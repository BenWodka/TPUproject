# Contains API for accessing process related tables from database:
# Processes, Buckets, Error log

from supabase import create_client
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from datetime import datetime, timedelta
from passwordhandler import verify_password
from email_utils import send_error_email
from apscheduler.schedulers.background import BackgroundScheduler
import os

# Access credentials for database
load_dotenv()

PROJECT_URL = os.getenv("SUPABASE_URL")
API_KEY = os.getenv("SUPABASE_API_KEY")

# Initializes Supabase client
supabase = create_client(PROJECT_URL, API_KEY)

# Initialize flask
app = Flask(__name__)
CORS(app)  # Enable CORS
limiter = Limiter(get_remote_address, app=app, default_limits=["20 per minute"], storage_uri="memory://")

scheduler = BackgroundScheduler()
scheduler.start()

def mark_in_progress(process_id):
    try:
        supabase.table("processes") \
            .update({"status": "IN_PROGRESS"}) \
            .eq("process_id", process_id).execute()
    except Exception as e:
        print(f"Error: mark_in_progress {e}")


def mark_complete(process_id):
    try:
        supabase.table("processes") \
            .update({"status": "COMPLETED"}) \
            .eq("process_id", process_id).execute()
    except Exception as e:
        print(f"Error: Mark complete {e}")


from apscheduler.jobstores.base import ConflictingIdError

@app.route("/processes/<int:process_id>/schedule", methods=["POST"])
@cross_origin()
def schedule_process(process_id):
    data = request.get_json()
    if not data or "end_time" not in data:
        return jsonify({"error":"end_time required"}), 400

    # parse today’s date + HH:MM
    today = datetime.now().date()
    hh, mm = map(int, data["end_time"].split(":"))
    end_dt = datetime.combine(today, datetime.min.time()).replace(hour=hh, minute=mm)

    # fetch durations
    buckets = supabase.table("buckets") \
                      .select("duration") \
                      .eq("process_id", process_id) \
                      .execute().data
    if not buckets:
        return jsonify({"error":"No buckets for process"}), 404

    total_minutes = sum(int(b["duration"]) for b in buckets)
    start_dt = end_dt - timedelta(minutes=total_minutes)

    # update the process
    supabase.table("processes").update({
        "start_time": start_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "end_time":   end_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "status":     "PENDING"
    }).eq("process_id", process_id).execute()

    # schedule both jobs, replacing any that already exist
    scheduler.add_job(mark_in_progress,
                      trigger="date",
                      run_date=start_dt,
                      args=[process_id],
                      id=f"start_{process_id}",
                      replace_existing=True)

    scheduler.add_job(mark_complete,
                      trigger="date",
                      run_date=end_dt,
                      args=[process_id],
                      id=f"complete_{process_id}",
                      replace_existing=True)

    return jsonify({
        "message":    "Scheduled process",
        "process_id": process_id,
        "start_time": start_dt.strftime("%H:%M"),
        "end_time":   end_dt.strftime("%H:%M")
    }), 201

# Helper to log errors with optional process_id
def log_error(message, process_id=None):
    try:
        entry = {
            "message": message,
            "failure_time": datetime.now().isoformat()
        }
        if process_id:
            entry["process_id"] = process_id

        supabase.table("error_log").insert(entry).execute()
    except Exception as e:
        print(f"⚠️ Failed to insert error log: {e}")

# --- Process Routes ---

@app.route('/processes/', methods=['GET'])
def getProcesses():
    try:
        response = supabase.table("processes").select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        error_msg = f"Error retrieving processes: {str(e)}"
        log_error(error_msg)

        send_error_email("TPU Error - Get All Processes", error_msg)
        return jsonify({"error": error_msg}), 500

@app.route('/processes/<int:process_id>', methods=['GET'])
def getProcess(process_id):
    try:
        response = supabase.table("processes").select("*").eq("process_id", process_id).single().execute()
        if not response.data:
            return jsonify({"error": f"Process with ID {process_id} not found."}), 404
        return jsonify(response.data)
    except Exception as e:
        error_msg = f"Error retrieving process {process_id}: {str(e)}"
        log_error(error_msg)
        send_error_email("TPU Error - Get Specific Process", error_msg)
        return jsonify({"error": error_msg}), 500
    
@app.route('/processes/current', methods=['GET'])
@cross_origin()
def get_current_process():
    try:
        # only PENDING and IN_PROGRESS trigger “View Process”
        in_list = '("PENDING","IN_PROGRESS")'

        resp = (
            supabase.table("processes")
                    .select("*")
                    .filter("status", "in", in_list)
                    .order("start_time")     # ascending by default
                    .limit(1)
                    .execute()
        )

        # no matching row → nothing running
        if not resp.data:
            return jsonify({ "running": False }), 200

        proc = resp.data[0]
        return jsonify({
            "running": True,
            "status":  proc["status"],
            "process": proc
        }), 200

    except Exception as e:
        app.logger.error("get_current_process failed", exc_info=True)
        return jsonify({ "error": str(e) }), 500

@app.route('/processes/<int:process_id>/cancel', methods=['POST'])
@cross_origin()
def cancel_process(process_id):
    try:
        # remove any scheduled jobs…
        for jid in (f"start_{process_id}", f"complete_{process_id}"):
            try: scheduler.remove_job(jid)
            except: pass

        # now mark it CANCELLED
        supabase.table("processes") \
               .update({ "status": "CANCELLED" }) \
               .eq("process_id", process_id) \
               .execute()

        return jsonify({"message": "Process cancelled"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/processes/start', methods=['POST', 'OPTIONS'])
@cross_origin()
def start_process():
    try:
        data = request.get_json()
        if not data or "process_id" not in data:
            return jsonify({"error": "Missing process_id"}), 400

        process_id = data["process_id"]

        # Check if a process is already marked as "IN_PROGRESS"
        existing = supabase.table("processes").select("*").eq("status", "IN_PROGRESS").execute()
        if existing.data and len(existing.data) > 0:
            return jsonify({"message": "A process is already in progress."}), 409

        # Update the selected process to "In progress"
        supabase.table("processes").update({
            "status": "IN_PROGRESS"
        }).eq("process_id", process_id).execute()

        return jsonify({"message": "Process marked as in progress"}), 200

    except Exception as e:
        error_msg = f"Failed to start process: {str(e)}"
        log_error(error_msg)
        send_error_email("TPU Error - Start Process", error_msg)
        return jsonify({"error": error_msg}), 500

# --- Bucket Routes ---

@app.route('/processes/buckets/', methods=['GET'])
def getBuckets():
    try:
        response = supabase.table("buckets").select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        error_msg = f"Error retrieving bucket data: {str(e)}"
        log_error(error_msg)
        send_error_email("TPU Error - Get All Buckets", error_msg)
        return jsonify({"error": error_msg}), 500

@app.route('/processes/buckets/<int:bucket_id>', methods=['GET'])
def getBucket(bucket_id):
    try:
        response = supabase.table("buckets").select("*").eq("bucket_id", bucket_id).single().execute()
        if not response.data:
            return jsonify({"error": f"Bucket with ID {bucket_id} not found."}), 404
        return jsonify(response.data)
    except Exception as e:
        error_msg = f"Error retrieving bucket {bucket_id}: {str(e)}"
        log_error(error_msg)
        send_error_email("TPU Error - Get Specific Bucket", error_msg)
        return jsonify({"error": error_msg}), 500

@app.route('/processes/<int:process_id>/buckets', methods=['GET'])
def getProcessBuckets(process_id):
    try:
        response = supabase.table("buckets").select("*").eq("process_id", process_id).execute()
        return jsonify(response.data)
    except Exception as e:
        error_msg = f"Error retrieving buckets for process {process_id}: {str(e)}"
        log_error(error_msg)
        send_error_email("TPU Error - Get Buckets by Process", error_msg)
        return jsonify({"error": error_msg}), 500

@app.route('/processes/<int:process_id>/buckets/<int:bucket_id>', methods=['GET'])
def getProcessBucket(process_id, bucket_id):
    try:
        response = supabase.table("buckets").select("*").eq("process_id", process_id).eq("bucket_id", bucket_id).execute()
        return jsonify(response.data)
    except Exception as e:
        error_msg = f"Error retrieving bucket {bucket_id} for process {process_id}: {str(e)}"
        log_error(error_msg)
        send_error_email("TPU Error - Get Specific Bucket of Process", error_msg)
        return jsonify({"error": error_msg}), 500

# --- Error Log Routes ---

@app.route('/processes/error-log/', methods=['GET'])
def getErrorLogs():
    try:
        response = supabase.table("error_log").select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        error_msg = f"Error retrieving error logs: {str(e)}"
        send_error_email("TPU Error - Get All Error Logs", error_msg)
        return jsonify({"error": error_msg}), 500

@app.route('/processes/error-log/<int:error_id>', methods=['GET'])
def getErrorLog(error_id):
    try:
        response = supabase.table("error_log").select("*").eq("error_id", error_id).single().execute()
        if not response.data:
            return jsonify({"error": f"Error with ID {error_id} not found."}), 404
        return jsonify(response.data)
    except Exception as e:
        error_msg = f"Error retrieving error log {error_id}: {str(e)}"
        send_error_email("TPU Error - Get Specific Error Log", error_msg)
        return jsonify({"error": error_msg}), 500

# --- Process Creation ---

@app.route('/processes/create', methods=['POST'])
@cross_origin()
def create_process():
    data = request.get_json()
    if not data or "buckets" not in data or "end_time" not in data:
        return jsonify({"error": "Missing fields (buckets, end_time)"}), 400

    # 1) parse end_date + end_time into a full datetime
    end_date_str = data.get("end_date")
    end_time_str = data["end_time"]
    # for simplicity, assume end_date_str exists; fallback to today if not:
    from datetime import date, datetime
    today = date.today().isoformat()
    dt_str = f"{end_date_str or today}T{end_time_str}:00"
    end_dt = datetime.fromisoformat(dt_str)

    # 2) sum durations
    buckets = data["buckets"]   # [{duration: X, description: "…"}, …]
    total_min = sum(int(b["duration"]) for b in buckets)
    start_dt = end_dt - timedelta(minutes=total_min)

    # 3) insert the process row
    process_insert = supabase.table("processes").insert({
        "start_time": start_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "end_time":   end_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "status":     "PENDING"
    }).execute()

    if not process_insert.data:
        return jsonify({"error": "Failed to insert process"}), 500

    process_id = process_insert.data[0]["process_id"]

    # 4) insert buckets — no bucket_id field, let DB auto‐assign it
    bucket_rows = []
    for b in buckets:
        bucket_rows.append({
            "process_id":  process_id,
            "duration":    int(b["duration"]),
            "description": b.get("description", "")[:40]
        })
    supabase.table("buckets").insert(bucket_rows).execute()

    return jsonify({
      "message":    "Process created and scheduled",
      "process_id": process_id,
      "start_time": start_dt.strftime("%H:%M"),
      "end_time":   end_dt.strftime("%H:%M")
    }), 201

from datetime import datetime, timedelta

@app.route('/processes/<int:process_id>/run-now', methods=['POST'])
@cross_origin()
def run_now(process_id):
    # 1) check existing
    existing = supabase.table("processes") \
        .select("process_id") \
        .in_("status", ["PENDING", "IN_PROGRESS"]) \
        .execute().data
    if existing:
        return jsonify({"error":"Another process pending or running"}), 409

    # 2) get bucket durations
    buckets = supabase.table("buckets") \
        .select("duration") \
        .eq("process_id", process_id) \
        .execute().data
    if not buckets:
        return jsonify({"error":"No buckets found"}), 404

    total_min = sum(int(b["duration"]) for b in buckets)
    now = datetime.now()
    end_dt = now + timedelta(minutes=total_min)

    # 3) update DB
    supabase.table("processes").update({
        "start_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "end_time":   end_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "status":     "IN_PROGRESS"
    }).eq("process_id", process_id).execute()

    # 4) schedule only the completion job
    scheduler.add_job(
      func=mark_complete,
      trigger='date',
      run_date=end_dt,
      args=[process_id],
      id=f"complete_{process_id}"
    )

    return jsonify({
      "message":    "Process started",
      "process_id": process_id,
      "start_time": now.strftime("%H:%M"),
      "end_time":   end_dt.strftime("%H:%M")
    }), 200

@app.route('/processes/<int:process_id>/complete', methods=['POST'])
@cross_origin()
def complete_process(process_id):
    try:
        supabase.table("processes") \
                .update({"status": "COMPLETED"}) \
                .eq("process_id", process_id) \
                .execute()
        return jsonify({"message": "Process marked COMPLETE"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Login ---

@app.route("/processes/login", methods=["POST"])
@cross_origin()
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    try:
        response = supabase.table("users").select("*").eq("username", username).single().execute()

        if not response.data:
            return jsonify({"error": "Invalid username or password"}), 401

        user = response.data
        stored_hash = user["password"]
        role = user.get("role", "user")

        if verify_password(password, stored_hash):
            return jsonify({
                "message": "Login successful",
                "username": username,
                "role": role
            }), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        error_msg = f"Login failed for user '{username}': {str(e)}"
        return jsonify({"error": error_msg}), 500

if __name__ == '__main__':
    # tells APScheduler to shut down when the app exits
    import atexit
    atexit.register(lambda: scheduler.shutdown(wait=False))
    app.run(debug=True)
