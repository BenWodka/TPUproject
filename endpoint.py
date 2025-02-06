from flask import Flask, request, jsonify
import requests  # To call out to the microcontroller
import psycopg2

app = Flask(__name__)

# Example configuration eventually use config file
MICROCONTROLLER_IP = "192.168.1.100"  # Replace microcontroller's IP

@app.route('/api/process/start', methods=['POST'])
def start_process():
    # Parse the incoming process details (e.g., bucket durations, delay_start, etc.)
    process_data = request.get_json()
    # TODO: Save process details to your PostgreSQL database

    # Option 1 (Push Model): Notify the microcontroller directly
    try:
        mc_response = requests.post(
            f'http://{MICROCONTROLLER_IP}/start',
            json=process_data,  # send process details
            timeout=5  # seconds
        )
        mc_response.raise_for_status()
    except requests.RequestException as e:
        return jsonify({'error': 'Could not contact microcontroller', 'details': str(e)}), 500

    return jsonify({'status': 'Process started on microcontroller', 'data': process_data}), 200

if __name__ == '__main__':
    app.run(debug=True)
