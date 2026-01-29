import React, { useState } from 'react';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { parseNumber } from '../utils/bookingHelpers';

/**
 * Rooms and Guests selection popup
 */
const RoomsGuestsPopup = ({ rooms, guests, onRoomsChange, onGuestsChange, onClose }) => {
  const [roomsList, setRoomsList] = useState(() => {
    const safeRooms = Math.max(parseNumber(rooms, 1), 1);
    const safeGuests = Math.max(parseNumber(guests, 1), 1);
    const list = [];
    let remainingGuests = safeGuests;
    for (let i = 0; i < safeRooms; i++) {
      const roomGuests = i === safeRooms - 1 ? Math.max(1, remainingGuests) : 1;
      list.push({ guests: Math.min(3, Math.max(1, roomGuests)) });
      remainingGuests -= list[i].guests;
    }
    if (list.length !== safeRooms) {
      const reset = [];
      for (let i = 0; i < safeRooms; i++) reset.push({ guests: 1 });
      return reset;
    }
    return list;
  });

  const updateGuests = (index, delta) => {
    setRoomsList((prev) =>
      prev.map((room, i) => {
        if (i !== index) return room;
        return { ...room, guests: Math.max(1, Math.min(3, room.guests + delta)) };
      })
    );
  };

  const addRoom = () => {
    setRoomsList((prev) => (prev.length < 10 ? [...prev, { guests: 1 }] : prev));
  };

  const removeRoom = () => {
    setRoomsList((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const handleDone = () => {
    const totalRooms = roomsList.length;
    const totalGuests = roomsList.reduce((sum, r) => sum + Math.max(parseNumber(r.guests, 1), 1), 0);
    onRoomsChange(totalRooms);
    onGuestsChange(totalGuests);
    onClose();
  };

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 bg-white rounded-2xl shadow-xl border border-gray-200 z-[60] w-[320px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h4 className="font-semibold text-gray-800 text-sm">Rooms & Guests</h4>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition">
          <X size={16} className="text-gray-500" />
        </button>
      </div>
      <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
        {roomsList.map((room, index) => (
          <div key={index} className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-sm font-medium text-gray-700">Room {index + 1}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateGuests(index, -1)}
                disabled={room.guests <= 1}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <Minus size={14} />
              </button>
              <span className="w-4 text-center font-bold text-gray-900 text-sm">{room.guests}</span>
              <button
                onClick={() => updateGuests(index, 1)}
                disabled={room.guests >= 3}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex gap-2">
          {roomsList.length > 1 && (
            <button onClick={removeRoom} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove Room">
              <Trash2 size={16} />
            </button>
          )}
          {roomsList.length < 10 && (
            <button
              onClick={addRoom}
              className="px-3 py-1.5 bg-white border border-gray-200 text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition font-bold text-xs"
            >
              + Add Room
            </button>
          )}
        </div>
        <button onClick={handleDone} className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm">
          APPLY
        </button>
      </div>
    </div>
  );
};

export default RoomsGuestsPopup;
