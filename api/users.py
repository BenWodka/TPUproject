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


# Defines Marshmallow schema for users
class userSchema(ma.Schema):
    user_id = ma.fields.Int(dump_only=True)
    username = ma.fields.Str(required=True)
    # May need to be remove password if it won't be handled by API
    password = ma.fields.Str(load_only=True)                
    email = ma.fields.Str(required=True)
    first_created = ma.fields.DateTime(dump_only=True)
    last_updated = ma.fields.DateTime(dump_only=True)

# Flask-Smorest blueprint
blp = Blueprint("users", "users", url_prefix="/users", description="Operations on users")

@blp.route("/")
class Users(MethodView):
    @blp.response(200, userSchema(many=True))
    def get(self):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Get users data from db
            cursor.execute("SELECT * FROM users") 
            usersRecord = cursor.fetchall()

            # Close Connection
            cursor.close()
            conn.close()

            return jsonify(usersRecord)
        except Exception as e:
            abort(500, message=f'Error retrieving user data: {str(e)}')

@blp.route("/<int:user_id>")
class User(MethodView):
    @blp.response(200, userSchema)
    def get(self, user_id):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Get user data from db using id
            cursor.execute(""" 
            SELECT user_id, username, email, first_created, last_updated
            FROM users
            WHERE user_id = %s
            """, (user_id,))
            userRecord = cursor.fetchone()

            # Check if user was found
            if not userRecord:
                abort(404, message=f"User with ID {user_id} not found.")

            # Close the connection
            cursor.close()
            conn.close()

            return jsonify(userRecord)
        except Exception as e:
            abort(500, message=f"Error retrieving user: {str(e)}")

api.register_blueprint(blp)

if __name__ == '__main__':
    # print("Registered routes:")
    # print(app.url_map)
    app.run(debug=True)         