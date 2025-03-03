import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function GET(request, { params }) {
  try {
    // Await params before destructuring
    const { propertyID } = await params;
    
    const result = await pool.query(
      `SELECT * FROM availability 
       WHERE property_id = $1
       ORDER BY start_time ASC`,
      [propertyID]
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching property availability:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE all availability for a property
export async function DELETE(request, { params }) {
    const client = await pool.connect();
    
    try {
      // Await params before destructuring
      const { propertyID } = await params;
      const { searchParams } = new URL(request.url);
      const sellerId = searchParams.get('sellerId');
      
    await client.query('BEGIN');
    
    let query = 'DELETE FROM availability WHERE property_id = $1';
    const values = [propertyID];
    
    if (sellerId) {
      values.push(sellerId);
      query += ' AND seller_id = $2';
    }
    
    query += ' RETURNING *';
    
    const result = await client.query(query, values);
    await client.query('COMMIT');
    
    return NextResponse.json({
      message: `Deleted ${result.rowCount} availability slots`,
      deletedSlots: result.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting property availability:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}