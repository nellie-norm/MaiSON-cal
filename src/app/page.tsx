"use client";

import React from 'react';
import SellerAvailabilityCalendar from '@/components/AvailabilityCalendar';

export default function AvailabilityPage() {
  // Hardcoded IDs for testing - you would normally get these from
  // URL parameters, auth context, or another source
  const sellerId = 1;
  const propertyId = 1;
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Manage Property Availability</h1>
      
      <SellerAvailabilityCalendar 
        sellerId={sellerId}
        propertyId={propertyId}
      />
    </div>
  );
}