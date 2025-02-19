import React from 'react';
import { format, isToday } from 'date-fns';

const CalendarDay = ({ date, isCurrentMonth, isSelected, onSelect, events = [] }) => {
  const dayIsToday = isToday(date);

  return (
    <button 
      onClick={() => onSelect(date)}
      className={`
        min-h-[200px] p-6 border-r border-b last:border-r-0 relative
        ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
        hover:bg-emerald-50 transition-colors
      `}
    >
      <div className="flex flex-col h-full">
        <span className={`
          inline-flex items-center justify-center w-12 h-12 rounded-full text-lg
          ${isSelected ? 'bg-emerald-600 text-white' : ''}
          ${dayIsToday && !isSelected ? 'bg-emerald-100 text-emerald-600 font-semibold' : ''}
          ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
          hover:bg-emerald-500 hover:text-white transition-colors
        `}>
          {format(date, 'd')}
        </span>
        
        <div className="mt-4 space-y-2 flex-grow">
          {events.map((event, index) => (
            <div key={index} className="px-3 py-2 text-sm rounded bg-emerald-50 text-emerald-700 truncate">
              {event.title}
            </div>
          ))}
        </div>
      </div>
    </button>
  );
};

export default CalendarDay; 