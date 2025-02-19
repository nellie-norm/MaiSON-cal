import React, { useState } from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarDay from './CalendarDay';
import { getDaysInMonth } from '../utils/calendar';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import TimeSelectionSidebar from './TimeSelectionSidebar';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTime = (hour) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isTimesPanelOpen, setIsTimesPanelOpen] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState(new Map());

  const handleMonthChange = (increment) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + increment);
      return newDate;
    });
  };

  const toggleTimeSlot = (date, time) => {
    setSelectedTimeSlots(prev => {
      const newMap = new Map(prev);
      const dateKey = date.toDateString();
      const currentSlots = new Set(newMap.get(dateKey) || []);
      
      if (currentSlots.has(time)) {
        currentSlots.delete(time);
      } else {
        currentSlots.add(time);
      }
      
      if (currentSlots.size > 0) {
        newMap.set(dateKey, currentSlots);
      } else {
        newMap.delete(dateKey);
      }
      
      return newMap;
    });
  };

  const getSelectedTimesForDate = (date) => {
    return selectedTimeSlots.get(date.toDateString()) || new Set();
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Simplified header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-normal">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
          <div className="flex">
            <button 
              onClick={() => handleMonthChange(-1)}
              className="p-2 hover:bg-gray-100 rounded-l border"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleMonthChange(1)}
              className="p-2 hover:bg-gray-100 rounded-r border-t border-r border-b"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            className="flex items-center gap-2 px-3 py-1 border rounded hover:bg-gray-100"
            onClick={() => setCurrentMonth(new Date())}
          >
            <CalendarIcon className="w-4 h-4" />
            Today
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2">
              <span className="text-sm text-gray-600">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-t border-l">
          {getDaysInMonth(currentMonth).map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map(({ date, isCurrentMonth }, dayIndex) => (
                <button
                  key={dayIndex}
                  onClick={() => {
                    setSelectedDate(date);
                    setIsTimesPanelOpen(true);
                  }}
                  className={`
                    p-2 min-h-[100px] border-r border-b text-left
                    ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                    hover:bg-gray-50
                  `}
                >
                  <span className={`
                    text-sm
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                    ${selectedDate?.toDateString() === date.toDateString() ? 'text-blue-600' : ''}
                  `}>
                    {format(date, 'd')}
                  </span>
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Time Selection Sidebar */}
        {selectedDate && isTimesPanelOpen && (
          <TimeSelectionSidebar
            selectedDate={selectedDate}
            onClose={() => setIsTimesPanelOpen(false)}
            selectedTimes={getSelectedTimesForDate(selectedDate)}
            onToggleTime={(time) => toggleTimeSlot(selectedDate, time)}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarView;