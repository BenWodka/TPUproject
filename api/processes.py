from flask import Flask, request, jsonify
from flask.views import MethodView
import marshmallow as ma
from flask_smorest import Api, Blueprint, abort
import psycopg2
from dotenv import load_dotenv
import os 

# Access credentials for database
load_dotenv()

HOST_NAME=os.getenv('HOST_NAME')
DB_NAME=os.getenv('DB_NAME')
DB_USER=os.getenv('DB_USER')
DB_PASSWORD=os.getenv('DB_PASSWORD')

# Initialize flask, flask-smorest
app = Flask(__name__)
app.config["API_TITLE"] = "TPU USER API"
app.config["API_VERSION"] = "v1"
app.config["OPENAPI_VERSION"] = "3.0.2"

api = Api(app)

# Connects to postgresql database
def db_connect():
    try:
        conn = psycopg2.connect(host=HOST_NAME, database=DB_NAME, user=DB_USER, password=DB_PASSWORD) 
        # conn = psycopg2.connect(host=HOST_NAME, database=DB_NAME) 
        # Also seems to work but unsure if it will continue to work
        return conn
    except Exception as e:
        raise Exception(f'Database connection failed: {e}')


# Defines Marshmallow schema for processes
class processSchema(ma.Schema):
    process_id = ma.fields.Int(dump_only=True)  
    user_id = ma.fields.Int(required=True)   
    delay_start = ma.fields.Boolean(required=True)
    start_time = ma.fields.DateTime(required=True)  
    end_time = ma.fields.DateTime(allow_none=True)  
    status = ma.fields.Str(required=True, validate=lambda x: x in ['PENDING', 'IN_PROGRESS', 'COMPLETED'])


# Defines Marshmallow schema for buckets
class bucketSchema(ma.Schema):
    bucket_id = ma.fields.Int(dump_only=True) 
    process_id = ma.fields.Int(required=True)  
    duration = ma.fields.Time(required=True)  
    skip_flag = ma.fields.Boolean(required=True)
    active_flag = ma.fields.Boolean(required=True)

# Flask-Smorest blueprint
blp = Blueprint("processes", "processes", url_prefix="/processes", description="Operations on processes")

@blp.route("/")
class Processes(MethodView):
    @blp.response(200, processSchema(many=True))
    def get(self):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Get processes data from db
            cursor.execute("SELECT * FROM processes") 
            processesRecord = cursor.fetchall()

            # Close Connection
            cursor.close()
            conn.close()

            return jsonify(processesRecord)
        except Exception as e:
            abort(500, message=f'Error retrieving process data: {str(e)}')

@blp.route("/<int:process_id>")
class Process(MethodView):
    @blp.response(200, processSchema)
    def get(self, process_id):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Get process data from db using id
            cursor.execute(""" 
            SELECT process_id, user_id, delay_start, start_time, end_time, status
            FROM processes
            WHERE process_id = %s
            """, (process_id,))
            processRecord = cursor.fetchone()

            # Check if process was found
            if not processRecord:
                abort(404, message=f"Process with ID {process_id} not found.")

            # Close the connection
            cursor.close()
            conn.close()

            return jsonify(processRecord)
        except Exception as e:
            abort(500, message=f"Error retrieving process: {str(e)}")


# Bucket Methods
@blp.route("/buckets")
class Buckets(MethodView):
    @blp.response(200, bucketSchema(many=True))
    def get(self):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Get buckets data from db
            cursor.execute("SELECT * FROM buckets") 
            bucketsRecord = cursor.fetchall()

            # Close Connection
            cursor.close()
            conn.close()

            return jsonify(bucketsRecord)
        except Exception as e:
            abort(500, message=f'Error retrieving bucket data: {str(e)}')

@blp.route("/buckets/<int:bucket_id>")
class Bucket(MethodView):
    def get(self, bucket_id):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Get bucket data from db using id
            cursor.execute(""" 
            SELECT bucket_id, process_id, duration, skip_flag, active_flag
            FROM buckets
            WHERE bucket_id = %s
            """, (bucket_id,))
            bucketRecord = cursor.fetchone()

            # Check if bucket was found
            if not bucketRecord:
                abort(404, message=f"Bucket with ID {bucket_id} not found.")

            # Close the connection
            cursor.close()
            conn.close()

            return jsonify(bucketRecord)
        except Exception as e:
            abort(500, message=f"Error retrieving bucket: {str(e)}")

api.register_blueprint(blp)

if __name__ == '__main__':
    app.run(debug=True)         