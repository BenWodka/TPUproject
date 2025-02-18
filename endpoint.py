from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/process/start', methods=['POST'])
def start_process():
    process_data = request.get_json()
    if process_data is None:
        print("No JSON received")
        return jsonify({'error': 'No JSON received'}), 400

    print("Received JSON:", process_data)

    return jsonify({'status': 'Received', 'data': process_data}), 200

if __name__ == '__main__':
    app.run(debug=True)
