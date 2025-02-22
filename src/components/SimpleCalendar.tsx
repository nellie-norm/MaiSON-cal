"use client";

import React, { useState } from 'react';

const SimpleCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00'
  });

  // Get days in current month
  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();

  // Create array of day numbers
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Create blank spaces for days before first of month
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  // Combine blanks and days
  const allDays = [...blanks, ...days];

  const handleAddEvent = () => {
    if (newEvent.title) {
      setEvents([...events, {
        ...newEvent,
        id: Date.now()
      }]);
      setShowEventForm(false);
      setNewEvent({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '12:00'
      });
    }
  };

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="space-x-2">
          <button onClick={prevMonth} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">←</button>
          <button onClick={nextMonth} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">→</button>
          <button 
            onClick={() => setShowEventForm(true)}
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-600">
            {day}
          </div>
        ))}
        
        {allDays.map((day, index) => (
          <div 
            key={index}
            className={`p-2 min-h-16 border rounded hover:bg-gray-50 ${
              day ? 'cursor-pointer' : ''
            }`}
          >
            {day && (
              <>
                <div className="font-medium">{day}</div>
                {events
                  .filter(event => new Date(event.date).getDate() === day)
                  .map(event => (
                    <div 
                      key={event.id}
                      className="text-sm p-1 mt-1 bg-blue-100 rounded"
                    >
                      {event.title}
                    </div>
                  ))
                }
              </>
            )}
          </div>
        ))}
      </div>

      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Event</h3>
              <button 
                onClick={() => setShowEventForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              className="w-full p-2 border rounded mb-4"
            />
            <button
              onClick={handleAddEvent}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Add Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCalendar;