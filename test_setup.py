#!/usr/bin/env python
# Save this as test_setup.py

import os
import sys

# Configure basic logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_environment():
    """Check if environment variables are properly set"""
    logger.info("Checking environment variables...")
    required_vars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT']
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        logger.error(f"Missing environment variables: {', '.join(missing)}")
    else:
        logger.info("All required environment variables are set")
    
    # Print all environment variables (excluding sensitive ones)
    logger.info("Environment variables:")
    for k, v in os.environ.items():
        if not k.lower().startswith(('password', 'secret')):
            logger.info(f"  {k}: {v}")

def check_imports():
    """Check if all required modules can be imported"""
    logger.info("Checking imports...")
    try:
        import psycopg2
        logger.info("Successfully imported psycopg2")
    except ImportError as e:
        logger.error(f"Failed to import psycopg2: {e}")
    
    try:
        import flask
        logger.info("Successfully imported flask")
    except ImportError as e:
        logger.error(f"Failed to import flask: {e}")

def check_backend_structure():
    """Check if backend directory structure is correct"""
    logger.info("Checking backend directory structure...")
    
    # Check if backend directory exists
    if not os.path.isdir('backend'):
        logger.error("backend directory does not exist")
        return
    
    # Check if models directory exists
    if not os.path.isdir('backend/models'):
        logger.error("backend/models directory does not exist")
        return
    
    # Check if availability.py exists
    if not os.path.isfile('backend/models/availability.py'):
        logger.error("backend/models/availability.py does not exist")
    else:
        logger.info("backend/models/availability.py exists")
    
    # Check if __init__.py files exist
    if not os.path.isfile('backend/__init__.py'):
        logger.warning("backend/__init__.py does not exist")
    
    if not os.path.isfile('backend/models/__init__.py'):
        logger.warning("backend/models/__init__.py does not exist")

def test_availability_import():
    """Test importing AvailabilityManager"""
    logger.info("Testing AvailabilityManager import...")
    
    # Try relative import
    try:
        from backend.models.availability import AvailabilityManager
        logger.info("Successfully imported AvailabilityManager (relative import)")
    except ImportError as e:
        logger.error(f"Failed to import AvailabilityManager (relative import): {e}")
        
        # Try absolute import
        try:
            import sys
            sys.path.append('.')  # Add current directory to path
            from backend.models.availability import AvailabilityManager
            logger.info("Successfully imported AvailabilityManager (absolute import with sys.path)")
        except ImportError as e:
            logger.error(f"Failed to import AvailabilityManager (absolute import): {e}")

def test_db_connection(connection_string=None):
    """Test database connection"""
    if not connection_string:
        # Build connection string from environment variables
        db_params = {
            "dbname": os.getenv('DB_NAME', 'postgres'),
            "user": os.getenv('DB_USER', 'postgres'),
            "password": os.getenv('DB_PASSWORD', 'postgres'),
            "host": os.getenv('DB_HOST', 'localhost'),
            "port": os.getenv('DB_PORT', '5432')
        }
        connection_string = f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['dbname']}?sslmode=require"
    
    logger.info(f"Testing database connection to {db_params['host']}:{db_params['port']}/{db_params['dbname']} as {db_params['user']}...")
    
    try:
        import psycopg2
        conn = psycopg2.connect(connection_string)
        logger.info("Successfully connected to database")
        
        # Try a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        logger.info(f"Database version: {version[0] if version else 'Unknown'}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")

if __name__ == "__main__":
    logger.info("Starting setup test...")
    logger.info(f"Current working directory: {os.getcwd()}")
    
    check_environment()
    check_imports()
    check_backend_structure()
    test_availability_import()
    test_db_connection()
    
    logger.info("Setup test completed")