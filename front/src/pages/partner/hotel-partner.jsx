
import { useMemo, useState } from "react";
import axios from "axios";
import { City, State } from "country-state-city";
import baseURL from "../../utils/baseURL";
import alert from "../../utils/custom_alert/custom_alert";
import { fetchLocation } from "../../utils/fetchLocation";
import { useLoader } from "../../utils/loader";
import { Unauthorized, userId } from "../../utils/Unauthorized";
import Disclaimer from "./disclaimer";

export default function HotelPartnerForm() {
  const [hotelName, setHotelName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [images, setImages] = useState([]);
  const { showLoader, hideLoader } = useLoader();
  const [hotelOwnerName, setHotelOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [hotelCategory, setHotelCategory] = useState("");
  const [customerWelcomeNote, setCustomerWelcomeNote] = useState("");
  const [startDate, setStartDate] = useState("");
  const [contactError, setContactError] = useState("");
  const [generalManagerContactError, setGeneralManagerContactError] = useState("");
  const [salesManagerContactError, setSalesManagerContactError] = useState("");
  const [salesManagerContact, setSalesManagerContact] = useState("");
  const [endDate, setEndDate] = useState("");
  const [landmark, setLandMark] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [starRating, setStarRating] = useState("2");
  const [propertyType, setPropertyType] = useState("");
  const [contact, setContact] = useState("");
  const [localId, setLocalId] = useState("");
  const [generalManagerContact, setGeneralManagerContact] = useState("");
  const [hotelEmail, setHotelEmail] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [selectedStateIsoCode, setSelectedStateIsoCode] = useState("");

  const indianStates = useMemo(() => State.getStatesOfCountry('IN'), []);
  const availableCities = useMemo(() =>
    selectedStateIsoCode ? City.getCitiesOfState('IN', selectedStateIsoCode) : [],
    [selectedStateIsoCode]
  );

  const handleStateChange = (e) => {
    const isoCode = e.target.value;
    setSelectedStateIsoCode(isoCode);
    const selectedStateObject = indianStates.find(s => s.isoCode === isoCode);
    setState(selectedStateObject ? selectedStateObject.name : "");
    setCity("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isConfirmed = window.confirm(
      "Before submitting, have you checked all details? Do you want to submit?"
    );

    if (!isConfirmed) {
      return;
    }

    showLoader();
    try {
      const formData = new FormData();
      formData.append("hotelName", hotelName);
      formData.append("hotelOwnerName", hotelOwnerName);
      formData.append("description", description);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("latitude", latitude);
      formData.append("hotelCategory", hotelCategory);
      formData.append("longitude", longitude);
      formData.append("state", state);
      formData.append("customerWelcomeNote", customerWelcomeNote);
      formData.append("city", city);
      formData.append("landmark", landmark);
      formData.append("pinCode", pinCode);
      formData.append("starRating", starRating);
      formData.append("contact", contact);
      formData.append("propertyType", propertyType);
      formData.append("generalManagerContact", generalManagerContact);
      formData.append("salesManagerContact", salesManagerContact);
      formData.append("hotelEmail", hotelEmail);
      formData.append("localId", localId);

      for (const image of images) {
        formData.append("images", image);
      }

      const response = await axios.post(
        `${baseURL}/data/hotels-new/post/upload/data`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        const alertMessage = `${response.data.message}. Now you will be redirected to our next step.`;
        alert(alertMessage);
        localStorage.setItem("hotelId", response.data.data.hotelId);
        window.location.href = "/partner/second-step";
      } else if (response.status === 500) {
        alert("Not able to submit your request right now. Please try again later.");
      }
    } catch (error) {
      alert("An error occurred. Please try again later.");
    } finally {
      hideLoader();
    }
  };

  const handleImageChange = (file) => {
    setImages((prevImages) => [...prevImages, file]);
  };

  const propertyTypeOptions = [
    "Apartment",
    "Guest House",
    "Holiday Home",
    "Homestay",
    "Hostel",
    "Hotel",
    "Hotel Apartment",
    "Resort",
    "Villa",
  ];

  const [imageInputs, setImageInputs] = useState([
    { id: "frontdeskImage", label: "Front Desk Image" },
    { id: "laneImage", label: "Lane Image" },
    { id: "receptionImage", label: "Reception Image" },
    { id: "laundryImage", label: "Laundry Image" },
    { id: "backyardImage", label: "Backyard Image" },
  ]);

  const addImageInput = () => {
    setImageInputs([
      ...imageInputs,
      {
        id: `image${imageInputs.length + 1}`,
        label: `Image ${imageInputs.length + 1}`,
      },
    ]);
  };

  const removeImageInput = (id) => {
    setImageInputs((prevInputs) =>
      prevInputs.filter((input) => input.id !== id)
    );
  };

  // Custom SVG Icons
  const CloseIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const LocationIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Unauthorized />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 px-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Welcome to Our Team! 🏨
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Please fill out this form carefully and make sure to complete every mandatory field. 
              This information will help us set up your hotel partnership.
            </p>
          </div>
          <Disclaimer />
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Hotel Registration Form</h2>
            <p className="text-blue-100 text-sm mt-1">All fields marked with * are required</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
            {/* Basic Information Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-blue-100">
                📋 Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700">
                    Hotel Name *
                  </label>
                  <input
                    type="text"
                    required
                    id="hotelName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    placeholder="Enter your hotel name"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="hotelOwnerName" className="block text-sm font-medium text-gray-700">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    id="hotelOwnerName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    placeholder="Enter owner's full name"
                    value={hotelOwnerName}
                    onChange={(e) => setHotelOwnerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="hotelEmail" className="block text-sm font-medium text-gray-700">
                    Hotel Email *
                  </label>
                  <input
                    type="email"
                    required
                    id="hotelEmail"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    placeholder="hotel@example.com"
                    value={hotelEmail}
                    onChange={(e) => setHotelEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-green-100">
                📞 Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                    Primary Contact *
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    required
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition-colors duration-200 text-sm ${
                      contactError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter 10-digit mobile number"
                    value={contact}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/\\D/g, '').slice(0, 10);
                      setContact(inputValue);
                      const regex = /^[0-9]{10}$/;
                      setContactError(
                        inputValue.length > 0 && !regex.test(inputValue)
                          ? "Please enter a valid 10-digit contact number"
                          : ""
                      );
                    }}
                  />
                  {contactError && <p className="text-red-500 text-xs mt-1">{contactError}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="generalManagerContact" className="block text-sm font-medium text-gray-700">
                    General Manager Contact *
                  </label>
                  <input
                    type="tel"
                    id="generalManagerContact"
                    required
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition-colors duration-200 text-sm ${
                      generalManagerContactError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter GM contact number"
                    value={generalManagerContact}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/\\D/g, '').slice(0, 10);
                      setGeneralManagerContact(inputValue);
                      const regex = /^[0-9]{10}$/;
                      setGeneralManagerContactError(
                        inputValue.length > 0 && !regex.test(inputValue)
                          ? "Please enter a valid 10-digit contact number"
                          : ""
                      );
                    }}
                  />
                  {generalManagerContactError && <p className="text-red-500 text-xs mt-1">{generalManagerContactError}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="salesManagerContact" className="block text-sm font-medium text-gray-700">
                    Sales Manager Contact *
                  </label>
                  <input
                    type="tel"
                    required
                    id="salesManagerContact"
                    className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition-colors duration-200 text-sm ${
                      salesManagerContactError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter sales manager contact"
                    value={salesManagerContact}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/\\D/g, '').slice(0, 10);
                      setSalesManagerContact(inputValue);
                      const regex = /^[0-9]{10}$/;
                      setSalesManagerContactError(
                        inputValue.length > 0 && !regex.test(inputValue)
                          ? "Please enter a valid 10-digit contact number"
                          : ""
                      );
                    }}
                  />
                  {salesManagerContactError && <p className="text-red-500 text-xs mt-1">{salesManagerContactError}</p>}
                </div>
              </div>
            </div>

            {/* Hotel Details Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-purple-100">
                🏨 Hotel Details
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Tell us about your hotel *
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    placeholder="Describe your hotel, its amenities, and what makes it special..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="customerWelcomeNote" className="block text-sm font-medium text-gray-700">
                    Customer Welcome Note
                  </label>
                  <textarea
                    id="customerWelcomeNote"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm resize-none"
                    placeholder="Write a welcoming message for your guests..."
                    value={customerWelcomeNote}
                    onChange={(e) => setCustomerWelcomeNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="starRating" className="block text-sm font-medium text-gray-700">
                    Star Rating *
                  </label>
                  <select
                    id="starRating"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={starRating}
                    onChange={(e) => setStarRating(e.target.value)}
                  >
                    <option value="">Select Rating</option>
                    <option value="1">⭐ 1 Star</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
                    Property Type *
                  </label>
                  <select
                    id="propertyType"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                  >
                    <option value="">Select Type</option>
                    {propertyTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="localId" className="block text-sm font-medium text-gray-700">
                    Accept Local ID *
                  </label>
                  <select
                    id="localId"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={localId}
                    onChange={(e) => setLocalId(e.target.value)}
                  >
                    <option value="">Please Select</option>
                    <option value="Accepted">✅ Accepted</option>
                    <option value="Not Accepted">❌ Not Accepted</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Information Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-yellow-100">
                📍 Location Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State *
                  </label>
                  <select
                    id="state"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    value={selectedStateIsoCode}
                    onChange={handleStateChange}
                  >
                    <option value="" disabled>Select a State</option>
                    {indianStates.map((state) => (
                      <option key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <select
                    id="city"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!selectedStateIsoCode}
                  >
                    <option value="" disabled>
                      {selectedStateIsoCode ? 'Select a City' : 'Select a state first'}
                    </option>
                    {availableCities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    id="pinCode"
                    required
                    maxLength="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    placeholder="Enter 6-digit PIN code"
                    value={pinCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\\D/g, '').slice(0, 6);
                      setPinCode(value);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">
                    Landmark *
                  </label>
                  <input
                    type="text"
                    id="landmark"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    placeholder="Nearby landmark or famous location"
                    value={landmark}
                    onChange={(e) => setLandMark(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                    Latitude *
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    placeholder="e.g., 28.6139"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                    Longitude *
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                    placeholder="e.g., 77.2090"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => fetchLocation(setLatitude, setLongitude)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                >
                  <LocationIcon />
                  <span className="ml-2">Fetch Location Automatically</span>
                </button>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-pink-100">
                📸 Hotel Images
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload high-quality images of your hotel. You can add multiple images to showcase different areas.
              </p>
              
              <div className="space-y-4">
                {imageInputs.map((input, index) => (
                  <div
                    key={input.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="sm:w-48 flex-shrink-0">
                      <span className="block text-sm font-medium text-gray-700">
                        {input.label} *
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                        onChange={(e) => handleImageChange(e.target.files[0], input.id)}
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeImageInput(input.id)}
                      className="inline-flex items-center justify-center w-10 h-10 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 flex-shrink-0"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={addImageInput}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium rounded-lg shadow-lg hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add More Images
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
                
                <button
                  type="submit"
                  className="w-full sm:w-auto px-12 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
                >
                  Next Step →
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
