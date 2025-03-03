// src/app/api/availability/seller/[sellerId]/route.js
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  // your connection config
});

export async function GET(request, { params }) {
  const { sellerId } = params;
  // Your GET handler for seller availability
  
  // Example implementation:
  try {
    const result = await pool.query(
      `SELECT a.*, p.address as property_address 
       FROM availability a
       JOIN properties p ON a.property_id = p.id
       WHERE a.seller_id = $1 
       ORDER BY a.start_time ASC`,
      [sellerId]
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching seller availability:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}