
import React, { useState, useEffect } from "react";
import { bookSeat, getCarById } from "../../redux/slices/car";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { useLoader } from "../../utils/loader";
import { useToast } from "../../utils/toast";
import { userEmail, userMobile, userName } from "../../utils/Unauthorized";

// --- Enhanced SVG Icons ---
const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
    <circle cx="7" cy="17" r="2"></circle>
    <circle cx="17" cy="17" r="2"></circle>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ArmchairIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"></path>
    <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"></path>
    <path d="M5 18v2"></path>
    <path d="M19 18v2"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12,5 19,12 12,19"></polyline>
  </svg>
);

// --- Helpers ---
const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short"
  }) : "N/A";

const formatTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).toUpperCase() : "N/A";

// --- Enhanced Seat Component ---
const Seat = ({ seat, onSelect, isSelected }) => {
  const getSeatClass = () => {
    if (seat.isBooked) {
      return "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed";
    }
    if (isSelected) {
      return "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg scale-105 transform";
    }
    return "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md hover:scale-102 transform transition-all duration-200";
  };

  const getSeatTypeColor = () => {
    switch (seat.seatType?.toLowerCase()) {
      case 'premium': return 'text-yellow-600 bg-yellow-50';
      case 'business': return 'text-purple-600 bg-purple-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <button
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${getSeatClass()}`}
      onClick={() => onSelect(seat)}
      disabled={seat.isBooked}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-xs font-bold">{seat.seatNumber}</span>
        {seat.seatType && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeatTypeColor()}`}>
            {seat.seatType}
          </span>
        )}
      </div>

      <div className="mb-2">
        <ArmchairIcon />
      </div>

      <span className="text-sm font-bold">₹{seat.seatPrice}</span>

      {seat.isBooked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium bg-gray-500 text-white px-2 py-1 rounded-full">
            Booked
          </span>
        </div>
      )}
    </button>
  );
};

// --- Enhanced Trip Info Card ---
const TripInfoCard = ({ selectedCab }) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
    <div className="relative">
      <img
        src={selectedCab.images?.[0]}
        alt={`${selectedCab.make} ${selectedCab.model}`}
        className="w-full h-48 sm:h-56 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      <div className="absolute bottom-4 left-4 text-white">
        <h2 className="text-xl sm:text-2xl font-bold">
          {selectedCab.make} {selectedCab.model}
        </h2>
      </div>
    </div>

    <div className="p-6">
      <div className="space-y-4">
        {/* Route */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
          <MapPinIcon />
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <span className="truncate">{selectedCab.pickupP}</span>
            <ArrowRightIcon />
            <span className="truncate">{selectedCab.dropP}</span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CalendarIcon />
            <div>
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Pickup</p>
              <p className="text-sm font-bold text-green-800">{formatDate(selectedCab.pickupD)}</p>
              <div className="flex items-center space-x-1 mt-1">
                <ClockIcon />
                <p className="text-xs text-green-700">{formatTime(selectedCab.pickupD)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
            <CalendarIcon />
            <div>
              <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Drop</p>
              <p className="text-sm font-bold text-orange-800">{formatDate(selectedCab.dropD)}</p>
              <div className="flex items-center space-x-1 mt-1">
                <ClockIcon />
                <p className="text-xs text-orange-700">{formatTime(selectedCab.dropD)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
const defaultPassenger = userName
const defaultPhone = userMobile
const defaultEmail = userEmail
// --- Main Component ---
export default function CabsBooking() {
  const [passengerDetails, setPassengerDetails] = useState({
    fullName: defaultPassenger,
    phone: defaultPhone,
    email: defaultEmail
  });
  const { id } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const dispatch = useDispatch();
  const [selectedCab, setSelectedCab] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  const { showLoader, hideLoader } = useLoader();
  const popup = useToast();

  useEffect(() => {
    if (id) {
      showLoader();
      dispatch(getCarById(id))
        .unwrap()
        .then((data) => setSelectedCab(data))
        .catch(() => popup.error("Failed to load car details"))
        .finally(() => hideLoader());
    }
  }, [id, dispatch]);

  const handleSeatSelect = (seat) =>
    setSelectedSeats((prev) =>
      prev.find((s) => s.seatNumber === seat.seatNumber)
        ? prev.filter((s) => s.seatNumber !== seat.seatNumber)
        : [...prev, seat]
    );

  const handleBooking = async () => {
    if (!passengerDetails.fullName || !passengerDetails.phone) {
      return popup.error("Please enter your full name and phone number");
    }
    if (selectedSeats.length === 0) {
      return popup.error("Please select at least one seat");
    }

    setIsBooking(true);
    try {
      const seatIds = selectedSeats.map((s) => s._id);
      const data = {
        seats: seatIds,
        carId: id,
        bookedBy: passengerDetails.fullName,
        sharingType: selectedCab.sharingType,
        vehicleType: selectedCab.vehicleType,
        customerMobile: passengerDetails.phone,
        customerEmail: passengerDetails.email
      };
      const response = await dispatch(bookSeat(data)).unwrap();
      const payload = response.payload;
      console.log("Booking response:", payload);
      if (payload && payload._id) {
        const bookingId = payload._id.slice(-8).toUpperCase();
        const totalAmount = selectedSeats.reduce((sum, seat) => sum + (seat.seatPrice || 0), 0) + Math.round(selectedSeats.reduce((sum, seat) => sum + (seat.seatPrice || 0), 0) * 0.05) + 25;
        
        popup.success(
          `🎉 Booking Confirmed!\n\nBooking ID: ${bookingId}\nSeats: ${selectedSeats.map(s => s.seatNumber).join(', ')}\nTotal Paid: ₹${totalAmount}`
        );

        setSelectedSeats([]);
        setPassengerDetails({ fullName: "", phone: "", email: "" });
        // Refetch cab details to show updated seat status
        dispatch(getCarById(id));
      }
    } catch (error) {
      popup.error(error?.message || "Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };


  if (!selectedCab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
         
        </div>
      </div>
    );
  }

  const baseFare = selectedSeats.reduce((sum, seat) => sum + (seat.seatPrice || 0), 0);
  const taxes = Math.round(baseFare * 0.05);
  const convenience = selectedSeats.length > 0 ? 25 : 0;
  const totalPrice = baseFare + taxes + convenience;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-2xl">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <LogoIcon />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Confirm Your Ride</h1>
                <p className="text-blue-100 text-sm">Complete your booking in just a few steps</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Trip Details */}
            <TripInfoCard selectedCab={selectedCab} />

            {/* Seat Selection */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <ArmchairIcon />
                  <span className="ml-2">Select Your Seats</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose from available seats. Selected: {selectedSeats.length}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {selectedCab.seatConfig?.map((seat) => (
                    <Seat
                      key={seat.seatNumber}
                      seat={seat}
                      onSelect={handleSeatSelect}
                      isSelected={selectedSeats.some((s) => s.seatNumber === seat.seatNumber)}
                    />
                  ))}
                </div>

                {/* Seat Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                    <span className="text-xs text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>
                    <span className="text-xs text-gray-600">Selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
                    <span className="text-xs text-gray-600">Booked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Passenger Details</h3>
                <p className="text-sm text-gray-600 mt-1">Enter your contact information</p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={passengerDetails.fullName}
                      onChange={(e) => setPassengerDetails({
                        ...passengerDetails,
                        fullName: e.target.value
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={passengerDetails.phone}
                      onChange={(e) => setPassengerDetails({
                        ...passengerDetails,
                        phone: e.target.value
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={passengerDetails.email}
                      onChange={(e) => setPassengerDetails({
                        ...passengerDetails,
                        email: e.target.value
                      })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                  <h3 className="text-lg font-bold">Payment Summary</h3>
                  <p className="text-blue-100 text-sm">Review your booking details</p>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {/* Selected Seats */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Selected Seats</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedSeats.length > 0
                            ? selectedSeats.map((s) => s.seatNumber).join(", ")
                            : "No seats selected"
                          }
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Pricing Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Fare</span>
                        <span className="text-sm font-medium text-gray-900">₹{baseFare}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Taxes & Fees (5%)</span>
                        <span className="text-sm font-medium text-gray-900">₹{taxes}</span>
                      </div>

                      {convenience > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Convenience Fee</span>
                          <span className="text-sm font-medium text-gray-900">₹{convenience}</span>
                        </div>
                      )}
                    </div>

                    <hr className="border-gray-300" />

                    {/* Total */}
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl">
                      <span className="text-lg font-bold text-blue-900">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-900">₹{totalPrice}</span>
                    </div>

                    {/* Booking Button */}
                    <button
                      onClick={handleBooking}
                      disabled={isBooking || !selectedSeats.length || !passengerDetails.fullName || !passengerDetails.phone}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${isBooking || !selectedSeats.length || !passengerDetails.fullName || !passengerDetails.phone
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                        }`}
                    >
                      {isBooking ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        `Confirm & Pay ₹${totalPrice}`
                      )}
                    </button>

                    {/* Security Note */}
                    <div className="text-center mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        🔒 Your payment information is secured with 256-bit SSL encryption
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
