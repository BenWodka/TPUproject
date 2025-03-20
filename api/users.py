from supabase import create_client
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import os

# Access credentials for database
load_dotenv()

PROJECT_URL = os.getenv('PROJECT_URL')
API_KEY = os.getenv('API_KEY')

# Initializes Supabase client
supabase = create_client(PROJECT_URL, API_KEY)

app = Flask(__name__)

# Enable CORS for cross-origin requests
CORS(app)  

# Limits requests
limiter = Limiter(get_remote_address, app=app, default_limits=["10 per minute"],storage_uri="memory://",)

@app.route('/users/', methods=['GET'])
def getUsers():
    try:
        response = supabase.table("users").select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"Error retrieving users: {str(e)}"}), 500

@app.route('/users/<int:user_id>', methods=['GET'])
def getUser(user_id):
    try:
        response = supabase.table("users").select("*").eq("user_id", user_id).single().execute()
        if not response.data:
            return jsonify({"error": f"User with ID {user_id} not found."}), 404
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": f"Error retrieving user: {str(e)}"}), 500     

if __name__ == '__main__':
    app.run(debug=True)         