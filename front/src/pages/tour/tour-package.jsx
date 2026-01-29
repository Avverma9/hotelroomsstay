import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getTravelList } from "../../redux/slices/travelSlice";
import { useLoader } from "../../utils/loader";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import HolidayImageSlider from "../../components/HolidayImageSlider";
import { ChevronDownIcon, FunnelIcon, XMarkIcon, StarIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";


// Updated amenity icons to be more generic
const getAmenityIcon = (amenity) => {
  const amenityLower = amenity.toLowerCase();
  
  if (amenityLower.includes('coffee') || amenityLower.includes('breakfast')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
  }
  if (amenityLower.includes('hotel') || amenityLower.includes('stay')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  }
  if (amenityLower.includes('pool') || amenityLower.includes('swim')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c.6.5 1.2 1 2.1 1C5.8 16 7.2 15 8.9 15c1.6 0 3.1 1 4.6 1 1.4 0 2.8-1 4.5-1 .9 0 1.5.5 2.1 1"/><path d="M2 20c.6.5 1.2 1 2.1 1 1.7 0 3.1-1 4.8-1 1.6 0 3.1 1 4.6 1 1.4 0 2.8-1 4.5-1 .9 0 1.5.5 2.1 1"/><path d="m2 12 2-4 4 2 4-6 3 6 4-2 2 4"/></svg>;
  }
  if (amenityLower.includes('wifi') || amenityLower.includes('wi-fi')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a8 8 0 0 1 14 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M8 16.29a4 4 0 0 1 8 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
  }
  if (amenityLower.includes('guide') || amenityLower.includes('tour')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  }
  if (amenityLower.includes('parking')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V6h6.5a4.5 4.5 0 1 1 0 9H9"/></svg>;
  }
  if (amenityLower.includes('gym') || amenityLower.includes('fitness')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.2 21.2-3.8-3.8"/><path d="M12.028 12.028 2.8 2.8"/><path d="m18.4 6-2.8 2.8"/><path d="M14.8 9.6 2.8 21.2"/><path d="M9.6 14.8 21.2 2.8"/></svg>;
  }
  if (amenityLower.includes('restaurant') || amenityLower.includes('dinner') || amenityLower.includes('meal')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>;
  }
  if (amenityLower.includes('music')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
  }
  if (amenityLower.includes('pet')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11.5" cy="8.5" r="2.5"/><path d="M12 12v9"/><circle cx="6" cy="15" r="1.5"/><circle cx="18" cy="15" r="1.5"/><path d="M6 12l6-4 6 4"/></svg>;
  }
  if (amenityLower.includes('ac') || amenityLower.includes('air')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10 2 10"/><path d="M12 14 2 14"/><path d="M20 12 2 12"/><path d="m16 6-4 4 4 4"/></svg>;
  }
  if (amenityLower.includes('pickup') || amenityLower.includes('transport')) {
    return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>;
  }
  
  // Default icon for unknown amenities
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
};


const AmenityDisplay = ({ amenity }) => {
  return (
    <div className="flex items-center justify-center w-7 h-7 bg-gray-50 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors" title={amenity}>
      {getAmenityIcon(amenity)}
    </div>
  );
};


const Tag = ({ children, className }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
    {children}
  </span>
);


const bannerImages = {
  default: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1932&auto=format&fit=crop",
  shimla: "https://images.unsplash.com/photo-1561361533-ebb360ca0297?q=80&w=2070&auto=format&fit=crop",
  patna: "https://images.unsplash.com/photo-1627513393021-a91334c40b8a?q=80&w=1932&auto=format&fit=crop"
};


const HeroBanner = ({ onSearch, searchTerm }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(searchTerm);


  useEffect(() => setTo(searchTerm), [searchTerm]);


  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(to);
  };


  const bannerImage = bannerImages[searchTerm.toLowerCase()] || bannerImages.default;


  return (
    <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6 group">
      <img src={bannerImage} alt="Travel Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-12">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-md">
          {searchTerm ? `Explore ${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)}` : 'Find Your Next Adventure'}
        </h1>
        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-lg p-1.5 flex shadow-lg">
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From"
            className="flex-1 min-w-0 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-transparent border-r border-gray-100 focus:outline-none"
          />
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Destination"
            className="flex-1 min-w-0 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 bg-transparent focus:outline-none"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-md transition-colors">
            Search
          </button>
        </form>
      </div>
    </div>
  );
};


const PackageCard = ({ item, handleBooking }) => {
  const amenitiesToShow = item.amenities ? item.amenities.slice(0, 5) : [];
  
  return (
    <div 
      onClick={() => handleBooking(item._id)}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer h-full overflow-hidden"
    >
      <div className="relative h-48 overflow-hidden">
        <HolidayImageSlider
          images={item.images}
          heightClass="h-48"
          showIndicators={false}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-gray-800 flex items-center shadow-sm">
          {item.starRating} <StarIcon className="w-3 h-3 text-amber-400 ml-0.5" />
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1">
          <Tag className="bg-black/50 backdrop-blur text-white border border-white/20">
            {item.nights}N / {item.days}D
          </Tag>
        </div>
      </div>


      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {item.travelAgencyName}
          </h3>
        </div>
        
        <p className="text-xs text-gray-500 flex items-center mb-3">
          <MapPinIcon className="w-3 h-3 mr-1 text-gray-400" />
          {item.city}, {item.state}
        </p>


        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar py-1">
           {amenitiesToShow.map((am, idx) => <AmenityDisplay key={idx} amenity={am} />)}
        </div>


        <div className="mt-auto pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Starting from</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">
              ₹{item.price.toLocaleString()}
            </p>
          </div>
          <button className="bg-blue-50 text-blue-600 text-xs font-bold px-4 py-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
            View Deal
          </button>
        </div>
      </div>
    </div>
  );
};


const FilterSidebar = ({ filters, handleFilterChange, maxPrice, allThemes, allAmenities, clearFilters, applyFilters, setIsSidebarOpen }) => {
  return (
    <aside className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <FunnelIcon className="w-4 h-4 mr-2 text-blue-600"/> Filters
        </h2>
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-gray-200 rounded-full">
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>


      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <div className="flex justify-between text-xs font-medium text-gray-700 mb-2">
            <span>Budget</span>
            <span>₹{Number(filters.price).toLocaleString()}</span>
          </div>
          <input 
            type="range" 
            name="price" 
            min="0" 
            max={maxPrice} 
            value={filters.price} 
            onChange={handleFilterChange} 
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
        </div>


        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Star Rating</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star} 
                onClick={() => handleFilterChange({ target: { name: 'rating', value: star === filters.rating ? 0 : star }})} 
                className={`flex-1 h-9 rounded-md border flex items-center justify-center transition-all ${filters.rating >= star ? 'bg-amber-50 border-amber-200 text-amber-500' : 'border-gray-200 text-gray-300 hover:border-gray-300'}`}
              >
                <StarIcon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>


        {[ {title: 'Themes', name: 'themes', options: allThemes}, {title: 'Amenities', name: 'amenities', options: allAmenities} ].map(group => (
          <div key={group.name}>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">{group.title}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {group.options.map(option => (
                <label key={option} className="flex items-center group cursor-pointer">
                  <div className="relative flex items-center">
                    <input 
                      name={group.name} 
                      value={option} 
                      type="checkbox" 
                      checked={filters[group.name].includes(option)} 
                      onChange={handleFilterChange} 
                      className="peer sr-only" 
                    />
                    <div className="w-4 h-4 border border-gray-300 rounded bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                    <svg className="absolute w-2.5 h-2.5 text-white left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span className="ml-2.5 text-xs text-gray-600 group-hover:text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>


      <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
        <button onClick={clearFilters} className="flex-1 px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100">Reset</button>
        <button onClick={applyFilters} className="flex-1 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">Show Results</button>
      </div>
    </aside>
  );
};


function TourPackages() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();  
  const { data } = useSelector((state) => state.travel);
  const travelData = Array.isArray(data) ? data : [];

console.log("Travel Data:", travelData);
  useEffect(() => {
    showLoader();
    dispatch(getTravelList({})).finally(() => hideLoader());
  }, [dispatch]);


  const handleBooking = useCallback((id) => navigate(`/travellers/booking/${id}`), [navigate]);
  
  // FIXED: Parse themes as comma-separated string and create unique array
  const allThemes = useMemo(() => {
    const themesSet = new Set();
    travelData.forEach(item => {
      if (item.themes && typeof item.themes === 'string') {
        // Split by comma and trim whitespace
        item.themes.split(',').forEach(theme => {
          const trimmed = theme.trim();
          if (trimmed) themesSet.add(trimmed);
        });
      }
    });
    return Array.from(themesSet).sort();
  }, [travelData]);
  
  const allAmenities = useMemo(() => [...new Set(travelData.flatMap(item => item.amenities ?? []))].sort(), [travelData]);
  const maxPrice = useMemo(() => (travelData.length > 0 ? Math.max(...travelData?.map(item => item.price)) : 100000), [travelData]);
  
  const initialFilters = { searchTerm: '', price: maxPrice, themes: [], amenities: [], rating: 0 };
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [tempFilters, setTempFilters] = useState(initialFilters);


  useEffect(() => {
    setActiveFilters(f => ({...f, price: maxPrice}));
    setTempFilters(f => ({...f, price: maxPrice}));
  }, [maxPrice]);


  useEffect(() => { if (isSidebarOpen) setTempFilters(activeFilters); }, [isSidebarOpen, activeFilters]);


  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTempFilters(prev => {
      if (type === 'checkbox') {
        const newValues = checked ? [...prev[name], value] : prev[name].filter(item => item !== value);
        return { ...prev, [name]: newValues };
      }
      return { ...prev, [name]: value };
    });
  };
  
  const handleSearch = (term) => {
    showLoader();
    setTimeout(() => {
      const newFilters = {...activeFilters, searchTerm: term };
      setActiveFilters(newFilters);
      setTempFilters(newFilters);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      hideLoader();
    }, 300);
  };
  
  const applyFilters = () => { 
    showLoader();
    setTimeout(() => {
      setActiveFilters(tempFilters); 
      setIsSidebarOpen(false); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      hideLoader();
    }, 300);
  };
  
  const clearAndApplyFilters = () => { 
    showLoader();
    setTimeout(() => {
      setActiveFilters(prev => ({...initialFilters, searchTerm: ""})); 
      setTempFilters(prev => ({...initialFilters, searchTerm: ""})); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      hideLoader();
    }, 300);
  };


  // FIXED: Filter logic to handle themes as string
  const filteredData = useMemo(() => {
    return travelData.filter(item => {
      if (!item) return false;
      
      const searchLower = activeFilters.searchTerm.toLowerCase();
      const nameMatch = item.travelAgencyName?.toLowerCase().includes(searchLower);
      const cityMatch = item.city?.toLowerCase().includes(searchLower);
      const priceMatch = item.price <= activeFilters.price;
      const ratingMatch = item.starRating >= activeFilters.rating;
      
      // FIXED: Handle themes as comma-separated string
      let themeMatch = true;
      if (activeFilters.themes.length > 0 && item.themes) {
        const itemThemes = typeof item.themes === 'string' 
          ? item.themes.split(',').map(t => t.trim()) 
          : [];
        themeMatch = activeFilters.themes.some(filterTheme => 
          itemThemes.includes(filterTheme)
        );
      }
      
      const amenityMatch = activeFilters.amenities.every(amenity => item.amenities?.includes(amenity));
      
      return (nameMatch || cityMatch) && priceMatch && ratingMatch && themeMatch && amenityMatch;
    });
  }, [activeFilters, travelData]);


  return (
    <div className="bg-white min-h-screen font-sans text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        <HeroBanner onSearch={handleSearch} searchTerm={activeFilters.searchTerm} />


        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className={`fixed inset-0 z-40 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
             <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
             <div className="absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl animate-slideRight">
                <FilterSidebar 
                  filters={tempFilters} 
                  handleFilterChange={handleFilterChange} 
                  maxPrice={maxPrice} 
                  allThemes={allThemes} 
                  allAmenities={allAmenities} 
                  clearFilters={clearAndApplyFilters} 
                  applyFilters={applyFilters} 
                  setIsSidebarOpen={setIsSidebarOpen}
                />
             </div>
          </div>


          <div className="hidden lg:block w-64 flex-shrink-0">
             <div className="sticky top-4 bg-white rounded-xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
                <FilterSidebar 
                  filters={tempFilters} 
                  handleFilterChange={handleFilterChange} 
                  maxPrice={maxPrice} 
                  allThemes={allThemes} 
                  allAmenities={allAmenities} 
                  clearFilters={clearAndApplyFilters} 
                  applyFilters={applyFilters} 
                  setIsSidebarOpen={setIsSidebarOpen}
                />
             </div>
          </div>


          <main className="flex-1 min-w-0">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-gray-900">
                 {filteredData.length > 0 ? 'Available Packages' : 'No Packages'} 
                 <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filteredData.length}</span>
               </h2>
               <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                 <FunnelIcon className="w-4 h-4" /> Filters
               </button>
             </div>


             {filteredData.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredData.map(item => (
                   <PackageCard key={item._id} item={item} handleBooking={handleBooking} />
                 ))}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                 <FunnelIcon className="w-12 h-12 text-gray-300 mb-3" />
                 <h3 className="text-lg font-bold text-gray-900">No matches found</h3>
                 <p className="text-gray-500 text-sm mb-4">Try adjusting your budget or amenities.</p>
                 <button onClick={clearAndApplyFilters} className="text-blue-600 font-bold text-sm hover:underline">Clear all filters</button>
               </div>
             )}
          </main>
        </div>
      </div>
    </div>
  );
}


export default TourPackages;
