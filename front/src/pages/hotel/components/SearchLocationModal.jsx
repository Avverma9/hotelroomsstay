import React, { useState } from 'react';
import { X, MapPin, Search } from 'lucide-react';

export default function SearchLocationModal({ isOpen, onClose, currentLocation, onApply }) {
  const [searchText, setSearchText] = useState(currentLocation);

  const handleApply = () => {
    if (searchText.trim()) {
      onApply(searchText);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">LOCATION</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Enter city, location or property name"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-base focus:outline-none focus:border-blue-600"
              autoFocus
            />
          </div>

          <button 
            onClick={handleApply}
            className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Search size={20} />
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
