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
limiter = Limiter(get_remote_address, app=app, default_limits=["10 per minute"], storage_uri="memory://")

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
        response = supabase.table("processes").select("*").eq("status", "IN_PROGRESS").limit(1).execute()
        if not response.data:
            return jsonify({"message": "No process currently running."}), 404

        if response.data:
            return jsonify({
                "running": True,
                "process": response.data
            }), 200
        else:
            return jsonify({"running": False}), 200
    except Exception as e:
        error_msg = f"Failed to get current running process: {str(e)}"
        log_error(error_msg)
        send_error_email("TPU Error - Get Current Process", error_msg)
        return jsonify({"error": error_msg}), 500


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

@app.route('/processes/create', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_process():
    try:
        data = request.get_json()
        if not data or "buckets" not in data or "end_time" not in data:
            return jsonify({"error": "Missing required fields (buckets, end_time)."}), 400

        buckets = data["buckets"]
        end_time_str = data["end_time"]
        end_time = datetime.strptime(end_time_str, "%H:%M")

        total_duration = sum(int(b["duration"]) for b in buckets)
        start_time = end_time - timedelta(minutes=total_duration)

        # Insert into processes table
        process_insert = supabase.table("processes").insert({
            "start_time": start_time.strftime("%H:%M:%S"),
            "end_time": end_time.strftime("%H:%M:%S"),
            "status": "Pending"
        }).execute()

        if not process_insert.data:
            raise Exception("Failed to insert process.")

        process_id = process_insert.data[0]["process_id"]

        bucket_data = []
        for b in buckets:
            bucket_data.append({
                "process_id": process_id,
                "bucket_id": b["bucket"],
                "duration": int(b["duration"]),
                "description": b.get("description", "")
            })

        supabase.table("buckets").insert(bucket_data).execute()

        return jsonify({
            "message": "Process created successfully.",
            "process_id": process_id,
            "start_time": start_time.strftime("%H:%M"),
            "end_time": end_time.strftime("%H:%M")
        }), 201

    except Exception as e:
        error_msg = f"Failed to create process: {str(e)}"
        log_error(error_msg)
        send_error_email("TPU Error - Process Creation", error_msg)
        return jsonify({"error": error_msg}), 500


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
        send_error_email("TPU Error - Login Failed", error_msg)
        return jsonify({"error": error_msg}), 500

if __name__ == '__main__':
    app.run(debug=True)
