// src/app/api/availability/seller/[sellerID]/route.js
import { NextResponse } from 'next/server';

const API_PORT = 5002;

export async function GET(request, { params }) {
    const sellerID = params.sellerID;
    
    try {
        const response = await fetch(`http://localhost:${API_PORT}/api/availability/seller/${sellerID}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching seller availability:', error);
        return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }
}