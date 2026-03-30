import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Loader2, 
  AlertTriangle, 
  PencilLine, 
  Trash2, 
  Search, 
  Filter,
  Plus,
  Users,
  Fuel,
  Settings2,
  Gauge,
  ChevronRight,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { getCarByOwnerId, deleteCarById } from '../../../redux/slices/tms/travel/car';
import Breadcrumb from '../../components/breadcrumb';

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop";

// Compact & Glowing Status Badge
const StatusBadge = ({ runningStatus, isAvailable }) => {
  let statusStr = "Unavailable";
  if (runningStatus) {
    statusStr = runningStatus;
  } else if (isAvailable) {
    statusStr = "Available";
  }

  const normalizedStatus = statusStr.toLowerCase();
  let config = { bg: "bg-slate-500/90", dot: "bg-white", text: statusStr };

  if (normalizedStatus.includes("on a trip") || normalizedStatus.includes("trip")) {
    config = { bg: "bg-indigo-500/90", dot: "bg-white animate-pulse", text: "On A Trip" };
  } else if (normalizedStatus.includes("available")) {
    config = { bg: "bg-emerald-500/90", dot: "bg-white", text: "Available" };
  } else if (normalizedStatus.includes("completed")) {
    config = { bg: "bg-purple-500/90", dot: "bg-white", text: "Completed" };
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md ${config.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`}></span>
      {config.text}
    </span>
  );
};

// Compact Car Card
const CarCard = ({ car, onDelete }) => {
  const imageUrl = car?.images?.[0] || FALLBACK_IMAGE;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300">
      
      {/* Compact Image Header */}
      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
        <img 
          src={imageUrl} 
          alt={`${car.make} ${car.model}`} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent"></div>
        
        <div className="absolute left-2.5 top-2.5">
          <StatusBadge runningStatus={car.runningStatus} isAvailable={car.isAvailable} />
        </div>
        
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
          <div className="min-w-0 pr-2">
            <p className="truncate text-lg font-extrabold text-white leading-tight">{car.make} {car.model}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">{car.year}</span>
              <span className="truncate text-[10px] font-medium text-slate-300">• {car.color || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Body */}
      <div className="flex flex-1 flex-col p-3.5">
        
        {/* Tags & Price Row */}
        <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap gap-1">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">
              {car.vehicleType}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">
              {car.sharingType}
            </span>
            {car.vehicleNumber && (
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-indigo-600 border border-indigo-100">
                {car.vehicleNumber}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-base font-extrabold leading-none text-slate-900">₹{car.price || car.perPersonCost || 0}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">/{car.sharingType === 'Shared' ? 'seat' : 'day'}</span>
          </div>
        </div>

        {/* High-Density Specs Grid */}
        <div className="mb-3 grid grid-cols-2 gap-y-2 gap-x-2 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{car.seater || '-'} Seats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{car.fuelType || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings2 size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{car.transmission || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{car.mileage ? `${car.mileage} kmpl` : '-'}</span>
          </div>
        </div>

        {/* Route (If Applicable) */}
        {(car.pickupP || car.dropP) && (
          <div className="mb-3 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 border border-slate-100">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">
                {car.pickupP || 'Any'} <span className="text-slate-300 mx-0.5">→</span> {car.dropP || 'Any'}
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <Link to={`/your-cars/${car._id}/edit`} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600 focus:outline-none">
              <PencilLine size={14} />
            </Link>
            <button
              onClick={() => onDelete(car._id)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          <Link to={`/your-cars/${car._id}`} className="flex h-7 items-center justify-center rounded-md bg-slate-900 px-3 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none">
            Details <ChevronRight size={12} className="ml-0.5" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default function YourCars() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { ownerCars, loading, error } = useSelector((state) => state.car);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sharingFilter, setSharingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleDelete = (carId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This cannot be undone.')) return;
    dispatch(deleteCarById(carId));
  };

  useEffect(() => {
    const ownerId = user?._id || user?.id;
    if (ownerId) {
      dispatch(getCarByOwnerId(ownerId));
    }
  }, [dispatch, user]);

  // Filtering Logic
  const filteredCars = useMemo(() => {
    if (!ownerCars) return [];
    
    return ownerCars.filter((car) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (car.make || '').toLowerCase().includes(searchLower) || 
        (car.model || '').toLowerCase().includes(searchLower) || 
        (car.vehicleNumber || '').toLowerCase().includes(searchLower);
      
      const matchesType = typeFilter ? car.vehicleType === typeFilter : true;
      const matchesSharing = sharingFilter ? car.sharingType === sharingFilter : true;
      
      let matchesStatus = true;
      if (statusFilter) {
        const currentStatus = car.runningStatus || (car.isAvailable ? 'Available' : 'Unavailable');
        matchesStatus = currentStatus.toLowerCase().includes(statusFilter.toLowerCase());
      }

      return matchesSearch && matchesType && matchesSharing && matchesStatus;
    });
  }, [ownerCars, searchTerm, typeFilter, sharingFilter, statusFilter]);

  const hasActiveFilters = searchTerm || typeFilter || sharingFilter || statusFilter;

  return (
    <div className="min-h-screen bg-slate-50/40 font-sans text-slate-900 selection:bg-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Compact Header Section */}
        <div className="mb-6">
          <Breadcrumb />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Your Vehicles</h1>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Manage fleet, live status, and pricing configs.
              </p>
            </div>
            <Link to="/add-a-car" className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none">
              <Plus size={16} /> Add Vehicle
            </Link>
          </div>
        </div>

        {/* Ultra-Compact Filter Toolbar */}
        {!loading && !error && ownerCars?.length > 0 && (
          <div className="mb-6 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-sm flex flex-col lg:flex-row items-center gap-2">
            
            <div className="flex flex-col sm:flex-row flex-1 w-full divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Search */}
              <div className="relative flex-[1.5] group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search make, model..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full appearance-none bg-transparent py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition-colors hover:bg-slate-50 rounded-lg sm:rounded-none sm:rounded-l-lg placeholder:font-normal placeholder:text-slate-400"
                />
              </div>

              {/* Type Filter */}
              <div className="relative flex-1 group shrink-0">
                <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full appearance-none bg-transparent py-2 pl-8 pr-7 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors">
                  <option value="">All Types</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Bus">Bus</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              
              {/* Sharing Filter */}
              <div className="relative flex-1 group shrink-0">
                <select value={sharingFilter} onChange={(e) => setSharingFilter(e.target.value)} className="w-full appearance-none bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors">
                  <option value="">All Modes</option>
                  <option value="Private">Private</option>
                  <option value="Shared">Shared</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative flex-1 group shrink-0">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 sm:rounded-none sm:rounded-r-lg transition-colors">
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="On A Trip">On A Trip</option>
                  <option value="Completed">Completed</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Badges & Clear */}
            <div className="flex items-center gap-2 px-2 lg:px-0 w-full lg:w-auto pb-1.5 lg:pb-0">
              {hasActiveFilters && (
                <button 
                  onClick={() => { setSearchTerm(''); setTypeFilter(''); setSharingFilter(''); setStatusFilter(''); }} 
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-900 px-2 transition-colors"
                >
                  Clear
                </button>
              )}
              <div className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">
                {filteredCars.length} Records
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-indigo-600 mb-3" />
            <p className="text-xs font-bold text-slate-500">Fetching fleet data...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 shadow-sm">
            <AlertTriangle size={16} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && ownerCars?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3">
              <Car size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Vehicles Registered</h3>
            <p className="mt-1 text-xs font-medium text-slate-500 max-w-sm">
              You haven't added any vehicles to your portfolio yet.
            </p>
            <Link to="/add-a-car" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800">
              <Plus size={14} /> Add Vehicle
            </Link>
          </div>
        )}

        {!loading && !error && ownerCars?.length > 0 && filteredCars.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
            <Search size={24} className="text-slate-300 mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Matches Found</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Try adjusting your filters.</p>
          </div>
        )}

        {!loading && !error && filteredCars.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCars.map((car) => (
              <CarCard key={car._id} car={car} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}