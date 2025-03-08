from flask import Flask, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv  # ✅ Add this to load environment variables
import os

# ✅ Load environment variables from .env file
load_dotenv()
app = Flask(__name__)

# Database connection details (from Docker environment variables)
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'maison_property_calendar')
DB_USER = os.getenv('DB_USER', 'nellnorman')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'mysecretpassword')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_SSLMODE = os.getenv('DB_SSLMODE', 'require')


# ✅ Define get_db_connection() before any routes use it
def get_db_connection():
    try:
        print(f"Connecting with: Host={DB_HOST}, DB={DB_NAME}, User={DB_USER}, SSL={DB_SSLMODE}")
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            cursor_factory=RealDictCursor,
            sslmode=DB_SSLMODE
        )
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None

@app.route('/test-db')
def test_db():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"success": False, "error": "Database connection failed. Check DB credentials and firewall settings."}), 500
        
        cur = conn.cursor()
        cur.execute("SELECT NOW();")  # Simple query to check DB connectivity
        result = cur.fetchone()
        conn.close()

        return jsonify({"success": True, "message": "Database connected!", "timestamp": result["now"]})
    
    except Exception as e:
        error_message = str(e)
        print(f"Detailed error: {error_message}")
        return jsonify({"success": False, "error": error_message}), 500
@app.route("/")
def home():
    return jsonify({"message": "Welcome to the Maison Property Calendar API!"})
    
### ✅ POST: Add availability
@app.route('/availability', methods=['POST'])
def add_availability():
    data = request.json
    property_id = data.get('property_id')
    seller_id = data.get('seller_id')
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    if not all([property_id, seller_id, start_time, end_time]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO availability (property_id, seller_id, start_time, end_time)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (property_id, seller_id, start_time, end_time))

            new_id = cur.fetchone()['id']
            conn.commit()

            return jsonify({'message': 'Availability added', 'id': new_id}), 201

    except Exception as e:
        print(f"Error inserting availability: {e}")
        return jsonify({'error': 'Could not add availability'}), 500
    finally:
        conn.close()

### ✅ GET: Fetch availability by property_id
@app.route('/availability', methods=['GET'])
def get_availability():
    property_id = request.args.get('property_id')

    if not property_id:
        return jsonify({'error': 'Missing property_id'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM availability WHERE property_id = %s ORDER BY start_time ASC
            """, (property_id,))

            result = cur.fetchall()

            return jsonify({'availability': result}), 200

    except Exception as e:
        print(f"Error retrieving availability: {e}")
        return jsonify({'error': 'Could not retrieve availability'}), 500
    finally:
        conn.close()

### ✅ DELETE: Remove availability by ID
@app.route('/availability/<uuid:availability_id>', methods=['DELETE'])
def delete_availability(availability_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM availability WHERE id = %s RETURNING id
            """, (str(availability_id),))

            deleted_id = cur.fetchone()
            if not deleted_id:
                return jsonify({'error': 'Availability not found'}), 404

            conn.commit()

            return jsonify({'message': 'Availability deleted'}), 200

    except Exception as e:
        print(f"Error deleting availability: {e}")
        return jsonify({'error': 'Could not delete availability'}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)