"use client";

import React from 'react';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Property Availability</h1>
      
      {/* Add the calendar component with hardcoded test IDs */}
      <AvailabilityCalendar 
        sellerId={1}
        propertyId={1}
      />
    </main>
  );
}