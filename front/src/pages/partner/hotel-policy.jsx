import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import baseURL from "../../utils/baseURL";

// Function to generate time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const hour = i;
      const minute = j;
      const period = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      const formattedMinute = minute.toString().padStart(2, "0");
      slots.push(`${formattedHour}:${formattedMinute} ${period}`);
    }
  }
  return slots;
};

export default function PolicyForm() {
  const navigate = useNavigate();
  const timeSlots = generateTimeSlots();

  // State Initializations
  const [hotelsPolicy, setHotelsPolicy] = useState("");
  const [showCustomHotelPolicy, setShowCustomHotelPolicy] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [showCustomCancellationPolicy, setShowCustomCancellationPolicy] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState("");
  const [showCustomRefundPolicy, setShowCustomRefundPolicy] = useState(false);
  const [outsideFoodPolicy, setOutsideFoodPolicy] = useState("Not Accepted");
  const [paymentMode, setPaymentMode] = useState("Online");
  const [petsAllowed, setPetsAllowed] = useState("Not Allowed");
  const [bachelorAllowed, setBachelorAllowed] = useState("Not Allowed");
  const [smokingAllowed, setSmokingAllowed] = useState("Not Allowed");
  const [alcoholAllowed, setAlcoholAllowed] = useState("Not Allowed");
  const [unmarriedCouplesAllowed, setUnmarriedCouplesAllowed] = useState("Not Allowed");
  const [internationalGuestAllowed, setInternationalGuestAllowed] = useState("Not Allowed");
  const [checkInPolicy, setCheckInPolicy] = useState("14:00");
  const [checkOutPolicy, setCheckOutPolicy] = useState("11:00");

  // Tariff states
  const [onDoubleSharing, setOnDoubleSharing] = useState("");
  const [onQuadSharing, setOnQuadSharing] = useState("");
  const [onBulkBooking, setOnBulkBooking] = useState("");
  const [onTrippleSharing, setOnTrippleSharing] = useState("");
  const [onMoreThanFour, setOnMoreThanFour] = useState("");
  const [offDoubleSharing, setOffDoubleSharing] = useState("");
  const [offQuadSharing, setOffQuadSharing] = useState("");
  const [offBulkBooking, setOffBulkBooking] = useState("");
  const [offTrippleSharing, setOffTrippleSharing] = useState("");
  const [offMoreThanFour, setOffMoreThanFour] = useState("");
  const [onDoubleSharingAp, setOnDoubleSharingAp] = useState("");
  const [onQuadSharingAp, setOnQuadSharingAp] = useState("");
  const [onBulkBookingAp, setOnBulkBookingAp] = useState("");
  const [onTrippleSharingAp, setOnTrippleSharingAp] = useState("");
  const [onMoreThanFourAp, setOnMoreThanFourAp] = useState("");
  const [onDoubleSharingMAp, setOnDoubleSharingMAp] = useState("");
  const [onQuadSharingMAp, setOnQuadSharingMAp] = useState("");
  const [onBulkBookingMAp, setOnBulkBookingMAp] = useState("");
  const [onTrippleSharingMAp, setOnTrippleSharingMAp] = useState("");
  const [onMoreThanFourMAp, setOnMoreThanFourMAp] = useState("");
  const [offDoubleSharingAp, setOffDoubleSharingAp] = useState("");
  const [offQuadSharingAp, setOffQuadSharingAp] = useState("");
  const [offBulkBookingAp, setOffBulkBookingAp] = useState("");
  const [offTrippleSharingAp, setOffTrippleSharingAp] = useState("");
  const [offMoreThanFourAp, setOffMoreThanFourAp] = useState("");
  const [offDoubleSharingMAp, setOffDoubleSharingMAp] = useState("");
  const [offQuadSharingMAp, setOffQuadSharingMAp] = useState("");
  const [offBulkBookingMAp, setOffBulkBookingMAp] = useState("");
  const [offTrippleSharingMAp, setOffTrippleSharingMAp] = useState("");
  const [offMoreThanFourMAp, setOffMoreThanFourMAp] = useState("");

  const hotelId = localStorage.getItem("hotelId");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isConfirmed = window.confirm(
      "Before submitting, have you checked all details? Do you want to submit?"
    );

    if (!isConfirmed) return;

    try {
      const payload = {
        hotelId: hotelId,
        hotelsPolicy,
        outsideFoodPolicy,
        cancellationPolicy,
        refundPolicy,
        paymentMode,
        petsAllowed,
        checkInPolicy,
        checkOutPolicy,
        bachelorAllowed,
        smokingAllowed,
        alcoholAllowed,
        unmarriedCouplesAllowed,
        internationalGuestAllowed,
        onDoubleSharing,
        onQuadSharing,
        onBulkBooking,
        onTrippleSharing,
        onMoreThanFour,
        offDoubleSharing,
        offQuadSharing,
        offBulkBooking,
        offTrippleSharing,
        offMoreThanFour,
        onDoubleSharingAp,
        onQuadSharingAp,
        onBulkBookingAp,
        onTrippleSharingAp,
        onMoreThanFourAp,
        onDoubleSharingMAp,
        onQuadSharingMAp,
        onBulkBookingMAp,
        onTrippleSharingMAp,
        onMoreThanFourMAp,
        offDoubleSharingAp,
        offQuadSharingAp,
        offBulkBookingAp,
        offTrippleSharingAp,
        offMoreThanFourAp,
        offDoubleSharingMAp,
        offQuadSharingMAp,
        offBulkBookingMAp,
        offTrippleSharingMAp,
        offMoreThanFourMAp,
      };
      
      const response = await axios.post(
        `${baseURL}/add-a-new/policy-to-your/hotel`,
        payload
      );
      
      if (response.status === 201) {
        alert("Your response has been recorded, Moving for amenities section");
        navigate("/partner/third-step");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting the form. Please try again.");
    }
  };

  const handlePolicyChange = (e, setPolicy, setShowCustom) => {
    const value = e.target.value;
    if (value === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setPolicy(value);
    }
  };

  // Custom SVG Icons
  const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const PolicyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const CurrencyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-4 px-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Hotel Policies & Pricing 📋
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto">
              Please fill out your hotel policy details carefully. This information helps customers understand your terms and pricing structure.
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full w-2/5"></div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">Step 2 of 5</p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              <PolicyIcon />
              <span className="ml-3">Policy Configuration</span>
            </h2>
            <p className="text-indigo-100 text-sm mt-1">Configure your hotel policies and pricing structure</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
            {/* Main Policies Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100 flex items-center">
                <PolicyIcon />
                <span className="ml-2">📜 Main Policies</span>
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hotel Policy */}
                <div className="space-y-3">
                  <label htmlFor="hotelsPolicySelect" className="block text-sm font-medium text-gray-700">
                    Hotel Policy *
                  </label>
                  <select
                    id="hotelsPolicySelect"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={showCustomHotelPolicy ? "custom" : hotelsPolicy}
                    onChange={(e) => handlePolicyChange(e, setHotelsPolicy, setShowCustomHotelPolicy)}
                  >
                    <option value="">-- Select a Policy --</option>
                    <option value="No outside food allowed.">🚫 No outside food allowed</option>
                    <option value="Pets are not permitted.">🐕 Pets are not permitted</option>
                    <option value="custom">✏️ Write your own</option>
                  </select>
                  {showCustomHotelPolicy && (
                    <textarea
                      id="hotelsPolicy"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                      value={hotelsPolicy}
                      onChange={(e) => setHotelsPolicy(e.target.value)}
                      placeholder="Write your custom hotel policy..."
                    />
                  )}
                </div>

                {/* Cancellation Policy */}
                <div className="space-y-3">
                  <label htmlFor="cancellationPolicySelect" className="block text-sm font-medium text-gray-700">
                    Cancellation Policy *
                  </label>
                  <select
                    id="cancellationPolicySelect"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={showCustomCancellationPolicy ? "custom" : cancellationPolicy}
                    onChange={(e) => handlePolicyChange(e, setCancellationPolicy, setShowCustomCancellationPolicy)}
                  >
                    <option value="">-- Select a Policy --</option>
                    <option value="Free Cancellation">✅ Free Cancellation</option>
                    <option value="50% Refund on Cancellation">💰 50% Refund on Cancellation</option>
                    <option value="custom">✏️ Write your own</option>
                  </select>
                  {showCustomCancellationPolicy && (
                    <textarea
                      id="cancellationPolicy"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                      value={cancellationPolicy}
                      onChange={(e) => setCancellationPolicy(e.target.value)}
                      placeholder="Write your custom cancellation policy..."
                    />
                  )}
                </div>

                {/* Refund Policy */}
                <div className="space-y-3">
                  <label htmlFor="refundPolicySelect" className="block text-sm font-medium text-gray-700">
                    Refund Policy
                  </label>
                  <select
                    id="refundPolicySelect"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={showCustomRefundPolicy ? "custom" : refundPolicy}
                    onChange={(e) => handlePolicyChange(e, setRefundPolicy, setShowCustomRefundPolicy)}
                  >
                    <option value="">-- Select a Policy --</option>
                    <option value="100% Refund">💯 100% Refund</option>
                    <option value="50% Refund">💰 50% Refund</option>
                    <option value="custom">✏️ Write your own</option>
                  </select>
                  {showCustomRefundPolicy && (
                    <textarea
                      id="refundPolicy"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                      value={refundPolicy}
                      onChange={(e) => setRefundPolicy(e.target.value)}
                      placeholder="Write your custom refund policy..."
                    />
                  )}
                </div>
              </div>
            </div>

            {/* General Policies Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-green-100">
                ⚙️ General Policies & Rules
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label htmlFor="outsideFoodPolicy" className="block text-sm font-medium text-gray-700">
                    Outside Food *
                  </label>
                  <select
                    id="outsideFoodPolicy"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={outsideFoodPolicy}
                    onChange={(e) => setOutsideFoodPolicy(e.target.value)}
                  >
                    <option value="Not Accepted">❌ Not Accepted</option>
                    <option value="Accepted">✅ Accepted</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700">
                    Payment Mode *
                  </label>
                  <select
                    id="paymentMode"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="Online">💳 Online</option>
                    <option value="Offline">💰 Offline</option>
                    <option value="Both">🔄 Both</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="petsAllowed" className="block text-sm font-medium text-gray-700">
                    Pets Allowed
                  </label>
                  <select
                    id="petsAllowed"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={petsAllowed}
                    onChange={(e) => setPetsAllowed(e.target.value)}
                  >
                    <option value="Allowed">🐕 Allowed</option>
                    <option value="Not Allowed">❌ Not Allowed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bachelorAllowed" className="block text-sm font-medium text-gray-700">
                    Bachelors Allowed
                  </label>
                  <select
                    id="bachelorAllowed"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={bachelorAllowed}
                    onChange={(e) => setBachelorAllowed(e.target.value)}
                  >
                    <option value="Allowed">✅ Allowed</option>
                    <option value="Not Allowed">❌ Not Allowed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="smokingAllowed" className="block text-sm font-medium text-gray-700">
                    Smoking Allowed
                  </label>
                  <select
                    id="smokingAllowed"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={smokingAllowed}
                    onChange={(e) => setSmokingAllowed(e.target.value)}
                  >
                    <option value="Allowed">🚬 Allowed</option>
                    <option value="Not Allowed">🚭 Not Allowed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="alcoholAllowed" className="block text-sm font-medium text-gray-700">
                    Alcohol Allowed
                  </label>
                  <select
                    id="alcoholAllowed"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={alcoholAllowed}
                    onChange={(e) => setAlcoholAllowed(e.target.value)}
                  >
                    <option value="Allowed">🍺 Allowed</option>
                    <option value="Not Allowed">❌ Not Allowed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="unmarriedCouplesAllowed" className="block text-sm font-medium text-gray-700">
                    Unmarried Couples
                  </label>
                  <select
                    id="unmarriedCouplesAllowed"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={unmarriedCouplesAllowed}
                    onChange={(e) => setUnmarriedCouplesAllowed(e.target.value)}
                  >
                    <option value="Allowed">💑 Allowed</option>
                    <option value="Not Allowed">❌ Not Allowed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="internationalGuestAllowed" className="block text-sm font-medium text-gray-700">
                    International Guests
                  </label>
                  <select
                    id="internationalGuestAllowed"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={internationalGuestAllowed}
                    onChange={(e) => setInternationalGuestAllowed(e.target.value)}
                  >
                    <option value="Allowed">🌍 Allowed</option>
                    <option value="Not Allowed">❌ Not Allowed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Check-in/Check-out Timing Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-yellow-100 flex items-center">
                <ClockIcon />
                <span className="ml-2">🕐 Check-in & Check-out Times</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-2">
                  <label htmlFor="checkInPolicy" className="block text-sm font-medium text-gray-700">
                    Check-in Time *
                  </label>
                  <input
                    type="time"
                    id="checkInPolicy"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={checkInPolicy}
                    onChange={(e) => setCheckInPolicy(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="checkOutPolicy" className="block text-sm font-medium text-gray-700">
                    Check-out Time *
                  </label>
                  <input
                    type="time"
                    id="checkOutPolicy"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={checkOutPolicy}
                    onChange={(e) => setCheckOutPolicy(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tariff Sections */}
            {/* On Season Tariff */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-orange-100 flex items-center">
                <CurrencyIcon />
                <span className="ml-2">🌞 On Season Tariff & Policy</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Double Sharing</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onDoubleSharing}
                    onChange={(e) => setOnDoubleSharing(e.target.value)}
                    placeholder="Enter pricing and policy details..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Triple Sharing</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onTrippleSharing}
                    onChange={(e) => setOnTrippleSharing(e.target.value)}
                    placeholder="Enter pricing and policy details..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Quad Sharing</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onQuadSharing}
                    onChange={(e) => setOnQuadSharing(e.target.value)}
                    placeholder="Enter pricing and policy details..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Bulk Booking</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onBulkBooking}
                    onChange={(e) => setOnBulkBooking(e.target.value)}
                    placeholder="Enter pricing and policy details..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On More than Four Sharing</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onMoreThanFour}
                    onChange={(e) => setOnMoreThanFour(e.target.value)}
                    placeholder="Enter pricing and policy details..."
                  />
                </div>
              </div>
            </div>

            {/* On Season AP Tariff */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-red-100">
                🍽️ On Season A.P Plan Tariff & Policy
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Double Sharing AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onDoubleSharingAp}
                    onChange={(e) => setOnDoubleSharingAp(e.target.value)}
                    placeholder="Enter AP plan pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Triple Sharing AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onTrippleSharingAp}
                    onChange={(e) => setOnTrippleSharingAp(e.target.value)}
                    placeholder="Enter AP plan pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Quad Sharing AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onQuadSharingAp}
                    onChange={(e) => setOnQuadSharingAp(e.target.value)}
                    placeholder="Enter AP plan pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Bulk Booking AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onBulkBookingAp}
                    onChange={(e) => setOnBulkBookingAp(e.target.value)}
                    placeholder="Enter AP plan pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On More than Four Sharing AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onMoreThanFourAp}
                    onChange={(e) => setOnMoreThanFourAp(e.target.value)}
                    placeholder="Enter AP plan pricing..."
                  />
                </div>
              </div>
            </div>

            {/* On Season MAP Tariff */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-pink-100">
                🍴 On Season M.A.P Plan Tariff & Policy
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Double Sharing MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onDoubleSharingMAp}
                    onChange={(e) => setOnDoubleSharingMAp(e.target.value)}
                    placeholder="Enter MAP plan pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Triple Sharing MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onTrippleSharingMAp}
                    onChange={(e) => setOnTrippleSharingMAp(e.target.value)}
                    placeholder="Enter MAP plan pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Quad Sharing MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onQuadSharingMAp}
                    onChange={(e) => setOnQuadSharingMAp(e.target.value)}
                    placeholder="Enter MAP plan pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On Bulk Booking MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onBulkBookingMAp}
                    onChange={(e) => setOnBulkBookingMAp(e.target.value)}
                    placeholder="Enter MAP plan pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">On More than Four Sharing MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={onMoreThanFourMAp}
                    onChange={(e) => setOnMoreThanFourMAp(e.target.value)}
                    placeholder="Enter MAP plan pricing..."
                  />
                </div>
              </div>
            </div>

            {/* Off Season Tariff */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200 flex items-center">
                <CurrencyIcon />
                <span className="ml-2">❄️ Off Season Tariff & Policy</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Double Sharing</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offDoubleSharing}
                    onChange={(e) => setOffDoubleSharing(e.target.value)}
                    placeholder="Enter off-season pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Triple Sharing</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offTrippleSharing}
                    onChange={(e) => setOffTrippleSharing(e.target.value)}
                    placeholder="Enter off-season pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Quad Sharing</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offQuadSharing}
                    onChange={(e) => setOffQuadSharing(e.target.value)}
                    placeholder="Enter off-season pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Bulk Booking</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offBulkBooking}
                    onChange={(e) => setOffBulkBooking(e.target.value)}
                    placeholder="Enter off-season pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off More than Four Sharing</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offMoreThanFour}
                    onChange={(e) => setOffMoreThanFour(e.target.value)}
                    placeholder="Enter off-season pricing..."
                  />
                </div>
              </div>
            </div>

            {/* Off Season AP Tariff */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-indigo-100">
                🥘 Off Season AP Tariff & Policy
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Double Sharing AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offDoubleSharingAp}
                    onChange={(e) => setOffDoubleSharingAp(e.target.value)}
                    placeholder="Enter off-season AP pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Triple Sharing AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offTrippleSharingAp}
                    onChange={(e) => setOffTrippleSharingAp(e.target.value)}
                    placeholder="Enter off-season AP pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Quad Sharing AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offQuadSharingAp}
                    onChange={(e) => setOffQuadSharingAp(e.target.value)}
                    placeholder="Enter off-season AP pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Bulk Booking AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offBulkBookingAp}
                    onChange={(e) => setOffBulkBookingAp(e.target.value)}
                    placeholder="Enter off-season AP pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off More than Four Sharing AP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offMoreThanFourAp}
                    onChange={(e) => setOffMoreThanFourAp(e.target.value)}
                    placeholder="Enter off-season AP pricing..."
                  />
                </div>
              </div>
            </div>

            {/* Off Season MAP Tariff */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-purple-100">
                🍱 Off Season MAP Tariff & Policy
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Double Sharing MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offDoubleSharingMAp}
                    onChange={(e) => setOffDoubleSharingMAp(e.target.value)}
                    placeholder="Enter off-season MAP pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Triple Sharing MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offTrippleSharingMAp}
                    onChange={(e) => setOffTrippleSharingMAp(e.target.value)}
                    placeholder="Enter off-season MAP pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Quad Sharing MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offQuadSharingMAp}
                    onChange={(e) => setOffQuadSharingMAp(e.target.value)}
                    placeholder="Enter off-season MAP pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off Bulk Booking MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offBulkBookingMAp}
                    onChange={(e) => setOffBulkBookingMAp(e.target.value)}
                    placeholder="Enter off-season MAP pricing..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Off More than Four Sharing MAP</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    value={offMoreThanFourMAp}
                    onChange={(e) => setOffMoreThanFourMAp(e.target.value)}
                    placeholder="Enter off-season MAP pricing..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
            
                <button
                  type="submit"
                  className="w-full sm:w-auto px-12 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                >
                  Continue to Amenities →
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
