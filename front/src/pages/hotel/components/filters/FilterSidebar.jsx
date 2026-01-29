import React, { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import amenityIcons, { amenitiesList, propertyTypes, starRatings } from '../../../../utils/extrasList';
import { useBedTypes } from '../../../../utils/additional-fields/bedTypes';
import { useRoomTypes } from '../../../../utils/additional-fields/roomTypes';

const DEFAULT_FILTERS = {
  minPrice: 400,
  maxPrice: 10000,
  starRating: '',
  amenities: [],
  type: [],
  bedTypes: [],
  propertyType: [],
};

const FilterSection = ({ title, children }) => (
  <div className="mb-6">
    <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
      <SlidersHorizontal size={14} className="text-blue-500" />
      {title}
    </h4>
    {children}
  </div>
);

const CheckboxTag = ({ label, checked, onChange }) => (
  <label className={`text-sm px-3 py-1.5 border rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${checked ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={(e) => {
        e.stopPropagation();
        onChange();
      }}
    />
    {label}
  </label>
);

const toLabel = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item?.label || item?.name || item?.type || item?.title || String(item);
};

const FilterPanel = ({ filters, onFiltersChange, variant = 'sidebar' }) => {
  const bedTypes = useBedTypes();
  const roomTypes = useRoomTypes();
  const [localFilters, setLocalFilters] = useState({ ...DEFAULT_FILTERS, ...filters });

  useEffect(() => {
    setLocalFilters((prev) => ({ ...prev, ...filters }));
  }, [filters]);

  const triggerChange = (patch) => {
    setLocalFilters((prev) => {
      const updated = { ...prev, ...patch };
      onFiltersChange(updated);
      return updated;
    });
  };

  const handleToggleArrayValue = (field, value) => {
    setLocalFilters((prev) => {
      const current = new Set(prev[field] || []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      const updated = { ...prev, [field]: Array.from(current) };
      onFiltersChange(updated);
      return updated;
    });
  };

  const highlightedAmenities = useMemo(() => amenitiesList.slice(0, variant === 'mobile' ? 8 : 12), [variant]);

  return (
    <div className="space-y-6">
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div>
              <p className="text-[11px] text-gray-500">Min</p>
              <input
                type="number"
                min={0}
                max={localFilters.maxPrice}
                value={localFilters.minPrice}
                onChange={(e) => triggerChange({ minPrice: Number(e.target.value) })}
                className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm"
              />
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Max</p>
              <input
                type="number"
                min={localFilters.minPrice}
                max={50000}
                value={localFilters.maxPrice}
                onChange={(e) => triggerChange({ maxPrice: Number(e.target.value) })}
                className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm"
              />
            </div>
          </div>
          <input
            type="range"
            min="400"
            max="20000"
            step="100"
            value={Math.min(localFilters.maxPrice, 20000)}
            onChange={(e) => triggerChange({ maxPrice: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>₹{localFilters.minPrice.toLocaleString()}</span>
            <span>₹{localFilters.maxPrice.toLocaleString()}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Star Rating">
        <div className="flex flex-wrap gap-2">
          {starRatings.map((rating) => (
            <button
              key={rating}
              onClick={() => triggerChange({ starRating: localFilters.starRating === rating ? '' : rating })}
              className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${localFilters.starRating === rating ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {rating} ★
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Property Type">
        <div className="flex flex-wrap gap-2">
          {propertyTypes.map((type) => (
            <CheckboxTag
              key={type}
              label={type}
              checked={localFilters.propertyType.includes(type)}
              onChange={() => handleToggleArrayValue('propertyType', type)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Room Type">
        <div className="flex flex-wrap gap-2">
          {roomTypes.map((room) => {
            const label = toLabel(room);
            return (
              <CheckboxTag
                key={label}
                label={label}
                checked={localFilters.type.includes(label)}
                onChange={() => handleToggleArrayValue('type', label)}
              />
            );
          })}
          {roomTypes.length === 0 && (
            <p className="text-xs text-gray-400">Loading room types...</p>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Bed Type">
        <div className="flex flex-wrap gap-2">
          {bedTypes.map((bed) => {
            const label = toLabel(bed);
            return (
              <CheckboxTag
                key={label}
                label={label}
                checked={localFilters.bedTypes.includes(label)}
                onChange={() => handleToggleArrayValue('bedTypes', label)}
              />
            );
          })}
          {bedTypes.length === 0 && (
            <p className="text-xs text-gray-400">Loading bed types...</p>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Popular Amenities">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {highlightedAmenities.map((amenity) => (
            <label
              key={amenity.id}
              className={`flex items-center gap-2 p-2 border rounded-lg text-sm cursor-pointer transition-colors ${localFilters.amenities.includes(amenity.name) ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={localFilters.amenities.includes(amenity.name)}
                onChange={() => handleToggleArrayValue('amenities', amenity.name)}
              />
              <span className="text-blue-500">
                {amenityIcons[amenity.name] || '•'}
              </span>
              {amenity.name}
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

const FilterSidebar = ({ filters, onFiltersChange, onClear }) => (
  <aside className="hidden lg:block w-72 shrink-0">
    <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Filters</h3>
        <button onClick={onClear} className="text-blue-600 text-sm font-medium">Clear</button>
      </div>
      <FilterPanel filters={filters} onFiltersChange={onFiltersChange} />
    </div>
  </aside>
);

export const MobileFilterPanel = ({ filters, onFiltersChange, onClear, onApply }) => (
  <div className="p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-lg">Filters</h3>
      <button onClick={onClear} className="text-sm text-blue-600 font-medium">Reset</button>
    </div>
    <FilterPanel filters={filters} onFiltersChange={onFiltersChange} variant="mobile" />
    <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
      <button
        onClick={onClear}
        className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
      >
        Clear
      </button>
      <button
        onClick={onApply}
        className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium"
      >
        Apply Filters
      </button>
    </div>
  </div>
);

export default FilterSidebar;
