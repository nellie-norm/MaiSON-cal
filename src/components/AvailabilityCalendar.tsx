"use client";

import React, { useState, useRef, useEffect } from 'react';

interface TimeSlot {
  date: string;
  time: string;
}

const timeSlots = [
  '08:00', '08:30','09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

const SellerAvailabilityCalendar = () => {
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  // Initialize current month to current date
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<string | null>(null);
  const [dragEndTime, setDragEndTime] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const generateCalendarDays = () => {
    const { days, firstDay } = getDaysInMonth(currentMonth);
    const blanks = Array(firstDay).fill(null);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    
    // Get today's date information
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthNum = today.getMonth();
    const currentYear = today.getFullYear();
    const isCurrentMonth = currentMonth.getMonth() === currentMonthNum && 
                          currentMonth.getFullYear() === currentYear;
    
    // If this is the current month, disable past days
    if (isCurrentMonth) {
      for (let i = 0; i < currentDay - 1; i++) {
        if (i < daysArray.length) {
          // Mark past days as disabled by setting them to -1
          // (We'll check for negative values to disable them in the UI)
          daysArray[i] = -daysArray[i];
        }
      }
    }
    
    return [...blanks, ...daysArray];
  };

  const formatDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toISOString().split('T')[0];
  };

  // Fixed handleTimeToggle function
  const handleTimeToggle = (time: string) => {
    // If we're in the middle of a drag, don't do anything
    if (isDragging) return;
    
    // Create a new time slot immediately when clicked
    const timeSlot = {
      date: selectedDate,
      time
    };
    
    // Check if this slot already exists
    const existingIndex = availabilities.findIndex(
      slot => slot.date === selectedDate && slot.time === time
    );
    
    if (existingIndex !== -1) {
      // Remove if it already exists
      setAvailabilities(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Add if it doesn't exist
      setAvailabilities(prev => [...prev, timeSlot]);
    }
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(formatDate(day));
    // Clear selected times when changing date
    setSelectedTimes([]);
  };

  // Drag and drop functionality
  const handleDragStart = (time: string, e: React.MouseEvent) => {
    if (!selectedDate) return;
    
    // Only initiate drag if it's not a simple click (prevent interference with toggle)
    // We'll set a small timeout to determine if this is the start of a drag
    const dragTimeout = setTimeout(() => {
      setIsDragging(true);
      setDragStartTime(time);
      setDragEndTime(time);
      
      // Initialize selection with just the start time, or keep existing selection and add to it
      setSelectedTimes(prev => {
        if (!prev.includes(time)) {
          return [...prev, time];
        }
        return prev;
      });
    }, 150); // Small delay to distinguish between click and drag
    
    // Clean up timeout on mouse up
    const clearDragTimeout = () => {
      clearTimeout(dragTimeout);
      document.removeEventListener('mouseup', clearDragTimeout);
    };
    
    document.addEventListener('mouseup', clearDragTimeout);
  };

  const handleDragEnter = (time: string) => {
    if (!isDragging || !selectedDate) return;
    
    setDragEndTime(time);
    
    // Calculate all times between start and end
    const startIndex = timeSlots.indexOf(dragStartTime!);
    const endIndex = timeSlots.indexOf(time);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      
      const selectedRange = timeSlots.slice(start, end + 1);
      setSelectedTimes(selectedRange);
    }
  };

  const handleDragEnd = () => {
    if (isDragging) {
      // Add the currently selected times to availabilities
      const newSlots = selectedTimes
        .filter(time => {
          // Filter out times that already exist in availabilities
          return !availabilities.some(slot => 
            slot.date === selectedDate && slot.time === time
          );
        })
        .map(time => ({
          date: selectedDate,
          time
        }));
      
      if (newSlots.length > 0) {
        setAvailabilities(prev => [...prev, ...newSlots]);
      }
      
      // Reset drag state
      setIsDragging(false);
      setDragStartTime(null);
      setDragEndTime(null);
      
      // Clear selected times after adding them
      setSelectedTimes([]);
    }
  };

  // Add event listeners for mouse up to end dragging
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const addAvailability = () => {
    const newSlots = selectedTimes.map(time => ({
      date: selectedDate,
      time
    }));
    setAvailabilities(prev => [...prev, ...newSlots]);
    setSelectedTimes([]);
    // Keep the selected date for convenience when adding multiple slots
  };

  const removeAvailability = (index: number) => {
    setAvailabilities(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto text-black">
      <h2 className="text-xl font-bold mb-6">Seller Availability</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar and time selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <span className="font-semibold">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="p-2 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center p-2 text-sm font-medium">
                {day}
              </div>
            ))}
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                onClick={() => day && day > 0 && handleDateSelect(day)}
                disabled={!day || day < 0}
                className={`
                  p-2 text-center rounded
                  ${!day ? 'bg-transparent' : day < 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}
                  ${selectedDate === (day && day > 0 ? formatDate(day) : '') ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                `}
              >
                {day ? Math.abs(day) : ''}
              </button>
            ))}
          </div>

          <h4 className="font-medium mb-2">Select Times <span className="text-sm text-gray-500">(drag to select multiple)</span></h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Morning column */}
            <div>
              <h5 className="text-center mb-2 font-medium text-sm bg-blue-50 p-1 rounded">Morning</h5>
              <div className="space-y-1">
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 8 && hour < 12;
                }).map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeToggle(time)}
                    onMouseDown={(e) => handleDragStart(time, e)}
                    onMouseEnter={() => handleDragEnter(time)}
                    disabled={!selectedDate}
                    className={`
                      w-full p-2 rounded text-sm select-none
                      ${selectedTimes.includes(time) ? 'bg-blue-500 text-white' : 'bg-gray-100'}
                      ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}
                      ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Afternoon column */}
            <div>
              <h5 className="text-center mb-2 font-medium text-sm bg-blue-50 p-1 rounded">Afternoon</h5>
              <div className="space-y-1">
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 12 && hour < 17;
                }).map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeToggle(time)}
                    onMouseDown={() => handleDragStart(time)}
                    onMouseEnter={() => handleDragEnter(time)}
                    disabled={!selectedDate}
                    className={`
                      w-full p-2 rounded text-sm select-none
                      ${selectedTimes.includes(time) ? 'bg-blue-500 text-white' : 'bg-gray-100'}
                      ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}
                      ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Evening column */}
            <div>
              <h5 className="text-center mb-2 font-medium text-sm bg-blue-50 p-1 rounded">Evening</h5>
              <div className="space-y-1">
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 17;
                }).map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeToggle(time)}
                    onMouseDown={() => handleDragStart(time)}
                    onMouseEnter={() => handleDragEnter(time)}
                    disabled={!selectedDate}
                    className={`
                      w-full p-2 rounded text-sm select-none
                      ${selectedTimes.includes(time) ? 'bg-blue-500 text-white' : 'bg-gray-100'}
                      ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}
                      ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            Times are automatically saved when selected or dragged
          </div>
        </div>

        {/* Added availability list */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Your Available Slots</h3>
          {availabilities.length === 0 ? (
            <p className="text-gray-500">No availability added yet. Select a date and time to add slots.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {/* Group availabilities by date */}
              {Object.entries(
                availabilities.reduce((acc, slot) => {
                  const date = slot.date;
                  if (!acc[date]) {
                    acc[date] = [];
                  }
                  acc[date].push(slot.time);
                  return acc;
                }, {} as Record<string, string[]>)
              ).map(([date, times], dateIndex) => (
                <div key={dateIndex} className="border border-gray-200 rounded-lg p-3 mb-2">
                  <div className="font-medium mb-2">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                  <div className="flex flex-wrap gap-1">
                    {times.sort().map((time, timeIndex) => {
                      const slotIndex = availabilities.findIndex(slot => slot.date === date && slot.time === time);
                      return (
                        <div key={timeIndex} className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {time}
                          <button 
                            onClick={() => removeAvailability(slotIndex)}
                            className="ml-1 text-blue-500 hover:text-blue-700"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4">
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded w-full text-center">
              All changes are automatically saved
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Your availability is being saved as you select times. This will be shown to potential buyers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAvailabilityCalendar;