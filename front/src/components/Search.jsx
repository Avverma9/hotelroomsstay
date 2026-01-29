import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const SearchIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const MyLocationIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2"></path></svg> );
const UsersIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> );
const MapPinIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> );
const MinusIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" y1="12" x2="19" y2="12"></line></svg> );
const PlusIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );
const ChevronDownIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg> );

export default function SearchForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getNextDay = (dateStr) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  // Auto-apply stored session location (so user need not click the location button)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('autoLocation');
      if (saved) {
        setData(prev => (prev.search ? prev : ({ ...prev, search: saved })));
      }
    } catch (e) {
      // ignore sessionStorage errors (e.g., in some strict privacy modes)
    }
  }, []);

  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [data, setData] = useState({
    search: "", 
    checkInDate: getToday(), 
    checkOutDate: getNextDay(getToday()),
    countRooms: 1, 
    guests: 2
  });

  const GUESTS_PER_ROOM = 3;

  if (location.pathname !== "/") return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "checkInDate") {
      setData(prev => {
        const newCheckIn = value;
        let newCheckOut = prev.checkOutDate;
        if (newCheckIn >= prev.checkOutDate) {
          newCheckOut = getNextDay(newCheckIn);
        }
        return { ...prev, checkInDate: newCheckIn, checkOutDate: newCheckOut };
      });
    } else {
      setData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSearch = () => {
    if (!data.search.trim()) {
      toast.error('Please enter a destination');
      return;
    }
    setShowGuestPopup(false);
    const params = {
      destination: data.search,
      checkIn: data.checkInDate,
      checkOut: data.checkOutDate,
      rooms: data.countRooms,
      guests: data.guests
    };
    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    navigate(`/hotel-search?${qs}`);
    toast.success('Searching...');
  };

  
  // force = true will bypass stored session value and perform a fresh geolocation fetch
  const getLocation = (force = false) => {
    if (!navigator.geolocation) return;

    // If not forcing, and user already fetched location earlier in this session, reuse it and do not re-fetch
    if (!force) {
      const saved = sessionStorage.getItem('autoLocation');
      if (saved) {
        setData((p) => ({ ...p, search: saved }));
        toast.success(`Location: ${saved}`);
        return;
      }
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const json = await res.json();
          const name = json.address.city || json.address.town || "Current Location";
          setData((p) => ({ ...p, search: name }));
          // Only set the stored value if it's not already present, so we don't reset it
          if (!sessionStorage.getItem('autoLocation')) {
            sessionStorage.setItem('autoLocation', name);
          }
          toast.success(`Location: ${name}`);
        } catch (e) {
          toast.error('Failed to get location');
        } finally {
          setFetchingLocation(false);
        }
      },
      () => { toast.error('Location error'); setFetchingLocation(false); }
    );
  };

  const updateGuests = (delta) => {
    setData(prev => {
      const newGuests = Math.max(1, prev.guests + delta);
      const requiredRooms = Math.ceil(newGuests / GUESTS_PER_ROOM);
      return { ...prev, guests: newGuests, countRooms: Math.max(prev.countRooms, requiredRooms) };
    });
  };

  const updateRooms = (delta) => {
    setData(prev => {
      const newRooms = Math.max(1, prev.countRooms + delta);
      const maxGuests = newRooms * GUESTS_PER_ROOM;
      return { ...prev, countRooms: newRooms, guests: Math.min(prev.guests, maxGuests) };
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-8">
      <div className="bg-white rounded-3xl md:rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 p-2">
        <div className="flex flex-col md:flex-row md:items-center relative z-20">
          <div className="flex-1 relative group border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0 md:pr-4">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
               <MapPinIcon />
            </div>
            <input type="text" name="search" value={data.search} onChange={handleChange} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Where to?" className="w-full h-12 pl-12 pr-10 bg-transparent text-sm font-bold text-gray-800 placeholder-gray-400 border-none focus:ring-0 outline-none" />
      <button disabled={fetchingLocation} onClick={() => getLocation(true)} className="absolute inset-y-0 right-2 px-2 flex items-center text-gray-300 hover:text-blue-600 transition-colors">
               {fetchingLocation ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <MyLocationIcon />}
            </button>
          </div>
          <div className="flex-[0.85] flex items-center border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0 px-2 md:px-4">
            <div className="flex-1 relative group">
              <label className="block text-[9px] font-black text-gray-400 uppercase ml-1">Check-in</label>
              <input type="date" name="checkInDate" min={getToday()} value={data.checkInDate} onChange={handleChange} className="w-full bg-transparent text-xs font-bold text-gray-700 border-none p-0 focus:ring-0 cursor-pointer h-5 outline-none" />
            </div>
            <div className="w-px h-8 bg-gray-200 mx-3"></div>
            <div className="flex-1 relative group">
              <label className="block text-[9px] font-black text-gray-400 uppercase ml-1">Check-out</label>
              <input type="date" name="checkOutDate" min={getNextDay(data.checkInDate)} value={data.checkOutDate} onChange={handleChange} className="w-full bg-transparent text-xs font-bold text-gray-700 border-none p-0 focus:ring-0 cursor-pointer h-5 outline-none" />
            </div>
          </div>
          <div className="relative flex-1">
             <button onClick={() => setShowGuestPopup(!showGuestPopup)} className={`w-full flex items-center justify-between py-2 md:py-0 px-2 md:pl-4 md:pr-4 hover:bg-gray-50 rounded-xl md:rounded-full transition-colors ${showGuestPopup ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-full"><UsersIcon className="text-blue-600" /></div>
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Guests & Rooms</span>
                    <span className="text-xs font-black text-gray-800 whitespace-nowrap">{data.countRooms} Room, {data.guests} Guests</span>
                  </div>
                </div>
                <ChevronDownIcon className={`text-gray-400 transition-transform duration-200 ${showGuestPopup ? 'rotate-180' : ''}`} />
             </button>
             {showGuestPopup && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowGuestPopup(false)} />
                  <div className="absolute top-full right-0 md:left-0 md:right-auto mt-4 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-5">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                        <div><p className="text-sm font-bold text-gray-800">Rooms</p><p className="text-xs text-gray-400">Minimum 1</p></div>
                        <div className="flex items-center gap-3">
                           <button onClick={() => updateRooms(-1)} disabled={data.countRooms <= 1} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${data.countRooms <= 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600'}`}><MinusIcon width="12" /></button>
                           <span className="w-4 text-center text-sm font-bold text-gray-800">{data.countRooms}</span>
                           <button onClick={() => updateRooms(1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-blue-600 hover:text-blue-600 transition-colors"><PlusIcon width="12" /></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div><p className="text-sm font-bold text-gray-800">Guests</p><p className="text-xs text-gray-400">Max {data.countRooms * GUESTS_PER_ROOM}</p></div>
                        <div className="flex items-center gap-3">
                           <button onClick={() => updateGuests(-1)} disabled={data.guests <= 1} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${data.guests <= 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600'}`}><MinusIcon width="12" /></button>
                           <span className="w-4 text-center text-sm font-bold text-gray-800">{data.guests}</span>
                           <button onClick={() => updateGuests(1)} disabled={data.guests >= data.countRooms * GUESTS_PER_ROOM} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${data.guests >= data.countRooms * GUESTS_PER_ROOM ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600'}`}><PlusIcon width="12" /></button>
                        </div>
                      </div>
                      <button onClick={() => setShowGuestPopup(false)} className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">Done</button>
                  </div>
                </>
             )}
          </div>
          <div className="pl-2 pr-1 py-2 md:py-0">
            <button onClick={handleSearch} className="w-full md:w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl md:rounded-full font-bold flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95 shrink-0">
                <SearchIcon className="w-5 h-5" />
                <span className="md:hidden ml-2">Search</span>
            </button>
          </div>
        </div>
      </div>
  <div className="mt-4 sm:mt-6 text-center">
        
        {['Goa', 'Manali', 'Mumbai', 'Dubai'].map((city) => (
          <button key={city} onClick={() => setData(prev => ({ ...prev, search: city }))} className="inline-block mx-1 my-1 px-4 py-2 text-xs font-semibold text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-full transition-all border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md">{city}</button>
        ))}
      </div>
    </div>
  );
}
