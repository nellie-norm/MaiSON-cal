import psycopg2
from datetime import datetime
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Try to import AvailabilityManager but don't crash if it fails
try:
    from backend.models.availability import AvailabilityManager
    availability_module_available = True
except ImportError as e:
    print(f"Warning: Could not import AvailabilityManager: {e}")
    availability_module_available = False

# Load environment variables
try:
    load_dotenv('.env.local')
except Exception as e:
    print(f"Warning: Could not load .env.local: {e}")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Log to console (will be captured by Azure)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API port from environment
API_PORT = int(os.getenv('API_PORT', 8000))

# Set up database connection string
db_params = {
    "dbname": os.getenv('DB_NAME', 'postgres'),
    "user": os.getenv('DB_USER', 'postgres'),
    "password": os.getenv('DB_PASSWORD', 'postgres'),
    "host": os.getenv('DB_HOST', 'localhost'),
    "port": os.getenv('DB_PORT', '5432')
}

# Don't attempt database connection on startup
connection_string = f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"

@app.route('/test', methods=['GET'])
def test_route():
    logger.info("Test endpoint called")
    return jsonify({
        'message': 'Server is running!', 
        'db_config': {
            'host': db_params['host'],
            'dbname': db_params['dbname'],
            'port': db_params['port'],
            # Don't include password in response
        }
    }), 200

# Add a health check endpoint
@app.route('/health', methods=['GET'])
def health():
    logger.info("Health check endpoint called")
    return jsonify({'status': 'healthy'}), 200

# Add a root route
@app.route('/', methods=['GET'])
def root():
    return jsonify({'message': 'API is online. Use /test to check connection details.'}), 200

# Instead of trying to import and use the AvailabilityManager, 
# add placeholder handlers that won't crash if the module is missing
@app.route('/api/availability/property/<int:property_id>', methods=['GET', 'DELETE'])
def handle_property_availability(property_id):
    if not availability_module_available:
        return jsonify({
            'error': 'Module not available',
            'message': 'The AvailabilityManager module is not available'
        }), 503
    try:
        # Try to import and use AvailabilityManager
        from backend.models.availability import AvailabilityManager
        availability_mgr = AvailabilityManager(connection_string)
        
        # Your original code...
        logger.info(f"Handling {request.method} request for property {property_id}")
        logger.info(f"Query params: {request.args}")
        
        if request.method == 'GET':
            seller_id = request.args.get('sellerId')
            if seller_id:
                seller_id = int(seller_id)
            logger.info(f"Getting availability for property {property_id}, seller {seller_id}")
            slots = availability_mgr.get_property_availability(property_id, seller_id)
            logger.info("Successfully retrieved availability data")
            return jsonify(slots), 200
            
        elif request.method == 'DELETE':
            seller_id = request.args.get('sellerId')
            if seller_id:
                seller_id = int(seller_id)
            logger.info(f"Deleting availability for property {property_id}, seller {seller_id}")
            result = availability_mgr.delete_property_availability(property_id, seller_id)
            return jsonify(result), 200
            
    except Exception as e:
        logger.error(f"Error handling availability: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Return a helpful error message instead of 500
        return jsonify({
            'error': str(e),
            'message': 'This endpoint requires database configuration',
            'status': 'Configuration error or module missing'
        }), 503

if __name__ == "__main__":
    # Use port provided by App Service
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting application on port {port}")
    app.run(host='0.0.0.0', port=port)