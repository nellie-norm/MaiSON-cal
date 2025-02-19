import React from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';

const TimeSelectionSidebar = ({ 
  selectedDate, 
  onClose, 
  selectedTimes, 
  onToggleTime 
}) => {
  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white border-l shadow-lg">
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            {Array.from({ length: 24 }, (_, i) => {
              const time = `${i.toString().padStart(2, '0')}:00`;
              const isSelected = selectedTimes.has(time);

              return (
                <button
                  key={i}
                  onClick={() => onToggleTime(time)}
                  className={`
                    text-left px-4 py-3 rounded
                    ${isSelected 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected times summary */}
        {selectedTimes.size > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Times:</h3>
            <div className="flex flex-wrap gap-2">
              {[...selectedTimes].sort().map(time => (
                <span key={time} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                  {time}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSelectionSidebar; 