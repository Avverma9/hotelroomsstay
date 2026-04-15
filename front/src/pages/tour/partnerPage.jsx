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

/* ─── STEP CONFIG ───────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Agency",     icon: "👤" },
  { id: 2, label: "Location",   icon: "🌍" },
  { id: 3, label: "Package",    icon: "📦" },
  { id: 4, label: "Inc / Exc",  icon: "✅" },
  { id: 5, label: "Itinerary",  icon: "📅" },
  { id: 6, label: "Terms",      icon: "⚖️" },
  { id: 7, label: "Vehicles",   icon: "🚌" },
  { id: 8, label: "Images",     icon: "🖼️" },
  { id: 9, label: "Preview",    icon: "👁️" },
];

/* ─── SHARED SELECT STYLES ──────────────────────────────────────── */
const selectStyles = {
  control: (p, s) => ({
    ...p,
    minHeight: "40px",
    border: s.isFocused ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "none",
    "&:hover": { border: "1.5px solid #a5b4fc" },
    fontSize: "13px",
  }),
  placeholder: (p) => ({ ...p, color: "#9ca3af", fontSize: "13px" }),
  multiValue: (p) => ({ ...p, backgroundColor: "#eef2ff", borderRadius: "4px" }),
  multiValueLabel: (p) => ({ ...p, color: "#3730a3", fontSize: "12px" }),
  multiValueRemove: (p) => ({
    ...p, color: "#3730a3",
    "&:hover": { backgroundColor: "#fee2e2", color: "#dc2626" },
  }),
  option: (p) => ({ ...p, fontSize: "13px" }),
};

/* ─── TINY HELPERS ──────────────────────────────────────────────── */
const Field = ({ label, required, children, error }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls =
  "w-full px-3 py-2 text-sm border-[1.5px] border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all bg-white";

const textareaCls =
  "w-full px-3 py-2 text-sm border-[1.5px] border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all resize-none bg-white";

const selectCls =
  "w-full px-3 py-2 text-sm border-[1.5px] border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all bg-white";

/* ─── STEP INDICATOR ────────────────────────────────────────────── */
const StepBar = ({ current }) => (
  <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
    {STEPS.map((s, i) => {
      const done = current > s.id;
      const active = current === s.id;
      return (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1 min-w-[52px]">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all
              ${done  ? "bg-indigo-600 text-white"  : ""}
              ${active? "bg-indigo-600 text-white ring-4 ring-indigo-100" : ""}
              ${!done && !active ? "bg-gray-100 text-gray-400" : ""}
            `}>
              {done ? "✓" : s.icon}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap
              ${active ? "text-indigo-700" : "text-gray-400"}
            `}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 rounded transition-all ${done ? "bg-indigo-500" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─── SECTION CARD ──────────────────────────────────────────────── */
const Card = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="mb-5">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ─── NAV BUTTONS ───────────────────────────────────────────────── */
const Nav = ({ step, total, onBack, onNext, onSubmit, isLast }) => (
  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
    <button
      type="button"
      onClick={onBack}
      disabled={step === 1}
      className="px-5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-all"
    >
      ← Back
    </button>
    <span className="text-xs text-gray-400">Step {step} of {total}</span>
    {isLast ? (
      <button
        type="button"
        onClick={onSubmit}
        className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:opacity-90 shadow transition-all"
      >
        🚀 Submit Package
      </button>
    ) : (
      <button
        type="button"
        onClick={onNext}
        className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
      >
        Next →
      </button>
    )}
  </div>
);

/* ─── PREVIEW ROW ───────────────────────────────────────────────── */
const PR = ({ label, value }) => (
  <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
    <span className="text-xs text-gray-800 font-medium">{value || "—"}</span>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const TravelForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    city: "", country: "", state: "",
    travelAgencyName: "", agencyId: "", agencyEmail: "", agencyPhone: "",
    themes: "", visitngPlaces: "", overview: "", price: "",
    nights: "", days: "", from: "", tourStartDate: "",
    isCustomizable: false, to: "",
    amenities: [], inclusion: [""], exclusion: [""],
    termsAndConditions: { cancellation: "", refund: "", bookingPolicy: "" },
    dayWise: [{ day: "", description: "" }],
    starRating: "", images: [],
    vehicles: [{
      name: "", vehicleNumber: "", totalSeats: "",
      seaterType: "2*2", pricePerSeat: 0, isActive: true,
      seatConfig: { rows: 1, left: 2, right: 2, aisle: true },
    }],
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates]       = useState([]);
  const [cities, setCities]       = useState([]);
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();

  /* ── Country/State/City ── */
  useEffect(() => {
    setCountries(Country.getAllCountries());
    if (formData.country) setStates(State.getStatesOfCountry(formData.country));
    if (formData.state && formData.country)
      setCities(City.getCitiesOfState(formData.country, formData.state));
  }, [formData.country, formData.state]);

  /* ── Generic change handler ── */
  const handleChange = (e, index = null) => {
    const { name, value } = e.target;
    if (["cancellation", "refund", "bookingPolicy"].includes(name)) {
      setFormData(p => ({ ...p, termsAndConditions: { ...p.termsAndConditions, [name]: value } }));
    } else if (name === "inclusion") {
      const arr = [...formData.inclusion];
      if (index !== null) arr[index] = value;
      else arr.push(value);
      setFormData(p => ({ ...p, inclusion: arr }));
    } else if (name === "exclusion") {
      const arr = [...formData.exclusion];
      if (index !== null) arr[index] = value;
      else arr.push(value);
      setFormData(p => ({ ...p, exclusion: arr }));
    } else {
      setFormData(p => ({
        ...p,
        [name]: ["duration","nights","days","starRating"].includes(name) ? Number(value) : value,
      }));
    }
  };

  const handleAmenitiesChange = (sel) => {
    const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    setFormData(p => ({ ...p, amenities: sel ? sel.map(o => cap(o.value)) : [] }));
  };

  /* ── Inclusion / Exclusion ── */
  const addInclusion    = () => setFormData(p => ({ ...p, inclusion: [...p.inclusion, ""] }));
  const removeInclusion = i  => setFormData(p => ({ ...p, inclusion: p.inclusion.filter((_, j) => j !== i) }));
  const addExclusion    = () => setFormData(p => ({ ...p, exclusion: [...p.exclusion, ""] }));
  const removeExclusion = i  => setFormData(p => ({ ...p, exclusion: p.exclusion.filter((_, j) => j !== i) }));

  /* ── Day-wise ── */
  const handleDayWise = (i, e) => {
    const arr = [...formData.dayWise];
    arr[i][e.target.name] = e.target.value;
    setFormData(p => ({ ...p, dayWise: arr }));
  };
  const addDay    = () => setFormData(p => ({ ...p, dayWise: [...p.dayWise, { day: "", description: "" }] }));
  const removeDay = i  => setFormData(p => ({ ...p, dayWise: p.dayWise.filter((_, j) => j !== i) }));

  /* ── Customizable ── */
  const handleCustomizable = val =>
    setFormData(p => ({
      ...p, isCustomizable: val,
      ...(val ? { tourStartDate: "" } : { from: "", to: "" }),
    }));

  /* ── Images ── */
  const addImage    = () => setFormData(p => ({ ...p, images: [...p.images, null] }));
  const removeImage = i  => setFormData(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }));
  const changeImage = (i, e) => {
    const arr = [...formData.images];
    arr[i] = e.target.files[0] || null;
    setFormData(p => ({ ...p, images: arr }));
  };

  /* ── Vehicles ── */
  const handleVehicle = (i, e) => {
    const { name, value, type, checked } = e.target;
    const arr = [...formData.vehicles];
    arr[i][name] = type === "checkbox" ? checked : value;
    setFormData(p => ({ ...p, vehicles: arr }));
  };
  const addVehicle = () =>
    setFormData(p => ({
      ...p,
      vehicles: [...p.vehicles, { name:"", vehicleNumber:"", totalSeats:"", seaterType:"2*2", pricePerSeat:0, isActive:true }],
    }));
  const removeVehicle = i => setFormData(p => ({ ...p, vehicles: p.vehicles.filter((_, j) => j !== i) }));

  /* ── Seat modal (redux) ── */
  const seatMapByKey  = useSelector(s => s.travel.seatMapByKey || {});
  const travelLoading = useSelector(s => s.travel.loading);
  const [showSeats, setShowSeats]   = useState(null);
  const [vehicleSeats, setVehicleSeats] = useState([]);

  useEffect(() => {
    if (!showSeats) return;
    const tourId    = formData?._id || formData?.id || formData?.travelId;
    const vehicleId = showSeats.vehicleId;
    const key = `${tourId}:${vehicleId}`;
    if (seatMapByKey[key]) setVehicleSeats(seatMapByKey[key]);
  }, [seatMapByKey, showSeats, formData]);

  const openSeats = vehicle => {
    const tourId    = formData?._id || formData?.id || formData?.travelId;
    const vehicleId = vehicle?._id || vehicle?.vehicleId || "";
    if (!tourId || !vehicleId) { setVehicleSeats([]); setShowSeats({ vehicleId: null }); return; }
    const key = `${tourId}:${vehicleId}`;
    if (seatMapByKey[key]) { setVehicleSeats(seatMapByKey[key]); setShowSeats({ vehicleId }); return; }
    setShowSeats({ vehicleId });
    dispatch(fetchSeatMap({ tourId, vehicleId }));
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const fd = new FormData();
    const plain = ["city","country","state","travelAgencyName","agencyId","agencyEmail",
      "agencyPhone","themes","visitngPlaces","overview","price","nights","days",
      "from","to","tourStartDate","starRating"];
    plain.forEach(k => fd.append(k, formData[k]));
    fd.append("isCustomizable", formData.isCustomizable ? "true" : "false");
    const tourEndDate = new Date(formData.tourStartDate);
    tourEndDate.setDate(tourEndDate.getDate() + Number(formData.days));
    fd.append("tourEndDate", tourEndDate.toISOString());
    fd.append("amenities",          JSON.stringify(formData.amenities));
    fd.append("inclusion",          JSON.stringify(formData.inclusion));
    fd.append("exclusion",          JSON.stringify(formData.exclusion));
    fd.append("dayWise",            JSON.stringify(formData.dayWise));
    fd.append("vehicles",           JSON.stringify(formData.vehicles));
    fd.append("termsAndConditions", JSON.stringify(formData.termsAndConditions));
    formData.images.forEach(img => { if (img instanceof File) fd.append("images", img); });
    try {
      showLoader();
      dispatch(createTravel(fd));
    } catch (err) {
      console.error(err);
    } finally {
      hideLoader();
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const visitPattern = /^[0-9]+N [a-zA-Z\s]+(\|[0-9]+N [a-zA-Z\s]+)*$/;
  const validVisit   = visitPattern.test(formData.visitngPlaces) || !formData.visitngPlaces;
  const openDate     = e => e.target.showPicker?.();

  /* ══════════════════════════════════════════════════════════
     STEP RENDERERS
  ══════════════════════════════════════════════════════════ */

  /* STEP 1 — Agency */
  const renderStep1 = () => (
    <Card title="Agency Information" subtitle="Basic details about your travel agency">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Agency Name" required>
          <input name="travelAgencyName" value={formData.travelAgencyName}
            onChange={handleChange} required placeholder="Your agency name" className={inputCls} />
        </Field>
        <Field label="Theme" required>
          <select name="themes" value={formData.themes} onChange={handleChange} required className={selectCls}>
            <option value="">Select theme</option>
            {["Winter","Summer","Honeymoon","Romantic","Adventure","Beach"].map(t =>
              <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Agency ID" required>
          <input name="agencyId" value={formData.agencyId} onChange={handleChange}
            required placeholder="AGY-2024-001" className={inputCls} />
        </Field>
        <Field label="Email" required>
          <input type="email" name="agencyEmail" value={formData.agencyEmail}
            onChange={handleChange} required placeholder="agency@example.com" className={inputCls} />
        </Field>
        <Field label="Phone" required>
          <input type="tel" name="agencyPhone" value={formData.agencyPhone}
            onChange={handleChange} required placeholder="+91 98765 43210" className={inputCls} />
        </Field>
      </div>
    </Card>
  );

  /* STEP 2 — Location */
  const renderStep2 = () => (
    <Card title="Location Details" subtitle="Where is this tour going?">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Country" required>
          <Select options={countries.map(c => ({ label: c.name, value: c.isoCode }))}
            value={countries.find(c => c.isoCode === formData.country)
              ? { label: countries.find(c => c.isoCode === formData.country).name, value: formData.country } : null}
            onChange={opt => setFormData(p => ({ ...p, country: opt.value }))}
            placeholder="Select country" styles={selectStyles} />
        </Field>
        <Field label="State">
          <Select options={states.map(s => ({ label: s.name, value: s.isoCode }))}
            value={states.find(s => s.isoCode === formData.state)
              ? { label: states.find(s => s.isoCode === formData.state).name, value: formData.state } : null}
            onChange={opt => setFormData(p => ({ ...p, state: opt.value }))}
            placeholder="Select state" styles={selectStyles} />
        </Field>
        <Field label="City">
          <Select options={cities.map(c => ({ label: c.name, value: c.name }))}
            value={formData.city ? { label: formData.city, value: formData.city } : null}
            onChange={opt => setFormData(p => ({ ...p, city: opt.value }))}
            placeholder="Select city" styles={selectStyles} />
        </Field>
      </div>
    </Card>
  );

  /* STEP 3 — Package */
  const renderStep3 = () => (
    <Card title="Package Details" subtitle="Dates, duration, pricing and overview">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Field label="Days" required>
          <select name="days" value={formData.days} onChange={handleChange} required className={selectCls}>
            <option value="">Days</option>
            {[...Array(30).keys()].map(i =>
              <option key={i+1} value={i+1}>{i+1} Day{i>0?"s":""}</option>)}
          </select>
        </Field>
        <Field label="Nights" required>
          <select name="nights" value={formData.nights} onChange={handleChange} required className={selectCls}>
            <option value="">Nights</option>
            {[...Array(30).keys()].map(i =>
              <option key={i+1} value={i+1}>{i+1} Night{i>0?"s":""}</option>)}
          </select>
        </Field>
        <Field label="Star Rating" required>
          <select name="starRating" value={formData.starRating} onChange={handleChange} required className={selectCls}>
            <option value="">Rating</option>
            {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Star{r>1?"s":""}</option>)}
          </select>
        </Field>
        <Field label="Price (₹)" required>
          <input type="number" name="price" value={formData.price} onChange={handleChange}
            required placeholder="0" className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Places to Visit" required error={!validVisit && formData.visitngPlaces ? "Format: 1N Bihar|2N Patna" : null}>
          <input name="visitngPlaces" value={formData.visitngPlaces} onChange={handleChange}
            required placeholder="1N Bihar|2N Patna|1N Delhi" className={inputCls} />
        </Field>
        <Field label="Package Overview" required>
          <textarea name="overview" value={formData.overview} onChange={handleChange}
            required rows={2} placeholder="Describe your travel package..." className={textareaCls} />
        </Field>
      </div>

      <div className="bg-indigo-50 rounded-xl p-4">
        <Field label="Customizable Package" required>
          <div className="flex gap-3 mt-1">
            {[{label:"Yes",value:true},{label:"No",value:false}].map(opt => (
              <button type="button" key={opt.label} onClick={() => handleCustomizable(opt.value)}
                className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all
                  ${formData.isCustomizable === opt.value
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {formData.isCustomizable ? (
            <>
              <Field label="From Date" required>
                <input type="date" name="from" value={formData.from} onChange={handleChange}
                  onClick={openDate} required className={inputCls} />
              </Field>
              <Field label="To Date" required>
                <input type="date" name="to" value={formData.to} onChange={handleChange}
                  onClick={openDate} required className={inputCls} />
              </Field>
            </>
          ) : (
            <Field label="Tour Start Date" required>
              <input type="date" name="tourStartDate" value={formData.tourStartDate}
                onChange={handleChange} onClick={openDate} required className={inputCls} />
            </Field>
          )}
        </div>
      </div>
    </Card>
  );

  /* STEP 4 — Inc / Exc / Amenities */
  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inclusions */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">✅ Inclusions</h3>
          {formData.inclusion.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input name="inclusion" value={item} onChange={e => handleChange(e, idx)}
                required placeholder={`Inclusion ${idx + 1}`}
                className="flex-1 px-3 py-1.5 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white" />
              {formData.inclusion.length > 1 && (
                <button type="button" onClick={() => removeInclusion(idx)}
                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs">
                  <MdDelete />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addInclusion}
            className="w-full mt-1 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1">
            <MdAdd /> Add Inclusion
          </button>
        </div>

        {/* Exclusions */}
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">❌ Exclusions</h3>
          {formData.exclusion.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input name="exclusion" value={item} onChange={e => handleChange(e, idx)}
                required placeholder={`Exclusion ${idx + 1}`}
                className="flex-1 px-3 py-1.5 text-sm border border-red-200 rounded-lg focus:outline-none focus:border-red-400 bg-white" />
              {formData.exclusion.length > 1 && (
                <button type="button" onClick={() => removeExclusion(idx)}
                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs">
                  <MdDelete />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addExclusion}
            className="w-full mt-1 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1">
            <MdAdd /> Add Exclusion
          </button>
        </div>
      </div>

      {/* Amenities */}
      <Card title="Amenities" subtitle="Select or type custom amenities">
        <Field label="Amenities" required>
          <CreatableSelect isMulti
            value={formData.amenities.map(a => ({ label: a, value: a }))}
            onChange={handleAmenitiesChange}
            options={(iconsList || []).map(icon => ({ label: icon.label, value: icon.label }))}
            placeholder="Select or type amenities..." styles={selectStyles} />
        </Field>
      </Card>
    </div>
  );

  /* STEP 5 — Day-wise Itinerary */
  const renderStep5 = () => (
    <Card title="Day-wise Itinerary" subtitle="Plan each day of the tour">
      <div className="space-y-3">
        {formData.dayWise.map((day, idx) => (
          <div key={idx} className="flex gap-3 items-start bg-purple-50 rounded-xl p-3 border border-purple-100">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
              <select name="day" value={day.day} onChange={e => handleDayWise(idx, e)} required
                className="px-2 py-1.5 text-sm border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 bg-white">
                <option value="">Day</option>
                {[...Array(30).keys()].map(i =>
                  <option key={i+1} value={i+1}>Day {i+1}</option>)}
              </select>
              <textarea name="description" value={day.description} onChange={e => handleDayWise(idx, e)}
                required rows={2} placeholder="Activities for this day..."
                className="md:col-span-3 px-2 py-1.5 text-sm border border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 resize-none bg-white" />
            </div>
            {formData.dayWise.length > 1 && (
              <button type="button" onClick={() => removeDay(idx)}
                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs mt-0.5 shrink-0">
                <MdDelete />
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addDay}
        className="w-full mt-4 py-2 text-sm font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
        <MdAdd /> Add Day
      </button>
    </Card>
  );

  /* STEP 6 — Terms */
  const renderStep6 = () => (
    <Card title="Terms & Conditions" subtitle="Define your policies">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: "cancellation", label: "Cancellation Policy", ph: "Cancellation terms..." },
          { name: "refund",       label: "Refund Policy",       ph: "Refund conditions..."  },
          { name: "bookingPolicy",label: "Booking Policy",      ph: "Booking requirements..."},
        ].map(({ name, label, ph }) => (
          <Field key={name} label={label} required>
            <textarea name={name} value={formData.termsAndConditions[name]}
              onChange={handleChange} required rows={5} placeholder={ph} className={textareaCls} />
          </Field>
        ))}
      </div>
    </Card>
  );

  /* STEP 7 — Vehicles */
  const renderStep7 = () => (
    <Card title="Vehicles" subtitle="Transport options for this tour">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              {["Type","Number","Seats","Seater","Price/Seat","Active","Actions"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formData.vehicles.map((v, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2">
                  <select name="name" value={v.name} onChange={e => handleVehicle(idx, e)} required
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm w-full bg-white">
                    <option value="">Select</option>
                    {["Deluxe Bus","AC Deluxe Bus","Luxury Coach","Tempo Traveller","Innova Crysta"].map(vt =>
                      <option key={vt} value={vt}>{vt}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input type="text" name="vehicleNumber" value={v.vehicleNumber}
                    onChange={e => handleVehicle(idx, e)} required placeholder="UP81AB1234"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm w-28 bg-white" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" name="totalSeats" value={v.totalSeats}
                    onChange={e => handleVehicle(idx, e)} required min="1"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm w-16 bg-white" />
                </td>
                <td className="px-3 py-2">
                  <select name="seaterType" value={v.seaterType} onChange={e => handleVehicle(idx, e)}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="2*2">2×2</option>
                    <option value="2*3">2×3</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input type="number" name="pricePerSeat" value={v.pricePerSeat}
                    onChange={e => handleVehicle(idx, e)} min="0"
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm w-24 bg-white" />
                </td>
                <td className="px-3 py-2 text-center">
                  <input type="checkbox" name="isActive" checked={v.isActive}
                    onChange={e => handleVehicle(idx, e)} className="w-4 h-4 cursor-pointer accent-indigo-600" />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openSeats(v)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-100 bg-white text-gray-600">
                      Seats
                    </button>
                    {formData.vehicles.length > 1 && (
                      <button type="button" onClick={() => removeVehicle(idx)}
                        className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs">
                        <MdDelete />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addVehicle}
        className="w-full mt-4 py-2 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2">
        <MdAdd /> Add Vehicle
      </button>
    </Card>
  );

  /* STEP 8 — Images */
  const renderStep8 = () => (
    <Card title="Images" subtitle="Upload photos for this travel package">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {formData.images.map((img, idx) => (
          <div key={idx} className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-700">Photo {idx + 1}</span>
              {formData.images.length > 0 && (
                <button type="button" onClick={() => removeImage(idx)}
                  className="p-0.5 bg-red-500 text-white rounded text-xs">
                  <MdClose size={12} />
                </button>
              )}
            </div>
            <input type="file" accept="image/*" onChange={e => changeImage(idx, e)}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-100 file:text-indigo-700 file:text-xs" />
            {img && (
              <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 truncate">
                <FaCheck size={10} /> {img.name}
              </p>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addImage}
        className="w-full py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
        <MdAdd /> Add Image
      </button>
    </Card>
  );

  /* STEP 9 — Preview */
  const renderStep9 = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
        <h2 className="text-lg font-black">Review Your Package</h2>
        <p className="text-indigo-200 text-xs mt-1">Please verify all details before submitting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agency */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Agency</h3>
          <PR label="Agency Name"  value={formData.travelAgencyName} />
          <PR label="Agency ID"    value={formData.agencyId} />
          <PR label="Email"        value={formData.agencyEmail} />
          <PR label="Phone"        value={formData.agencyPhone} />
          <PR label="Theme"        value={formData.themes} />
        </div>

        {/* Location & Package */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Location & Package</h3>
          <PR label="Country"      value={countries.find(c => c.isoCode === formData.country)?.name} />
          <PR label="State/City"   value={[formData.state, formData.city].filter(Boolean).join(", ")} />
          <PR label="Duration"     value={`${formData.days} Days / ${formData.nights} Nights`} />
          <PR label="Price"        value={formData.price ? `₹ ${formData.price}` : ""} />
          <PR label="Star Rating"  value={formData.starRating ? `${formData.starRating} ★` : ""} />
          <PR label="Places"       value={formData.visitngPlaces} />
          <PR label="Start Date"   value={formData.isCustomizable
            ? `${formData.from} → ${formData.to}` : formData.tourStartDate} />
          <PR label="Customizable" value={formData.isCustomizable ? "Yes" : "No"} />
        </div>
      </div>

      {/* Inclusions / Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2">Inclusions ({formData.inclusion.filter(Boolean).length})</h3>
          {formData.inclusion.filter(Boolean).map((i, idx) => (
            <p key={idx} className="text-xs text-gray-700 py-0.5">✓ {i}</p>
          ))}
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <h3 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2">Exclusions ({formData.exclusion.filter(Boolean).length})</h3>
          {formData.exclusion.filter(Boolean).map((i, idx) => (
            <p key={idx} className="text-xs text-gray-700 py-0.5">✗ {i}</p>
          ))}
        </div>
      </div>

      {/* Amenities */}
      {formData.amenities.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {formData.amenities.map(a => (
              <span key={a} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Itinerary */}
      {formData.dayWise.some(d => d.day) && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Itinerary ({formData.dayWise.length} days)</h3>
          <div className="space-y-1.5">
            {formData.dayWise.map((d, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">{d.day || idx+1}</span>
                <p className="text-xs text-gray-700">{d.description || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicles */}
      {formData.vehicles.some(v => v.name) && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Vehicles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400">
                {["Type","Number","Seats","Seater","Price/Seat"].map(h =>
                  <th key={h} className="pb-1.5 text-left font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>
                {formData.vehicles.filter(v => v.name).map((v, idx) => (
                  <tr key={idx} className="border-t border-gray-50">
                    <td className="py-1.5 text-gray-800">{v.name}</td>
                    <td className="py-1.5 text-gray-600">{v.vehicleNumber}</td>
                    <td className="py-1.5 text-gray-600">{v.totalSeats}</td>
                    <td className="py-1.5 text-gray-600">{v.seaterType}</td>
                    <td className="py-1.5 text-gray-600">₹{v.pricePerSeat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Images count */}
      {formData.images.filter(Boolean).length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Images</h3>
          <p className="text-sm text-gray-700">{formData.images.filter(Boolean).length} image(s) uploaded</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-amber-500 text-lg shrink-0">⚠️</span>
        <p className="text-xs text-amber-800">
          Please review all details carefully. Once submitted, changes may require re-submission.
          Click <strong>Submit Package</strong> below when ready.
        </p>
      </div>
    </div>
  );

  /* ── SEAT MODAL ── */
  const SeatModal = () => {
    if (!showSeats?.vehicleId) return null;
    const booked    = vehicleSeats.filter(s => s.isBooked || s.booked || s.status === "booked").length;
    const available = vehicleSeats.length - booked;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowSeats(null)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Seat Map</h3>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-200 inline-block" /> Booked: {booked}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-200 inline-block" /> Free: {available}</span>
            </div>
          </div>
          {travelLoading ? (
            <div className="text-center py-8 text-sm text-gray-400">Loading seats...</div>
          ) : vehicleSeats.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">No seat info available.</div>
          ) : (
            <div className="grid grid-cols-8 gap-1.5">
              {vehicleSeats.map((s, idx) => {
                const label   = s.seatNumber || s.seatNo || s.code || s.label || String(idx + 1);
                const booked  = s.isBooked || s.booked || s.status === "booked";
                return (
                  <div key={idx} className={`text-xs text-center py-1.5 rounded border font-medium
                    ${booked ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    {label}
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => setShowSeats(null)}
            className="mt-4 w-full py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    );
  };

  /* ── STEP CONTENT MAP ── */
  const stepContent = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
    8: renderStep8,
    9: renderStep9,
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Disclaimer />

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Travel Package Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Create and manage your premium travel packages</p>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        {/* Active step */}
        <div className="min-h-[400px]">
          {stepContent[step]?.()}
        </div>

        {/* Nav */}
        <Nav
          step={step}
          total={STEPS.length}
          onBack={() => setStep(s => Math.max(1, s - 1))}
          onNext={() => setStep(s => Math.min(STEPS.length, s + 1))}
          onSubmit={handleSubmit}
          isLast={step === STEPS.length}
        />
      </div>

      <SeatModal />
    </div>
  );
};

export default TravelForm;