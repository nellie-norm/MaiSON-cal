from datetime import datetime
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor

class AvailabilityManager:
    def __init__(self, db_connection_string):
        self.conn_string = db_connection_string

    def _get_connection(self):
        return psycopg2.connect(self.conn_string)

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

    def get_property_availability(self, property_id: int, seller_id: int = None) -> List[dict]:
        """
        Get all availability slots for a property
        """
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT * FROM availability 
                    WHERE property_id = %s
                """
                params = [property_id]
                
                if seller_id:
                    query += " AND seller_id = %s"
                    params.append(seller_id)
                    
                query += " ORDER BY start_time"
                
                cur.execute(query, params)
                return cur.fetchall()

    def delete_property_availability(self, property_id: int, seller_id: int = None) -> dict:
        """
        Delete availability slots for a property
        """
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                query = "DELETE FROM availability WHERE property_id = %s"
                params = [property_id]
                
                if seller_id:
                    query += " AND seller_id = %s"
                    params.append(seller_id)
                    
                cur.execute(query, params)
                deleted_count = cur.rowcount
                return {
                    "message": f"Deleted {deleted_count} availability slots",
                    "deleted_count": deleted_count
                } 