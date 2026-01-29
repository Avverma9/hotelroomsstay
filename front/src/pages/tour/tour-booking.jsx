import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getTravelById, bookNow, fetchSeatMap } from "../../redux/slices/travelSlice";
import { getGst } from "../../redux/slices/gstSlice";
import { useLoader } from "../../utils/loader";
import { useToast } from "../../utils/toast";
import { userId } from "../../utils/Unauthorized";
import { 
  Calendar, Moon, BedDouble, Info, CheckCircle, XCircle, 
  Check, X, Bus, ArrowRight, Armchair, Settings2, User, Baby,
  MapPin, CheckCircle2, AlertCircle, UserPlus, ChevronLeft, ChevronRight
} from 'lucide-react';

const formatReadableDate = (dateString) => {
  if (!dateString) return "";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Helper to extract YYYY-MM-DD from ISO string for HTML input min/max
const formatDateForInput = (isoDate) => {
  if (!isoDate) return "";
  return isoDate.split("T")[0];
};

const addDays = (dateString, days) => {
  if (!dateString) return "";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().split("T")[0];
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
};

const StarIcon = ({ filled, className = "" }) => (
  <svg
    className={`w-5 h-5 ${filled ? "text-yellow-400" : "text-slate-300"} drop-shadow-sm ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Image Carousel Component
const ImageCarousel = ({ images, title, dates, duration, rating, themes }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images]);

  if (!images || images.length === 0) {
    // Show placeholder if no images
    return (
      <div className="relative h-64 md:h-96 w-full bg-gradient-to-br from-orange-400 to-orange-600">
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
          <div className="flex justify-start">
            <span className="bg-white/20 backdrop-blur text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-lg">
              {themes}
            </span>
          </div>
          <div className="text-white">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 tracking-tight drop-shadow-lg">
              {title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="flex items-center gap-1 text-xs md:text-sm bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                <Calendar size={14} className="text-orange-400" />
                {dates}
              </span>
              <span className="flex items-center gap-1 text-xs md:text-sm bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                <Moon size={14} className="text-orange-400" />
                {duration}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < rating} className="w-4 h-4" />
              ))}
              <span className="text-sm ml-1">{rating}.0 Star Rating</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-64 md:h-96 w-full overflow-hidden bg-gray-900">
      {/* Images */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="w-full h-full flex-shrink-0 relative">
            <img 
              src={img} 
              alt={`Slide ${idx + 1}`} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Overlay Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
        {/* Top: Theme Badge */}
        <div className="flex justify-start">
          <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-lg">
            {themes}
          </span>
        </div>

        {/* Bottom: Title and Info */}
        <div className="text-white">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 tracking-tight drop-shadow-lg">
            {title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <span className="flex items-center gap-1 text-xs md:text-sm bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
              <Calendar size={14} className="text-orange-400" />
              {dates}
            </span>
            <span className="flex items-center gap-1 text-xs md:text-sm bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
              <Moon size={14} className="text-orange-400" />
              {duration}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} filled={i < rating} className="w-4 h-4" />
            ))}
            <span className="text-sm ml-1">{rating}.0 Star Rating</span>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex === idx ? 'bg-orange-500 w-6' : 'bg-white/60 hover:bg-white w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function TourBookNowPage() {
  const { id } = useParams();
  const { travelById, loading, seatMapByKey } = useSelector((state) => state.travel);
  const gstData = useSelector((state) => state.gst.gst);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useLoader();
  const toast = useToast();

  const [view, setView] = useState('details');
  const [activeTab, setActiveTab] = useState('itinerary');
  const [finalPrice, setFinalPrice] = useState(0);
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  
  // Booking state
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState({});
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    if (id) dispatch(getTravelById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (travelById?.price) {
      dispatch(getGst({ type: "Tour", gstThreshold: travelById.price }));
    }
  }, [dispatch, travelById?.price]);

  useEffect(() => {
    if (gstData && travelById) {
      const startingPrice = travelById.price;
      const gstPercentage = gstData.gstPrice;
      const gstAmount = (startingPrice * gstPercentage) / 100;
      setFinalPrice(startingPrice + gstAmount);
    } else if (travelById) {
      setFinalPrice(travelById.price);
    }
  }, [gstData, travelById]);

  useEffect(() => {
    if (!travelById) return;
    const firstVehicle = travelById?.vehicles?.find((v) => v.isActive !== false);
    setSelectedVehicleId(firstVehicle?._id || "");
  }, [travelById]);

  useEffect(() => {
    if (!travelById?._id || !selectedVehicleId) return;
    const key = `${travelById._id}:${selectedVehicleId}`;
    if (seatMapByKey[key]) return;
    
    dispatch(fetchSeatMap({ tourId: travelById._id, vehicleId: selectedVehicleId }));
  }, [dispatch, travelById?._id, selectedVehicleId, seatMapByKey]);

  const seatKey = travelById?._id && selectedVehicleId ? `${travelById._id}:${selectedVehicleId}` : "";
  const seatMap = seatKey ? (seatMapByKey[seatKey] || []) : [];
  const selectedVehicle = travelById?.vehicles?.find(v => v._id === selectedVehicleId);
  
  const bookedFromSeatMap = (seatMap || []).filter(s => s.status === "booked" || s.isBooked || s.booked).map(s => String(s.code || s.seatNumber || s.label || s.id));
  const bookedFromVehicle = (selectedVehicle?.bookedSeats || []).map(s => String(s));
  const bookedSeats = Array.from(new Set([...(bookedFromSeatMap || []), ...(bookedFromVehicle || [])]));
  const isCustomizable = !!travelById?.isCustomizable;

  const minDate = travelById?.from ? formatDateForInput(travelById.from) : "";
  const maxDate = travelById?.to ? formatDateForInput(travelById.to) : "";

  const busType = selectedVehicle?.seaterType === '2x3' ? '2x3' : '2x2';

  // FIXED: Handle visitngPlaces (note the typo in API)
  const visitingPlaces = useMemo(() => {
    try {
      const places = travelById?.visitngPlaces || travelById?.visitingPlaces || "";
      return places.replace(/\|/g, ", ");
    } catch {
      return "";
    }
  }, [travelById]);

  // FIXED: Get first theme from comma-separated string for display
  const displayTheme = useMemo(() => {
    if (!travelById?.themes) return "Tour Package";
    const themesArray = travelById.themes.split(',').map(t => t.trim());
    return themesArray[0] || "Tour Package";
  }, [travelById?.themes]);

  const startBooking = () => {
    if (!userId) {
      toast.warning("Please log in to book.");
      return;
    }
    
    if (isCustomizable) {
      setBookingStartDate(minDate || "");
      setBookingEndDate("");
    } else {
      const start = travelById?.tourStartDate || travelById?.from || "";
      const end = travelById?.to || (start ? addDays(start, (travelById?.days || 1) - 1) : "");
      setBookingStartDate(start ? formatDateForInput(start) : "");
      setBookingEndDate(end ? formatDateForInput(end) : "");
    }
    setView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(id => id !== seatId));
      const newPassengers = { ...passengers };
      delete newPassengers[seatId];
      setPassengers(newPassengers);
    } else {
      setSelectedSeats(prev => [...prev, seatId]);
      setPassengers(prev => ({
        ...prev,
        [seatId]: { type: 'adult', fullName: '', age: '', dateOfBirth: '', gender: 'male', mobile: '' }
      }));
    }
  };

  const updatePassenger = (seatId, field, value) => {
    setPassengers(prev => ({
      ...prev,
      [seatId]: { ...prev[seatId], [field]: value }
    }));
  };

  const confirmBooking = async () => {
    if (selectedSeats.length === 0) {
      toast.warning("Please select at least one seat.");
      return;
    }

    if (!bookingStartDate || !bookingEndDate) {
      toast.warning("Please select both From and To dates.");
      return;
    }

    const fromTs = new Date(bookingStartDate).getTime();
    const toTs = new Date(bookingEndDate).getTime();
    const minTs = minDate ? new Date(minDate).getTime() : 0;
    const maxTs = maxDate ? new Date(maxDate).getTime() : Infinity;

    if (Number.isNaN(fromTs) || Number.isNaN(toTs)) {
        toast.warning("Invalid dates selected.");
        return;
    }

    if (toTs < fromTs) {
      toast.warning("End date must be after Start date.");
      return;
    }

    if (isCustomizable) {
        if (fromTs < minTs || toTs > maxTs) {
            toast.warning(`Dates must be between ${formatDate(minDate)} and ${formatDate(maxDate)}`);
            return;
        }
    }

    let valid = true;
    selectedSeats.forEach(seat => {
      const p = passengers[seat];
      if (!p.fullName.trim()) valid = false;
      if (p.type === 'adult' && !p.age) valid = false;
      if (p.type === 'child' && !p.dateOfBirth) valid = false;
    });

    if (!valid) {
      toast.warning("Please fill in all passenger details correctly.");
      return;
    }

    const totalAdults = selectedSeats.filter(s => passengers[s].type === 'adult').length;
    const totalChildren = selectedSeats.filter(s => passengers[s].type === 'child').length;
    const childDOBs = selectedSeats.filter(s => passengers[s].type === 'child').map(s => passengers[s].dateOfBirth);

    let totalAmount = 0;
    selectedSeats.forEach(seat => {
      const p = passengers[seat];
      if (p.type === 'adult') {
        totalAmount += finalPrice;
      } else {
        const age = calculateAge(p.dateOfBirth);
        const isFullFare = age === null || age >= 8;
        totalAmount += isFullFare ? finalPrice : finalPrice / 2;
      }
    });

    const passengerList = [
      ...Array.from({ length: totalAdults }).map(() => ({ type: "adult" })),
      ...childDOBs.map((dob) => ({ type: "child", dateOfBirth: dob }))
    ];

    const bookingData = {
      userId,
      tourId: travelById._id,
      vehicleId: selectedVehicleId,
      seats: selectedSeats,
      status: "pending",
      numberOfAdults: totalAdults,
      numberOfChildren: totalChildren,
      passengers: passengerList,
      from: bookingStartDate,
      to: bookingEndDate,
      tourStartDate: travelById.tourStartDate || bookingStartDate,
      isCustomizable: isCustomizable,
      travelAgencyName: travelById.travelAgencyName,
      agencyPhone: travelById.agencyPhone,
      agencyEmail: travelById.agencyEmail,
      visitngPlaces: travelById.visitngPlaces,
      country: travelById.country,
      state: travelById.state,
      city: travelById.city,
      themes: travelById.themes,
      basePrice: travelById.price,
      totalAmount,
      amenities: travelById.amenities,
      inclusion: travelById.inclusion,
      exclusion: travelById.exclusion,
      dayWise: travelById.dayWise,
      termsAndConditions: travelById.termsAndConditions
    };

    try {
      showLoader();
      const res = await dispatch(bookNow(bookingData)).unwrap();
      const data = res?.payload || res;
      const bookingCode = data?.bookingCode || data?.bookingId || "N/A";
      toast.success(`Booking Confirmed!\nBooking ID: ${bookingCode}`);
      setView('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(`Booking failed.\nReason: ${err?.message || err?.toString() || "Unknown error"}`);
    } finally {
      hideLoader();
    }
  };

  const goBack = () => {
    setView('details');
    setSelectedSeats([]);
    setPassengers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSeat = (seatId) => {
    const isBooked = bookedSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);

    let bgClass = "bg-white border-gray-300 text-gray-600 hover:border-orange-500 hover:scale-110 shadow-sm";
    if (isBooked) bgClass = "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200";
    if (isSelected) bgClass = "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105";

    return (
      <button
        key={seatId}
        onClick={() => toggleSeat(seatId)}
        disabled={isBooked}
        className={`w-8 h-8 md:w-10 md:h-10 rounded md:rounded-lg border flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-200 ${bgClass}`}
      >
        {isSelected ? <Check size={14} /> : seatId}
      </button>
    );
  };

  const StickyFooter = () => (
    <div className="fixed left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]" style={{ bottom: window.innerWidth <= 768 ? 'calc(env(safe-area-inset-bottom) + 56px)' : '0', zIndex: 1050 }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Total Package Cost</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">
            {formatCurrency(finalPrice)} 
            <span className="text-xs font-normal text-gray-500 ml-1">/ person</span>
          </p>
        </div>
        <button 
          onClick={startBooking} 
          className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-lg shadow-lg transform transition active:scale-95 flex items-center gap-2 whitespace-nowrap"
        >
          Book Now <ArrowRight size={18} className="md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  );

  if (loading || !travelById) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 blur-lg bg-blue-500/10 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen font-sans">
      {view === 'details' && (
        <div className="pb-20 md:pb-24">
          {/* Image Carousel with Overlay */}
          <ImageCarousel 
            images={travelById.images}
            title={travelById.travelAgencyName}
            dates={`${formatDate(travelById.from)} - ${formatDate(travelById.to || addDays(travelById.from, travelById.days - 1))}`}
            duration={`${travelById.nights}N/${travelById.days}D`}
            rating={travelById.starRating}
            themes={displayTheme}
          />

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 mt-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm overflow-x-auto">
                {['itinerary', 'info', 'policies'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)} 
                    className={`flex-1 py-3 px-4 text-center whitespace-nowrap capitalize font-medium transition-colors text-sm md:text-base ${activeTab === tab ? 'border-b-3 border-orange-600 text-orange-600 font-bold bg-orange-50/50' : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'}`}
                  >
                    {tab === 'info' ? 'Overview & Inclusions' : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[500px] bg-white">
                {activeTab === 'itinerary' && (
                  <div className="p-4 md:p-8 animate-in fade-in duration-500">
                    <div className="relative border-l-2 border-gray-200 ml-4 md:ml-8 space-y-8">
                      {(travelById.dayWise || []).map((item, index) => (
                        <div key={item._id || index} className="ml-6 relative">
                          <span className="absolute -left-[31px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 ring-4 ring-white border-2 border-orange-500 text-orange-600 font-bold text-sm">
                            {item.day}
                          </span>
                          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow hover:border-orange-200">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                              <MapPin size={18} className="text-orange-500" /> Day {item.day}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">{item.description}</p>
                            <div className="flex items-center gap-2 text-xs text-orange-600 font-medium bg-orange-50 w-fit px-2 py-1 rounded">
                              <BedDouble size={14} /> Night Stay Included
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                    {/* Overview Section */}
                    {travelById.overview && (
                      <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Info className="text-orange-600" /> Overview</h3>
                        <p className="text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-lg border border-gray-100 whitespace-pre-line">{travelById.overview}</p>
                      </section>
                    )}

                    {/* Visiting Places */}
                    {visitingPlaces && (
                      <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="text-blue-600" /> Visiting Places</h3>
                        <p className="text-gray-600 leading-relaxed bg-blue-50 p-6 rounded-lg border border-blue-100">{visitingPlaces}</p>
                      </section>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="text-green-600" /> Inclusions</h3>
                        <ul className="space-y-3 bg-gray-50 p-6 rounded-lg border border-gray-100">
                          {(travelById.inclusion || []).map((i, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-gray-700">
                              <Check className="text-green-500 shrink-0 mt-0.5" size={18} /><span>{i}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                      
                      <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><XCircle className="text-red-500" /> Exclusions</h3>
                        <ul className="space-y-3 bg-gray-50 p-6 rounded-lg border border-gray-100">
                          {(travelById.exclusion || []).map((e, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-gray-700">
                              <X className="text-red-400 shrink-0 mt-0.5" size={18} /><span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    {/* Amenities */}
                    {travelById.amenities && travelById.amenities.length > 0 && (
                      <section>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle className="text-purple-600" /> Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {travelById.amenities.map((amenity, idx) => (
                            <span key={idx} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {travelById.vehicles && travelById.vehicles.length > 0 && (
                      <section className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <Bus className="text-blue-600" size={32} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-blue-800 mb-1">Vehicle Details</h3>
                          <p className="font-bold text-gray-900">{travelById.vehicles[0].name}</p>
                          <p className="text-sm text-gray-600">
                            {travelById.vehicles[0].vehicleNumber && `Reg: ${travelById.vehicles[0].vehicleNumber} • `}
                            {travelById.vehicles[0].totalSeats} Seater
                          </p>
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === 'policies' && (
                  <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
                    {travelById.termsAndConditions && (
                      <section className="bg-white rounded-lg border border-gray-100">
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 p-4 border-b border-orange-200">
                          <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                            <AlertCircle className="text-orange-500" size={20} /> Terms & Conditions
                          </h3>
                        </div>
                        <div className="p-4 md:p-6 space-y-6">
                          {Object.entries(travelById.termsAndConditions).map(([key, value]) => (
                            <div key={key} className="pb-4 border-b border-gray-100 last:border-0">
                              <h4 className="font-bold text-sm md:text-base capitalize text-slate-900 mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </h4>
                              <p className="text-xs md:text-sm text-slate-600 whitespace-pre-line leading-relaxed ml-3.5">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <StickyFooter />
        </div>
      )}

      {view === 'booking' && (
        <div className="min-h-screen bg-gray-50">
          <div className="bg-gray-900 text-white py-8 px-4 text-center sticky top-0 z-50 shadow-md">
            <h2 className="text-2xl font-bold">Complete Your Booking</h2>
            <p className="opacity-80 text-sm mt-1">Select seats and enter details</p>
          </div>
          
          <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8 items-start pb-32 md:pb-40">
            {/* Seat Selection */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 mx-auto">
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <Armchair className="text-orange-600" /> Select Seats
                  </h3>
                  <div className="mt-3 mb-4">
                    {isCustomizable ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Start Date</label>
                          <input
                            type="date"
                            value={bookingStartDate}
                            onChange={(e) => setBookingStartDate(e.target.value)}
                            min={minDate}
                            max={maxDate}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">End Date</label>
                          <input
                            type="date"
                            value={bookingEndDate}
                            onChange={(e) => setBookingEndDate(e.target.value)}
                            min={bookingStartDate || minDate}
                            max={maxDate}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] text-gray-400 mt-1">
                                Available Range: {formatDate(minDate)} to {formatDate(maxDate)}
                            </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">From</label>
                          <input
                            type="date"
                            value={bookingStartDate}
                            disabled
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">To</label>
                          <input
                            type="date"
                            value={bookingEndDate}
                            disabled
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <div className="col-span-2">
                           <p className="text-[10px] text-orange-500 font-semibold mt-1">
                               * Fixed Departure Dates
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedVehicle && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedVehicle.name} • {selectedVehicle.seaterType || '2x2'} Layout • {selectedVehicle.totalSeats} Seats
                    </p>
                  )}
                </div>

                <div className="flex gap-4 text-xs mb-6 justify-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-400 rounded"></div> Avail</span>
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-600 rounded"></div> Selected</span>
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-200 rounded"></div> Booked</span>
                </div>

                <div className="flex justify-end mb-4 border-b-2 border-dashed border-gray-100 pb-4">
                  <div className="flex flex-col items-center mr-8">
                    <Settings2 className="text-gray-300" size={24} />
                    <span className="text-[10px] text-gray-400 uppercase mt-1 tracking-wider">Driver</span>
                  </div>
                </div>

                {/* Dynamic Bus Layout */}
                <div className={`grid gap-y-3 gap-x-2 md:gap-x-3 mx-auto max-w-fit ${busType === '2x2' ? 'grid-cols-[auto_auto_30px_auto_auto]' : 'grid-cols-[auto_auto_30px_auto_auto_auto]'}`}>
                  <div className="text-center text-[10px] text-gray-400 font-bold">A</div>
                  <div className="text-center text-[10px] text-gray-400 font-bold">B</div>
                  <div className=""></div>
                  <div className="text-center text-[10px] text-gray-400 font-bold">C</div>
                  <div className="text-center text-[10px] text-gray-400 font-bold">D</div>
                  {busType === '2x3' && <div className="text-center text-[10px] text-gray-400 font-bold">E</div>}

                  {Array.from({ length: 10 }, (_, i) => i + 1).map(r => (
                    <React.Fragment key={r}>
                      {renderSeat(r + 'A')}
                      {renderSeat(r + 'B')}
                      <div className="flex items-center justify-center text-[10px] text-gray-300 font-mono">{r}</div>
                      {renderSeat(r + 'C')}
                      {renderSeat(r + 'D')}
                      {busType === '2x3' && renderSeat(r + 'E')}
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Rear of Bus</p>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              {selectedSeats.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200 min-h-[300px]">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Armchair size={32} className="text-gray-300" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">No seats selected</p>
                  <p className="text-sm">Please select seats from the layout to proceed.</p>
                </div>
              ) : (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 animate-in fade-in duration-300">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-900 border-b pb-4">
                    <UserPlus className="text-blue-600" /> Passenger Details
                  </h3>
                  
                  <div className="space-y-6">
                    {selectedSeats.map((seatId, index) => (
                      <div key={seatId} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group hover:border-blue-300 transition-colors">
                        <div className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded shadow-sm font-bold">Seat {seatId}</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          
                          {/* Type & Full Name */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => updatePassenger(seatId, 'type', 'adult')}
                                className={`flex-1 py-2 px-3 text-sm rounded-lg border font-medium flex items-center justify-center gap-2 transition-colors ${passengers[seatId]?.type === 'adult' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                              >
                                <User size={16} /> Adult
                              </button>
                              <button 
                                onClick={() => updatePassenger(seatId, 'type', 'child')}
                                className={`flex-1 py-2 px-3 text-sm rounded-lg border font-medium flex items-center justify-center gap-2 transition-colors ${passengers[seatId]?.type === 'child' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                              >
                                <Baby size={16} /> Child
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                            <input 
                              type="text" 
                              placeholder="Passenger Name" 
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                              value={passengers[seatId]?.fullName || ''}
                              onChange={(e) => updatePassenger(seatId, 'fullName', e.target.value)}
                            />
                          </div>

                          {/* Age/DOB & Gender */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              {passengers[seatId]?.type === 'child' ? (
                                <>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                                  <input 
                                    type="date" 
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-shadow"
                                    value={passengers[seatId]?.dateOfBirth || ''}
                                    onChange={(e) => updatePassenger(seatId, 'dateOfBirth', e.target.value)}
                                  />
                                </>
                              ) : (
                                <>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age</label>
                                  <input 
                                    type="number" 
                                    placeholder="Age" 
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    value={passengers[seatId]?.age || ''}
                                    onChange={(e) => updatePassenger(seatId, 'age', e.target.value)}
                                  />
                                </>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                              <select 
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                value={passengers[seatId]?.gender || 'male'}
                                onChange={(e) => updatePassenger(seatId, 'gender', e.target.value)}
                              >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>

                          {index === 0 && (
                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Mobile Number</label>
                              <input 
                                type="tel" 
                                placeholder="10-digit mobile number" 
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                value={passengers[seatId]?.mobile || ''}
                                onChange={(e) => updatePassenger(seatId, 'mobile', e.target.value)}
                              />
                              <p className="text-xs text-gray-400 mt-1">Booking confirmation will be sent here.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4">Payment Summary</h4>
                    <div className="bg-blue-50 p-5 rounded-xl space-y-3 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span>Package Price (x{selectedSeats.length})</span>
                        <span className="font-medium">{formatCurrency(selectedSeats.length * finalPrice)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-blue-900 text-lg border-t border-blue-200 pt-3">
                        <span>Total Amount</span>
                        <span>{formatCurrency(selectedSeats.length * finalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-orange-700 font-bold bg-orange-100/50 p-2 rounded">
                        <span>Pay Now (20% Advance)</span>
                        <span>{formatCurrency(selectedSeats.length * finalPrice * 0.20)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Booking Footer */}
          {selectedSeats.length > 0 && (
            <div className="fixed left-0 right-0 bg-white border-t-2 border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]" style={{ bottom: window.innerWidth <= 768 ? 'calc(env(safe-area-inset-bottom) + 56px)' : '0', zIndex: 1050 }}>
              <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Advance Payment (20%)</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedSeats.length * finalPrice * 0.20)}
                  </p>
                </div>
                <div className="flex gap-2 md:gap-3">
                  <button 
                    onClick={goBack} 
                    className="py-2.5 md:py-3 px-4 md:px-6 border-2 border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors whitespace-nowrap text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmBooking} 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-lg shadow-lg hover:shadow-xl flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap text-sm md:text-base"
                  >
                    <CheckCircle2 size={18} className="md:w-5 md:h-5" /> Confirm & Pay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'success' && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-lg w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-500 mb-8">Thank you for choosing {travelById.travelAgencyName}.</p>
            
            <div className="bg-gray-50 p-6 rounded-lg text-left mb-8 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Bus size={100} />
              </div>
              <div className="flex justify-between mb-2 relative z-10">
                <span className="text-sm text-gray-500">Trip</span>
                <span className="font-medium text-gray-800">{travelById.travelAgencyName}</span>
              </div>
              <div className="flex justify-between mb-2 relative z-10">
                <span className="text-sm text-gray-500">Seats</span>
                <span className="font-medium text-gray-800">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Start Date</span>
                  <span className="font-medium text-gray-800">{formatDate(bookingStartDate || travelById.from)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">End Date</span>
                  <span className="font-medium text-gray-800">{formatDate(bookingEndDate || travelById.to || addDays(bookingStartDate || travelById.from, (travelById?.days || 1) - 1))}</span>
                </div>
              </div>
            </div>

            <button onClick={goBack} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition">
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
