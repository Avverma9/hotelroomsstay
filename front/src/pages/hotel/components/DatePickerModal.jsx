import React, { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function DatePickerModal({ isOpen, onClose, checkIn, checkOut, onApply }) {
  const today = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);

  const [selectedCheckIn, setSelectedCheckIn] = useState(checkIn ? new Date(checkIn) : null);
  const [selectedCheckOut, setSelectedCheckOut] = useState(checkOut ? new Date(checkOut) : null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [nextMonth, setNextMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d;
  });

  // keep in sync when props change
  useEffect(() => {
    setSelectedCheckIn(checkIn ? new Date(checkIn) : null);
    setSelectedCheckOut(checkOut ? new Date(checkOut) : null);
  }, [checkIn, checkOut]);

  // keep two months always consecutive
  useEffect(() => {
    const n = new Date(currentMonth);
    n.setMonth(n.getMonth() + 1);
    n.setDate(1);
    setNextMonth(n);
  }, [currentMonth]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const formatDate = (date) => (date ? date.toISOString().split("T")[0] : "");

  const formatDisplayDate = (date) =>
    date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

  const handleDateClick = (date) => {
    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      setSelectedCheckIn(date);
      setSelectedCheckOut(null);
      return;
    }
    if (selectedCheckIn && !selectedCheckOut) {
      if (date > selectedCheckIn) setSelectedCheckOut(date);
      else {
        setSelectedCheckIn(date);
        setSelectedCheckOut(null);
      }
    }
  };

  const isDateInRange = (date) => {
    if (!selectedCheckIn || !selectedCheckOut || !date) return false;
    return date > selectedCheckIn && date < selectedCheckOut;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const d = formatDate(date);
    return (selectedCheckIn && d === formatDate(selectedCheckIn)) || (selectedCheckOut && d === formatDate(selectedCheckOut));
  };

  const handleApply = () => {
    if (selectedCheckIn && selectedCheckOut) {
      onApply(formatDate(selectedCheckIn), formatDate(selectedCheckOut));
      onClose();
    }
  };

  const goPrev = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    prev.setDate(1);
    setCurrentMonth(prev);
  };

  const goNext = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    setCurrentMonth(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden">
        {/* Slim header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide">Select dates</div>
            <div className="mt-0.5 text-xs text-gray-500 truncate">
              {selectedCheckIn ? formatDisplayDate(selectedCheckIn) : "Check-in"}
              {"  "}
              {selectedCheckOut ? `→ ${formatDisplayDate(selectedCheckOut)}` : "→ Check-out"}
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[currentMonth, nextMonth].map((month, idx) => (
              <div key={idx} className="select-none">
                {/* Month bar (more compact) */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={goPrev}
                    className={`p-1.5 rounded hover:bg-gray-100 ${idx === 0 ? "visible" : "invisible"}`}
                    aria-hidden={idx !== 0}
                    tabIndex={idx !== 0 ? -1 : 0}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="text-sm font-semibold">
                    {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>

                  <button
                    onClick={goNext}
                    className={`p-1.5 rounded hover:bg-gray-100 ${idx === 1 ? "visible" : "invisible"}`}
                    aria-hidden={idx !== 1}
                    tabIndex={idx !== 1 ? -1 : 0}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Week headers */}
                <div className="grid grid-cols-7 text-center text-[11px] text-gray-500">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="py-1 font-medium">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid (smaller cells) */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(month).map((date, i) => {
                    const isPast = date && date < today;
                    const selected = isDateSelected(date);
                    const inRange = isDateInRange(date);

                    return (
                      <button
                        key={i}
                        onClick={() => date && handleDateClick(date)}
                        disabled={!date || isPast}
                        className={[
                          "h-9 w-9 md:h-9 md:w-9 rounded-md text-sm",
                          "flex items-center justify-center",
                          !date ? "invisible" : "",
                          isPast ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100",
                          inRange ? "bg-blue-50" : "",
                          selected ? "bg-blue-600 text-white hover:bg-blue-600" : "",
                        ].join(" ")}
                      >
                        {date?.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer (compact) */}
          <div className="mt-4 pt-3 border-t flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedCheckIn || !selectedCheckOut}
              className="flex-1 h-10 rounded-lg bg-black text-white text-sm font-medium disabled:bg-gray-300"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
