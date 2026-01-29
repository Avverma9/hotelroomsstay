import React, { useState, useEffect } from "react";
import { MdClose, MdAdd, MdDelete } from "react-icons/md";
import { Country, State, City } from "country-state-city";
import { useDispatch, useSelector } from "react-redux";
import { createTravel } from "../../redux/slices/travelSlice";
import { useLoader } from "../../utils/loader";
import { FaCheck } from "react-icons/fa";
import iconsList from "../../utils/icons";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import Disclaimer from "../partner/disclaimer";

const TravelForm = () => {
  const [formData, setFormData] = useState({
    city: "",
    country: "",
    state: "",
    travelAgencyName: "",
    agencyId: "",
    agencyEmail: "",
    agencyPhone: "",
    themes: "",
    visitngPlaces: "",
    overview: "",
    price: "",
    nights: "",
    days: "",
    from: "",
    tourStartDate: "",
    isCustomizable: false,
    to: "",
    amenities: [],
    inclusion: [""],
    exclusion: [""],
    termsAndConditions: { cancellation: "", refund: "", bookingPolicy: "" },
    dayWise: [{ day: "", description: "" }],
    starRating: "",
    images: [],
    vehicles: [
      {
        name: "",
        vehicleNumber: "",
        totalSeats: "",
        seaterType: "2*2",
        pricePerSeat: 0,
        isActive: true,
      },
    ],
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;

    if (["cancellation", "refund", "bookingPolicy"].includes(name)) {
      setFormData({
        ...formData,
        termsAndConditions: {
          ...formData.termsAndConditions,
          [name]: value,
        },
      });
    } else if (name === "inclusion") {
      const newInclusion = [...formData.inclusion];
      if (index !== null) {
        newInclusion[index] = value;
      } else {
        newInclusion.push(value);
      }
      setFormData({ ...formData, inclusion: newInclusion });
    } else if (name === "exclusion") {
      const newExclusion = [...formData.exclusion];
      if (index !== null) {
        newExclusion[index] = value;
      } else {
        newExclusion.push(value);
      }
      setFormData({ ...formData, exclusion: newExclusion });
    } else {
      setFormData({
        ...formData,
        [name]: ["duration", "nights", "days", "starRating"].includes(name)
          ? Number(value)
          : value,
      });
    }
  };

  const handleAmenitiesChange = (selectedOptions) => {
    const capitalizeFirstLetter = (str) => {
      if (!str) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    };
    setFormData({
      ...formData,
      amenities: selectedOptions
        ? selectedOptions.map((option) => capitalizeFirstLetter(option.value))
        : [],
    });
  };

  const handleDayWiseChange = (index, e) => {
    const updatedDayWise = [...formData.dayWise];
    updatedDayWise[index][e.target.name] = e.target.value;
    setFormData({ ...formData, dayWise: updatedDayWise });
  };

  const handleAddDay = () => {
    setFormData({
      ...formData,
      dayWise: [...formData.dayWise, { day: "", description: "" }],
    });
  };

  const handleRemoveDay = (index) => {
    const updatedDayWise = formData.dayWise.filter((_, i) => i !== index);
    setFormData({ ...formData, dayWise: updatedDayWise });
  };

  const handleCustomizableChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      isCustomizable: value,
      ...(value ? { tourStartDate: "" } : { from: "", to: "" }),
    }));
  };

  const handleAddImage = () => {
    setFormData({ ...formData, images: [...formData.images, null] });
  };

  const handleRemoveImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
  };

  const handleImageChange = (index, e) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = e.target.files;
    setFormData({ ...formData, images: updatedImages });
  };

  const handleVehicleChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index][name] = type === "checkbox" ? checked : value;
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  const handleAddVehicle = () => {
    setFormData({
      ...formData,
      vehicles: [
        ...formData.vehicles,
        {
          name: "",
          vehicleNumber: "",
          totalSeats: "",
          seaterType: "2*2",
          pricePerSeat: 0,
          isActive: true,
        },
      ],
    });
  };

  const handleRemoveVehicle = (index) => {
    const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
    setFormData({ ...formData, vehicles: updatedVehicles });
  };

  // Seat modal for partner to view seats for a vehicle (when tour exists)
  const seatMapByKey = useSelector((state) => state.travel.seatMapByKey || {});
  const travelLoading = useSelector((state) => state.travel.loading);
  const [showVehicleSeats, setShowVehicleSeats] = useState(null); // { vehicleId }
  const [vehicleSeats, setVehicleSeats] = useState([]);

  const openVehicleSeats = (vehicle) => {
    const tourId = formData?._id || formData?.id || formData?.travelId;
    const vehicleId = vehicle?._id || vehicle?.vehicleId || '';
    if (!tourId || !vehicleId) {
      setVehicleSeats([]);
      setShowVehicleSeats({ vehicleId: null });
      return;
    }
    const key = `${tourId}:${vehicleId}`;
    if (seatMapByKey[key]) {
      setVehicleSeats(seatMapByKey[key]);
      setShowVehicleSeats({ vehicleId });
      return;
    }
    setShowVehicleSeats({ vehicleId });
    dispatch(fetchSeatMap({ tourId, vehicleId }));
  };

  useEffect(() => {
    if (!showVehicleSeats) return;
    const tourId = formData?._id || formData?.id || formData?.travelId;
    const vehicleId = showVehicleSeats.vehicleId;
    const key = `${tourId}:${vehicleId}`;
    if (seatMapByKey[key]) setVehicleSeats(seatMapByKey[key]);
  }, [seatMapByKey, showVehicleSeats, formData]);

  const VehicleSeatModal = ({ open, onClose, seats = [], loading = false }) => {
    if (!open) return null;
    const booked = (seats || []).filter(s => s.isBooked || s.booked || s.status === 'booked').length;
    const available = (seats || []).length - booked;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">Seat Map</h3>
            <div className="text-sm text-gray-600">Booked: <span className="font-bold">{booked}</span> • Available: <span className="font-bold">{available}</span></div>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading seats...</div>
          ) : !seats || seats.length === 0 ? (
            <div className="text-center py-8">No seat information available.</div>
          ) : (
            <div className="grid grid-cols-8 gap-2">
              {seats.map((s, idx) => {
                const label = s.seatNumber || s.seatNo || s.code || s.label || String(idx + 1);
                const bookedFlag = s.isBooked || s.booked || s.status === 'booked';
                return (
                  <div key={idx} className={`text-xs text-center py-2 rounded ${bookedFlag ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'} border`}>{label}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleRemoveInclusion = (index) => {
    const updatedInclusion = formData.inclusion.filter((_, i) => i !== index);
    setFormData({ ...formData, inclusion: updatedInclusion });
  };

  const handleRemoveExclusion = (index) => {
    const updatedExclusion = formData.exclusion.filter((_, i) => i !== index);
    setFormData({ ...formData, exclusion: updatedExclusion });
  };

  const handleAddInclusion = () => {
    setFormData({ ...formData, inclusion: [...formData.inclusion, ""] });
  };

  const handleAddExclusion = () => {
    setFormData({ ...formData, exclusion: [...formData.exclusion, ""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("city", formData.city);
    formDataToSend.append("themes", formData.themes);
    formDataToSend.append("state", formData.state);
    formDataToSend.append("overview", formData.overview);
    formDataToSend.append("travelAgencyName", formData.travelAgencyName);
    formDataToSend.append("agencyId", formData.agencyId);
    formDataToSend.append("agencyEmail", formData.agencyEmail);
    formDataToSend.append("agencyPhone", formData.agencyPhone);
    formDataToSend.append("visitngPlaces", formData.visitngPlaces);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("nights", formData.nights);
    formDataToSend.append("days", formData.days);
    formDataToSend.append("from", formData.from);
    formDataToSend.append("to", formData.to);
    formDataToSend.append("tourStartDate", formData.tourStartDate);
  // Include isCustomizable flag (boolean) in the FormData
    formDataToSend.append(
      "isCustomizable",
      formData.isCustomizable ? "true" : "false"
    );
    formDataToSend.append("starRating", formData.starRating);

    formData.inclusion.forEach((inclusions) => {
      formDataToSend.append("inclusion[]", inclusions);
    });
    formData.exclusion.forEach((exclusions) => {
      formDataToSend.append("exclusion[]", exclusions);
    });
    formData.amenities.forEach((amenity) => {
      formDataToSend.append("amenities[]", amenity);
    });
    formData.dayWise.forEach((day, index) => {
      formDataToSend.append(`dayWise[${index}][day]`, day.day);
      formDataToSend.append(`dayWise[${index}][description]`, day.description);
    });
    formData.vehicles.forEach((vehicle, index) => {
      formDataToSend.append(`vehicles[${index}][name]`, vehicle.name);
      formDataToSend.append(
        `vehicles[${index}][vehicleNumber]`,
        vehicle.vehicleNumber
      );
      formDataToSend.append(
        `vehicles[${index}][totalSeats]`,
        vehicle.totalSeats
      );
      formDataToSend.append(
        `vehicles[${index}][seaterType]`,
        vehicle.seaterType
      );
      formDataToSend.append(
        `vehicles[${index}][pricePerSeat]`,
        vehicle.pricePerSeat
      );
      formDataToSend.append(`vehicles[${index}][isActive]`, vehicle.isActive);
    });

    for (const [key, value] of Object.entries(formData.termsAndConditions)) {
      formDataToSend.append(`termsAndConditions[${key}]`, value);
    }
    formData.images.forEach((image) => {
      if (image instanceof File) {
        formDataToSend.append("images", image);
      }
    });

    try {
      showLoader();
      dispatch(createTravel(formDataToSend));
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      hideLoader();
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);

    if (formData.country) {
      const initialStates = State.getStatesOfCountry(formData.country);
      setStates(initialStates);
    }

    if (formData.state && formData.country) {
      const initialCities = City.getCitiesOfState(
        formData.country,
        formData.state
      );
      setCities(initialCities);
    }
  }, [formData.country, formData.state]);

  const pattern = /^[0-9]+N [a-zA-Z\s]+(\|[0-9]+N [a-zA-Z\s]+)*$/;
  const isValid =
    pattern.test(formData.visitngPlaces) || !formData.visitngPlaces;

  const openDatePicker = (e) => {
    e.target.showPicker();
  };

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "48px",
      border: state.isFocused ? "2px solid #3B82F6" : "1px solid #E5E7EB",
      borderRadius: "12px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": { border: "1px solid #9CA3AF" },
    }),
    placeholder: (provided) => ({ ...provided, color: "#9CA3AF" }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#EFF6FF",
      border: "1px solid #DBEAFE",
    }),
    multiValueLabel: (provided) => ({ ...provided, color: "#1E40AF" }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#1E40AF",
      "&:hover": { backgroundColor: "#FEE2E2", color: "#DC2626" },
    }),
  };

  const FormField = ({
    label,
    required = false,
    children,
    error = null,
    icon = null,
  }) => (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-semibold text-gray-700 mb-1">
        {icon && <span className="mr-2 text-lg">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  const SectionTitle = ({ icon, title }) => (
    <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-gradient-to-r from-blue-400 to-purple-400">
      <div className="text-4xl">{icon}</div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">Fill in the details below</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Disclaimer />

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Travel Package Management
          </h1>
          <p className="text-gray-600 text-lg">
            Create and manage your premium travel packages
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Agency Information */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <SectionTitle icon="👤" title="Agency Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField label="Agency Name" required icon="🏢">
                <input
                  type="text"
                  name="travelAgencyName"
                  value={formData.travelAgencyName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Your agency name"
                />
              </FormField>

              <FormField label="Theme" required icon="🎯">
                <select
                  name="themes"
                  value={formData.themes}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select theme</option>
                  {[
                    "Winter",
                    "Summer",
                    "Honeymoon",
                    "Romantic",
                    "Adventure",
                    "Beach",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Agency ID" required icon="🆔">
                <input
                  type="text"
                  name="agencyId"
                  value={formData.agencyId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="AGY-2024-001"
                />
              </FormField>

              <FormField label="Email" required icon="📧">
                <input
                  type="email"
                  name="agencyEmail"
                  value={formData.agencyEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="agency@example.com"
                />
              </FormField>

              <FormField label="Phone" required icon="📱">
                <input
                  type="tel"
                  name="agencyPhone"
                  value={formData.agencyPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="+91 98765 43210"
                />
              </FormField>
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <SectionTitle icon="🌍" title="Location Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Country" required icon="🗺️">
                <Select
                  options={countries.map((c) => ({
                    label: c.name,
                    value: c.isoCode,
                  }))}
                  value={
                    countries.find((c) => c.isoCode === formData.country)
                      ? {
                          label: countries.find(
                            (c) => c.isoCode === formData.country
                          ).name,
                          value: formData.country,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData({ ...formData, country: opt.value })
                  }
                  placeholder="Select country"
                  styles={selectStyles}
                />
              </FormField>

              <FormField label="State" icon="📍">
                <Select
                  options={states.map((s) => ({
                    label: s.name,
                    value: s.isoCode,
                  }))}
                  value={
                    states.find((s) => s.isoCode === formData.state)
                      ? {
                          label: states.find(
                            (s) => s.isoCode === formData.state
                          ).name,
                          value: formData.state,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData({ ...formData, state: opt.value })
                  }
                  placeholder="Select state"
                  styles={selectStyles}
                />
              </FormField>

              <FormField label="City" icon="🏙️">
                <Select
                  options={cities.map((c) => ({
                    label: c.name,
                    value: c.name,
                  }))}
                  value={
                    formData.city
                      ? { label: formData.city, value: formData.city }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData({ ...formData, city: opt.value })
                  }
                  placeholder="Select city"
                  styles={selectStyles}
                />
              </FormField>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <SectionTitle icon="📦" title="Package Details" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <FormField label="Days" required icon="📅">
                <select
                  name="days"
                  value={formData.days}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select Days</option>
                  {[...Array(30).keys()].map((i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} Day{i > 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Nights" required icon="🌙">
                <select
                  name="nights"
                  value={formData.nights}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select nights</option>
                  {[...Array(30).keys()].map((i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} Night{i > 0 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Star Rating" required icon="⭐">
                <select
                  name="starRating"
                  value={formData.starRating}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select Rating</option>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Star{rating > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <FormField
                label="Places to Visit"
                required
                icon="🎯"
                error={
                  !isValid && formData.visitngPlaces
                    ? "Format: 1N Bihar|2N Patna"
                    : null
                }
              >
                <input
                  type="text"
                  name="visitngPlaces"
                  value={formData.visitngPlaces}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 1N Bihar|2N Patna|1N Delhi"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </FormField>

              <FormField label="Package Price" required icon="💰">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="₹ 0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </FormField>
            </div>

            <FormField label="Package Overview" required icon="📝">
              <textarea
                name="overview"
                value={formData.overview}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your travel package in detail..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              />
            </FormField>

            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
              <FormField label="Customizable Package" required icon="🔄">
                <div className="flex gap-4">
                  {[
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => handleCustomizableChange(opt.value)}
                      className={`px-8 py-3 rounded-xl font-bold transition-all ${
                        formData.isCustomizable === opt.value
                          ? "bg-blue-600 text-white shadow-lg scale-105"
                          : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormField>

              {formData.isCustomizable ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FormField label="From Date" required icon="📅">
                    <input
                      type="date"
                      name="from"
                      value={formData.from}
                      onChange={handleChange}
                      onClick={openDatePicker}
                      required={formData.isCustomizable}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </FormField>
                  <FormField label="To Date" required icon="📅">
                    <input
                      type="date"
                      name="to"
                      value={formData.to}
                      onChange={handleChange}
                      onClick={openDatePicker}
                      required={formData.isCustomizable}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </FormField>
                </div>
              ) : (
                <FormField label="Tour Start Date" required icon="📅">
                  <input
                    type="date"
                    name="tourStartDate"
                    value={formData.tourStartDate}
                    onChange={handleChange}
                    onClick={openDatePicker}
                    required={!formData.isCustomizable}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </FormField>
              )}
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <SectionTitle icon="✅" title="Inclusions & Exclusions" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-2xl">✅</span> Inclusions
                </h3>
                {formData.inclusion.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-3 items-end">
                    <input
                      name="inclusion"
                      value={item}
                      onChange={(e) => handleChange(e, idx)}
                      required
                      placeholder={`Inclusion ${idx + 1}`}
                      className="flex-1 px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                    {formData.inclusion.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInclusion(idx)}
                        className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <MdDelete />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddInclusion}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2 mt-4"
                >
                  <MdAdd /> Add
                </button>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-2xl">❌</span> Exclusions
                </h3>
                {formData.exclusion.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-3 items-end">
                    <input
                      name="exclusion"
                      value={item}
                      onChange={(e) => handleChange(e, idx)}
                      required
                      placeholder={`Exclusion ${idx + 1}`}
                      className="flex-1 px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                    {formData.exclusion.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExclusion(idx)}
                        className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <MdDelete />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddExclusion}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2 mt-4"
                >
                  <MdAdd /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <SectionTitle icon="🛠️" title="Amenities" />
            <FormField label="Select Amenities" required icon="⭐">
              <CreatableSelect
                isMulti
                value={formData.amenities.map((a) => ({ label: a, value: a }))}
                onChange={handleAmenitiesChange}
                options={
                  iconsList?.map((icon) => ({
                    label: icon.label,
                    value: icon.label,
                  })) || []
                }
                placeholder="Select or type custom amenities..."
                styles={selectStyles}
              />
            </FormField>
          </div>

          {/* Day-wise Itinerary */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <SectionTitle icon="📅" title="Day-wise Itinerary" />
            {formData.dayWise.map((day, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-4 border-l-4 border-purple-500"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-gray-800">
                    📍 Day {idx + 1}
                  </h4>
                  {formData.dayWise.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDay(idx)}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <select
                    name="day"
                    value={day.day}
                    onChange={(e) => handleDayWiseChange(idx, e)}
                    required
                    className="px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="">Select Day</option>
                    {[...Array(30).keys()].map((i) => (
                      <option key={i + 1} value={i + 1}>
                        Day {i + 1}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="description"
                    value={day.description}
                    onChange={(e) => handleDayWiseChange(idx, e)}
                    required
                    rows="1"
                    placeholder="Describe activities..."
                    className="lg:col-span-3 px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddDay}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              <MdAdd /> Add Day
            </button>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <SectionTitle icon="⚖️" title="Terms & Conditions" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FormField label="Cancellation Policy" required icon="📋">
                <textarea
                  name="cancellation"
                  value={formData.termsAndConditions.cancellation}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Your cancellation policy..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </FormField>

              <FormField label="Refund Policy" required icon="💵">
                <textarea
                  name="refund"
                  value={formData.termsAndConditions.refund}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Your refund policy..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </FormField>

              <FormField label="Booking Policy" required icon="📝">
                <textarea
                  name="bookingPolicy"
                  value={formData.termsAndConditions.bookingPolicy}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Your booking policy..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </FormField>
            </div>
          </div>

          {/* Vehicles */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 overflow-x-auto">
            <SectionTitle icon="🚌" title="Vehicles" />
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-purple-100">
                  <th className="px-4 py-4 text-left font-bold text-gray-700">
                    Vehicle Type
                  </th>
                  <th className="px-4 py-4 text-left font-bold text-gray-700">
                    Number
                  </th>
                  <th className="px-4 py-4 text-left font-bold text-gray-700">
                    Seats
                  </th>
                  <th className="px-4 py-4 text-left font-bold text-gray-700">
                    Seater
                  </th>
                  <th className="px-4 py-4 text-left font-bold text-gray-700">
                    Price/Seat
                  </th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">
                    Active
                  </th>
                  <th className="px-4 py-4 text-center font-bold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.vehicles.map((vehicle, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <select
                        name="name"
                        value={vehicle.name}
                        onChange={(e) => handleVehicleChange(idx, e)}
                        required
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg w-full text-sm"
                      >
                        <option value="">Select</option>
                        {[
                          "Deluxe Bus",
                          "AC Deluxe Bus",
                          "Luxury Coach",
                          "Tempo Traveller",
                          "Innova Crysta",
                        ].map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        name="vehicleNumber"
                        value={vehicle.vehicleNumber}
                        onChange={(e) => handleVehicleChange(idx, e)}
                        required
                        placeholder="UP81AB1234"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg w-full text-sm"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        name="totalSeats"
                        value={vehicle.totalSeats}
                        onChange={(e) => handleVehicleChange(idx, e)}
                        required
                        min="1"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg w-full text-sm"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <select
                        name="seaterType"
                        value={vehicle.seaterType}
                        onChange={(e) => handleVehicleChange(idx, e)}
                        required
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg w-full text-sm"
                      >
                        <option value="2*2">2x2</option>
                        <option value="2*3">2x3</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        name="pricePerSeat"
                        value={vehicle.pricePerSeat}
                        onChange={(e) => handleVehicleChange(idx, e)}
                        min="0"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg w-full text-sm"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={vehicle.isActive}
                        onChange={(e) => handleVehicleChange(idx, e)}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openVehicleSeats(vehicle)}
                          className="px-3 py-1 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          Show Seats
                        </button>
                        {formData.vehicles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVehicle(idx)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <MdDelete />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={handleAddVehicle}
              className="w-full mt-6 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 flex items-center justify-center gap-2"
            >
              <MdAdd /> Add Vehicle
            </button>
          </div>

          {/* Images */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <SectionTitle icon="🖼️" title="Images" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {formData.images.map((img, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 border-2 border-dashed border-indigo-300"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-800">📸 {idx + 1}</h4>
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <MdClose />
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(idx, e)}
                    className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 text-sm"
                  />
                  {img && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <FaCheck /> {img.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddImage}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <MdAdd /> Add Image
            </button>
          </div>

          {/* Submit */}
          <div className="flex justify-center pb-8">
            <button
              type="submit"
              className="px-16 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl font-black text-xl transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95"
            >
              🚀 Submit Travel Package
            </button>
          </div>
        </form>
        <VehicleSeatModal
          open={!!showVehicleSeats && !!showVehicleSeats.vehicleId}
          onClose={() => setShowVehicleSeats(null)}
          seats={vehicleSeats}
          loading={travelLoading}
        />
      </div>
    </div>
  );
};

export default TravelForm;
