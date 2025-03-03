import { NextResponse } from 'next/server';

const API_PORT = 5002;

// GET all availability slots with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const sellerId = searchParams.get('sellerId');
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Get property-specific availability
    const response = await fetch(
      `http://localhost:${API_PORT}/api/availability/property/${propertyId}?sellerId=${sellerId || ''}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST to create new availability slots
export async function POST(request) {
  try {
    console.log('POST request received at Next.js API route');
    const data = await request.json();
    console.log('Data received in Next.js:', data);
    
    // Log the URL we're about to call
    const pythonUrl = `http://localhost:${API_PORT}/api/availability`;
    console.log('Calling Python backend at:', pythonUrl);
    
    const response = await fetch(pythonUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    console.log('Response from Python backend:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python backend error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save availability' },
      { status: 500 }
    );
  }
}

// DELETE availability
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const sellerId = searchParams.get('sellerId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const response = await fetch(
      `http://localhost:${API_PORT}/api/availability/property/${propertyId}?sellerId=${sellerId || ''}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}