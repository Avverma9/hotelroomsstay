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
  MapPin, CheckCircle2, AlertCircle, UserPlus
} from 'lucide-react';

const formatReadableDate = (dateString) => {
  if (!dateString) return "";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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

const CheckCircleIcon = () => (
  <svg className="w-6 h-6 text-emerald-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-6 h-6 text-rose-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookingRoomsModal = ({ open, onClose, travel, finalPrice, onConfirm }) => {
  const isCustomizable = !!travel?.isCustomizable;
  const durationInDays = travel?.days || 1;

  const visitPlaces = useMemo(() => (travel?.visitngPlaces || "").replace(/\|/g, " | "), [travel]);

  const fixedStartDate = useMemo(() => {
    if (!travel) return "";
  return !isCustomizable ? (travel.tourStartDate || travel.from || "") : "";
  }, [travel, isCustomizable]);

  const dispatch = useDispatch();
  // seat map moved into travel slice at state.travel.seatMapByKey
  const { loading: seatLoading, seatMapByKey } = useSelector((s) => s.travel);

  const [selectedDate, setSelectedDate] = useState(fixedStartDate);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childDOBs, setChildDOBs] = useState([]);
  const [calcResult, setCalcResult] = useState(null);
  const [error, setError] = useState("");

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);

  const seatLimit = (adults || 0) + (children || 0);
  const seatKey = travel?._id && selectedVehicleId ? `${travel._id}:${selectedVehicleId}` : "";
  const seatMap = seatKey ? (seatMapByKey[seatKey] || []) : [];

  useEffect(() => {
    if (!open) return;
    setAdults(2);
    setChildren(0);
    setChildDOBs([]);
    setCalcResult(null);
    setError("");
    setSelectedDate(fixedStartDate);
    const firstVehicle = travel?.vehicles?.find((v) => v.isActive !== false);
    setSelectedVehicleId(firstVehicle?._id || "");
    setSelectedSeats([]);
  }, [open, fixedStartDate, travel]);

  useEffect(() => {
    if (!open || !travel?._id || !selectedVehicleId) return;
    // Check if we already have data for this key to avoid re-fetching
    const key = `${travel._id}:${selectedVehicleId}`;
    if (seatMapByKey[key]) return;
    
    dispatch(fetchSeatMap({ tourId: travel._id, vehicleId: selectedVehicleId }));
  }, [open, dispatch, travel?._id, selectedVehicleId, seatMapByKey]);

  useEffect(() => {
    setSelectedSeats((prev) => prev.slice(0, seatLimit));
  }, [seatLimit]);

  const changeAdults = (delta) => {
    setAdults((prev) => Math.min(4, Math.max(1, prev + delta)));
    setCalcResult(null);
  };

  const changeChildren = (delta) => {
    setChildren((prev) => {
      const next = Math.min(3, Math.max(0, prev + delta));
      setChildDOBs((dobs) => {
        const copy = dobs.slice(0, next);
        while (copy.length < next) copy.push("");
        return copy;
      });
      return next;
    });
    setCalcResult(null);
  };

  const handleChildDOBChange = (index, value) => {
    setChildDOBs((prev) => {
      const copy = prev.slice();
      copy[index] = value;
      return copy;
    });
    setCalcResult(null);
  };

  const toggleSeat = (code) => {
    setError("");
    setSelectedSeats((prev) => {
      if (prev.includes(code)) return prev.filter((x) => x !== code);
      if (prev.length >= seatLimit) return prev;
      return [...prev, code];
    });
  };

  const aggregateTotals = () => {
    const totalAdults = adults;
    let totalAmount = totalAdults * finalPrice;

    const dobList = childDOBs.slice(0, children);
    const collectedChildDOBs = [];
    for (let i = 0; i < children; i += 1) {
      const dob = dobList[i];
      if (!dob) return { error: "Please enter date of birth for every child." };
      const age = calculateAge(dob);
      const isFullFare = age === null || age >= 8;
      const childFare = isFullFare ? finalPrice : finalPrice / 2;
      totalAmount += childFare;
      collectedChildDOBs.push(dob);
    }

    return {
      totalAmount,
      totalAdults,
      totalChildren: children,
      childDOBs: collectedChildDOBs
    };
  };

  const handleCalculate = () => {
    setError("");
    const activeDate = selectedDate || fixedStartDate;
    if (!activeDate) {
      setError("Please select a start date for this tour.");
      return;
    }
    const totals = aggregateTotals();
    if (totals.error) {
      setError(totals.error);
      return;
    }
    const endDate = addDays(activeDate, durationInDays - 1);
    setCalcResult({ ...totals, startDate: activeDate, endDate });
  };

  const handleConfirm = () => {
    if (!calcResult) {
      handleCalculate();
      return;
    }
    if (!selectedVehicleId) {
      setError("Please select a vehicle.");
      return;
    }
    if (selectedSeats.length !== seatLimit) {
      setError(`Please select ${seatLimit} seat(s).`);
      return;
    }
    onConfirm({ ...calcResult, vehicleId: selectedVehicleId, seats: selectedSeats });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 sm:px-4 py-2 sm:py-6">
      <div className="w-full max-w-3xl max-h-[95vh] rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-6 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-2 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold text-indigo-600">{travel?.themes}</p>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{travel?.travelAgencyName}</h2>
            {visitPlaces && <p className="mt-1 text-xs sm:text-sm text-slate-500 line-clamp-1">{visitPlaces}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 p-1.5 sm:p-2 text-gray-500 transition hover:bg-gray-100 flex-shrink-0">
            <span className="sr-only">Close</span>×
          </button>
        </div>

        <div className="mt-2 sm:mt-4 space-y-3 sm:space-y-6 overflow-y-auto flex-1">
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4">
            <p className="text-sm font-semibold text-slate-600">{isCustomizable ? "Select Travel Date" : "Selected Date"}</p>
            {isCustomizable ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCalcResult(null);
                }}
                className="mt-2 w-full rounded-lg sm:rounded-xl border border-gray-300 px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200"
              />
            ) : (
              <p className="mt-2 text-base sm:text-lg font-semibold text-slate-900">{formatReadableDate(selectedDate)}</p>
            )}
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4">
            <p className="text-sm font-semibold text-slate-600">Select Vehicle</p>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(e.target.value);
                setSelectedSeats([]);
              }}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {(travel?.vehicles || [])
                .filter((v) => v.isActive !== false)
                .map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} {v.vehicleNumber ? `(${v.vehicleNumber})` : ""} - {v.totalSeats} seats
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-xs sm:text-sm font-semibold text-slate-800">Adult</p>
                <p className="text-xs text-slate-500">Above 12 years</p>
                <div className="mt-2 sm:mt-3 flex items-center justify-between rounded-lg sm:rounded-xl border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-semibold">
                  <button type="button" onClick={() => changeAdults(-1)} className="px-1 sm:px-2 text-lg sm:text-2xl" disabled={adults <= 1}>−</button>
                  <span>{adults}</span>
                  <button type="button" onClick={() => changeAdults(1)} className="px-1 sm:px-2 text-lg sm:text-2xl" disabled={adults >= 4}>+</button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">Child</p>
                    <p className="text-xs text-slate-500">Below 12 years</p>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">8+ full fare</span>
                </div>
                <div className="mt-2 sm:mt-3 flex items-center justify-between rounded-lg sm:rounded-xl border border-gray-300 px-2 sm:px-3 py-1 sm:py-2 text-base sm:text-lg font-semibold">
                  <button type="button" onClick={() => changeChildren(-1)} className="px-1 sm:px-2 text-lg sm:text-2xl" disabled={children <= 0}>−</button>
                  <span>{children}</span>
                  <button type="button" onClick={() => changeChildren(1)} className="px-1 sm:px-2 text-lg sm:text-2xl" disabled={children >= 3}>+</button>
                </div>
              </div>
            </div>

            {children > 0 && (
              <div className="space-y-2 sm:space-y-3">
                {childDOBs.slice(0, children).map((dob, childIdx) => (
                  <div key={`child-${childIdx}`}>
                    <label className="text-xs sm:text-sm font-medium text-slate-700 block mb-1">
                      Child {childIdx + 1} Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dob}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => handleChildDOBChange(childIdx, e.target.value)}
                      className="w-full rounded-lg sm:rounded-xl border border-gray-300 px-3 py-2 text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-200 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">Select Seats</p>
              <p className="text-xs text-slate-500">Selected {selectedSeats.length}/{seatLimit}</p>
            </div>

            {seatLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading seats...</p>
            ) : (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {seatMap.map((s) => {
                  const isBooked = s.status === "booked";
                  const isSelected = selectedSeats.includes(s.code);
                  const disabled = isBooked || (!isSelected && selectedSeats.length >= seatLimit);

                  return (
                    <button
                      key={s.code}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleSeat(s.code)}
                      className={[
                        "rounded-lg border px-2 py-2 text-xs font-semibold",
                        isBooked ? "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed" : "",
                        isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-800 border-slate-300",
                        disabled && !isBooked ? "opacity-60" : ""
                      ].join(" ")}
                      title={isBooked ? "Booked" : "Available"}
                    >
                      {s.code}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex gap-3 text-xs">
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-white border border-slate-300" />Available</div>
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-blue-600" />Selected</div>
              <div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded bg-slate-200" />Booked</div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs sm:text-sm text-blue-800">
            Child below 8 years will be charged at 50% of adult fare. Above 8 years will be charged full price.
          </div>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm text-rose-700">{error}</div>}

          {calcResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
              <p className="text-xs sm:text-sm font-semibold">Travellers Summary</p>
              <p className="text-xs sm:text-sm">
                Adults: {calcResult.totalAdults} • Children: {calcResult.totalChildren}
              </p>
              <p className="text-sm sm:text-base font-bold mt-1">
                Calculated Amount: ₹{calcResult.totalAmount.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:gap-3 mt-4 sm:mt-6 flex-shrink-0 border-t pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCalculate}
              className="w-full rounded-lg sm:rounded-xl bg-slate-900 px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-white transition hover:bg-slate-800 font-medium"
            >
              Calculate Amount
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 font-medium"
              disabled={!calcResult}
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TourBookNowPage() {
  const { id } = useParams();
  const { travelById, loading } = useSelector((state) => state.travel);
  const gstData = useSelector((state) => state.gst.gst);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useLoader();
  const popup = useToast();

  const [finalPrice, setFinalPrice] = useState(0);
  const [bookingSummary, setBookingSummary] = useState({
    startDate: "",
    endDate: "",
    totalAdults: 1,
    totalChildren: 0,
    totalAmount: 0,
    childDOBs: []
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) dispatch(getTravelById(id));
  }, [dispatch, id]);

  useEffect(() => {
    dispatch(getGst({ type: "Tour" }));
  }, [dispatch]);

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

  const formatDate = useCallback((dateString) => formatReadableDate(dateString) || "N/A", []);

  useEffect(() => {
    if (!travelById) return;
  const defaultStart = travelById.isCustomizable ? "" : (travelById.tourStartDate || travelById.from || "");
    const defaultEnd = defaultStart ? addDays(defaultStart, (travelById.days || 1) - 1) : "";
    setBookingSummary((prev) => ({ ...prev, startDate: defaultStart, endDate: defaultEnd }));
  }, [travelById]);

  const handleBooking = async (details) => {
    if (!userId) return popup("Please log in to book.");

    const selectedStart = details?.startDate || bookingSummary.startDate || travelById?.tourStartDate || travelById?.from;
    if (!selectedStart) return popup("Please select travel dates.");

    const computedEnd = details?.endDate || bookingSummary.endDate || addDays(selectedStart, (travelById?.days || 1) - 1);

    const totalAdults = details?.totalAdults ?? bookingSummary.totalAdults ?? 1;
    const totalChildren = details?.totalChildren ?? bookingSummary.totalChildren ?? 0;
    const childDOBs = details?.childDOBs ?? bookingSummary.childDOBs ?? [];
    const totalAmount = details?.totalAmount ?? bookingSummary.totalAmount ?? finalPrice;

    const seats = details?.seats || [];
    const vehicleId = details?.vehicleId;

    const passengers = [
      ...Array.from({ length: totalAdults }).map(() => ({ type: "adult" })),
      ...childDOBs.map((dob) => ({ type: "child", dateOfBirth: dob }))
    ];

    const bookingData = {
      userId,
      tourId: travelById._id,
      vehicleId,
      seats,
      status: "pending",

      numberOfAdults: totalAdults,
      numberOfChildren: totalChildren,
      passengers,

      from: selectedStart,
      to: computedEnd,
      tourStartDate: travelById.tourStartDate || selectedStart,
  isCustomizable: travelById.isCustomizable,

      travelAgencyName: travelById.travelAgencyName,
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
      const bookingCode = data?.bookingCode || data?.bookingId || data?.bookingCode || "N/A";
      popup.success(`Booking Confirmed!\nCity: ${bookingData.city}\nFrom: ${formatDate(selectedStart)}\nBooking: ${bookingCode}`);
      setTimeout(() => navigate("/tour-bookings"), 2500);
    } catch (err) {
      popup(`Booking failed.\nReason: ${err?.message || err?.toString() || "Unknown error"}`);
    } finally {
      hideLoader();
    }
  };

  const handleModalConfirm = (details) => {
    setBookingSummary({
      startDate: details.startDate,
      endDate: details.endDate,
      totalAdults: details.totalAdults,
      totalChildren: details.totalChildren,
      totalAmount: details.totalAmount,
      childDOBs: details.childDOBs || []
    });
    setIsModalOpen(false);
    handleBooking(details);
  };

  const visitingPlaces = useMemo(() => {
    try {
      return (travelById?.visitngPlaces || "").replace(/\|/g, ", ");
    } catch {
      return "";
    }
  }, [travelById]);

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
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen font-sans">
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <header className="mb-6 lg:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                {travelById.travelAgencyName}
              </h1>
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} filled={i < travelById.starRating} />
                  ))}
                </div>
                <p className="ml-2 text-base sm:text-lg text-slate-600">{travelById.starRating}.0 Star Rating</p>
              </div>
              <p className="mt-1 text-slate-500">{travelById.city}, {travelById.state}, {travelById.country}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-xs font-semibold ring-1 ring-inset ring-emerald-200">
                Trusted Partner
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 text-xs font-semibold ring-1 ring-inset ring-blue-200">
                Instant Confirmation
              </span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <section aria-label="Image Gallery" className="rounded-2xl">
              <HolidayImageSlider
                images={travelById.images}
                heightClass="h-64 sm:h-72 lg:h-[420px]"
                showIndicators
                showThumbnails
                className="bg-white/70 p-3 sm:p-4 rounded-3xl"
                imageClassName="rounded-2xl"
              />
            </section>

            <section className="p-5 sm:p-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Tour Overview</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{travelById.overview}</p>
            </section>

            <section className="p-5 sm:p-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Day-wise Itinerary</h2>
              <div className="space-y-4">
                {travelById.dayWise?.filter((d) => d.description).map((day) => (
                  <div key={day._id || `${day.day}`} className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center font-bold shadow-sm">
                      {day.day}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-slate-900">Day {day.day}</h3>
                      <p className="text-slate-600">{day.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 sm:p-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Inclusions</h2>
                <ul className="space-y-2">
                  {(travelById.inclusion || []).map((item, i) => (
                    <li key={i} className="flex items-start text-slate-700">
                      <CheckCircleIcon /><span className="mt-0.5">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 sm:p-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Exclusions</h2>
                <ul className="space-y-2">
                  {(travelById.exclusion || []).map((item, i) => (
                    <li key={i} className="flex items-start text-slate-700">
                      <XCircleIcon /><span className="mt-0.5">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="p-5 sm:p-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Terms & Conditions</h2>
              <div className="space-y-4">
                {Object.entries(travelById.termsAndConditions || {}).map(([key, value]) => (
                  <div key={key}>
                    <h3 className="font-semibold text-base sm:text-lg capitalize text-slate-900">
                      {key.replace(/([A-Z])/g, " $1")}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 whitespace-pre-line">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-4 sm:p-6 shadow-xl shadow-slate-400/10 ring-1 ring-slate-200">
                <div className="flex items-baseline gap-2 mb-5 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                    ₹{finalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-slate-500">/ person</span>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-600">Travel Date</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {bookingSummary.startDate ? formatDate(bookingSummary.startDate) : "Select during booking"}
                    </p>
                    {bookingSummary.endDate && <p className="text-sm text-slate-500">Ends {formatDate(bookingSummary.endDate)}</p>}
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-600">Travellers</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {(bookingSummary.totalAdults ?? 1)} Adults • {(bookingSummary.totalChildren ?? 0)} Children
                    </p>
                    {bookingSummary.totalAmount > 0 && (
                      <p className="mt-2 text-sm font-semibold text-emerald-600">
                        Last calculated amount: ₹{bookingSummary.totalAmount.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-5 sm:pt-6">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Package Details</h3>
                    <div className="bg-slate-50 rounded-xl p-3 sm:p-4 ring-1 ring-slate-200">
                      <ul className="space-y-2 sm:space-y-3 text-sm">
                        <li className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Duration</span>
                          <span className="font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full text-xs">
                            {travelById.days} Days / {travelById.nights} Nights
                          </span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Available From</span>
                          <span className="font-bold text-slate-900">{formatDate(travelById.from)}</span>
                        </li>
                        <li className="flex justify-between items-start gap-3">
                          <span className="text-slate-600 font-medium">Places</span>
                          <span className="font-semibold text-slate-900 text-right max-w-[65%] break-words">
                            {visitingPlaces}
                          </span>
                        </li>
                        <li className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Theme</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-xs ring-1 ring-blue-200">
                            {travelById.themes}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-5 sm:pt-6">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Amenities Included</h3>
                    <div className="flex flex-wrap gap-2">
                      {(travelById.amenities || []).map((item) => (
                        <span
                          key={item}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border border-blue-200/70 shadow-sm"
                          title={item}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 sm:px-6 sm:py-4 text-base sm:text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Book Now — Select Travellers & Seats
                  </button>
                </div>

                <div className="mt-5 sm:mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Have questions?
                    <a href={`mailto:${travelById.agencyEmail}`} className="font-semibold text-blue-600 hover:underline ml-1">
                      Contact our team
                    </a>
                  </p>
                </div>

              </div>
            </div>
          </aside>
        </main>
      </div>

      <BookingRoomsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        travel={travelById}
        finalPrice={finalPrice}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
