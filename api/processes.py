from supabase import create_client
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import os

# Access credentials for database
load_dotenv()

PROJECT_URL = os.getenv("PROJECT_URL")
API_KEY = os.getenv("API_KEY")

# Initializes Supabase client
supabase = create_client(PROJECT_URL, API_KEY)

# Initialize flask
app = Flask(__name__)

# Enable CORS for cross-origin requests
CORS(app)  

# Limits requests
limiter = Limiter(get_remote_address, app=app, default_limits=["10 per minute"],storage_uri="memory://",)

# Get all process data
@app.route('/processes/', methods=['GET'])
# @limiter.limit("10 per minute")
def getProcesses():
    try:
        response = supabase.table("processes").select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"Error retrieving processes: {str(e)}"}), 500

# Get process with specific ID
@app.route('/processes/<int:process_id>', methods=['GET'])
def getProcess(process_id):
    try:
        response = supabase.table("processes").select("*").eq("process_id", process_id).single().execute()
        if not response.data:
            return jsonify({"error": f"Process with ID {process_id} not found."}), 404
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"Error retrieving process: {str(e)}"}), 500

# Get all bucket data
@app.route('/processes/buckets/', methods=['GET'])
def getBuckets():
    try:
        response = supabase.table("buckets").select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"Error retrieving bucket data: {str(e)}"}), 500

# Get bucket with specific ID
@app.route('/processes/buckets/<int:bucket_id>', methods=['GET'])
def getBucket(bucket_id):
    try:
        response = supabase.table("buckets").select("*").eq("bucket_id", bucket_id).single().execute()
        if not response.data:
            return jsonify({"error": f"Bucket with ID {bucket_id} not found."}), 404
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"Error retrieving bucket: {str(e)}"}), 500

# Get all buckets of process with specifc process ID
@app.route('/processes/<int:process_id>/buckets', methods=['GET'])
def getProcessBuckets(process_id):
    try:
        response = supabase.table("buckets").select("*").eq("process_id", process_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"Error retrieving bucket data: {str(e)}"}), 500

# Get specifc bucket of a process using IDs
@app.route('/processes/<int:process_id>/buckets/<int:bucket_id>', methods=['GET'])
def getProcessBucket(process_id, bucket_id):
    try:
        response = supabase.table("buckets").select("*").eq("process_id", process_id).eq("bucket_id", bucket_id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"Error retrieving bucket data: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
