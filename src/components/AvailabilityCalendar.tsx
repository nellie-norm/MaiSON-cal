"use client";

import React, { useState, useCallback, useEffect } from 'react';

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
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<string | null>(null);
  const [dragEndTime, setDragEndTime] = useState<string | null>(null);
  
  // Regular availability pattern states
  const [showRegularForm, setShowRegularForm] = useState(false);
  const [regularDay, setRegularDay] = useState<number | null>(null);
  const [regularStartTime, setRegularStartTime] = useState<string>('');
  const [regularEndTime, setRegularEndTime] = useState<string>('');
  const [regularWeeks, setRegularWeeks] = useState(4); // How many weeks to add this pattern
  
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  
  // Show temporary "Saved" indicator whenever availabilities change
  useEffect(() => {
    if (availabilities.length > 0) {
      setShowSavedIndicator(true);
      const timer = setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [availabilities]);

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

  const handleTimeToggle = (time: string) => {
    // If we're in the middle of a drag, don't do anything
    if (isDragging) return;
    
    console.log("Toggle time:", time);
    
    // Create a new time slot immediately when clicked
    const timeSlot = {
      date: selectedDate,
      time
    };
    
    // Check if this slot already exists
    const existingIndex = availabilities.findIndex(
      slot => slot.date === selectedDate && slot.time === time
    );
    
    console.log("Existing index:", existingIndex);
    
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

  const handleDragEnter = (time: string) => {
    if (!isDragging || !selectedDate) return;
    
    setDragEndTime(time);
    
    // Calculate all times between start and end
    const startIndex = timeSlots.indexOf(dragStartTime!);
    const endIndex = timeSlots.indexOf(time);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      
      // Get all times in the range
      const selectedRange = timeSlots.slice(start, end + 1);
      console.log("Selected range:", selectedRange); // Debugging
      setSelectedTimes(selectedRange);
    }
  };

  // Find the index of a time slot in the timeSlots array
  const getTimeIndex = (time: string) => timeSlots.indexOf(time);

  // Add regular availability for multiple weeks
  const addRegularAvailability = () => {
    if (!regularDay || !regularStartTime || !regularEndTime) return;
    
    const startIndex = getTimeIndex(regularStartTime);
    const endIndex = getTimeIndex(regularEndTime);
    
    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
      console.error("Invalid time range");
      return;
    }
    
    // Get all times in the range
    const selectedTimeRange = timeSlots.slice(startIndex, endIndex + 1);
    
    // Generate the dates for the selected day of week for the next N weeks
    const newAvailabilities: TimeSlot[] = [];
    const today = new Date();
    
    for (let week = 0; week < regularWeeks; week++) {
      // Find the date of the next occurrence of the selected day
      const date = new Date(today);
      date.setDate(today.getDate() + ((regularDay + 7 - today.getDay()) % 7) + (week * 7));
      
      const formattedDate = date.toISOString().split('T')[0];
      
      // Add each time slot for this date
      selectedTimeRange.forEach(time => {
        // Check if this slot already exists
        const alreadyExists = availabilities.some(
          slot => slot.date === formattedDate && slot.time === time
        );
        
        if (!alreadyExists) {
          newAvailabilities.push({
            date: formattedDate,
            time
          });
        }
      });
    }
    
    // Add all new availabilities
    if (newAvailabilities.length > 0) {
      setAvailabilities(prev => [...prev, ...newAvailabilities]);
    }
    
    // Reset form
    setShowRegularForm(false);
    setRegularDay(null);
    setRegularStartTime('');
    setRegularEndTime('');
  };

  // Simplified drag end handler with fixed dependency array
  const handleDragEnd = useCallback(() => {
    if (isDragging && selectedTimes.length > 0) {
      console.log("Drag ended with selectedTimes:", selectedTimes);
      
      // Process each selected time one by one (more reliable)
      const newTimes: TimeSlot[] = [];
      
      selectedTimes.forEach(time => {
        // Check if we already have this time slot
        const alreadyExists = availabilities.some(
          slot => slot.date === selectedDate && slot.time === time
        );
        
        // Only add if it doesn't already exist
        if (!alreadyExists) {
          console.log("Adding time from drag:", time);
          newTimes.push({ date: selectedDate, time });
        }
      });
      
      if (newTimes.length > 0) {
        setAvailabilities(prev => [...prev, ...newTimes]);
      }
      
      // Reset all states
      setIsDragging(false);
      setDragStartTime(null);
      setDragEndTime(null);
      setSelectedTimes([]);
    }
  }, [isDragging, selectedTimes, availabilities, selectedDate]);

  // Track mouse movement on the document level
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // If we have a drag start but aren't dragging yet, 
      // now we are dragging because mouse moved
      if (dragStartTime && !isDragging) {
        setIsDragging(true);
        setSelectedTimes([dragStartTime]);
      }
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      } else if (dragStartTime) {
        // If we had a start time but never started dragging,
        // this was just a click - clean up
        setDragStartTime(null);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStartTime, isDragging, handleDragEnd]);

  const removeAvailability = (index: number) => {
    setAvailabilities(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto text-black">
      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .fade-out {
          animation: fadeOut 1.5s ease-out 0.5s forwards;
        }
      `}</style>
      
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
                  ${selectedDate === (day && day > 0 ? formatDate(day) : '') ? 'bg-green-500 text-white hover:bg-green-600' : ''}
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
              <h5 className="text-center mb-2 font-medium text-sm bg-green-50 p-1 rounded">Morning</h5>
              <div className="space-y-1">
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 8 && hour < 12;
                }).map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeToggle(time)}
                    onMouseDown={() => {
                      // Only start drag on actual mousedown + move
                      // This allows click to work separately
                      if (!selectedDate) return;
                      setDragStartTime(time);
                    }}
                    onMouseEnter={() => {
                      // Only register as dragging if we have a start time
                      if (dragStartTime && !isDragging) {
                        setIsDragging(true);
                        setSelectedTimes([dragStartTime]);
                      }
                      
                      if (isDragging) {
                        handleDragEnter(time);
                      }
                    }}
                    disabled={!selectedDate}
                    className={`
                      w-full p-2 rounded text-sm select-none
                      ${selectedTimes.includes(time) ? 'bg-green-500 text-white' : 'bg-gray-100'}
                      ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100'}
                      ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                      ${availabilities.some(slot => slot.date === selectedDate && slot.time === time) ? 'bg-green-500 text-white' : ''}
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Afternoon column */}
            <div>
              <h5 className="text-center mb-2 font-medium text-sm bg-green-50 p-1 rounded">Afternoon</h5>
              <div className="space-y-1">
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 12 && hour < 17;
                }).map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeToggle(time)}
                    onMouseDown={() => {
                      // Only start drag on actual mousedown + move
                      // This allows click to work separately
                      if (!selectedDate) return;
                      setDragStartTime(time);
                    }}
                    onMouseEnter={() => {
                      // Only register as dragging if we have a start time
                      if (dragStartTime && !isDragging) {
                        setIsDragging(true);
                        setSelectedTimes([dragStartTime]);
                      }
                      
                      if (isDragging) {
                        handleDragEnter(time);
                      }
                    }}
                    disabled={!selectedDate}
                    className={`
                      w-full p-2 rounded text-sm select-none
                      ${selectedTimes.includes(time) ? 'bg-green-500 text-white' : 'bg-gray-100'}
                      ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100'}
                      ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                      ${availabilities.some(slot => slot.date === selectedDate && slot.time === time) ? 'bg-green-500 text-white' : ''}
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Evening column */}
            <div>
              <h5 className="text-center mb-2 font-medium text-sm bg-green-50 p-1 rounded">Evening</h5>
              <div className="space-y-1">
                {timeSlots.filter(time => {
                  const hour = parseInt(time.split(':')[0]);
                  return hour >= 17;
                }).map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeToggle(time)}
                    onMouseDown={() => {
                      // Only start drag on actual mousedown + move
                      // This allows click to work separately
                      if (!selectedDate) return;
                      setDragStartTime(time);
                    }}
                    onMouseEnter={() => {
                      // Only register as dragging if we have a start time
                      if (dragStartTime && !isDragging) {
                        setIsDragging(true);
                        setSelectedTimes([dragStartTime]);
                      }
                      
                      if (isDragging) {
                        handleDragEnter(time);
                      }
                    }}
                    disabled={!selectedDate}
                    className={`
                      w-full p-2 rounded text-sm select-none
                      ${selectedTimes.includes(time) ? 'bg-green-500 text-white' : 'bg-gray-100'}
                      ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100'}
                      ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                      ${availabilities.some(slot => slot.date === selectedDate && slot.time === time) ? 'bg-green-500 text-white' : ''}
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowRegularForm(true)}
              className="text-green-600 font-medium text-sm hover:text-green-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Regular Availability
            </button>
          </div>
          
          {/* Regular availability popup */}
          {showRegularForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-lg">
                <h3 className="text-lg font-semibold mb-4">Add Regular Availability</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set up a recurring availability pattern for specific days of the week.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Day of the Week</label>
                  <div className="grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={day}
                        onClick={() => setRegularDay(index)}
                        className={`
                          p-2 text-center rounded text-sm
                          ${regularDay === index ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <select 
                      value={regularStartTime} 
                      onChange={(e) => setRegularStartTime(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <select 
                      value={regularEndTime} 
                      onChange={(e) => setRegularEndTime(e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={!regularStartTime}
                    >
                      <option value="">Select time</option>
                      {timeSlots
                        .filter(time => {
                          if (!regularStartTime) return true;
                          return getTimeIndex(time) >= getTimeIndex(regularStartTime);
                        })
                        .map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Number of weeks to schedule: {regularWeeks}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={regularWeeks}
                    onChange={(e) => setRegularWeeks(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 week</span>
                    <span>12 weeks</span>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setShowRegularForm(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addRegularAvailability}
                    disabled={!regularDay || !regularStartTime || !regularEndTime}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Add Regular Availability
                  </button>
                </div>
              </div>
            </div>
          )}
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
                        <div key={timeIndex} className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded">
                          {time}
                          <button 
                            onClick={() => removeAvailability(slotIndex)}
                            className="ml-1 text-green-500 hover:text-green-700"
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
          
          <div className="mt-4 h-6">
            {showSavedIndicator && (
              <div className="text-sm text-green-600 italic text-center fade-out">
                ✓ Changes saved
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAvailabilityCalendar;