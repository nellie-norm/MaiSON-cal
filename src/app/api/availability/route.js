import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configure database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// GET all availability slots with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const sellerId = searchParams.get('sellerId');
    
    let query = 'SELECT * FROM availability WHERE 1=1';
    const values = [];
    
    if (propertyId) {
      values.push(propertyId);
      query += ` AND property_id = $${values.length}`;
    }
    
    if (sellerId) {
      values.push(sellerId);
      query += ` AND seller_id = $${values.length}`;
    }
    
    query += ' ORDER BY start_time ASC';
    
    const result = await pool.query(query, values);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST to create new availability slots
export async function POST(request) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { sellerId, propertyId, availabilitySlots } = await request.json();
    
    // Validate input
    if (!sellerId || !propertyId || !availabilitySlots || !Array.isArray(availabilitySlots)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    const insertedSlots = [];
    
    // Insert each availability slot
    for (const slot of availabilitySlots) {
      const { startTime, endTime } = slot;
      
      // Validate time range
      if (!startTime || !endTime) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Missing start or end time' }, { status: 400 });
      }
      
      const result = await client.query(
        `INSERT INTO availability 
         (seller_id, property_id, start_time, end_time)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [sellerId, propertyId, startTime, endTime]
      );
      
      insertedSlots.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    return NextResponse.json(insertedSlots, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating availability:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}