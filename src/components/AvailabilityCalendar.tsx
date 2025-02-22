"use client";

import React, { useState } from 'react';

interface TimeSlot {
  date: string;
  time: string;
  userType: 'buyer' | 'seller';
}

const timeSlots = [
  '08:00', '08:30','09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

const AvailabilityCalendar = () => {
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    return [...blanks, ...daysArray];
  };

  const formatDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toISOString().split('T')[0];
  };

  const handleTimeToggle = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(formatDate(day));
  };

  const addAvailability = () => {
    const newSlots = selectedTimes.map(time => ({
      date: selectedDate,
      time,
      userType
    }));
    setAvailabilities(prev => [...prev, ...newSlots]);
    setShowForm(false);
    setSelectedTimes([]);
    setSelectedDate('');
  };

  const findMatches = () => {
    const matches = availabilities.reduce((acc, slot) => {
      const matchingSlot = availabilities.find(
        s => s.date === slot.date && 
        s.time === slot.time && 
        s.userType !== slot.userType
      );
      if (matchingSlot) {
        acc.push({
          date: slot.date,
          time: slot.time,
          users: [slot.userType, matchingSlot.userType]
        });
      }
      return acc;
    }, [] as any[]);

    return [...new Set(matches.map(m => JSON.stringify(m)))].map(m => JSON.parse(m));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto text-black">
      <div className="flex justify-between mb-6">
        <div className="space-x-4">
          <button
            className={`px-4 py-2 rounded ${userType === 'buyer' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
            onClick={() => setUserType('buyer')}
          >
            I'm a Buyer
          </button>
          <button
            className={`px-4 py-2 rounded ${userType === 'seller' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
            onClick={() => setUserType('seller')}
          >
            I'm a Seller
          </button>
        </div>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => setShowForm(true)}
        >
          Add Availability
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-black">Add Availability</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex gap-6">
              {/* Calendar */}
              <div className="w-1/2">
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
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center p-2 text-sm font-medium">
                      {day}
                    </div>
                  ))}
                  {generateCalendarDays().map((day, index) => (
                    <button
                      key={index}
                      onClick={() => day && handleDateSelect(day)}
                      disabled={!day}
                      className={`
                        p-2 text-center rounded
                        ${!day ? 'bg-transparent' : 'hover:bg-gray-100'}
                        ${selectedDate === (day ? formatDate(day) : '') ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                      `}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div className="w-1/2">
                <h4 className="font-medium mb-2">Select Times</h4>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeToggle(time)}
                      disabled={!selectedDate}
                      className={`
                        p-2 rounded text-sm
                        ${selectedTimes.includes(time) ? 'bg-blue-500 text-white' : 'bg-gray-100'}
                        ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}
                      `}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={addAvailability}
                disabled={!selectedDate || selectedTimes.length === 0}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-black">Your Availability</h3>
        <div className="space-y-2">
          {availabilities
            .filter(slot => slot.userType === userType)
            .map((slot, index) => (
              <div key={index} className="p-2 bg-gray-100 rounded flex justify-between text-black">
                <span>{new Date(slot.date).toLocaleDateString()} at {slot.time}</span>
                <span className="capitalize">{slot.userType}</span>
              </div>
            ))
          }
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-black">Matching Time Slots</h3>
        <div className="space-y-2">
          {findMatches().map((match, index) => (
            <div key={index} className="p-2 bg-green-100 rounded text-black">
              Match found: {new Date(match.date).toLocaleDateString()} at {match.time}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;