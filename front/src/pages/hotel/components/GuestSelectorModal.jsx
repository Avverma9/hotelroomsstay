import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';

export default function GuestSelectorModal({ isOpen, onClose, rooms, adults, children, onApply }) {
  const [selectedRooms, setSelectedRooms] = useState(parseInt(rooms) || 1);
  const [selectedAdults, setSelectedAdults] = useState(parseInt(adults) || 2);
  const [selectedChildren, setSelectedChildren] = useState(parseInt(children) || 0);

  const handleApply = () => {
    onApply(selectedRooms, selectedAdults, selectedChildren);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">GUESTS & ROOMS</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Rooms</p>
              <p className="text-xs text-gray-500">Minimum 1</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedRooms(Math.max(1, selectedRooms - 1))}
                disabled={selectedRooms <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-semibold">{selectedRooms}</span>
              <button
                onClick={() => setSelectedRooms(selectedRooms + 1)}
                className="w-8 h-8 rounded-full border border-blue-600 flex items-center justify-center text-blue-600"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Adults</p>
              <p className="text-xs text-gray-500">Ages 13 or above</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedAdults(Math.max(1, selectedAdults - 1))}
                disabled={selectedAdults <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-semibold">{selectedAdults}</span>
              <button
                onClick={() => setSelectedAdults(selectedAdults + 1)}
                className="w-8 h-8 rounded-full border border-blue-600 flex items-center justify-center text-blue-600"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Children</p>
              <p className="text-xs text-gray-500">Ages 0-12</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedChildren(Math.max(0, selectedChildren - 1))}
                disabled={selectedChildren <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-semibold">{selectedChildren}</span>
              <button
                onClick={() => setSelectedChildren(selectedChildren + 1)}
                className="w-8 h-8 rounded-full border border-blue-600 flex items-center justify-center text-blue-600"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button 
            onClick={handleApply}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
