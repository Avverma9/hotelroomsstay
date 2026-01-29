import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * Calendar Picker Modal for selecting check-in and check-out dates
 */
const CalendarPicker = ({ checkIn, checkOut, onCheckInChange, onCheckOutChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(checkIn || new Date()));
  const [selecting, setSelecting] = useState('checkIn');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const handleDateClick = (date) => {
    if (!date || date < today) return;
    if (selecting === 'checkIn') {
      onCheckInChange(date.toISOString());
      const currentCheckOut = new Date(checkOut);
      if (currentCheckOut <= date) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        onCheckOutChange(nextDay.toISOString());
      }
      setSelecting('checkOut');
      return;
    }
    const checkInDate = new Date(checkIn);
    if (date <= checkInDate) {
      onCheckInChange(date.toISOString());
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      onCheckOutChange(nextDay.toISOString());
      return;
    }
    onCheckOutChange(date.toISOString());
    onClose();
  };

  const isSelected = (date, type) => {
    if (!date) return false;
    const compareDate = type === 'checkIn' ? new Date(checkIn) : new Date(checkOut);
    return date.toDateString() === compareDate.toDateString();
  };

  const isInRange = (date) => {
    if (!date || !checkIn || !checkOut) return false;
    const d = date.getTime();
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    return d > start && d < end;
  };

  const renderMonth = (monthDate) => {
    const days = getDaysInMonth(monthDate);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return (
      <div className="w-[260px] shrink-0">
        <h3 className="text-center font-bold text-gray-800 mb-3 text-sm">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-2 uppercase tracking-wide">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-8" />;
            const isPast = date < today;
            const isCheckIn = isSelected(date, 'checkIn');
            const isCheckOut = isSelected(date, 'checkOut');
            const inRange = isInRange(date);
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                disabled={isPast}
                className={`h-8 w-8 mx-auto rounded-md text-xs font-semibold transition-all flex items-center justify-center ${
                  isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'
                } ${isCheckIn || isCheckOut ? 'bg-blue-600 text-white shadow-md z-10' : ''} ${
                  inRange ? 'bg-blue-50 text-blue-600' : ''
                } ${!isPast && !isCheckIn && !isCheckOut && !inRange ? 'text-gray-700' : ''}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-auto max-w-[95vw]">
        <div className="p-3 border-b flex items-center justify-between bg-gray-50/50">
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setSelecting('checkIn')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selecting === 'checkIn' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Check-in
            </button>
            <button
              onClick={() => setSelecting('checkOut')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selecting === 'checkOut' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Check-out
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex items-start gap-4 overflow-x-auto no-scrollbar">
          {renderMonth(currentMonth)}
          <div className="w-[1px] bg-gray-100 self-stretch hidden sm:block"></div>
          <div className="hidden sm:block">{renderMonth(nextMonth)}</div>
        </div>

        <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => {
              const prev = new Date(currentMonth);
              prev.setMonth(prev.getMonth() - 1);
              if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) setCurrentMonth(prev);
            }}
            className="p-2 hover:bg-white rounded-full text-gray-600 disabled:opacity-30 border border-transparent hover:border-gray-200 transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => {
              const next = new Date(currentMonth);
              next.setMonth(next.getMonth() + 1);
              setCurrentMonth(next);
            }}
            className="p-2 hover:bg-white rounded-full text-gray-600 border border-transparent hover:border-gray-200 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarPicker;
