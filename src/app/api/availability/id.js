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

// GET a specific availability slot by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const result = await pool.query(
      'SELECT * FROM availability WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE a specific availability slot
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const result = await pool.query(
      'DELETE FROM availability WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Availability slot deleted',
      deletedSlot: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT/PATCH to update a specific availability slot
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { startTime, endTime } = await request.json();
    
    // Validate input
    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const result = await pool.query(
      `UPDATE availability 
       SET start_time = $1, end_time = $2
       WHERE id = $3
       RETURNING *`,
      [startTime, endTime, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}