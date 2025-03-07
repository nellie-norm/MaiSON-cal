import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import uuid
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from flask import abort
from typing import List, Optional
from models.availability import AvailabilityManager

app = Flask(__name__, static_folder='frontend/build', static_url_path='/')
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
app.debug = True

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
try:
    load_dotenv('.env')
except Exception as e:
    logger.warning(f"Could not load .env: {e}")

# Database configuration
db_params = {
    "dbname": os.getenv('DB_NAME', 'postgres'),
    "user": os.getenv('DB_USER', 'postgres'),
    "password": os.getenv('DB_PASSWORD', 'postgres'),
    "host": os.getenv('DB_HOST', 'localhost'),
    "port": os.getenv('DB_PORT', '5432')
}

# Log database configuration (excluding password)
logger.info("Database configuration:")
logger.info(f"Host: {db_params['host']}")
logger.info(f"Port: {db_params['port']}")
logger.info(f"Database: {db_params['dbname']}")
logger.info(f"User: {db_params['user']}")

def get_connection_string(db_params):
    """Create database connection string with appropriate SSL settings"""
    # Get SSL mode from environment or default to require
    ssl_mode = os.getenv('PGSSLMODE', 'require')
    # Format the connection string exactly like the working psql command
    return f"postgresql://{db_params['user']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}?sslmode={ssl_mode}"

# Create connection string
connection_string = get_connection_string(db_params)
logger.info(f"Connection string (without password): {connection_string}")

# Add password to connection params separately
connection_params = {
    "dsn": connection_string,
    "password": db_params['password'],
    "connect_timeout": 10,
    "sslmode": os.getenv('PGSSLMODE', 'require'),
    "ssl": True
}

@app.before_request
def log_request_info():
    logger.info('=' * 50)
    logger.info(f'Request Method: {request.method}')
    logger.info(f'Request Path: {request.path}')
    logger.info(f'Request Headers: {dict(request.headers)}')
    logger.info('=' * 50)

# Keep the current working test endpoint
@app.route('/api/test-create', methods=['GET', 'POST', 'OPTIONS'])
def create_test_data():
    logger.info(f"Received {request.method} request to /api/test-create")
    logger.info(f"Headers: {dict(request.headers)}")
    
    try:
        property_id = str(uuid.uuid4())
        seller_id = str(uuid.uuid4())
        
        response_data = {
            "message": f"Test data for {request.method} request",
            "property": {
                "id": property_id,
                "name": f"Test Property {property_id[:8]}"
            },
            "seller": {
                "id": seller_id,
                "name": f"Test Seller {seller_id[:8]}"
            }
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 200
        
    except Exception as e:
        logger.error(f"Error in test-create: {str(e)}")
        return jsonify({"error": str(e)}), 500

# New endpoints using AvailabilityManager
@app.route('/api/availability/test', methods=['POST'])
def create_availability_test_data():
    """Create test data in the database"""
    try:
        availability_manager = AvailabilityManager(connection_string)
        result = availability_manager.create_test_data()
        
        # Log the created test data
        logger.info(f"Created test data: {result}")
        
        # Ensure the response includes the property and seller IDs
        if 'property' in result and 'seller' in result:
            logger.info(f"Test property ID: {result['property']['id']}")
            logger.info(f"Test seller ID: {result['seller']['id']}")
        
        return jsonify(result), 200 if 'error' not in result else 500
    except Exception as e:
        logger.error(f"Error creating test data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/availability/property/<string:property_id>', methods=['GET', 'DELETE'])
def handle_property_availability(property_id):
    """Get or delete availability for a property"""
    try:
        availability_manager = AvailabilityManager(connection_string)
        seller_id = request.args.get('sellerId')
        
        if request.method == 'GET':
            slots = availability_manager.get_property_availability(property_id, seller_id)
            return jsonify(slots), 200
            
        elif request.method == 'DELETE':
            result = availability_manager.delete_property_availability(property_id, seller_id)
            return jsonify(result), 200
            
    except Exception as e:
        logger.error(f"Error handling availability: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/availability', methods=['POST'])
def create_availability():
    """Create new availability slots"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        property_id = data.get('propertyId')
        # Get seller_id from request or from auth token
        seller_id = data.get('sellerId')
        availability_slots = data.get('availabilitySlots', [])

        if not property_id or not availability_slots:
            return jsonify({"error": "Missing required fields: propertyId or availabilitySlots"}), 400

        availability_manager = AvailabilityManager(connection_string)
        
        # Process each availability slot
        results = []
        for slot in availability_slots:
            try:
                start_time = datetime.fromisoformat(slot.get('start_time').replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(slot.get('end_time').replace('Z', '+00:00'))
                
                success = availability_manager.save_availability(
                    property_id=property_id,
                    seller_id=seller_id,
                    start_time=start_time,
                    end_time=end_time
                )
                
                results.append({
                    "success": success,
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat()
                })
            except Exception as e:
                logger.error(f"Error processing slot {slot}: {e}")
                results.append({
                    "success": False,
                    "error": str(e),
                    "slot": slot
                })

        return jsonify({
            "message": "Availability slots processed",
            "results": results,
            "success_count": sum(1 for r in results if r.get("success", False))
        }), 200

    except Exception as e:
        logger.error(f"Error creating availability: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api', methods=['GET'])
def api_root():
    return jsonify({
        'message': 'API is online',
        'endpoints': {
            'test': '/api/test-create',
            'availability': {
                'test': '/api/availability/test',
                'property': '/api/availability/property/<property_id>',
                'create': '/api/availability'
            }
        }
    }), 200

@app.route('/setup-test-schema', methods=['GET'])
def setup_test_schema():
    """Initialize the database schema"""
    logger.info("Starting schema setup...")
    try:
        logger.info("Attempting database connection...")
        conn = psycopg2.connect(connection_string, connect_timeout=10)
        logger.info("Database connection successful")
        
        with conn:
            with conn.cursor() as cur:
                logger.info("Executing schema creation...")
                
                # Drop tables
                logger.info("Dropping existing tables...")
                cur.execute("""
                    DROP TABLE IF EXISTS availability CASCADE;
                    DROP TABLE IF EXISTS properties CASCADE;
                    DROP TABLE IF EXISTS sellers CASCADE;
                """)
                logger.info("Dropped existing tables")

                # Create tables one by one for better error tracking
                logger.info("Creating sellers table...")
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS sellers (
                        id UUID PRIMARY KEY,
                        name VARCHAR(255) NOT NULL
                    );
                """)

                logger.info("Creating properties table...")
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS properties (
                        id UUID PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        seller_id UUID REFERENCES sellers(id)
                    );
                """)

                logger.info("Creating availability table...")
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS availability (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        property_id UUID REFERENCES properties(id),
                        seller_id UUID REFERENCES sellers(id),
                        start_time TIMESTAMP NOT NULL,
                        end_time TIMESTAMP NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(property_id, seller_id, start_time, end_time)
                    );
                """)

                logger.info("Creating indexes...")
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_availability_property ON availability(property_id);
                    CREATE INDEX IF NOT EXISTS idx_availability_seller ON availability(seller_id);
                """)

                conn.commit()
                logger.info("Schema setup completed successfully")
                return jsonify({"message": "Schema created successfully"}), 200
    except psycopg2.Error as e:
        logger.error(f"Database error setting up schema: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Error setting up schema: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()
            logger.info("Database connection closed")

@app.route('/test-db', methods=['GET'])
def test_db_connection():
    """Simple endpoint to test database connectivity"""
    logger.info("Testing database connection...")
    try:
        # Connect directly with parameters
        conn = psycopg2.connect(
            dbname=db_params['dbname'],
            user=db_params['user'],
            password=db_params['password'],
            host=db_params['host'],
            port=db_params['port'],
            sslmode=os.getenv('PGSSLMODE', 'require'),
            connect_timeout=10
        )
        
        with conn:
            with conn.cursor() as cur:
                cur.execute('SELECT version();')
                version = cur.fetchone()[0]
                logger.info(f"Database connection successful. Version: {version}")
                return jsonify({
                    "status": "success",
                    "message": "Database connection successful",
                    "version": version
                }), 200
    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting application on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)