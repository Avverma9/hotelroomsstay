import React from 'react';
import {
  Wifi, Snowflake, Tv, ParkingCircle, Coffee, UtensilsCrossed,
  Dumbbell, Waves, Bath, Clock, CheckCircle2, Star
} from 'lucide-react';

/**
 * Returns appropriate icon for an amenity label
 */
export const getAmenityIcon = (label) => {
  const lower = String(label || '').toLowerCase();
  if (lower.includes('wi-fi') || lower.includes('wifi')) return <Wifi size={18} className="text-blue-500" />;
  if (lower.includes('ac') || lower.includes('air condition')) return <Snowflake size={18} className="text-cyan-500" />;
  if (lower.includes('tv') || lower.includes('television')) return <Tv size={18} className="text-purple-500" />;
  if (lower.includes('parking')) return <ParkingCircle size={18} className="text-gray-600" />;
  if (lower.includes('breakfast') || lower.includes('meal')) return <Coffee size={18} className="text-orange-500" />;
  if (lower.includes('restaurant') || lower.includes('dining')) return <UtensilsCrossed size={18} className="text-red-500" />;
  if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell size={18} className="text-green-600" />;
  if (lower.includes('pool') || lower.includes('swimming')) return <Waves size={18} className="text-blue-400" />;
  if (lower.includes('housekeeping')) return <Bath size={18} className="text-teal-500" />;
  if (lower.includes('24') || lower.includes('reception')) return <Clock size={18} className="text-indigo-500" />;
  return <CheckCircle2 size={18} className="text-emerald-500" />;
};

/**
 * Section card wrapper component
 */
export const SectionCard = ({ title, icon, right, children }) => (
  <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {right}
    </div>
    {children}
  </section>
);

/**
 * Info rows display component
 */
export const InfoRows = ({ rows }) => (
  <div className="rounded-2xl border border-gray-100 overflow-hidden">
    <div className="divide-y divide-gray-100">
      {rows
        .filter((r) => r && (r.value !== undefined || r.value !== null))
        .map((row, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3 px-4 py-3 bg-white">
            <div className="text-xs sm:text-sm text-gray-500 shrink-0">{row.label}</div>
            <div className={`text-xs sm:text-sm font-semibold text-right ${row.valueClass || 'text-gray-900'}`}>
              {row.value}
            </div>
          </div>
        ))}
    </div>
  </div>
);

/**
 * Star rating display component
 */
export const Stars = ({ value = 0 }) => {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} size={14} className="text-yellow-500" fill="currentColor" />
      ))}
      {half ? <Star size={14} className="text-yellow-500" fill="currentColor" /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} size={14} className="text-gray-300" />
      ))}
    </div>
  );
};
