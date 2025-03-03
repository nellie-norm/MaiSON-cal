import psycopg2
from datetime import datetime
from models.availability import AvailabilityManager
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API port from environment
API_PORT = int(os.getenv('API_PORT', 5002))

def test_db_connection(connection_string):
    try:
        conn = psycopg2.connect(connection_string)
        print("Successfully connected to the database!")
        conn.close()
        return True
    except Exception as e:
        print(f"Failed to connect to database. Error: {e}")
        return False

@app.route('/api/availability/property/<int:property_id>', methods=['GET', 'DELETE'])
def handle_property_availability(property_id):
    try:
        print(f"Handling {request.method} request for property {property_id}")
        print(f"Query params: {request.args}")
        
        availability_mgr = AvailabilityManager(connection_string)
        
        if request.method == 'GET':
            seller_id = request.args.get('sellerId')
            if seller_id:
                seller_id = int(seller_id)
            print(f"Getting availability for property {property_id}, seller {seller_id}")
            slots = availability_mgr.get_property_availability(property_id, seller_id)
            return jsonify(slots), 200
            
        elif request.method == 'DELETE':
            seller_id = request.args.get('sellerId')
            if seller_id:
                seller_id = int(seller_id)
            print(f"Deleting availability for property {property_id}, seller {seller_id}")
            result = availability_mgr.delete_property_availability(property_id, seller_id)
            return jsonify(result), 200
            
    except Exception as e:
        print(f"Error handling availability: {e}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/availability', methods=['POST'])
def save_availability():
    try:
        print("Python server received POST request to /api/availability")
        data = request.json
        print("Received data in Python:", data)
        
        # Skip the database checks
        # Extract the basic fields
        seller_id = data.get('sellerId')
        property_id = data.get('propertyId')
        availability_slots = data.get('availabilitySlots')
        
        if not all([seller_id, property_id, availability_slots]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Save each slot
        results = []
        availability_mgr = AvailabilityManager(connection_string)
        for slot in availability_slots:
            # Log what we're saving
            print(f"Would save: property={property_id}, seller={seller_id}, start={slot['startTime']}, end={slot['endTime']}")
            
            # Actually save to database
            success = availability_mgr.save_availability(
                property_id=property_id,
                seller_id=seller_id,
                start_time=datetime.fromisoformat(slot['startTime'].replace('Z', '+00:00')),
                end_time=datetime.fromisoformat(slot['endTime'].replace('Z', '+00:00'))
            )
            results.append(success)
        
        # Return success
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"Detailed Python error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/test', methods=['GET'])
def test_route():
    return jsonify({'message': 'Server is running!'}), 200

if __name__ == "__main__":
    # Use environment variables
    db_params = {
        "dbname": os.getenv('DB_NAME'),
        "user": os.getenv('DB_USER'),
        "password": os.getenv('DB_PASSWORD'),
        "host": os.getenv('DB_HOST'),
        "port": os.getenv('DB_PORT', '5432')
    }
    
    # Don't print sensitive information
    print("Database parameters loaded from environment")
    
    connection_string = f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"
    
    # Test the connection
    if test_db_connection(connection_string):
        print("Connected successfully!")
    else:
        print("Failed to connect. Please check credentials.")

    # Initialize the availability manager
    availability_mgr = AvailabilityManager(connection_string)
    
    # Run the app
    app.run(port=API_PORT, debug=False)  # Set debug=False for production 