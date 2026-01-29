import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { getAllCars } from "../../redux/slices/car"; 
import { useNavigate } from "react-router-dom";
import { useLoader } from "../../utils/loader";

// --- ICONS (SVG) ---
const Icons = {
  Filter: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Car: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
  MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Fuel: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M12 12v10"/><path d="M8 2h8"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
};

// --- FILTER COMPONENT (All Filters restored) ---
const FilterPanel = ({ filters, setFilters, options, isOpen, onClose, isMobile }) => {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: name === "price" || name === "seats" ? Number(value) : value
    }));
  };

  const resetFilters = () => {
    setFilters({
      make: "All",
      fuelType: "All",
      seats: 1,
      price: options.priceRange.max,
      sharingType: "All",
      vehicleType: "All"
    });
  };

  const Content = () => (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* 1. Price Range */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-sm font-bold text-gray-800">Max Price</label>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">₹{filters.price}</span>
        </div>
        <input
          type="range"
          name="price"
          min={options.priceRange.min}
          max={options.priceRange.max}
          value={filters.price}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>₹{options.priceRange.min}</span>
            <span>₹{options.priceRange.max}</span>
        </div>
      </div>

      {/* 2. Seats Counter */}
      <div>
        <label className="text-sm font-bold text-gray-800 block mb-3">Min Seats Required</label>
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
           <button 
             onClick={() => setFilters(p => ({...p, seats: Math.max(1, p.seats - 1)}))}
             className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 active:scale-95 transition-transform"
           >-</button>
           <div className="text-center">
             <span className="block text-xl font-bold text-gray-900">{filters.seats}</span>
             <span className="text-[10px] text-gray-400 uppercase font-bold">Seats</span>
           </div>
           <button 
             onClick={() => setFilters(p => ({...p, seats: Math.min(10, p.seats + 1)}))}
             className="w-10 h-10 bg-blue-600 rounded-lg shadow-sm shadow-blue-200 flex items-center justify-center text-lg font-bold text-white active:scale-95 transition-transform"
           >+</button>
        </div>
      </div>

      {/* 3. All Dropdowns Restored */}
      <div className="space-y-4">
        {[
            { label: "Car Brand", name: "make", opts: options.makes },
            { label: "Fuel Type", name: "fuelType", opts: options.fuelTypes },
            { label: "Sharing Type", name: "sharingType", opts: options.sharingTypes },
            { label: "Vehicle Type", name: "vehicleType", opts: options.vehicleTypes }
        ].map(f => (
            <div key={f.name}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5 ml-1">{f.label}</label>
            <div className="relative">
                <select 
                    name={f.name} 
                    value={filters[f.name]} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all shadow-sm"
                >
                    <option value="All">All {f.label}s</option>
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </div>
            </div>
        ))}
      </div>
    </div>
  );

  // --- Mobile View (Bottom Sheet) ---
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
          onClick={onClose} 
        />
        
        {/* Slide-Up Panel */}
        <div 
          className={`fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] transform flex flex-col max-h-[90vh] ${isOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          {/* Draggable Handle */}
          <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
             <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-3xl">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
            <button onClick={resetFilters} className="text-sm text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">Reset</button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
             <Content />
          </div>

          {/* Fixed Bottom Button */}
          <div className="p-4 bg-white border-t border-gray-100 pb-safe">
            <button onClick={onClose} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform">
                Show Results
            </button>
          </div>
        </div>
      </>
    );
  }

  // --- Desktop View (Sticky Sidebar) ---
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
            <Icons.Filter />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        </div>
        <button onClick={resetFilters} className="text-xs text-red-500 font-bold hover:underline">Reset</button>
      </div>
      <Content />
    </div>
  );
};

// --- SEARCH MODAL (Same as before) ---
const SearchModal = ({ isOpen, onClose, searchParams, setSearchParams, onSearch }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-[95%] max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Plan your trip</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><Icons.Close /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-3">
             <div className="relative group">
                <Icons.MapPin className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-blue-500" />
                <input type="text" placeholder="From (City)" value={searchParams.from} onChange={e => setSearchParams(p => ({...p, from: e.target.value}))} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium" />
             </div>
             <div className="relative group">
                <Icons.MapPin className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-blue-500" />
                <input type="text" placeholder="To (City)" value={searchParams.to} onChange={e => setSearchParams(p => ({...p, to: e.target.value}))} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium" />
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase mb-1 block">Pickup Date</label>
                  <input type="date" value={searchParams.pickupDate} onChange={e => setSearchParams(p => ({...p, pickupDate: e.target.value}))} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500 font-medium text-sm" />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase mb-1 block">Drop Date</label>
                  <input type="date" value={searchParams.dropDate} onChange={e => setSearchParams(p => ({...p, dropDate: e.target.value}))} className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500 font-medium text-sm" />
               </div>
             </div>
          </div>
          <button onClick={() => { onSearch(); onClose(); }} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-lg text-lg active:scale-95 transition-transform">Search Rides</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function CarsPage() {
  const [cabs, setCabs] = useState([]);
  const [filteredCabs, setFilteredCabs] = useState([]);
  const [isMobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({ from: "", to: "", pickupDate: "", dropDate: "" });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try { 
        const res = await dispatch(getAllCars()); 
        setCabs(res.payload || []); 
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    })();
  }, [dispatch]);

  // Derived Options
  const options = useMemo(() => {
    const prices = cabs.map((c) => c.perPersonCost).filter((p) => p != null);
    return {
      makes: [...new Set(cabs.map((cab) => cab.make))],
      fuelTypes: [...new Set(cabs.map((cab) => cab.fuelType))],
      sharingTypes: ["Shared", "Private"], // Hardcoded or derive from DB if available
      vehicleTypes: ["Car", "Bus", "Bike"],
      priceRange: { min: 0, max: prices.length ? Math.max(...prices) : 3000 },
    };
  }, [cabs]);

  const [filters, setFilters] = useState({ 
    make: "All", 
    fuelType: "All", 
    sharingType: "All",
    vehicleType: "All",
    seats: 1, 
    price: 3000 
  });

  // Init Max Price
  useEffect(() => {
    if (options.priceRange.max > 0) setFilters(p => ({ ...p, price: options.priceRange.max }));
  }, [options.priceRange.max]);

  // Filtering Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      let result = [...cabs];
      
      // Search Params
      if (searchParams.from) result = result.filter(c => c.pickupP?.toLowerCase().includes(searchParams.from.toLowerCase()));
      if (searchParams.to) result = result.filter(c => c.dropP?.toLowerCase().includes(searchParams.to.toLowerCase()));
      
      // Sidebar Filters
      if (filters.make !== "All") result = result.filter(c => c.make === filters.make);
      if (filters.fuelType !== "All") result = result.filter(c => c.fuelType === filters.fuelType);
      if (filters.sharingType !== "All") result = result.filter(c => c.sharingType === filters.sharingType);
      if (filters.vehicleType !== "All") result = result.filter(c => c.vehicleType === filters.vehicleType);
      
      // Numeric Filters
      result = result.filter(c => (c.perPersonCost || 0) <= filters.price);
      result = result.filter(c => c.seater >= filters.seats);

      setFilteredCabs(result);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchParams, filters, cabs]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 lg:pb-10 overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-gray-900 p-1.5 rounded-lg"><Icons.Car className="text-white" /></div>
            <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">HRS Cabs</span>
          </div>
          
          {/* Mobile Search Button */}
          <button 
            onClick={() => setSearchModalOpen(true)}
            className="lg:hidden flex-1 min-w-0 flex items-center justify-between bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-full transition-colors max-w-[280px]"
          >
            <div className="flex items-center gap-2 overflow-hidden">
                <Icons.Search className="text-gray-500" /> 
                <span className="truncate text-sm text-gray-700 font-semibold">
                {searchParams.from || "Where to go?"}
                </span>
            </div>
            <div className="bg-white p-1 rounded-full shadow-sm"><Icons.Filter /></div>
          </button>

          {/* Desktop Search */}
          <div onClick={() => setSearchModalOpen(true)} className="hidden lg:flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full cursor-pointer w-96 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-200 group">
             <Icons.Search className="text-gray-500 group-hover:text-gray-900" />
             <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-gray-800">{searchParams.from || "Search destinations"}</span>
                <span className="text-[10px] text-gray-500 font-medium">Anytime • Anyone</span>
             </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <FilterPanel isMobile={false} filters={filters} setFilters={setFilters} options={options} />
          </aside>

          {/* MAIN LIST */}
          <main className="flex-1 min-w-0">
             <div className="flex justify-between items-end mb-5">
                <h1 className="text-xl font-bold text-gray-900">
                    Available Rides 
                    <span className="text-gray-500 text-sm font-medium ml-2 bg-gray-100 px-2 py-0.5 rounded-full">{filteredCabs.length} found</span>
                </h1>
             </div>
             
             <div className="space-y-4">
               {filteredCabs.map(cab => (
                 <div key={cab._id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-5 hover:shadow-xl hover:border-blue-100 transition-all group">
                    {/* Image */}
                    <div className="sm:w-60 h-48 sm:h-auto bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                       <img src={cab.images || `https://placehold.co/600x400?text=${cab.make}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Car" />
                       <div className="absolute top-2 left-2 flex gap-1">
                           <span className="bg-white/95 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm flex items-center gap-1"><Icons.Fuel /> {cab.fuelType}</span>
                           <span className="bg-gray-900 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm">{cab.vehicleType}</span>
                       </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{cab.make} {cab.model}</h3>
                             <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md"><Icons.Users /> {cab.seats || cab.seater} Seater</span>
                                <span className="bg-gray-50 px-2 py-1 rounded-md">{cab.sharingType}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="block text-2xl font-bold text-gray-900">₹{cab.perPersonCost}</span>
                             <span className="text-[10px] text-gray-400 font-medium uppercase">Per Person</span>
                          </div>
                       </div>

                       {/* Route Line */}
                       <div className="flex items-center gap-3 my-3 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                          <div className="flex-1 min-w-0">
                             <p className="text-xs text-gray-400 font-bold uppercase">Pickup</p>
                             <p className="text-sm font-semibold text-gray-800 truncate" title={cab.pickupP}>{cab.pickupP}</p>
                          </div>
                          <div className="text-gray-300">➔</div>
                          <div className="flex-1 min-w-0 text-right">
                             <p className="text-xs text-gray-400 font-bold uppercase">Drop</p>
                             <p className="text-sm font-semibold text-gray-800 truncate" title={cab.dropP}>{cab.dropP}</p>
                          </div>
                       </div>

                       <button 
                         onClick={() => navigate(`/cab-booking/${cab._id}`)}
                         className="mt-auto w-full bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                         Book This Ride
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                       </button>
                    </div>
                 </div>
               ))}

               {filteredCabs.length === 0 && !isLoading && (
                 <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="inline-flex bg-gray-50 p-4 rounded-full mb-4"><Icons.Car className="text-gray-400 w-8 h-8"/></div>
                    <h3 className="text-lg font-bold text-gray-900">No rides found</h3>
                    <p className="text-sm text-gray-500 mt-1">Try changing your filters or search criteria.</p>
                    <button onClick={() => setFilters({make:"All", fuelType:"All", sharingType:"All", vehicleType:"All", seats:1, price:3000})} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Clear all filters</button>
                 </div>
               )}
             </div>
          </main>
        </div>
      </div>

      {/* MOBILE FAB (Floating Action Button) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-30">
        <button 
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform"
        >
          <Icons.Filter />
          <span className="font-bold text-sm tracking-wide">Filters</span>
          <span className="bg-white text-gray-900 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {Object.values(filters).filter(v => v !== "All" && v !== 1 && v !== 3000).length}
          </span>
        </button>
      </div>

      {/* MODALS */}
      <FilterPanel isMobile={true} isOpen={isMobileFilterOpen} onClose={() => setMobileFilterOpen(false)} filters={filters} setFilters={setFilters} options={options} />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setSearchModalOpen(false)} searchParams={searchParams} setSearchParams={setSearchParams} onSearch={() => {}} />
    </div>
  );
}