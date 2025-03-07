from datetime import datetime
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
import uuid

logger = logging.getLogger(__name__)

class AvailabilityManager:
    def __init__(self, db_connection_string):
        self.conn_string = db_connection_string

    def _get_connection(self):
        return psycopg2.connect(self.conn_string)

    def save_availability(self, property_id: str, seller_id: str, 
                        start_time: datetime, end_time: datetime) -> dict:
        """
        Save a new availability slot for a property
        Returns the created availability record
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Check if property exists
                    cur.execute("SELECT id FROM properties WHERE id = %s", (property_id,))
                    property_exists = cur.fetchone()
                    
                    # Check if seller exists
                    cur.execute("SELECT id FROM sellers WHERE id = %s", (seller_id,))
                    seller_exists = cur.fetchone()
                    
                    # Create seller if it doesn't exist
                    if not seller_exists:
                        logger.info(f"Creating seller with ID {seller_id}")
                        cur.execute("""
                            INSERT INTO sellers (id, name)
                            VALUES (%s, %s)
                            RETURNING id
                        """, (seller_id, f"Seller {seller_id[:8]}"))
                        conn.commit()
                    
                    # Create property if it doesn't exist
                    if not property_exists:
                        logger.info(f"Creating property with ID {property_id}")
                        cur.execute("""
                            INSERT INTO properties (id, name, seller_id)
                            VALUES (%s, %s, %s)
                            RETURNING id
                        """, (property_id, f"Property {property_id[:8]}", seller_id))
                        conn.commit()
                    
                    # Insert availability with UUID generation
                    cur.execute("""
                        INSERT INTO availability 
                        (property_id, seller_id, start_time, end_time)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id, property_id, seller_id, start_time, end_time, created_at, updated_at
                    """, (property_id, seller_id, start_time, end_time))
                    
                    result = cur.fetchone()
                    conn.commit()
                    return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error saving availability: {e}")
            return None

    def get_property_availability(self, property_id: str, seller_id: Optional[str] = None) -> List[dict]:
        """
        Get all availability slots for a property
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                        SELECT id, property_id, seller_id, 
                               start_time, end_time, 
                               created_at, updated_at
                        FROM availability 
                        WHERE property_id = %s
                    """
                    params = [property_id]
                    
                    if seller_id:
                        query += " AND seller_id = %s"
                        params.append(seller_id)
                        
                    query += " ORDER BY start_time"
                    
                    cur.execute(query, params)
                    results = cur.fetchall()
                    return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"Error getting availability: {e}")
            return []

    def delete_property_availability(self, property_id: str, seller_id: Optional[str] = None) -> dict:
        """
        Delete availability slots for a property
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    query = "DELETE FROM availability WHERE property_id = %s"
                    params = [property_id]
                    
                    if seller_id:
                        query += " AND seller_id = %s"
                        params.append(seller_id)
                        
                    cur.execute(query, params)
                    deleted_count = cur.rowcount
                    conn.commit()
                    return {
                        "message": f"Deleted {deleted_count} availability slots",
                        "deleted_count": deleted_count
                    }
        except Exception as e:
            logger.error(f"Error deleting availability: {e}")
            return {"error": str(e), "deleted_count": 0}

    def create_test_data(self) -> dict:
        """
        Create test property and seller with some availability slots
        """
        try:
            with self._get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Create test seller
                    seller_id = str(uuid.uuid4())
                    cur.execute("""
                        INSERT INTO sellers (id, name)
                        VALUES (%s, %s)
                        RETURNING id, name
                    """, (seller_id, f"Test Seller {seller_id[:8]}"))
                    seller = cur.fetchone()

                    # Create test property
                    property_id = str(uuid.uuid4())
                    cur.execute("""
                        INSERT INTO properties (id, name, seller_id)
                        VALUES (%s, %s, %s)
                        RETURNING id, name
                    """, (property_id, f"Test Property {property_id[:8]}", seller_id))
                    property = cur.fetchone()

                    conn.commit()
                    return {
                        "message": "Test data created successfully",
                        "property": dict(property) if property else None,
                        "seller": dict(seller) if seller else None
                    }
        except Exception as e:
            logger.error(f"Error creating test data: {e}")
            return {"error": str(e)}





# from datetime import datetime
# from typing import List
# import psycopg2
# from psycopg2.extras import RealDictCursor

# class AvailabilityManager:
#     def __init__(self, db_connection_string):
#         self.conn_string = db_connection_string

#     def _get_connection(self):
#         return psycopg2.connect(self.conn_string)

#     def save_availability(self, property_id: str, seller_id: str, 
#                     start_time: datetime, end_time: datetime) -> bool:
#         """
#         Save a new availability slot for a property
#         """
#         try:
#             with self._get_connection() as conn:
#                 with conn.cursor() as cur:
#                     # Check if property exists
#                     cur.execute("SELECT id FROM properties WHERE id = %s", (property_id,))
#                     if not cur.fetchone():
#                         print(f"Property {property_id} does not exist")
#                         return False
                    
#                     # Check if seller exists
#                     cur.execute("SELECT id FROM sellers WHERE id = %s", (seller_id,))
#                     if not cur.fetchone():
#                         print(f"Seller {seller_id} does not exist")
#                         return False
                    
#                     # Insert availability
#                     cur.execute("""
#                         INSERT INTO availability (property_id, seller_id, start_time, end_time)
#                         VALUES (%s, %s, %s, %s)
#                         RETURNING id
#                     """, (property_id, seller_id, start_time, end_time))
                    
#                     result = cur.fetchone()
#                     conn.commit()
#                     return result is not None
#         except Exception as e:
#             print(f"Error saving availability: {e}")
#             return False

#     def get_property_availability(self, property_id: int, seller_id: int = None) -> List[dict]:
#         """
#         Get all availability slots for a property
#         """
#         with self._get_connection() as conn:
#             with conn.cursor(cursor_factory=RealDictCursor) as cur:
#                 query = """
#                     SELECT * FROM availability 
#                     WHERE property_id = %s
#                 """
#                 params = [property_id]
                
#                 if seller_id:
#                     query += " AND seller_id = %s"
#                     params.append(seller_id)
                    
#                 query += " ORDER BY start_time"
                
#                 cur.execute(query, params)
#                 return cur.fetchall()

#     def delete_property_availability(self, property_id: int, seller_id: int = None) -> dict:
#         """
#         Delete availability slots for a property
#         """
#         with self._get_connection() as conn:
#             with conn.cursor() as cur:
#                 query = "DELETE FROM availability WHERE property_id = %s"
#                 params = [property_id]
                
#                 if seller_id:
#                     query += " AND seller_id = %s"
#                     params.append(seller_id)
                    
#                 cur.execute(query, params)
#                 deleted_count = cur.rowcount
#                 return {
#                     "message": f"Deleted {deleted_count} availability slots",
#                     "deleted_count": deleted_count
#                 } 