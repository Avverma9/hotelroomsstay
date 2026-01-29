import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Menu,
  X,
  User,
  SlidersHorizontal,
  ArrowUpDown,
  LogOut,
  Briefcase,
  Calendar as CalendarIcon,
  UserCircle
} from 'lucide-react';
import { searchHotels, setFilters, resetFilters } from '../../redux/slices/hotelSearchSlice';
import { getGst } from '../../redux/slices/gstSlice';

import SearchLocationModal from './components/SearchLocationModal';
import DatePickerModal from './components/DatePickerModal';
import GuestSelectorModal from './components/GuestSelectorModal';
import HotelCard from './components/HotelCard';
import FilterSidebar, { MobileFilterPanel } from './components/filters/FilterSidebar';
import ErrorBoundary from '../../components/ErrorBoundary';
import { HotelCardSkeleton } from './components/HotelcardSkeleton';

const flattenAmenities = (amenities) => {
  if (!amenities) return [];
  if (Array.isArray(amenities)) {
    const first = amenities[0];
    if (first && Array.isArray(first.amenities)) return first.amenities;

    return amenities.flatMap((item) => {
      if (!item) return [];
      if (typeof item === 'string') return [item];
      if (Array.isArray(item.amenities)) return item.amenities;
      if (typeof item === 'object') {
        return Object.values(item).filter((value) => typeof value === 'string');
      }
      return [String(item)];
    });
  }
  return String(amenities).split(',');
};

const toLocalDateTime = (dateStr, fallback = null) => {
  if (!dateStr) return fallback;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? fallback : d;
};

const isBookingInsideRange = (checkInStr, checkOutStr, startStr, endStr) => {
  const checkIn = toLocalDateTime(checkInStr);
  const checkOut = toLocalDateTime(checkOutStr);
  const start = toLocalDateTime(startStr);
  const end = toLocalDateTime(endStr);
  if (!checkIn || !checkOut || !start || !end) return false;
  return checkIn >= start && checkOut <= end;
};

const getRoomBasePrice = (room) => {
  return room?.finalPrice ?? room?.price ?? 0;
};

const getRoomEffectivePrice = (room, checkInStr, checkOutStr) => {
  const base = getRoomBasePrice(room);
  const mp = room?.monthlyPriceDetails;
  if (!mp || mp.validForBooking !== true) return base;
  const inside = isBookingInsideRange(checkInStr, checkOutStr, mp.startDate, mp.endDate);
  if (!inside) return base;
  const monthPrice = Number(mp.monthPrice);
  if (Number.isFinite(monthPrice) && monthPrice > 0) return monthPrice;
  return base;
};

const getHotelMinEffectivePrice = (hotel, checkInStr, checkOutStr) => {
  const rooms = hotel?.rooms || [];
  if (!rooms.length) return 0;
  return Math.min(...rooms.map((r) => getRoomEffectivePrice(r, checkInStr, checkOutStr)));
};

const getHotelMaxEffectivePrice = (hotel, checkInStr, checkOutStr) => {
  const rooms = hotel?.rooms || [];
  if (!rooms.length) return 0;
  return Math.max(...rooms.map((r) => getRoomEffectivePrice(r, checkInStr, checkOutStr)));
};

export default function HotelSearchPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { hotels, loading, filters } = useSelector((state) => state.hotelSearch);
  const { gst: gstData } = useSelector((state) => state.gst);

  const [isMobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');

  const [searchLocation, setSearchLocation] = useState(searchParams.get('destination') || '');
  const [checkInDate, setCheckInDate] = useState(searchParams.get('checkIn') || '');
  const [checkOutDate, setCheckOutDate] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  const [rooms, setRooms] = useState(searchParams.get('rooms') || '1');
  const [children, setChildren] = useState('0');

  const tripMeta = useMemo(
    () => ({
      destination: searchLocation,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rooms,
      guests,
      children,
    }),
    [searchLocation, checkInDate, checkOutDate, rooms, guests, children]
  );

  const handleFiltersChange = (updatedFilters) => {
    dispatch(setFilters(updatedFilters));
  };

  const activeFiltersCount = useMemo(() => {
    if (!filters) return 0;
    let count = 0;
    if (filters.minPrice > 400) count += 1;
    if (filters.maxPrice < 10000) count += 1;
    if (filters.starRating) count += 1;
    count += filters.amenities?.length || 0;
    count += filters.type?.length || 0;
    count += filters.bedTypes?.length || 0;
    count += filters.propertyType?.length || 0;
    return count;
  }, [filters]);

  useEffect(() => {
    const searchData = {
      destination: searchParams.get('destination'),
      checkIn: searchParams.get('checkIn'),
      checkOut: searchParams.get('checkOut'),
      rooms: searchParams.get('rooms'),
      guests: searchParams.get('guests'),
      page: 1,
      limit: 20
    };

    if (searchData.destination) {
      dispatch(searchHotels(searchData));
    }
  }, [dispatch, location.search]);

  useEffect(() => {
    if (hotels && hotels.length > 0) {
      const maxPrices = hotels
        .filter((h) => h && typeof h === 'object')
        .map((hotel) => getHotelMaxEffectivePrice(hotel, checkInDate, checkOutDate));

      if (maxPrices.length > 0) {
        const maxRoomPrice = Math.max(...maxPrices);
        if (Number.isFinite(maxRoomPrice) && maxRoomPrice > 0) {
          dispatch(getGst({ type: 'Hotel', gstThreshold: maxRoomPrice }));
        }
      }
    }
  }, [hotels, dispatch, checkInDate, checkOutDate]);

  const filteredHotels = useMemo(() => {
    const validHotels = Array.isArray(hotels)
      ? hotels.filter((item) => item && typeof item === 'object')
      : [];

    const filtered = validHotels.filter((hotel) => {
      const minHotelPrice = getHotelMinEffectivePrice(hotel, checkInDate, checkOutDate);
      const normalizedAmenities = flattenAmenities(hotel.amenities);

      const priceMatch =
        minHotelPrice >= (filters.minPrice ?? 0) &&
        minHotelPrice <= (filters.maxPrice ?? Number.MAX_SAFE_INTEGER);

      const starMatch =
        !filters.starRating || String(hotel.starRating || '').startsWith(filters.starRating);

      const amenityMatch =
        filters.amenities.length === 0 ||
        filters.amenities.every((selected) =>
          normalizedAmenities.some((amenity) =>
            String(amenity).toLowerCase().includes(selected.toLowerCase())
          )
        );

      const propertyMatch =
        filters.propertyType.length === 0 ||
        (hotel.propertyType || []).some((type) => filters.propertyType.includes(type));

      const roomTypeMatch =
        filters.type.length === 0 ||
        (hotel.rooms || []).some((room) =>
          filters.type.some((selected) =>
            room.type && room.type.toLowerCase().includes(selected.toLowerCase())
          )
        );

      const bedTypeMatch =
        filters.bedTypes.length === 0 ||
        (hotel.rooms || []).some((room) => {
          if (!room.bedTypes) return false;
          return filters.bedTypes.some((selected) =>
            room.bedTypes.toLowerCase().includes(selected.toLowerCase())
          );
        });

      return priceMatch && starMatch && amenityMatch && propertyMatch && roomTypeMatch && bedTypeMatch;
    });

    return filtered.sort((a, b) => {
      const priceA = getHotelMinEffectivePrice(a, checkInDate, checkOutDate);
      const priceB = getHotelMinEffectivePrice(b, checkInDate, checkOutDate);
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }, [filters, hotels, sortOrder, checkInDate, checkOutDate]);

  const handleClearFilters = () => {
    dispatch(resetFilters());
  };

  const handleSearch = () => {
    if (!searchLocation.trim()) return;

    const searchData = {
      destination: searchLocation,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rooms: rooms,
      guests: guests,
      page: 1,
      limit: 20
    };

    const params = new URLSearchParams();
    if (searchLocation) params.append('destination', searchLocation);
    if (checkInDate) params.append('checkIn', checkInDate);
    if (checkOutDate) params.append('checkOut', checkOutDate);
    if (rooms) params.append('rooms', rooms);
    if (guests) params.append('guests', guests);

    navigate(`/hotel-search?${params.toString()}`);
    dispatch(searchHotels(searchData));
  };

  const handleLocationApply = (newLocation) => {
    setSearchLocation(newLocation);
    setShowSearchModal(false);

    if (newLocation.trim()) {
      const searchData = {
        destination: newLocation,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        rooms: rooms,
        guests: guests,
        page: 1,
        limit: 20
      };

      const params = new URLSearchParams();
      params.append('destination', newLocation);
      if (checkInDate) params.append('checkIn', checkInDate);
      if (checkOutDate) params.append('checkOut', checkOutDate);
      if (rooms) params.append('rooms', rooms);
      if (guests) params.append('guests', guests);

      navigate(`/hotel-search?${params.toString()}`);
      dispatch(searchHotels(searchData));
    }
  };

  const handleDateApply = (newCheckIn, newCheckOut) => {
    setCheckInDate(newCheckIn);
    setCheckOutDate(newCheckOut);
    setShowDatePicker(false);
  };

  const handleGuestApply = (newRooms, newAdults, newChildren) => {
    setRooms(newRooms.toString());
    setGuests(newAdults.toString());
    setChildren(newChildren.toString());
    setShowGuestSelector(false);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SearchLocationModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        currentLocation={searchLocation}
        onApply={handleLocationApply}
      />
      <DatePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        checkIn={checkInDate}
        checkOut={checkOutDate}
        onApply={handleDateApply}
      />
      <GuestSelectorModal
        isOpen={showGuestSelector}
        onClose={() => setShowGuestSelector(false)}
        rooms={rooms}
        adults={guests}
        children={children}
        onApply={handleGuestApply}
      />

      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="hidden md:flex items-center gap-4">
            <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2 mr-4">
              <img src="/logo.png" alt="HappyStay" className="w-36 h-12 object-contain" />
            </div>

            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 text-left"
              >
                <MapPin size={18} className="text-gray-400" />
                <span className="text-sm">{searchLocation || 'Search location'}</span>
              </button>

              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100"
              >
                <CalendarIcon size={18} className="text-gray-400" />
                <span className="text-sm whitespace-nowrap">
                  {checkInDate && checkOutDate
                    ? `${formatDisplayDate(checkInDate)} - ${formatDisplayDate(checkOutDate)}`
                    : 'Select dates'
                  }
                </span>
              </button>

              <button
                onClick={() => setShowGuestSelector(true)}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100"
              >
                <User size={18} className="text-gray-400" />
                <span className="text-sm whitespace-nowrap">{guests} Adult, {rooms} Room</span>
              </button>

              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Search size={18} />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu size={24} />
              </button>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-semibold text-sm">Hello, Traveller</p>
                    </div>
                    <button onClick={() => navigate('/profile')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                      <UserCircle size={16} />
                      <span>My Profile</span>
                    </button>
                    <button onClick={() => navigate('/bookings')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                      <Briefcase size={16} />
                      <span>My Trips</span>
                    </button>
                    <button onClick={() => navigate('/login')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 text-sm">
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2">
                <img src="/logo.png" alt="HappyStay" className="w-28 h-10 object-contain" />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setShowSearchModal(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Search size={20} className="text-blue-600" />
                </button>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Menu size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-2 text-gray-700 w-full text-left"
              >
                <MapPin size={14} />
                <span className="font-medium text-sm">{searchLocation || 'Select Location'}</span>
              </button>
              <div className="flex items-center gap-3 text-gray-500 text-xs">
                <button
                  onClick={() => setShowDatePicker(true)}
                  className="hover:text-blue-600"
                >
                  {checkInDate && checkOutDate
                    ? `${formatDisplayDate(checkInDate)} - ${formatDisplayDate(checkOutDate)}`
                    : 'Select Dates'
                  }
                </button>
                <span>•</span>
                <button
                  onClick={() => setShowGuestSelector(true)}
                  className="hover:text-blue-600"
                >
                  {guests} Adult, {rooms} Room
                </button>
              </div>
            </div>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-56 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="font-semibold text-sm">Hello, Traveller</p>
                  </div>
                  <button onClick={() => navigate('/profile')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                    <UserCircle size={16} />
                    <span>My Profile</span>
                  </button>
                  <button onClick={() => navigate('/bookings')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                    <Briefcase size={16} />
                    <span>My Trips</span>
                  </button>
                  <button onClick={() => navigate('/login')} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 text-sm">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <FilterSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />

          <section className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={toggleSortOrder}
                className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                <ArrowUpDown size={18} />
                <span>Price {sortOrder === 'asc' ? 'Low to High' : 'High to Low'}</span>
              </button>
            </div>

            <ErrorBoundary>
              {loading ? (
                <>
                  <HotelCardSkeleton />
                  <HotelCardSkeleton />
                  <HotelCardSkeleton />
                  <HotelCardSkeleton />
                </>
              ) : filteredHotels.length > 0 ? (
                <div className="flex flex-col gap-4 md:gap-5">
                  {filteredHotels.map((hotel) => (
                    <HotelCard
                      key={hotel._id || hotel.hotelId}
                      hotel={hotel}
                      gstData={gstData}
                      tripMeta={tripMeta}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Search className="mx-auto text-gray-300 mb-3" size={48} />
                  <h3 className="text-lg font-bold">No hotels found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
                  <button onClick={handleClearFilters} className="mt-4 text-blue-600 font-bold">
                    Reset Filters
                  </button>
                </div>
              )}
            </ErrorBoundary>
          </section>
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <SlidersHorizontal size={18} />
            <span className="text-sm font-medium">Filters ({activeFiltersCount})</span>
          </button>
          <button
            onClick={toggleSortOrder}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowUpDown size={18} />
            <span className="text-sm font-medium">Price {sortOrder === 'asc' ? '↑' : '↓'}</span>
          </button>
        </div>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <MobileFilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClear={handleClearFilters}
              onApply={() => setMobileFilterOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { getRoomEffectivePrice, toLocalDateTime, isBookingInsideRange, getRoomBasePrice };
