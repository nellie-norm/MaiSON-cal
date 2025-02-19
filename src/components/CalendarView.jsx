import React, { useState } from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarDay from './CalendarDay';
import { getDaysInMonth } from '../utils/calendar';
import { format } from 'date-fns';

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
    <div className="min-h-screen bg-gray-50 p-8 relative flex">
      <div className="flex-1 max-w-[1800px] mx-auto pr-96"> {/* Added right padding for panel */}
        <CalendarHeader 
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
          onToday={() => setCurrentMonth(new Date())}
        />

        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-emerald-50">
            {WEEKDAYS.map(day => (
              <div key={day} className="py-4 text-center border-r last:border-r-0">
                <span className="text-sm font-semibold text-emerald-800">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {getDaysInMonth(currentMonth).map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map(({ date, isCurrentMonth }, dayIndex) => (
                <CalendarDay
                  key={dayIndex}
                  date={date}
                  isCurrentMonth={isCurrentMonth}
                  isSelected={selectedDate?.toDateString() === date.toDateString()}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsTimesPanelOpen(true);
                  }}
                  events={[]}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Time Selection Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-96 bg-white shadow-2xl
        transform transition-transform duration-300 border-l border-gray-200
        ${isTimesPanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
            </h2>
            <button 
              onClick={() => setIsTimesPanelOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Time slots */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col divide-y divide-gray-200">
              {Array.from({ length: 24 }, (_, i) => {
                const time = formatTime(i);
                const isSelected = selectedDate && getSelectedTimesForDate(selectedDate).has(time);

                return (
                  <button
                    key={i}
                    onClick={() => selectedDate && toggleTimeSlot(selectedDate, time)}
                    className={`
                      flex items-center justify-between py-3 px-4
                      ${isSelected 
                        ? 'bg-gray-100 font-medium' 
                        : 'hover:bg-gray-50'
                      }
                      transition-colors
                    `}
                  >
                    <span>{time}</span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected times summary - Back in the panel */}
          {selectedDate && getSelectedTimesForDate(selectedDate).size > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Times:</h3>
              <div className="flex flex-wrap gap-2">
                {[...getSelectedTimesForDate(selectedDate)].sort().map(time => (
                  <span key={time} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {time}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;