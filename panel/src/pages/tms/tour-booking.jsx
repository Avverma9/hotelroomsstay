import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, MapIcon, Compass, Phone, Mail, ShieldCheck,
  ListChecks, Layers, ChevronRight, ChevronLeft, Star,
  Check, CheckCircle2, Loader2, Minus, Plus, User, Users,
  X, AlertTriangle, CalendarDays,
  ChevronDown
} from 'lucide-react';
import {
  getTourById,
  getVehicleSeats,
  createBooking,
} from '../../../redux/slices/tms/travel/tour/tour';
import { getGST } from '../../../redux/slices/admin/gst';
import { selectAuth } from '../../../redux/slices/authSlice';
import { formatCurrency } from '../../utils/format'

const toArr = (v) =>
  Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];

const calculateAge = (dobString) => {
  if (!dobString) return -1;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const DayWiseItem = ({ day, index }) => {
  const [expanded, setExpanded] = useState(false);
  const title = day.title || day.heading || day.dayTitle || `Day ${index + 1}`;
  const desc = day.description || day.activities || day.detail || day.dayDescription || '';
  const places = day.places || day.visitingPlaces || '';

  return (
    <div className="border-b border-zinc-100 last:border-0 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-50 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 ring-1 ring-blue-100">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-zinc-800 line-clamp-1">{title}</span>
        </div>
        <ChevronRight
          size={18}
          className={`shrink-0 text-zinc-400 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 space-y-2 pl-15 ml-10">
            {places && (
              <p className="text-xs font-medium text-blue-700 bg-blue-50/50 inline-block px-2 py-1 rounded-md">
                <span className="text-blue-400 font-semibold mr-1">Places:</span>
                {places}
              </p>
            )}
            {desc && <p className="text-sm text-zinc-600 leading-relaxed">{desc}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const BusSeatGrid = ({ seats, selectedSeatMap, onToggleSeat, totalNeeded, seatConfig }) => {
  const seatByCode = useMemo(() => {
    const m = new Map();
    seats.forEach(s => {
      const k = String(s.seatNumber || s.code || '');
      if (k) m.set(k, s);
    });
    return m;
  }, [seats]);

  const { left = 1, right = 2, aisle = true, rows: cfgRows } = seatConfig || {};

  const leftCols = Array.from({ length: left }, (_, i) => String.fromCharCode(65 + i));
  const rightCols = Array.from({ length: right }, (_, i) => String.fromCharCode(65 + left + 1 + i));

  const numRows = useMemo(() => {
    if (cfgRows) return Number(cfgRows);
    let max = 0;
    seatByCode.forEach((_, code) => { const r = parseInt(code); if (!isNaN(r) && r > max) max = r; });
    return max;
  }, [cfgRows, seatByCode]);

  if (!seats.length) return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center">
      <Users size={28} className="text-zinc-300 mb-3" />
      <p className="text-sm font-medium text-zinc-500">No seats configured for this vehicle.</p>
    </div>
  );

  if (!seatConfig || !numRows) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {seats.map((seat, i) => {
          const key = String(seat.seatNumber || seat.code || i + 1);
          const isBooked = seat.isBooked || seat.status === 'booked';
          const isSelected = selectedSeatMap.has(key);
          const canSelect = !isBooked && (isSelected || selectedSeatMap.size < totalNeeded);
          
          let cls = 'border-zinc-200 bg-white text-zinc-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md';
          if (isBooked) cls = 'border-red-100 bg-red-50/50 text-red-300 cursor-not-allowed';
          else if (isSelected) cls = 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20 cursor-pointer ring-4 ring-blue-50';
          else if (!canSelect) cls = 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed';

          return (
            <button key={key} type="button"
              disabled={isBooked || (!isSelected && !canSelect)}
              onClick={() => !isBooked && canSelect && onToggleSeat(seat, key)}
              className={`flex h-14 w-full flex-col items-center justify-center rounded-xl border-2 text-sm font-bold transition-all duration-200 ${cls}`}
            >
              {isSelected ? <Check size={16} strokeWidth={3}/> : isBooked ? <X size={16} strokeWidth={2.5}/> : <span>{key}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  const renderSeat = (rowNum, col) => {
    const code = `${rowNum}${col}`;
    const seat = seatByCode.get(code);
    if (!seat) {
      return <div key={code} className="h-12 w-12 shrink-0 rounded-xl" />;
    }
    const isBooked = seat.isBooked;
    const isSelected = selectedSeatMap.has(code);
    const canSelect = !isBooked && (isSelected || selectedSeatMap.size < totalNeeded);
    
    let cls = 'border-zinc-200 bg-white text-zinc-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md cursor-pointer';
    if (isBooked) cls = 'border-red-100 bg-red-50/50 text-red-300 cursor-not-allowed';
    else if (isSelected) cls = 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20 cursor-pointer ring-4 ring-blue-50';
    else if (!canSelect) cls = 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed';

    return (
      <button key={code} type="button"
        disabled={isBooked || (!isSelected && !canSelect)}
        onClick={() => !isBooked && canSelect && onToggleSeat(seat, code)}
        title={isBooked ? `${code} — Booked` : `${code} — ${isSelected ? 'Selected' : 'Available'}`}
        className={`relative h-12 w-12 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${cls}`}
      >
        {isBooked ? <X size={16} strokeWidth={2.5} />
          : isSelected ? <Check size={16} strokeWidth={3} />
          : <span className="text-xs font-bold">{code}</span>
        }
      </button>
    );
  };

  return (
    <div className="overflow-x-auto pb-4 custom-scrollbar">
      <div className="inline-block min-w-max p-1">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-6 py-4">
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Front</span>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 shadow-sm">
              <span>🚌</span> Driver
            </div>
          </div>

          <div className="flex items-center gap-2 px-6 pt-5 pb-2">
            <div className="w-8 shrink-0" />
            {leftCols.map(col => (
              <div key={col} className="w-12 shrink-0 text-center text-xs font-bold text-zinc-400">{col}</div>
            ))}
            {aisle && <div className="w-10 shrink-0" />}
            {rightCols.map(col => (
              <div key={col} className="w-12 shrink-0 text-center text-xs font-bold text-zinc-400">{col}</div>
            ))}
          </div>

          <div className="space-y-3 px-6 pb-6">
            {Array.from({ length: numRows }, (_, i) => {
              const rowNum = i + 1;
              return (
                <div key={rowNum} className="flex items-center gap-2">
                  <div className="w-8 shrink-0 text-right text-xs font-bold text-zinc-300">{rowNum}</div>
                  {leftCols.map(col => renderSeat(rowNum, col))}
                  {aisle && (
                    <div className="w-10 shrink-0 flex items-center justify-center">
                      <div className="h-full w-px bg-zinc-100" />
                    </div>
                  )}
                  {rightCols.map(col => renderSeat(rowNum, col))}
                </div>
              );
            })}
          </div>
        </div>

        {selectedSeatMap.size > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from(selectedSeatMap.entries()).map(([k, s]) => (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Seat {k}{s?.seatPrice ? <span className="text-blue-400/80 ml-1">| {formatCurrency(s.seatPrice)}</span> : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Counter = ({ label, sub, value, onDec, onInc, min = 0 }) => (
  <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 transition-shadow hover:shadow-md">
    <div>
      <p className="text-sm font-semibold text-zinc-900">{label}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
    <div className="flex items-center gap-4">
      <button
        type="button" onClick={onDec} disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-zinc-50"
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
      <span className="w-6 text-center text-lg font-bold text-zinc-900">{value}</span>
      <button
        type="button" onClick={onInc}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>
  </div>
);

const getStepLabels = (hasSeats) =>
  hasSeats ? ['Configuration', 'Seat Selection', 'Passenger Details', 'Review & Confirm'] : ['Configuration', 'Passenger Details', 'Review & Confirm'];

export default function TourBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector(selectAuth);
  const { tourDetails, vehicleSeats, loading: tourLoading } = useSelector((s) => s.tour);
  const { selectedGST, loading: gstLoading } = useSelector((s) => s.adminGst);

  useEffect(() => {
    if (id) dispatch(getTourById(id));
    dispatch(getGST({ type: 'Tour' }));
  }, [dispatch, id]);

  const tour = tourDetails;

  const vehicles = useMemo(() => tour?.vehicles || [], [tour]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles, selectedVehicle]);

  const seats = useMemo(() => {
    if (vehicleSeats) {
      const vData = vehicleSeats?.vehicle;
      if (vData?.seatMatrix && Array.isArray(vData.seatMatrix) && vData.seatMatrix.length > 0) {
        const bookedSet = new Set((vData.bookedSeats || []).map(String));
        return vData.seatMatrix.map((s) => ({
          seatNumber: s.code,
          isBooked: bookedSet.has(s.code) || s.status === 'booked',
          seatType: s.type || '',
          seatPrice: Number(selectedVehicle?.pricePerSeat || 0),
        }));
      }
      const raw = Array.isArray(vehicleSeats)
        ? vehicleSeats
        : (vehicleSeats?.seats || vehicleSeats?.seatConfig || vehicleSeats?.data || null);
      if (Array.isArray(raw) && raw.length > 0) return raw;
    }
    const seater = Number(selectedVehicle?.seater || selectedVehicle?.totalSeats || 0);
    if (!seater) return [];
    const bookedSet = new Set((selectedVehicle?.bookedSeats || []).map(String));
    return Array.from({ length: seater }, (_, i) => {
      const num = String(i + 1);
      return { seatNumber: num, isBooked: bookedSet.has(num), seatPrice: Number(selectedVehicle?.pricePerSeat || 0) };
    });
  }, [vehicleSeats, selectedVehicle]);

  const seatConfig = useMemo(() => vehicleSeats?.vehicle?.seatConfig || null, [vehicleSeats]);

  useEffect(() => {
    if (selectedVehicle?._id && tour?._id) {
      dispatch(getVehicleSeats({ tourId: tour._id, vehicleId: selectedVehicle._id }));
      setSelectedSeatMap(new Map());
      setStep(1);
    }
  }, [dispatch, selectedVehicle?._id, tour?._id]);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedSeatMap, setSelectedSeatMap] = useState(new Map());
  const [passengers, setPassengers] = useState([{ type: 'adult', fullName: '', gender: '', dateOfBirth: '' }]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingError, setBookingError] = useState('');

  const totalPassengers = adults + children;
  const hasSeats = seats.length > 0;
  const stepLabels = getStepLabels(hasSeats);
  const totalSteps = stepLabels.length;
  const currentLabel = stepLabels[step - 1];

  useEffect(() => {
    setPassengers((prev) => {
      const currentLength = prev.length;
      if (currentLength === totalPassengers) {
        return prev.map((p, i) => ({ ...p, type: i < adults ? 'adult' : 'child' }));
      }
      if (currentLength < totalPassengers) {
        const toAdd = totalPassengers - currentLength;
        const newPassengers = Array.from({ length: toAdd }, (_, i) => ({
          type: (currentLength + i) < adults ? 'adult' : 'child',
          fullName: '', gender: '', dateOfBirth: ''
        }));
        return [...prev, ...newPassengers];
      }
      return prev.slice(0, totalPassengers).map((p, i) => ({ ...p, type: i < adults ? 'adult' : 'child' }));
    });
  }, [totalPassengers, adults]);

  const themeList = useMemo(() => toArr(tour?.themes), [tour?.themes]);
  const inclusions = useMemo(() => toArr(tour?.inclusion), [tour?.inclusion]);
  const exclusions = useMemo(() => toArr(tour?.exclusion), [tour?.exclusion]);

  const updatePassenger = (idx, field, val) => {
    setPassengers((prev) => {
      const next = [...prev];
      const updated = { ...next[idx], [field]: val };
      if (field === 'dateOfBirth' && val) {
        const age = calculateAge(val);
        if (age >= 0) updated.type = age >= 12 ? 'adult' : 'child';
      }
      next[idx] = updated;
      return next;
    });
  };

  const handleToggleSeat = (seat, key) =>
    setSelectedSeatMap((prev) => {
      const next = new Map(prev);
      next.has(key) ? next.delete(key) : next.set(key, seat);
      return next;
    });

  const tourBasePrice = Number(tour?.price || 0);
  const perSeatPrice = Number(selectedVehicle?.pricePerSeat || 0);
  const seatPrice = perSeatPrice * selectedSeatMap.size;
  const subtotal = tourBasePrice + seatPrice;
  const gstRate = Number(selectedGST?.gstRate || selectedGST?.rate || selectedGST?.percentage || 0);
  const taxAmount = Math.round(subtotal * gstRate / 100);
  const totalAmount = subtotal + taxAmount;

  const canProceed = useMemo(() => {
    if (currentLabel === 'Configuration') return !!selectedVehicle && adults >= 1;
    if (currentLabel === 'Seat Selection') return selectedSeatMap.size === totalPassengers;
    if (currentLabel === 'Passenger Details') return passengers.every((p) => p.fullName.trim() !== '');
    return true;
  }, [currentLabel, selectedVehicle, adults, selectedSeatMap.size, totalPassengers, passengers]);

  const handleNext = () => canProceed && step < totalSteps && setStep((s) => s + 1);
  const handleBack = () => step > 1 && setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!user) { setBookingError('Please log in to continue.'); return; }
    setSubmitting(true);
    setBookingError('');
    try {
      const actualAdults = passengers.filter((p) => p.type === 'adult').length;
      const actualChildren = passengers.filter((p) => p.type === 'child').length;
      const payload = {
        userId: user._id || user.id || user.userId || '',
        tourId: tour._id,
        vehicleId: selectedVehicle?._id || '',
        seats: Array.from(selectedSeatMap.keys()),
        numberOfAdults: actualAdults,
        numberOfChildren: actualChildren,
        passengers: passengers.map((p) => ({
          type: p.type,
          fullName: p.fullName.trim(),
          ...(p.gender && { gender: p.gender }),
          ...(p.dateOfBirth && { dateOfBirth: p.dateOfBirth }),
        })),
        travelAgencyName: tour.travelAgencyName,
        agencyPhone: tour.agencyPhone,
        agencyEmail: tour.agencyEmail,
        visitngPlaces: tour.visitngPlaces,
        country: tour.country,
        state: tour.state,
        city: tour.city,
        themes: Array.isArray(tour.themes) ? tour.themes.join(', ') : (tour.themes || ''),
        tourStartDate: tour.tourStartDate,
        nights: tour.nights,
        days: tour.days,
        from: tour.from,
        to: tour.to,
        basePrice: tourBasePrice,
        seatPrice,
        tax: taxAmount,
        discount: 0,
        totalAmount,
        amenities: tour.amenities || [],
        inclusion: toArr(tour.inclusion),
        exclusion: toArr(tour.exclusion),
        termsAndConditions: tour.termsAndConditions,
        dayWise: tour.dayWise || [],
        bookingSource: 'dashboard',
      };
      const result = await dispatch(createBooking(payload)).unwrap();
      setBookingResult(result?.data || result);
    } catch (err) {
      setBookingError(typeof err === 'string' ? err : err?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (tourLoading && !tour) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 size={36} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-zinc-50 text-center px-4">
        <div className="bg-zinc-100 p-6 rounded-full shadow-inner">
          <MapIcon size={48} className="text-zinc-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-zinc-800">Tour Unavailable</h2>
          <p className="text-sm font-medium text-zinc-500">We couldn't find the tour you're looking for.</p>
        </div>
        <button onClick={() => navigate('/tours-book')} className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 hover:shadow-xl transition-all">
          Explore Other Tours
        </button>
      </div>
    );
  }

  if (bookingResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10 shadow-xl shadow-zinc-200/50 text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Booking Confirmed!</h2>
            <p className="mt-2 text-sm text-zinc-500 font-medium">Get ready for your adventure.</p>
          </div>
          {(bookingResult.bookingCode || bookingResult._id) && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">Booking Reference</p>
              <p className="font-mono text-xl font-extrabold tracking-widest text-blue-700">
                {bookingResult.bookingCode || bookingResult._id}
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6 text-left space-y-4">
            {(bookingResult.basePrice ?? tourBasePrice) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Tour Package</span>
                <span className="font-bold text-zinc-900">{formatCurrency(bookingResult.basePrice ?? tourBasePrice)}</span>
              </div>
            )}
            {(bookingResult.seatPrice ?? seatPrice) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Seat Reservation</span>
                <span className="font-bold text-zinc-900">{formatCurrency(bookingResult.seatPrice ?? seatPrice)}</span>
              </div>
            )}
            {gstRate > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-medium">Taxes & Fees ({gstRate}%)</span>
                <span className="font-bold text-zinc-900">{formatCurrency(bookingResult.tax ?? taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-zinc-200 pt-4">
              <span className="text-base font-bold text-zinc-800">Total Amount</span>
              <span className="text-2xl font-black text-blue-600">{formatCurrency(bookingResult.totalAmount ?? totalAmount)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/tours-book')}
            className="w-full rounded-2xl bg-zinc-900 py-4 text-sm font-bold text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/40 pb-32 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600 mb-0.5">Booking Checkout</p>
            <h1 className="truncate text-lg font-black text-zinc-900 tracking-tight">{tour.travelAgencyName || 'Premium Tour'}</h1>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {stepLabels.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step > i + 1 ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : step === i + 1 ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-md shadow-blue-600/20' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {step > i + 1 ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`text-xs font-bold tracking-wide ${step === i + 1 ? 'text-blue-700' : step > i + 1 ? 'text-zinc-700' : 'text-zinc-400'}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-8 h-0.5 rounded-full mx-1 transition-colors ${step > i + 1 ? 'bg-green-400' : 'bg-zinc-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="lg:hidden flex items-center bg-zinc-100 px-3 py-1.5 rounded-full">
            <span className="text-xs font-bold text-zinc-600">Step {step} of {totalSteps}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {currentLabel === 'Configuration' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-7 space-y-6">
              <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-200/40">
                <div className="relative h-72 w-full overflow-hidden bg-zinc-100 group">
                  {tour.images?.[0] ? (
                    <img src={tour.images[0]} alt={tour.travelAgencyName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><MapIcon size={64} className="text-zinc-300" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/30 to-transparent" />
                  
                  {tour.starRating > 0 && (
                    <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-lg backdrop-blur-md">
                      <Star size={14} className="fill-amber-900" /> {tour.starRating}
                    </div>
                  )}
                  
                  {themeList.length > 0 && (
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {themeList.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/30">{t}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="absolute bottom-5 left-6 right-6">
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tight">{tour.travelAgencyName}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                      <MapPin size={14} className="text-blue-400" /> {[tour.city, tour.state, tour.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 divide-x divide-zinc-100 bg-white">
                  <div className="flex flex-col items-center py-4 px-2 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Duration</p>
                    <p className="text-base font-black text-zinc-800">{tour.nights ?? 0}N / {tour.days ?? 0}D</p>
                  </div>
                  <div className="flex flex-col items-center py-4 px-2 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Start Date</p>
                    <p className="text-base font-black text-zinc-800">
                      {tour.tourStartDate ? new Date(tour.tourStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center py-4 px-2 text-center bg-blue-50/30">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">Base Price</p>
                    <p className="text-base font-black text-blue-700">{formatCurrency(tour.price || 0)}</p>
                  </div>
                </div>
              </div>

              {tour?.route  && (
                <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Compass size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Journey Route</p>
                    <div className="flex flex-wrap items-center gap-2 text-base font-bold text-zinc-800">
                      <span>{tour?.route?.substring(0, 30) || 'Origin'}</span>
                     
                    </div>
                  </div>
                </div>
              )}

              {tour.visitngPlaces && (
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">Key Destinations</h3>
                  <p className="text-sm font-medium text-zinc-700 leading-relaxed">{tour.visitngPlaces}</p>
                </div>
              )}

              {tour.dayWise?.length > 0 && (
                <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Itinerary Overview</h3>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {tour.dayWise.map((day, i) => (
                      <DayWiseItem key={i} day={day} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {(inclusions.length > 0 || exclusions.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inclusions.length > 0 && (
                    <div className="rounded-3xl border border-green-100 bg-green-50/50 p-6">
                      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-green-700 flex items-center gap-2">
                        <div className="bg-green-200/50 p-1 rounded-full"><Check size={14} className="text-green-600"/></div> Included
                      </h3>
                      <ul className="space-y-3">
                        {inclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm font-medium text-green-900 leading-snug">
                            <Check size={16} className="mt-0.5 shrink-0 text-green-500" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exclusions.length > 0 && (
                    <div className="rounded-3xl border border-red-100 bg-red-50/50 p-6">
                      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-red-700 flex items-center gap-2">
                        <div className="bg-red-200/50 p-1 rounded-full"><X size={14} className="text-red-600"/></div> Excluded
                      </h3>
                      <ul className="space-y-3">
                        {exclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm font-medium text-red-900 leading-snug">
                            <X size={16} className="mt-0.5 shrink-0 text-red-400" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-28 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/40 space-y-6">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">Trip Configuration</h3>
                  <p className="text-sm text-zinc-500 mt-1">Select your preferred options to continue.</p>
                </div>

                {vehicles.length > 0 ? (
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Select Transport</label>
                    <div className="space-y-3">
                      {vehicles.map((v) => (
                        <button
                          key={v._id} type="button"
                          onClick={() => setSelectedVehicle(v)}
                          className={`w-full flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 ${
                            selectedVehicle?._id === v._id
                              ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                              : 'border-zinc-200 bg-white hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div>
                            <p className="text-base font-bold text-zinc-900">
                              {v.vehicleType || v.name || 'Standard Vehicle'}
                            </p>
                            <p className="text-xs font-medium text-zinc-500 mt-1 flex items-center gap-1.5">
                              <Users size={12} /> {v.sharingType || v.seaterType} · {v.seater || v.totalSeats} seats
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-black text-blue-600">{formatCurrency(v.pricePerSeat || 0)}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">per seat</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-sm font-medium text-amber-800">No transport options are currently configured for this package.</p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Travelers</label>
                  <div className="space-y-3">
                    <Counter label="Adults" sub="Ages 12 and above" value={adults} min={1}
                      onDec={() => setAdults((v) => Math.max(1, v - 1))}
                      onInc={() => setAdults((v) => v + 1)} />
                    <Counter label="Children" sub="Ages 0 to 11" value={children} min={0}
                      onDec={() => setChildren((v) => Math.max(0, v - 1))}
                      onInc={() => setChildren((v) => v + 1)} />
                  </div>
                </div>

                {gstLoading ? (
                  <div className="flex items-center gap-2 justify-center py-2 text-sm text-zinc-400"><Loader2 size={16} className="animate-spin" /> Calculating taxes...</div>
                ) : selectedGST && gstRate > 0 && (
                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
                    <div className="bg-white p-1.5 rounded-full shadow-sm"><ShieldCheck size={16} className="text-blue-500" /></div>
                    Government taxes (GST {gstRate}%) apply to this booking.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentLabel === 'Seat Selection' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl shadow-zinc-200/40">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Select Seats</h2>
                  <p className="text-sm font-medium text-zinc-500 mt-1 flex items-center gap-2">
                    {selectedVehicle?.name || selectedVehicle?.vehicleType || 'Transport'} 
                    <span className="w-1 h-1 bg-zinc-300 rounded-full" /> 
                    {selectedVehicle?.vehicleNumber || 'Unassigned'}
                  </p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border-2 transition-colors ${
                  selectedSeatMap.size === totalPassengers ? 'border-green-200 bg-green-50 text-green-700' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                }`}>
                  {selectedSeatMap.size === totalPassengers ? <CheckCircle2 size={18} className="text-green-500" /> : <Users size={18} className="text-zinc-400" />}
                  {selectedSeatMap.size} of {totalPassengers} Selected
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 mb-8 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span className="flex items-center gap-2"><div className="h-4 w-4 rounded border-2 border-zinc-200 bg-white" /> Available</span>
                <span className="flex items-center gap-2"><div className="h-4 w-4 rounded border-2 border-blue-600 bg-blue-600" /> Selected</span>
                <span className="flex items-center gap-2"><div className="h-4 w-4 rounded border-2 border-red-100 bg-red-50" /> Unavailable</span>
              </div>

              {tourLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
                  <p className="text-sm font-bold text-zinc-400 tracking-wide">LOADING SEAT MAP...</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <BusSeatGrid
                    seats={seats}
                    selectedSeatMap={selectedSeatMap}
                    onToggleSeat={handleToggleSeat}
                    totalNeeded={totalPassengers}
                    seatConfig={seatConfig}
                  />
                </div>
              )}
            </div>

            {selectedSeatMap.size > 0 && (
              <div className="rounded-3xl border border-blue-200 bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/20">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">Current Selection</p>
                    <p className="text-xl font-medium">{selectedSeatMap.size} seats × {formatCurrency(perSeatPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{formatCurrency(seatPrice)}</p>
                    {tourBasePrice > 0 && <p className="text-sm text-blue-200 font-medium mt-1">+ {formatCurrency(tourBasePrice)} Base Package</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentLabel === 'Passenger Details' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Traveler Information</h2>
              <p className="text-sm font-medium text-zinc-500 mt-1">Please provide details for all passengers.</p>
            </div>

            <div className="space-y-4">
              {passengers.map((p, i) => (
                <div key={i} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-5 border-b border-zinc-100 pb-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${p.type === 'adult' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      <User size={16} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-800">
                      Traveler {i + 1} <span className="text-zinc-300 mx-2">•</span> <span className={p.type === 'adult' ? 'text-blue-600' : 'text-purple-600'}>{p.type}</span>
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">Legal Full Name <span className="text-red-500">*</span></label>
                      <input
                        value={p.fullName}
                        onChange={(e) => updatePassenger(i, 'fullName', e.target.value)}
                        placeholder="As it appears on ID"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-semibold text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:font-normal placeholder:text-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">Gender</label>
                      <div className="relative">
                        <select
                          value={p.gender}
                          onChange={(e) => updatePassenger(i, 'gender', e.target.value)}
                          className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-semibold text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="" disabled className="text-zinc-400 font-normal">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={18} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-500">Date of Birth</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={p.dateOfBirth}
                          onChange={(e) => updatePassenger(i, 'dateOfBirth', e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-semibold text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentLabel === 'Review & Confirm' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Review Booking</h2>
              <p className="text-sm font-medium text-zinc-500 mt-1">Please verify all details before confirming payment.</p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-xl shadow-zinc-200/40">
              <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Trip Summary</h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Package', value: tour.travelAgencyName },
                  { label: 'Destination', value: [tour.city, tour.state].filter(Boolean).join(', ') },
                  { label: 'Dates', value: tour.tourStartDate ? new Date(tour.tourStartDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Flexible' },
                  { label: 'Transport', value: selectedVehicle?.name || selectedVehicle?.vehicleType || 'Standard' },
                  { label: 'Travelers', value: `${adults} Adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}` },
                  selectedSeatMap.size > 0 ? { label: 'Selected Seats', value: Array.from(selectedSeatMap.keys()).join(', ') } : null,
                ].filter(Boolean).map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-zinc-100 last:border-0 last:pb-0">
                    <span className="text-sm font-medium text-zinc-500 mb-1 sm:mb-0">{item.label}</span>
                    <span className="text-base font-bold text-zinc-900 text-left sm:text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-xl shadow-zinc-200/40">
              <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Payment Details</h3>
              </div>
              <div className="p-6 space-y-4">
                {tourBasePrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-600">Base Package Amount</span>
                    <span className="text-base font-bold text-zinc-900">{formatCurrency(tourBasePrice)}</span>
                  </div>
                )}
                {seatPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-600">Seat Reservation ({selectedSeatMap.size})</span>
                    <span className="text-base font-bold text-zinc-900">{formatCurrency(seatPrice)}</span>
                  </div>
                )}
                {gstRate > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-600">Taxes & Fees (GST {gstRate}%)</span>
                    <span className="text-base font-bold text-zinc-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="mt-4 pt-6 border-t border-zinc-200 flex justify-between items-end">
                  <div>
                    <span className="block text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Due</span>
                    <span className="text-xs font-medium text-zinc-400">Includes all taxes and fees</span>
                  </div>
                  <span className="text-4xl font-black text-blue-600 tracking-tight">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <AlertTriangle size={20} className="shrink-0 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-800">Booking Unsuccessful</h4>
                  <p className="text-sm font-medium text-red-600 mt-1">{bookingError}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200/80 bg-white/80 backdrop-blur-xl pb-safe">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {step > 1 && (
            <button
              type="button" onClick={handleBack} disabled={submitting}
              className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}
          
          <div className="flex-1"></div>

          {step < totalSteps ? (
            <button
              type="button" onClick={handleNext} disabled={!canProceed}
              className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-8 py-4 text-base font-bold text-white shadow-lg shadow-zinc-900/20 transition-all hover:bg-zinc-800 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none w-full sm:w-auto min-w-[200px]"
            >
              Continue to {stepLabels[step]} <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button" onClick={handleSubmit} disabled={submitting || !canProceed}
              className="flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 w-full sm:w-auto min-w-[240px]"
            >
              {submitting ? (
                <><Loader2 size={20} className="animate-spin" /> Processing Payment...</>
              ) : (
                <><CheckCircle2 size={20} /> Confirm & Pay</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}