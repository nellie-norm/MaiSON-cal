from datetime import datetime
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor
import os

class AvailabilityManager:
    def __init__(self, connection_string=None):
        # If no connection string is provided, construct from environment variables
        if not connection_string:
            # Extract database connection details from environment variables
            db_host = os.getenv('DB_HOST', 'localhost')
            db_name = os.getenv('DB_NAME', 'postgres')
            db_user = os.getenv('DB_USER', 'postgres')
            db_password = os.getenv('DB_PASSWORD', 'postgres')
            db_port = os.getenv('DB_PORT', '5432')
            
            # Construct connection string with SSL mode based on host
            if db_host in ['localhost', '127.0.0.1', 'host.docker.internal']:
                connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}?sslmode=disable"
            else:
                # For cloud/remote databases, use SSL
                connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}?sslmode=require"
        
        self.connection_string = connection_string
        print(f"Connection String: {self.connection_string.split(':')[2].split('@')[0]}")  # Safely log partial connection info

    def _get_connection(self):
        try:
            return psycopg2.connect(self.connection_string)
        except Exception as e:
            print(f"Connection Error: {e}")
            raise

    def save_availability(self, property_id: int, seller_id: int, 
                        start_time: datetime, end_time: datetime) -> bool:
        """
        Save a new availability slot for a property
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # Check if property exists
                    cur.execute("SELECT id FROM properties WHERE id = %s", (property_id,))
                    if not cur.fetchone():
                        print(f"Property {property_id} does not exist")
                        return False
                    
                    # Check if seller exists
                    cur.execute("SELECT id FROM sellers WHERE id = %s", (seller_id,))
                    if not cur.fetchone():
                        print(f"Seller {seller_id} does not exist")
                        return False
                    
                    # Insert availability
                    cur.execute("""
                        INSERT INTO availability (property_id, seller_id, start_time, end_time)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id
                    """, (property_id, seller_id, start_time, end_time))
                    
                    result = cur.fetchone()
                    conn.commit()
                    return result is not None
        except Exception as e:
            print(f"Error saving availability: {e}")
            return False

    def get_property_availability(self, property_id, seller_id=None):
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Build query based on parameters
                    query = "SELECT * FROM availability WHERE property_id = %s"
                    params = [property_id]
                    
                    if seller_id:
                        query += " AND seller_id = %s"
                        params.append(seller_id)
                    
                    cur.execute(query, params)
                    return cur.fetchall()
        except Exception as e:
            print(f"Error fetching availability: {e}")
            return []

    def create_availability(self, seller_id, property_id, availability_slots):
        # More robust implementation
        try:
            successes = 0
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    for slot in availability_slots:
                        start_time = datetime.fromisoformat(slot['start_time'])
                        end_time = datetime.fromisoformat(slot['end_time'])
                        
                        # Insert each availability slot
                        cur.execute("""
                            INSERT INTO availability (property_id, seller_id, start_time, end_time)
                            VALUES (%s, %s, %s, %s)
                            RETURNING id
                        """, (property_id, seller_id, start_time, end_time))
                        
                        if cur.fetchone():
                            successes += 1
                    
                    conn.commit()
            
            return {
                "message": f"Created {successes} out of {len(availability_slots)} availability slots",
                "total_slots": len(availability_slots),
                "successful_slots": successes
            }
        except Exception as e:
            print(f"Error creating availability: {e}")
            return {"error": str(e), "message": "Failed to create availability slots"}

    def delete_property_availability(self, property_id, seller_id=None):
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # Build query based on parameters
                    query = "DELETE FROM availability WHERE property_id = %s"
                    params = [property_id]
                    
                    if seller_id:
                        query += " AND seller_id = %s"
                        params.append(seller_id)
                    
                    cur.execute(query, params)
                    conn.commit()
                    
                    return {
                        "message": "Availability deleted successfully", 
                        "rows_deleted": cur.rowcount
                    }
        except Exception as e:
            print(f"Error deleting availability: {e}")
            return {"error": str(e), "message": "Failed to delete availability"}