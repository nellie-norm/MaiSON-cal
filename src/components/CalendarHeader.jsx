import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const CalendarHeader = ({ currentMonth, onMonthChange, onToday }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-8">
        <h1 className="text-3xl font-bold text-emerald-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h1>
        <div className="flex gap-2 bg-emerald-50 p-1.5 rounded-lg">
          <button 
            onClick={() => onMonthChange(-1)}
            className="p-2 hover:bg-white rounded-md transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-emerald-600" />
          </button>
          <button 
            onClick={() => onMonthChange(1)}
            className="p-2 hover:bg-white rounded-md transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-emerald-600" />
          </button>
        </div>
      </div>
      <button 
        onClick={onToday}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
      >
        <CalendarIcon className="w-5 h-5" />
        Today
      </button>
    </div>
  );
};

export default CalendarHeader; 