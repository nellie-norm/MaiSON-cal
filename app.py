import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Log to console (will be captured by Azure)
    ]
)
logger = logging.getLogger(__name__)

# Function to create appropriate connection string
def get_connection_string(db_params):
    """
    Create a database connection string with or without SSL based on the host.
    SSL is required for Azure PostgreSQL but may not be supported by local development databases.
    """
    base_conn_string = f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}"
    
    # Check if this is a local or development connection
    local_hosts = ['localhost', '127.0.0.1', 'host.docker.internal']
    if any(local_host in db_params['host'] for local_host in local_hosts):
        logger.info(f"Using non-SSL connection for local host: {db_params['host']}")
        return f"{base_conn_string}?sslmode=disable"
    else:
        logger.info(f"Using SSL connection for remote host: {db_params['host']}")
        return f"{base_conn_string}?sslmode=require"

# Try different import paths for AvailabilityManager
try:
    # First try the relative import
    from backend.models.availability import AvailabilityManager
    availability_module_available = True
    logger.info("Successfully imported AvailabilityManager from backend.models.availability")
except ImportError:
    try:
        # Then try an absolute import
        import sys
        # Add current directory to path to help with imports
        sys.path.append('.')
        from backend.models.availability import AvailabilityManager
        availability_module_available = True
        logger.info("Successfully imported AvailabilityManager after adding current directory to path")
    except ImportError as e:
        logger.warning(f"Could not import AvailabilityManager: {e}")
        availability_module_available = False

# Load environment variables
try:
    load_dotenv('.env.local')
except Exception as e:
    logger.warning(f"Could not load .env.local: {e}")

app = Flask(__name__, static_folder='frontend/build', static_url_path='/')
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

# Create connection string with or without SSL based on host
connection_string = get_connection_string(db_params)
logger.info(f"Final connection string (sanitized): {connection_string.replace(db_params['password'], '******')}")

# Define a simple AvailabilityManager class if the import fails
if not availability_module_available:
    logger.warning("Using fallback AvailabilityManager implementation")
    class AvailabilityManager:
        def __init__(self, connection_string):
            self.connection_string = connection_string
            # Make sure Azure connections always use SSL
            if 'azure' in connection_string and '?sslmode=require' not in connection_string:
                self.connection_string = connection_string + '?sslmode=require'
            # Remove SSL requirement if connecting to localhost
            if 'sslmode=require' in connection_string and ('localhost' in connection_string or '127.0.0.1' in connection_string):
                self.connection_string = connection_string.replace('?sslmode=require', '')
            
        def get_property_availability(self, property_id, seller_id=None):
            # Return empty list for now
            return []
            
        def create_availability(self, seller_id, property_id, availability_slots):
            # Return success message
            return {"message": "Availability created (placeholder)"}
            
        def delete_property_availability(self, property_id, seller_id=None):
            # Return success message
            return {"message": "Availability deleted (placeholder)"}

# Serve frontend routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# API endpoints
@app.route('/api', methods=['GET'])
def api_root():
    return jsonify({'message': 'API is online. Use /test to check connection details.'}), 200

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

# Instead of trying to import and use the AvailabilityManager, 
# add placeholder handlers that won't crash if the module is missing
@app.route('/api/availability/property/<int:property_id>', methods=['GET', 'DELETE'])
def handle_property_availability(property_id):
    logger.info(f"Handling {request.method} request for property {property_id}")
    logger.info(f"Query params: {request.args}")
    
    try:
        # Use the AvailabilityManager (either imported or our fallback)
        availability_mgr = AvailabilityManager(connection_string)
        
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

@app.route('/api/availability', methods=['POST'])
def create_availability():
    try:
        data = request.json
        seller_id = data.get('sellerId')
        property_id = data.get('propertyId')
        availability_slots = data.get('availabilitySlots', [])
        
        availability_manager = AvailabilityManager(connection_string)
        result = availability_manager.create_availability(seller_id, property_id, availability_slots)
        
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error creating availability: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/debug', methods=['GET'])
def debug():
    import os
    import sys
    
    # Check what directories and files exist
    current_dir = os.getcwd()
    files_in_current_dir = os.listdir(current_dir)
    
    # Check if backend directory exists
    backend_dir_exists = os.path.isdir(os.path.join(current_dir, 'backend'))
    backend_files = []
    if backend_dir_exists:
        backend_files = os.listdir(os.path.join(current_dir, 'backend'))
        
        # Check if models directory exists
        models_dir_exists = os.path.isdir(os.path.join(current_dir, 'backend', 'models'))
        models_files = []
        if models_dir_exists:
            models_files = os.listdir(os.path.join(current_dir, 'backend', 'models'))
        else:
            models_files = ["models directory does not exist"]
    else:
        backend_files = ["backend directory does not exist"]
    
    # Check Python path
    python_path = sys.path
    
    # Check if the AvailabilityManager class is available
    availability_manager_available = False
    try:
        from backend.models.availability import AvailabilityManager
        availability_manager_available = True
    except ImportError:
        pass
    
    return jsonify({
        'current_directory': current_dir,
        'files_in_current_dir': files_in_current_dir,
        'backend_dir_exists': backend_dir_exists,
        'backend_files': backend_files,
        'models_files': models_files if backend_dir_exists else [],
        'python_path': python_path,
        'availability_manager_available': availability_manager_available,
        'environment_variables': {k: v for k, v in os.environ.items() if not k.lower().startswith('password') and not k.lower().startswith('secret')}
    })

@app.route('/test-db-connection', methods=['GET'])
def test_db_connection():
    logger.info("Database connection test endpoint called")
    
    # Detailed connection details
    connection_details = {
        'host': db_params['host'],
        'dbname': db_params['dbname'],
        'user': db_params['user'],
        'port': db_params['port']
    }
    logger.info(f"Attempting to connect with: {connection_details}")
    
    try:
        # Use explicit connection parameters
        conn = psycopg2.connect(
            host=db_params['host'],
            database=db_params['dbname'],
            user=db_params['user'],
            password=db_params['password'],
            port=db_params['port'],
            # Explicit SSL mode for Azure PostgreSQL
            sslmode='require'
        )
        
        # If connection succeeds, try a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()
        
        # Close the connection
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Connected to database successfully',
            'db_version': db_version[0] if db_version else None,
            'connection_details': connection_details
        }), 200
    
    except Exception as e:
        # Capture and log detailed error information
        import traceback
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'error_details': traceback.format_exc()
        }
        logger.error(f"Database connection error: {error_details}")
        
        return jsonify({
            'status': 'error',
            'message': 'Failed to connect to database',
            'error': error_details,
            'connection_details': connection_details
        }), 500

@app.route('/check-schema', methods=['GET'])
def check_schema():
    try:
        with psycopg2.connect(
            host=db_params['host'],
            database=db_params['dbname'],
            user=db_params['user'],
            password=db_params['password'],
            port=db_params['port'],
            sslmode='require'
        ) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get all tables
                cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
                tables = cur.fetchall()
                
                # Get columns for each table
                table_details = {}
                for table in tables:
                    table_name = table['table_name']
                    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '{table_name}';")
                    columns = cur.fetchall()
                    table_details[table_name] = columns
                
                return jsonify({
                    'tables': [t['table_name'] for t in tables],
                    'table_details': table_details
                })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/check-all-schemas', methods=['GET'])
def check_all_schemas():
    try:
        with psycopg2.connect(
            host=db_params['host'],
            database=db_params['dbname'],
            user=db_params['user'],
            password=db_params['password'],
            port=db_params['port'],
            sslmode='require'
        ) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get all schemas
                cur.execute("SELECT schema_name FROM information_schema.schemata;")
                schemas = cur.fetchall()
                
                results = {}
                for schema in schemas:
                    schema_name = schema['schema_name']
                    # Skip system schemas
                    if schema_name in ('pg_catalog', 'information_schema'):
                        continue
                        
                    # Get tables in this schema
                    cur.execute(f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{schema_name}';")
                    tables = [table['table_name'] for table in cur.fetchall()]
                    
                    if tables:  # Only include non-empty schemas
                        results[schema_name] = tables
                
                # Also include connection info for debugging
                cur.execute("SELECT current_database();")
                current_db = cur.fetchone()['current_database']
                
                return jsonify({
                    'current_database': current_db,
                    'connection': {
                        'host': db_params['host'],
                        'dbname': db_params['dbname'],
                        'user': db_params['user']
                    },
                    'schemas_and_tables': results
                })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/setup-database', methods=['GET'])
def setup_database():
    try:
        with psycopg2.connect(
            host=db_params['host'],
            database=db_params['dbname'],
            user=db_params['user'],
            password=db_params['password'],
            port=db_params['port'],
            sslmode='require'
        ) as conn:
            with conn.cursor() as cur:
                # Create tables
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS properties (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL
                    );
                """)
                
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS sellers (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL
                    );
                """)
                
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS availability (
                        id SERIAL PRIMARY KEY,
                        property_id INTEGER REFERENCES properties(id),
                        seller_id INTEGER REFERENCES sellers(id),
                        start_time TIMESTAMP NOT NULL,
                        end_time TIMESTAMP NOT NULL
                    );
                """)
                
                # Insert sample data
                cur.execute("""
                    INSERT INTO properties (name) 
                    VALUES ('Sample Property 1'), ('Sample Property 2')
                    ON CONFLICT DO NOTHING;
                """)
                
                cur.execute("""
                    INSERT INTO sellers (name) 
                    VALUES ('Sample Seller 1'), ('Sample Seller 2')
                    ON CONFLICT DO NOTHING;
                """)
                
                conn.commit()
                
                # Check what was created
                cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
                tables = [row[0] for row in cur.fetchall()]
                
                return jsonify({
                    'message': 'Database setup completed successfully',
                    'tables_created': tables
                })
    except Exception as e:
        import traceback
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == "__main__":
    # Use port provided by App Service
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting application on port {port}")
    app.run(host='0.0.0.0', port=port)