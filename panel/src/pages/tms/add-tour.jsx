import React, { useState, useRef } from 'react';
import { Plus, Trash2, Save, X, Building2, MapPin, ListChecks, CalendarDays, Car, FileText, UploadCloud, Armchair, LayoutGrid } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addTour } from '../../../redux/slices/tms/travel/tour/tour';

const predefinedLayouts = [
  { id: '1x1', label: '1x1 (Sleeper/VIP)', left: 1, right: 1, aisle: true },
  { id: '1x2', label: '1x2 (Premium)', left: 1, right: 2, aisle: true },
  { id: '2x2', label: '2x2 (Standard Bus)', left: 2, right: 2, aisle: true },
  { id: '2x3', label: '2x3 (Economy Bus)', left: 2, right: 3, aisle: true },
  { id: '3x2', label: '3x2 (Economy Bus)', left: 3, right: 2, aisle: true },
  { id: 'custom', label: 'Custom Layout', left: 0, right: 0, aisle: false },
];

const initialVehicleState = {
  name: '',
  vehicleNumber: '',
  totalSeats: '',
  seatConfig: {
    rows: '',
    left: 2,
    right: 2,
    aisle: true
  },
  seaterType: '2x2',
  pricePerSeat: '',
  isActive: true
};

const initialDayState = {
  day: 1,
  description: ''
};

const predefinedAmenities = [
  'WiFi', 'AC', 'Breakfast', 'Swimming Pool', 'Gym', 'Parking', 'Spa', 'Bar', 'Restaurant', 'Room Service', 'TV', 'Geyser', 'Heater', 'First Aid'
];

export default function TourForm() {
  const [formData, setFormData] = useState({
    travelAgencyName: '',
    agencyId: '',
    agencyPhone: '',
    agencyEmail: '',
    isAccepted: false,
    country: '',
    state: '',
    city: '',
    visitngPlaces: '',
    themes: '',
    price: '',
    nights: '',
    days: '',
    from: '',
    to: '',
    tourStartDate: '',
    tourEndDate: '',
    runningStatus: 'active', // 'active', 'inactive', 'completed'
    isCustomizable: false,
    starRating: '',
    amenities: [],
    inclusion: '',
    exclusion: '',
    images: [],
    dayWise: [initialDayState],
    vehicles: [initialVehicleState],
    termsAndConditions: []
  });

  const dispatch = useDispatch();
  const [amenitySearch, setAmenitySearch] = useState('');
  const [showAmenityDropdown, setShowAmenityDropdown] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleArrayTextChange = (e, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleDayChange = (index, field, value) => {
    const newDays = [...formData.dayWise];
    newDays[index][field] = value;
    setFormData((prev) => ({ ...prev, dayWise: newDays }));
  };

  const addDay = () => {
    setFormData((prev) => ({
      ...prev,
      dayWise: [...prev.dayWise, { day: prev.dayWise.length + 1, description: '' }]
    }));
  };

  const removeDay = (index) => {
    const newDays = formData.dayWise.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, dayWise: newDays }));
  };

  const handleVehicleChange = (index, field, value) => {
    const newVehicles = [...formData.vehicles];
    newVehicles[index][field] = value;
    setFormData((prev) => ({ ...prev, vehicles: newVehicles }));
  };

  const handleSeatConfigChange = (index, field, value, type = 'number') => {
    const newVehicles = [...formData.vehicles];
    
    let parsedValue = value;
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }

    newVehicles[index].seatConfig = {
      ...newVehicles[index].seatConfig,
      [field]: parsedValue
    };
    
    if (newVehicles[index].seaterType !== 'custom') {
      newVehicles[index].seaterType = 'custom';
    }
    setFormData((prev) => ({ ...prev, vehicles: newVehicles }));
  };

  const handleLayoutSelect = (index, layout) => {
    const newVehicles = [...formData.vehicles];
    newVehicles[index].seaterType = layout.id;
    if (layout.id !== 'custom') {
      newVehicles[index].seatConfig.left = layout.left;
      newVehicles[index].seatConfig.right = layout.right;
      newVehicles[index].seatConfig.aisle = layout.aisle;
    }
    setFormData((prev) => ({ ...prev, vehicles: newVehicles }));
  };

  const addVehicle = () => {
    setFormData((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, { ...initialVehicleState }]
    }));
  };

  const removeVehicle = (index) => {
    const newVehicles = formData.vehicles.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, vehicles: newVehicles }));
  };

  const handleTermsChange = (index, field, value) => {
    const newTerms = [...formData.termsAndConditions];
    newTerms[index][field] = value;
    setFormData((prev) => ({ ...prev, termsAndConditions: newTerms }));
  };

  const addTerm = () => {
    setFormData((prev) => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, { key: '', value: '' }]
    }));
  };

  const removeTerm = (index) => {
    const newTerms = formData.termsAndConditions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, termsAndConditions: newTerms }));
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
    setAmenitySearch('');
    setShowAmenityDropdown(false);
  };

  const handleAddCustomAmenity = (e) => {
    if (e.key === 'Enter' && amenitySearch.trim()) {
      e.preventDefault();
      if (!formData.amenities.includes(amenitySearch.trim())) {
        toggleAmenity(amenitySearch.trim());
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newImageUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImageUrls]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      inclusion: formData.inclusion.split(',').map((i) => i.trim()).filter(Boolean),
      exclusion: formData.exclusion.split(',').map((i) => i.trim()).filter(Boolean),
      termsAndConditions: formData.termsAndConditions.reduce((acc, curr) => {
        if (curr.key && curr.value) acc[curr.key] = curr.value;
        return acc;
      }, {})
    };

    dispatch(addTour(payload));
  };

  const filteredAmenities = predefinedAmenities.filter(a => 
    a.toLowerCase().includes(amenitySearch.toLowerCase()) && !formData.amenities.includes(a)
  );

  const inputClass = "block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
  const sectionClass = "bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100";
  const sectionHeaderClass = "flex items-center text-lg font-semibold text-slate-800 mb-6";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900 w-full">
      <div className="w-full mx-auto space-y-8 max-w-[1920px]">
        
        <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Tour Package</h1>
            <p className="text-sm text-slate-500 mt-1">Fill in the details below to publish a new travel itinerary.</p>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button type="button" className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all font-medium flex items-center shadow-sm">
              <X className="w-4 h-4 mr-2" /> Cancel
            </button>
            <button onClick={handleSubmit} type="button" className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium flex items-center shadow-md shadow-slate-900/10">
              <Save className="w-4 h-4 mr-2" /> Save Package
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              Agency Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-1">
                <label className={labelClass}>Agency Name</label>
                <input type="text" name="travelAgencyName" value={formData.travelAgencyName} onChange={handleInputChange} className={inputClass} placeholder="e.g. Wanderlust Travels" />
              </div>
              <div className="xl:col-span-1">
                <label className={labelClass}>Agency ID</label>
                <input type="text" name="agencyId" value={formData.agencyId} onChange={handleInputChange} className={inputClass} placeholder="e.g. AG-2938" />
              </div>
              <div className="xl:col-span-1">
                <label className={labelClass}>Phone Number</label>
                <input type="tel" name="agencyPhone" value={formData.agencyPhone} onChange={handleInputChange} className={inputClass} placeholder="+1 9876543210" />
              </div>
              <div className="xl:col-span-1">
                <label className={labelClass}>Email Address</label>
                <input type="email" name="agencyEmail" value={formData.agencyEmail} onChange={handleInputChange} className={inputClass} placeholder="agency@example.com" />
              </div>
              <div className="md:col-span-2 lg:col-span-4 xl:col-span-1 pt-2 flex items-center">
                <label className="flex items-center cursor-pointer group w-max mt-4 xl:mt-6">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-slate-50 group-hover:border-indigo-500 transition-colors">
                    <input type="checkbox" name="isAccepted" checked={formData.isAccepted} onChange={handleInputChange} className="absolute opacity-0 w-full h-full cursor-pointer" />
                    {formData.isAccepted && (
                      <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div>
                    )}
                  </div>
                  <span className="ml-3 text-sm font-medium text-slate-700 select-none">Agency Accepted & Verified</span>
                </label>
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              Destination & Schedule
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
              <div className="xl:col-span-1">
                <label className={labelClass}>Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleInputChange} className={inputClass} placeholder="e.g. India" />
              </div>
              <div className="xl:col-span-1">
                <label className={labelClass}>State/Region</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} className={inputClass} placeholder="e.g. Rajasthan" />
              </div>
              <div className="xl:col-span-1">
                <label className={labelClass}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClass} placeholder="e.g. Jaipur" />
              </div>
              <div className="md:col-span-3 xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Visiting Places</label>
                  <input type="text" name="visitngPlaces" value={formData.visitngPlaces} onChange={handleInputChange} className={inputClass} placeholder="Hawa Mahal, Amer Fort..." />
                </div>
                <div>
                  <label className={labelClass}>Themes</label>
                  <input type="text" name="themes" value={formData.themes} onChange={handleInputChange} className={inputClass} placeholder="Adventure, Nature, Romantic..." />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-6">
              <div>
                <label className={labelClass}>Booking From Date</label>
                <input type="date" name="from" value={formData.from} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Booking To Date</label>
                <input type="date" name="to" value={formData.to} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tour Start Date</label>
                <input type="date" name="tourStartDate" value={formData.tourStartDate} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tour End Date</label>
                <input type="date" name="tourEndDate" value={formData.tourEndDate} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Total Days</label>
                <input type="number" name="days" value={formData.days} onChange={handleInputChange} className={inputClass} placeholder="0" />
              </div>
              <div>
                <label className={labelClass}>Total Nights</label>
                <input type="number" name="nights" value={formData.nights} onChange={handleInputChange} className={inputClass} placeholder="0" />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100 items-end">
                <div>
                  <label className={labelClass}>Total Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} className={`${inputClass} pl-8`} placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Star Rating (1-5)</label>
                  <input type="number" min="1" max="5" name="starRating" value={formData.starRating} onChange={handleInputChange} className={inputClass} placeholder="5" />
                </div>
              </div>
            </div>

            <div className="pb-3">
              <label className="flex items-center cursor-pointer group w-max">
                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white group-hover:border-indigo-500 transition-colors">
                  <input type="checkbox" name="isCustomizable" checked={formData.isCustomizable} onChange={handleInputChange} className="absolute opacity-0 w-full h-full cursor-pointer" />
                  {formData.isCustomizable && <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div>}
                </div>
                <span className="ml-3 text-sm font-medium text-slate-700 select-none">Allow Customization</span>
              </label>
            </div>
          </div>

          <div className={sectionClass}>
            <h2 className={sectionHeaderClass}>
              <div className="p-2 bg-emerald-50 rounded-lg mr-3">
                <ListChecks className="w-5 h-5 text-emerald-600" />
              </div>
              Features & Media
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Amenities</label>
                  <div className="relative">
                    <div className="min-h-[46px] p-2 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50/50 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      {formData.amenities.map(amenity => (
                        <span key={amenity} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
                          {amenity}
                          <button type="button" onClick={() => toggleAmenity(amenity)} className="ml-1.5 text-indigo-500 hover:text-indigo-900 focus:outline-none">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={amenitySearch}
                        onChange={(e) => setAmenitySearch(e.target.value)}
                        onKeyDown={handleAddCustomAmenity}
                        onFocus={() => setShowAmenityDropdown(true)}
                        onBlur={() => setTimeout(() => setShowAmenityDropdown(false), 200)}
                        placeholder={formData.amenities.length === 0 ? "Search amenities or type and press Enter..." : ""}
                        className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-slate-800 px-1 placeholder:text-slate-400"
                      />
                    </div>
                    
                    {showAmenityDropdown && (amenitySearch || filteredAmenities.length > 0) && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-xl py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-slate-100">
                        {filteredAmenities.length > 0 ? (
                          filteredAmenities.map((amenity, index) => (
                            <div
                              key={index}
                              onClick={() => toggleAmenity(amenity)}
                              className="cursor-pointer select-none relative py-2.5 pl-4 pr-9 hover:bg-indigo-50 text-slate-700 transition-colors"
                            >
                              <span className="block truncate">{amenity}</span>
                            </div>
                          ))
                        ) : (
                          amenitySearch.trim() && (
                            <div
                              onClick={() => toggleAmenity(amenitySearch.trim())}
                              className="cursor-pointer select-none relative py-2.5 pl-4 pr-9 hover:bg-indigo-50 text-indigo-600 transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" /> <span>Add new: "{amenitySearch}"</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Inclusions <span className="text-slate-400 font-normal ml-1">(Comma separated)</span></label>
                    <textarea rows="3" value={formData.inclusion} onChange={(e) => handleArrayTextChange(e, 'inclusion')} placeholder="Flight tickets, 4-star Hotel stay, Local guide..." className={`${inputClass} resize-y`}></textarea>
                  </div>
                  <div>
                    <label className={labelClass}>Exclusions <span className="text-slate-400 font-normal ml-1">(Comma separated)</span></label>
                    <textarea rows="3" value={formData.exclusion} onChange={(e) => handleArrayTextChange(e, 'exclusion')} placeholder="Personal expenses, Travel Insurance..." className={`${inputClass} resize-y`}></textarea>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Upload Images</label>
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-2 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                      <UploadCloud className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <span className="relative rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          multiple 
                          accept="image/*"
                          className="sr-only" 
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                        />
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
                    {formData.images.map((src, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                        <img src={src} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className={sectionClass}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className={`${sectionHeaderClass} mb-0`}>
                  <div className="p-2 bg-amber-50 rounded-lg mr-3">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  Terms & Conditions
                </h2>
                <button type="button" onClick={addTerm} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium flex items-center shadow-sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Rule
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.termsAndConditions.map((term, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100 group transition-colors hover:border-slate-200">
                    <div className="w-full sm:w-1/3">
                      <input type="text" placeholder="Rule Title (e.g. Cancellation)" value={term.key} onChange={(e) => handleTermsChange(index, 'key', e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex-1 w-full flex gap-3">
                      <input type="text" placeholder="Description (e.g. Non-refundable after 24 hrs)" value={term.value} onChange={(e) => handleTermsChange(index, 'value', e.target.value)} className={inputClass} />
                      <button type="button" onClick={() => removeTerm(index)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 border border-transparent hover:border-red-100">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {formData.termsAndConditions.length === 0 && (
                  <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-500 font-medium">No terms defined yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Rule" to specify conditions for this tour.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={sectionClass}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className={`${sectionHeaderClass} mb-0`}>
                  <div className="p-2 bg-rose-50 rounded-lg mr-3">
                    <CalendarDays className="w-5 h-5 text-rose-600" />
                  </div>
                  Day-wise Itinerary
                </h2>
                <button type="button" onClick={addDay} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium flex items-center shadow-sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Day
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.dayWise.map((dayObj, index) => (
                  <div key={index} className="flex items-start gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                    <div className="w-20 sm:w-24 shrink-0">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Day</label>
                      <input 
                        type="number" 
                        value={dayObj.day} 
                        onChange={(e) => handleDayChange(index, 'day', e.target.value === '' ? '' : Number(e.target.value))} 
                        className={`${inputClass} text-center font-semibold text-slate-700`} 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Activity Description</label>
                      <textarea rows="2" value={dayObj.description} onChange={(e) => handleDayChange(index, 'description', e.target.value)} className={`${inputClass} resize-y`} placeholder="Describe the locations and activities planned for this day..."></textarea>
                    </div>
                    <button type="button" onClick={() => removeDay(index)} className="absolute -top-3 -right-3 p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className={`${sectionHeaderClass} mb-0`}>
                <div className="p-2 bg-violet-50 rounded-lg mr-3">
                  <Car className="w-5 h-5 text-violet-600" />
                </div>
                Vehicle Inventory
              </h2>
              <button type="button" onClick={addVehicle} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center shadow-sm shadow-violet-600/20">
                <Plus className="w-4 h-4 mr-2" /> Add Vehicle
              </button>
            </div>
            
            <div className="space-y-8">
              {formData.vehicles.map((vehicle, index) => {
                const leftSeatsCount = Math.max(0, Number(vehicle.seatConfig.left) || 0);
                const rightSeatsCount = Math.max(0, Number(vehicle.seatConfig.right) || 0);
                const rowSeatsTotal = leftSeatsCount + rightSeatsCount;
                const totalEstimatedSeats = (Math.max(0, Number(vehicle.seatConfig.rows) || 0) * rowSeatsTotal);

                return (
                <div key={index} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 relative group transition-colors hover:border-indigo-200 shadow-sm">
                  <div className="absolute top-6 right-6 flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                      <span className="mr-3 text-sm font-medium text-slate-600 hidden sm:block">Active</span>
                      <div className="relative flex items-center justify-center w-10 h-5 rounded-full bg-slate-200 transition-colors" style={{ backgroundColor: vehicle.isActive ? '#4f46e5' : '#e2e8f0' }}>
                        <input type="checkbox" checked={vehicle.isActive} onChange={(e) => handleVehicleChange(index, 'isActive', e.target.checked)} className="absolute opacity-0 w-full h-full cursor-pointer z-10" />
                        <div className={`absolute left-1 w-3.5 h-3.5 bg-white rounded-full transition-transform ${vehicle.isActive ? 'translate-x-4.5' : 'translate-x-0'}`} style={{ transform: vehicle.isActive ? 'translateX(18px)' : 'translateX(0)' }}></div>
                      </div>
                    </label>
                    <button type="button" onClick={() => removeVehicle(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="bg-violet-100 text-violet-700 text-xs py-1 px-2.5 rounded-md font-bold">Vehicle #{index + 1}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-2 xl:col-span-2">
                      <label className={labelClass}>Name / Model</label>
                      <input type="text" required value={vehicle.name} onChange={(e) => handleVehicleChange(index, 'name', e.target.value)} className={inputClass} placeholder="e.g. Volvo B11R Multi-axle" />
                    </div>
                    <div className="lg:col-span-1 xl:col-span-2">
                      <label className={labelClass}>Registration Number</label>
                      <input type="text" value={vehicle.vehicleNumber} onChange={(e) => handleVehicleChange(index, 'vehicleNumber', e.target.value)} className={inputClass} placeholder="e.g. MH-12-AB-1234" />
                    </div>
                  </div>

                  <div className="mb-8 border-t border-slate-100 pt-8">
                    <label className={`${labelClass} mb-4 flex items-center gap-2`}>
                      <LayoutGrid className="w-4 h-4 text-indigo-500" /> Select Seat Layout
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12 gap-3">
                      {predefinedLayouts.map(layout => (
                        <button
                          type="button"
                          key={layout.id}
                          onClick={() => handleLayoutSelect(index, layout)}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-2 ${
                            vehicle.seaterType === layout.id
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600 shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'
                          }`}
                        >
                          {layout.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-4">
                    <div className="flex flex-col xl:flex-row gap-8">
                      
                      <div className="flex-1 space-y-6">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Seat Configuration Details</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Total Rows</label>
                            <input type="number" required value={vehicle.seatConfig.rows} onChange={(e) => handleSeatConfigChange(index, 'rows', e.target.value, 'number')} className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Total Seats</label>
                            <input 
                              type="number" 
                              required 
                              value={vehicle.totalSeats} 
                              onChange={(e) => handleVehicleChange(index, 'totalSeats', e.target.value === '' ? '' : Number(e.target.value))} 
                              className={inputClass} 
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Estimate: Rows ({vehicle.seatConfig.rows || 0}) × {rowSeatsTotal} = {totalEstimatedSeats}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Left Side Seats</label>
                            <input type="number" required value={vehicle.seatConfig.left} onChange={(e) => handleSeatConfigChange(index, 'left', e.target.value, 'number')} className={inputClass} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Right Side Seats</label>
                            <input type="number" required value={vehicle.seatConfig.right} onChange={(e) => handleSeatConfigChange(index, 'right', e.target.value, 'number')} className={inputClass} />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200 pt-5 gap-4">
                           <label className="flex items-center cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white group-hover:border-indigo-500 transition-colors">
                              <input type="checkbox" checked={vehicle.seatConfig.aisle} onChange={(e) => handleSeatConfigChange(index, 'aisle', e.target.checked, 'checkbox')} className="absolute opacity-0 w-full h-full cursor-pointer" />
                              {vehicle.seatConfig.aisle && <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div>}
                            </div>
                            <span className="ml-3 text-sm font-medium text-slate-700 select-none">Has Center Aisle</span>
                          </label>

                          <div className="w-full sm:w-1/2 lg:w-1/3">
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Price Per Seat</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                              <input 
                                type="number" 
                                value={vehicle.pricePerSeat} 
                                onChange={(e) => handleVehicleChange(index, 'pricePerSeat', e.target.value === '' ? '' : Number(e.target.value))} 
                                className={`${inputClass} pl-8`} 
                                placeholder="0.00" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full xl:w-[450px] 2xl:w-[500px] shrink-0 bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center shadow-sm overflow-hidden">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                           <Armchair className="w-4 h-4" /> Single Row Preview
                        </h5>
                        
                        <div className="w-full overflow-x-auto pb-4" style={{scrollbarWidth: 'thin'}}>
                          <div className="flex items-center justify-center min-w-max mx-auto gap-3 bg-slate-100/80 p-5 rounded-2xl border border-slate-200">
                            <div className="flex gap-1.5">
                              {Array.from({ length: leftSeatsCount }).map((_, i) => (
                                <div key={`l-${i}`} className="w-10 h-12 shrink-0 bg-indigo-50 rounded-lg border border-indigo-200 shadow-sm flex items-center justify-center text-indigo-400">
                                  <Armchair className="w-5 h-5" />
                                </div>
                              ))}
                              {leftSeatsCount === 0 && <div className="text-xs text-slate-400 italic">No Left</div>}
                            </div>

                            {vehicle.seatConfig.aisle && (
                              <div className="w-8 h-12 shrink-0 border-x-2 border-dashed border-slate-300 bg-slate-50/50 mx-1 flex items-center justify-center">
                                 <div className="w-0.5 h-6 bg-slate-200 rounded-full"></div>
                              </div>
                            )}

                            <div className="flex gap-1.5">
                              {Array.from({ length: rightSeatsCount }).map((_, i) => (
                                <div key={`r-${i}`} className="w-10 h-12 shrink-0 bg-indigo-50 rounded-lg border border-indigo-200 shadow-sm flex items-center justify-center text-indigo-400">
                                  <Armchair className="w-5 h-5" />
                                </div>
                              ))}
                              {rightSeatsCount === 0 && <div className="text-xs text-slate-400 italic">No Right</div>}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 text-sm font-medium text-slate-600 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                          Total <span className="text-indigo-600 font-bold text-base mx-1">{rowSeatsTotal}</span> Seats in Row
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )})}
              {formData.vehicles.length === 0 && (
                <div className="text-center py-10 bg-white border border-dashed border-slate-300 rounded-2xl">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Car className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-base text-slate-700 font-medium">No vehicles allocated</p>
                  <p className="text-sm text-slate-500 mt-1">Add buses or cars for this tour package.</p>
                </div>
              )}
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}