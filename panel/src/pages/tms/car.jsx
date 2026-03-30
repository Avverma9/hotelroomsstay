import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Car as CarIcon,
  UserCircle,
  UploadCloud,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Users,
  Image as ImageIcon,
  ClipboardList,
} from 'lucide-react';
import { addCar, updateCar, getCarById, getSeatsData, getOwnerById, clearCarError, clearSelectedCar, clearSelectedOwner } from '../../../redux/slices/tms/travel/car';
import { getAllPartners } from '../../../redux/slices/partner';
import Breadcrumb from '../../components/breadcrumb';

const VEHICLE_TYPES = ['Bike', 'Car', 'Bus'];
const SHARING_TYPES = ['Private', 'Shared'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const STATUS_OPTIONS = ['Available', 'On A Trip', 'Trip Completed', 'Unavailable'];
const SEAT_TYPES = ['Window', 'Aisle', 'Middle'];
const TOTAL_STEPS = 5;

const STEPS = [
  { num: 1, label: 'Car Details', icon: CarIcon },
  { num: 2, label: 'Seats', icon: Users },
  { num: 3, label: 'Owner', icon: UserCircle },
  { num: 4, label: 'Images', icon: ImageIcon },
  { num: 5, label: 'Review', icon: ClipboardList },
];

const INITIAL_FORM_STATE = {
  make: '', model: '', year: '', vehicleType: 'Car', sharingType: 'Private',
  price: '', color: '', fuelType: 'Petrol', transmission: 'Automatic',
  runningStatus: 'Available', isAvailable: true, vehicleNumber: '',
  pickupP: '', dropP: '', pickupD: '', dropD: '', seater: '',
  extraKm: '', perPersonCost: '', mileage: '',
  ownerName: '', ownerEmail: '', ownerMobile: '', ownerDrivingLicence: '',
  ownerAadhar: '', ownerPAN: '', ownerAddress: '', ownerCity: '',
  ownerState: '', ownerPinCode: '', ownerId: '',
};

// ── Stepper (outside component — stable reference) ─────────────────────────────
const Stepper = ({ current, maxReachable, onStepClick }) => (
  <div className="flex items-center justify-center gap-1 sm:gap-2">
    {STEPS.map((s, i) => {
      const done = current > s.num;
      const active = current === s.num;
      const clickable = s.num <= maxReachable;
      const Icon = s.icon;
      return (
        <React.Fragment key={s.num}>
          {i > 0 && (
            <div className={`hidden sm:block h-0.5 w-8 rounded-full transition-colors ${done ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          )}
          <button
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onStepClick(s.num)}
            className="flex flex-col items-center gap-1 disabled:cursor-default"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
              done
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : active
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {done ? <CheckCircle2 size={16} /> : <Icon size={15} />}
            </div>
            <span className={`hidden sm:block text-[10px] font-bold uppercase tracking-wider ${active ? 'text-indigo-600' : done ? 'text-slate-600' : 'text-slate-400'}`}>{s.label}</span>
          </button>
        </React.Fragment>
      );
    })}
  </div>
);

// ── datetime-local formatter ───────────────────────────────────────────────────
const toLocalDT = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
};

// ── ReviewRow (outside component — stable reference) ────────────────────────────
const ReviewRow = ({ label, value }) =>
  value !== undefined && value !== null && value !== '' ? (
    <div className="flex items-start gap-2 py-1.5">
      <span className="w-40 shrink-0 text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{String(value)}</span>
    </div>
  ) : null;

// ════════════════════════════════════════════════════════════════════════════════
export default function AddCarForm({ isEditMode = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: carId } = useParams();

  const { selectedCar, selectedOwner, seatsData, loading, error } = useSelector((state) => state.car || {});
  const { partners = [], loading: partnersLoading } = useSelector((state) => state.partner || {});

  const [step, setStep] = useState(1);
  const [maxReachable, setMaxReachable] = useState(1);
  const [stepErrors, setStepErrors] = useState({});
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [carImages, setCarImages] = useState([]);
  const [dlImages, setDlImages] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [seatConfig, setSeatConfig] = useState([]);
  const [seatCountInput, setSeatCountInput] = useState('');

  const existingCarImages = isEditMode ? selectedCar?.images || [] : [];
  const existingDlImages = isEditMode ? selectedCar?.dlImage || [] : [];

  // ── Step 1 validation ──────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    if (!formData.make.trim()) errs.make = 'Required';
    if (!formData.model.trim()) errs.model = 'Required';
    if (!formData.year || Number(formData.year) < 1980 || Number(formData.year) > 2030) errs.year = 'Valid year required';
    if (!formData.color.trim()) errs.color = 'Required';
    if (!formData.price || Number(formData.price) <= 0) errs.price = 'Required';
    return errs;
  };

  // ── Seat helpers ───────────────────────────────────────────────────────────
  const generateSeats = () => {
    const count = parseInt(seatCountInput, 10);
    if (!count || count < 1 || count > 60) return;
    const seats = Array.from({ length: count }, (_, i) => ({
      seatNumber: i + 1,
      seatType: i % 3 === 0 ? 'Window' : i % 3 === 1 ? 'Aisle' : 'Middle',
      seatPrice: '',
      isBooked: false,
      bookedBy: '',
    }));
    setSeatConfig(seats);
    setFormData((p) => ({ ...p, seater: String(count) }));
  };

  const addSeat = () =>
    setSeatConfig((prev) => {
      const next = [...prev, { seatNumber: prev.length + 1, seatType: 'Window', seatPrice: '', isBooked: false, bookedBy: '' }];
      setFormData((p) => ({ ...p, seater: String(next.length) }));
      return next;
    });

  const removeSeat = (idx) =>
    setSeatConfig((prev) => {
      const next = prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, seatNumber: i + 1 }));
      setFormData((p) => ({ ...p, seater: next.length ? String(next.length) : p.seater }));
      return next;
    });

  const updateSeat = (idx, field, value) =>
    setSeatConfig((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  // ── Generic handlers ───────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    // Bug fix: clear seatConfig when switching away from Shared
    if (name === 'sharingType' && value !== 'Shared') {
      setSeatConfig([]);
      setSeatCountInput('');
      setFormData((prev) => ({ ...prev, [name]: value, seater: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (stepErrors[name]) setStepErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePartnerSelect = (e) => {
    const partnerId = e.target.value;
    setSelectedPartnerId(partnerId);
    if (!partnerId) {
      setFormData((prev) => ({ ...prev, ownerId: '', ownerName: '', ownerEmail: '', ownerMobile: '' }));
      return;
    }
    const partner = partners.find((p) => p._id === partnerId);
    if (partner) {
      setFormData((prev) => ({
        ...prev,
        ownerId: partner._id,
        ownerName: partner.name || partner.fullName || partner.username || '',
        ownerEmail: partner.email || partner.ownerEmail || '',
        ownerMobile: partner.mobile || partner.phone || '',
      }));
    }
  };

  const handleFileChange = (e, setFileState) => {
    if (e.target.files) setFileState((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const removeFile = (index, fileState, setFileState) => {
    const n = [...fileState];
    n.splice(index, 1);
    setFileState(n);
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(getAllPartners());
    if (isEditMode && carId) {
      dispatch(getCarById(carId));
      dispatch(getSeatsData(carId));
    }
    return () => { dispatch(clearSelectedCar()); dispatch(clearSelectedOwner()); dispatch(clearCarError()); };
  }, [dispatch, isEditMode, carId]);

  useEffect(() => {
    if (isEditMode && selectedCar) {
      const carData = { ...INITIAL_FORM_STATE };
      for (const key in carData) {
        if (selectedCar[key] !== undefined && selectedCar[key] !== null) carData[key] = selectedCar[key];
      }
      // Fix datetime-local format (API returns ISO, input needs YYYY-MM-DDTHH:MM)
      carData.pickupD = toLocalDT(selectedCar.pickupD);
      carData.dropD = toLocalDT(selectedCar.dropD);

      // Handle populated ownerId (Mongoose populate returns object, not string)
      const ownerRef = selectedCar.ownerId;
      const resolvedOwnerId =
        typeof ownerRef === 'object' && ownerRef?._id
          ? ownerRef._id
          : typeof ownerRef === 'string'
          ? ownerRef
          : '';
      if (resolvedOwnerId) {
        carData.ownerId = resolvedOwnerId;
        // If already populated, map owner fields directly
        if (typeof ownerRef === 'object' && ownerRef?._id) {
          carData.ownerName = ownerRef.name || ownerRef.ownerName || '';
          carData.ownerEmail = ownerRef.email || ownerRef.ownerEmail || '';
          carData.ownerMobile = ownerRef.mobile || ownerRef.phone || ownerRef.ownerMobile || '';
          carData.ownerDrivingLicence = ownerRef.drivingLicence || ownerRef.ownerDrivingLicence || '';
          carData.ownerAadhar = ownerRef.aadhar || ownerRef.ownerAadhar || '';
          carData.ownerPAN = ownerRef.PAN || ownerRef.pan || ownerRef.ownerPAN || '';
          carData.ownerAddress = ownerRef.address || ownerRef.ownerAddress || '';
          carData.ownerCity = ownerRef.city || ownerRef.ownerCity || '';
          carData.ownerState = ownerRef.state || ownerRef.ownerState || '';
          carData.ownerPinCode = String(ownerRef.pinCode || ownerRef.ownerPinCode || '');
        }
      }

      setFormData(carData);
      setCarImages([]);
      setDlImages([]);

      // Load embedded seatConfig only when full objects (not bare ObjectId strings)
      const sc = selectedCar.seatConfig;
      if (Array.isArray(sc) && sc.length > 0 && typeof sc[0] === 'object' && sc[0].seatNumber) {
        setSeatConfig(sc);
        setSeatCountInput(String(sc.length));
      }

      // Match partner dropdown to existing ownerId
      if (resolvedOwnerId) {
        const matched = partners.find((p) => p._id === resolvedOwnerId);
        if (matched) setSelectedPartnerId(resolvedOwnerId);
        // Fetch owner doc to populate owner fields (for non-populated responses)
        dispatch(getOwnerById(resolvedOwnerId));
      }

      // In edit mode all steps are reachable
      setMaxReachable(TOTAL_STEPS);
    }
  }, [isEditMode, selectedCar]);

  // Match partner dropdown once BOTH selectedCar and partners list are available
  // (partners may load after selectedCar, so a separate effect is needed)
  useEffect(() => {
    if (!isEditMode || !selectedCar || !partners.length || selectedPartnerId) return;
    const ownerRef = selectedCar.ownerId;
    const resolvedOwnerId =
      typeof ownerRef === 'object' && ownerRef?._id
        ? ownerRef._id
        : typeof ownerRef === 'string'
        ? ownerRef
        : '';
    if (resolvedOwnerId && partners.find((p) => p._id === resolvedOwnerId)) {
      setSelectedPartnerId(resolvedOwnerId);
    }
  }, [isEditMode, selectedCar, partners]);

  // Populate seatConfig from getSeatsData response
  useEffect(() => {
    if (isEditMode && seatsData) {
      const seats = Array.isArray(seatsData) ? seatsData : seatsData?.seats || [];
      if (seats.length > 0) {
        setSeatConfig(seats);
        setSeatCountInput(String(seats.length));
        setFormData((prev) => ({ ...prev, seater: String(seats.length) }));
      }
    }
  }, [isEditMode, seatsData]);

  // Populate owner fields from getOwnerById response
  useEffect(() => {
    if (isEditMode && selectedOwner) {
      setFormData((prev) => ({
        ...prev,
        ownerName: selectedOwner.name || selectedOwner.ownerName || prev.ownerName,
        ownerEmail: selectedOwner.email || selectedOwner.ownerEmail || prev.ownerEmail,
        ownerMobile: selectedOwner.mobile || selectedOwner.phone || selectedOwner.ownerMobile || prev.ownerMobile,
        ownerDrivingLicence: selectedOwner.drivingLicence || selectedOwner.ownerDrivingLicence || prev.ownerDrivingLicence,
        ownerAadhar: selectedOwner.aadhar || selectedOwner.ownerAadhar || prev.ownerAadhar,
        ownerPAN: selectedOwner.PAN || selectedOwner.pan || selectedOwner.ownerPAN || prev.ownerPAN,
        ownerAddress: selectedOwner.address || selectedOwner.ownerAddress || prev.ownerAddress,
        ownerCity: selectedOwner.city || selectedOwner.ownerCity || prev.ownerCity,
        ownerState: selectedOwner.state || selectedOwner.ownerState || prev.ownerState,
        ownerPinCode: String(selectedOwner.pinCode || selectedOwner.ownerPinCode || prev.ownerPinCode || ''),
      }));
    }
  }, [isEditMode, selectedOwner]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const next = () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) { setStepErrors(errs); return; }
      setStepErrors({});
    }
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    setStep(nextStep);
    setMaxReachable((prev) => Math.max(prev, nextStep));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSuccessMsg('');
    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (val !== '' && val !== undefined && val !== null) submitData.append(key, val);
    });
    carImages.forEach((file) => submitData.append('images', file));
    dlImages.forEach((file) => submitData.append('dlImage', file));
    // Bug fix: only send seatConfig for Shared vehicles
    if (formData.sharingType === 'Shared' && seatConfig.length > 0) {
      submitData.append('seatConfig', JSON.stringify(seatConfig));
    }

    try {
      if (isEditMode) {
        await dispatch(updateCar({ carId, carData: submitData })).unwrap();
        setSuccessMsg('Vehicle details updated successfully.');
      } else {
        await dispatch(addCar(submitData)).unwrap();
        setSuccessMsg('Vehicle and Owner details successfully added.');
        setFormData(INITIAL_FORM_STATE);
        setCarImages([]);
        setDlImages([]);
        setSeatConfig([]);
        setSeatCountInput('');
        setStep(1);
        setMaxReachable(1);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/your-cars'), 2000);
    } catch (err) {
      console.error('Submission failed', err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Shared classes ─────────────────────────────────────────────────────────
  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 placeholder:font-normal";
  const inputErrClass = "w-full rounded-lg border border-rose-400 bg-rose-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-rose-500 focus:ring-1 focus:ring-rose-400 placeholder:text-slate-400 placeholder:font-normal";
  const labelClass = "mb-1.5 block text-[13px] font-bold text-slate-700";

  const field = (name) => ({
    name,
    value: formData[name],
    onChange: handleTextChange,
    className: stepErrors[name] ? inputErrClass : inputClass,
  });

  // ── Loading gate ───────────────────────────────────────────────────────────
  if (isEditMode && loading && !selectedCar) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6">
          <Breadcrumb />
          <button type="button" onClick={() => navigate(-1)} className="flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 mb-3">
            <ArrowLeft size={16} className="mr-2" />Back to Your Cars
          </button>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 mb-1">Travel Management</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{isEditMode ? 'Edit Vehicle' : 'Onboard New Vehicle'}</h1>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3.5 shadow-sm">
            <div className="flex items-center gap-2.5 text-sm font-bold text-rose-700"><AlertCircle size={16} /><p>{error}</p></div>
            <button type="button" onClick={() => dispatch(clearCarError())} className="text-rose-500 hover:text-rose-700"><X size={16} /></button>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 shadow-sm text-sm font-bold text-emerald-700">
            <CheckCircle2 size={16} /><p>{successMsg}</p>
          </div>
        )}
        {Object.keys(stepErrors).length > 0 && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 shadow-sm text-sm font-bold text-rose-700">
            <AlertCircle size={16} /><p>Please fill in all required fields before proceeding.</p>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-6">
          <Stepper current={step} maxReachable={maxReachable} onStepClick={setStep} />
        </div>

        {/* Card wrapper */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">

          {/* ───── STEP 1 — Car Details ────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100"><CarIcon size={18} /></div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Vehicle Specifications</h2>
                  <p className="text-xs text-slate-500 font-medium">Technical details, pricing & route information.</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className={labelClass}>Make (Brand) <span className="text-rose-500">*</span></label>
                    <input type="text" {...field('make')} placeholder="e.g. Toyota" />
                    {stepErrors.make && <p className="mt-1 text-[11px] font-bold text-rose-500">{stepErrors.make}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Model <span className="text-rose-500">*</span></label>
                    <input type="text" {...field('model')} placeholder="e.g. Innova" />
                    {stepErrors.model && <p className="mt-1 text-[11px] font-bold text-rose-500">{stepErrors.model}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Year <span className="text-rose-500">*</span></label>
                    <input type="number" {...field('year')} placeholder="2023" />
                    {stepErrors.year && <p className="mt-1 text-[11px] font-bold text-rose-500">{stepErrors.year}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Color <span className="text-rose-500">*</span></label>
                    <input type="text" {...field('color')} placeholder="Pearl White" />
                    {stepErrors.color && <p className="mt-1 text-[11px] font-bold text-rose-500">{stepErrors.color}</p>}
                  </div>
                  <div><label className={labelClass}>Vehicle Type <span className="text-rose-500">*</span></label><select {...field('vehicleType')} className={inputClass}>{VEHICLE_TYPES.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>Sharing Mode <span className="text-rose-500">*</span></label><select {...field('sharingType')} className={inputClass}>{SHARING_TYPES.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>Fuel Type <span className="text-rose-500">*</span></label><select {...field('fuelType')} className={inputClass}>{FUEL_TYPES.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                  <div><label className={labelClass}>Transmission <span className="text-rose-500">*</span></label><select {...field('transmission')} className={inputClass}>{TRANSMISSIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                  <div>
                    <label className={labelClass}>Price (₹) <span className="text-rose-500">*</span></label>
                    <input type="number" {...field('price')} placeholder="1500" />
                    {stepErrors.price && <p className="mt-1 text-[11px] font-bold text-rose-500">{stepErrors.price}</p>}
                  </div>
                  <div><label className={labelClass}>Mileage (kmpl)</label><input type="number" {...field('mileage')} placeholder="15" /></div>
                  <div><label className={labelClass}>Extra KM</label><input type="number" {...field('extraKm')} placeholder="50" /></div>
                  <div><label className={labelClass}>Per Person Cost (₹)</label><input type="number" {...field('perPersonCost')} placeholder="300" /></div>
                  <div><label className={labelClass}>Vehicle Number</label><input type="text" {...field('vehicleNumber')} placeholder="UP32AB1234" /></div>
                  <div>
                    <label className={labelClass}>Seating Capacity</label>
                    <input
                      type="number"
                      {...field('seater')}
                      placeholder="e.g. 7"
                      disabled={formData.sharingType === 'Shared' && seatConfig.length > 0}
                      title={formData.sharingType === 'Shared' && seatConfig.length > 0 ? 'Auto-set by seat configuration' : ''}
                    />
                    {formData.sharingType === 'Shared' && seatConfig.length > 0 && (
                      <p className="mt-1 text-[11px] text-violet-600 font-semibold">Auto-set by seat config ({seatConfig.length})</p>
                    )}
                  </div>
                  <div><label className={labelClass}>Running Status</label><select {...field('runningStatus')} className={inputClass}>{STATUS_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                  <div className="flex flex-col justify-center gap-1.5">
                    <label className={labelClass}>Availability</label>
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input type="checkbox" name="isAvailable" checked={Boolean(formData.isAvailable)} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-semibold text-slate-700">Available</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Route & Schedule</p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div><label className={labelClass}>Pickup Point</label><input type="text" {...field('pickupP')} placeholder="Delhi" /></div>
                    <div><label className={labelClass}>Drop Point</label><input type="text" {...field('dropP')} placeholder="Agra" /></div>
                    <div><label className={labelClass}>Pickup Date & Time</label><input type="datetime-local" {...field('pickupD')} /></div>
                    <div><label className={labelClass}>Drop Date & Time</label><input type="datetime-local" {...field('dropD')} /></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───── STEP 2 — Seat Configuration ────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100"><Users size={18} /></div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Seat Configuration</h2>
                  <p className="text-xs text-slate-500 font-medium">Define seat layout for shared vehicles.</p>
                </div>
              </div>
              <div className="p-6">
                {formData.sharingType !== 'Shared' ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                    <Users size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">Seat configuration is only for Shared vehicles</p>
                    <p className="mt-1 text-xs text-slate-400">Go back to Step 1 and change Sharing Mode to "Shared" to configure seats.</p>
                  </div>
                ) : (
                  <>
                    {/* Generate bar */}
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex-1">
                        <label className={labelClass}>How many seats?</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={seatCountInput}
                          onChange={(e) => setSeatCountInput(e.target.value)}
                          placeholder="e.g. 7"
                          className={inputClass + ' max-w-[160px]'}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={generateSeats}
                        disabled={!seatCountInput || parseInt(seatCountInput) < 1}
                        className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} />Generate Seat Layout
                      </button>
                    </div>

                    {seatConfig.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                        <Users size={28} className="text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-400">No seats configured yet</p>
                        <p className="mt-1 text-xs text-slate-400">Enter total seats above and click "Generate Seat Layout".</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{seatConfig.length} seat{seatConfig.length !== 1 ? 's' : ''}</p>
                          <button type="button" onClick={addSeat} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700"><Plus size={13} />Add Seat</button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {seatConfig.map((seat, idx) => (
                            <div key={idx} className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors">
                              <button type="button" onClick={() => removeSeat(idx)} className="absolute right-2.5 top-2.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={13} /></button>
                              <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-[11px] font-extrabold text-violet-700">{seat.seatNumber}</span>
                                <span className="text-sm font-bold text-slate-800">Seat #{seat.seatNumber}</span>
                              </div>
                              <div className="space-y-2.5">
                                <div>
                                  <label className="mb-1 block text-[11px] font-bold text-slate-500">Type</label>
                                  <select value={seat.seatType} onChange={(e) => updateSeat(idx, 'seatType', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                    {SEAT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-bold text-slate-500">Price (₹)</label>
                                  <input
                                    type="number"
                                    placeholder="500"
                                    value={seat.seatPrice}
                                    onChange={(e) => updateSeat(idx, 'seatPrice', e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <label className="inline-flex cursor-pointer items-center gap-2">
                                  <input type="checkbox" checked={seat.isBooked} onChange={(e) => updateSeat(idx, 'isBooked', e.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600" />
                                  <span className="text-[11px] font-bold text-slate-600">Booked</span>
                                </label>
                                {seat.isBooked && (
                                  <div>
                                    <label className="mb-1 block text-[11px] font-bold text-slate-500">Booked By</label>
                                    <input type="text" placeholder="User ID or Name" value={seat.bookedBy} onChange={(e) => updateSeat(idx, 'bookedBy', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 placeholder:font-normal" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* ───── STEP 3 — Owner Details ──────────────────────────────────── */}
          {step === 3 && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100"><UserCircle size={18} /></div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Owner / Driver Profile</h2>
                  <p className="text-xs text-slate-500 font-medium">Select an existing partner or enter new owner details.</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Select Owner (Partner)</label>
                  <select value={selectedPartnerId} onChange={handlePartnerSelect} className={inputClass}>
                    <option value="">Choose existing partner (optional)</option>
                    {partners.map((p) => <option key={p._id} value={p._id}>{p.name || p.fullName || p.email || p._id}</option>)}
                  </select>
                  {partnersLoading && <p className="mt-1 text-xs font-medium text-slate-500">Loading partners...</p>}
                  {formData.ownerId && <p className="mt-1.5 text-[11px] font-semibold text-indigo-600">Owner ID: {formData.ownerId}</p>}
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Or enter manually</p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div><label className={labelClass}>Full Name</label><input type="text" {...field('ownerName')} placeholder="Ramesh Kumar" /></div>
                    <div><label className={labelClass}>Email</label><input type="email" {...field('ownerEmail')} placeholder="ramesh@example.com" /></div>
                    <div><label className={labelClass}>Mobile</label><input type="tel" {...field('ownerMobile')} placeholder="9876543210" /></div>
                    <div><label className={labelClass}>Driving Licence No.</label><input type="text" {...field('ownerDrivingLicence')} placeholder="DL0420220012345" /></div>
                    <div><label className={labelClass}>Aadhar</label><input type="text" {...field('ownerAadhar')} placeholder="123456789012" /></div>
                    <div><label className={labelClass}>PAN</label><input type="text" {...field('ownerPAN')} placeholder="ABCDE1234F" /></div>
                    <div className="sm:col-span-2 lg:col-span-3"><label className={labelClass}>Address</label><input type="text" {...field('ownerAddress')} placeholder="12 Main Street, Sector 5" /></div>
                    <div><label className={labelClass}>City</label><input type="text" {...field('ownerCity')} placeholder="Delhi" /></div>
                    <div><label className={labelClass}>State</label><input type="text" {...field('ownerState')} placeholder="Delhi" /></div>
                    <div><label className={labelClass}>PIN Code</label><input type="number" {...field('ownerPinCode')} placeholder="110001" /></div>
                  </div>
                </div>
                {/* DL Scans */}
                <div className="border-t border-slate-100 pt-5">
                  <label className={labelClass}>Driving Licence Scans</label>
                  {existingDlImages.length > 0 && (
                    <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {existingDlImages.map((url, i) => (
                        <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">View file {i + 1}</a>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <UploadCloud className="h-6 w-6 text-slate-400" />
                      <label htmlFor="dl-images" className="relative cursor-pointer rounded-md bg-white px-3 py-1.5 font-bold text-indigo-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:text-indigo-500">
                        <span>Select DL files</span>
                        <input id="dl-images" type="file" multiple className="sr-only" onChange={(e) => handleFileChange(e, setDlImages)} accept="image/*,.pdf" />
                      </label>
                    </div>
                  </div>
                  {dlImages.length > 0 && (
                    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {dlImages.map((file, i) => (
                        <li key={i} className="relative flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                          <span className="truncate pr-5">{file.name}</span>
                          <button type="button" onClick={() => removeFile(i, dlImages, setDlImages)} className="absolute right-2 text-slate-400 hover:text-rose-500"><X size={13} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ───── STEP 4 — Images ─────────────────────────────────────────── */}
          {step === 4 && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100"><ImageIcon size={18} /></div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Vehicle Images</h2>
                  <p className="text-xs text-slate-500 font-medium">Upload photos of the vehicle.</p>
                </div>
              </div>
              <div className="p-6">
                {existingCarImages.length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Existing Images</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {existingCarImages.map((url, i) => (
                        <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <img src={url} alt={`Vehicle ${i + 1}`} className="h-28 w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 hover:bg-slate-50 transition-colors">
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <div className="flex text-sm leading-6 text-slate-600 justify-center items-center gap-2">
                      <label htmlFor="car-images" className="relative cursor-pointer rounded-md bg-white px-3 py-1.5 font-bold text-indigo-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:text-indigo-500">
                        <span>Upload files</span>
                        <input id="car-images" type="file" multiple className="sr-only" onChange={(e) => handleFileChange(e, setCarImages)} accept="image/*" />
                      </label>
                      <p className="font-medium">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">PNG, JPG, GIF up to 5MB each</p>
                  </div>
                </div>
                {carImages.length > 0 && (
                  <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {carImages.map((file, i) => (
                      <li key={i} className="relative flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                        <span className="truncate pr-5">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i, carImages, setCarImages)} className="absolute right-2 text-slate-400 hover:text-rose-500"><X size={13} /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* ───── STEP 5 — Review & Submit ────────────────────────────────── */}
          {step === 5 && (
            <>
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200"><ClipboardList size={18} /></div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Review & Submit</h2>
                  <p className="text-xs text-slate-500 font-medium">Verify all details before submitting.</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Vehicle */}
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600"><CarIcon size={13} />Vehicle</p>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100">
                    <ReviewRow label="Make / Model" value={`${formData.make} ${formData.model}`.trim() || undefined} />
                    <ReviewRow label="Year" value={formData.year} />
                    <ReviewRow label="Color" value={formData.color} />
                    <ReviewRow label="Vehicle Type" value={formData.vehicleType} />
                    <ReviewRow label="Sharing" value={formData.sharingType} />
                    <ReviewRow label="Fuel / Trans." value={`${formData.fuelType} / ${formData.transmission}`} />
                    <ReviewRow label="Price" value={formData.price ? `₹${formData.price}` : undefined} />
                    <ReviewRow label="Mileage" value={formData.mileage ? `${formData.mileage} kmpl` : undefined} />
                    <ReviewRow label="Extra KM" value={formData.extraKm} />
                    <ReviewRow label="Per Person Cost" value={formData.perPersonCost ? `₹${formData.perPersonCost}` : undefined} />
                    <ReviewRow label="Seating Capacity" value={formData.seater} />
                    <ReviewRow label="Vehicle No." value={formData.vehicleNumber} />
                    <ReviewRow label="Status" value={formData.runningStatus} />
                    <ReviewRow label="Available" value={formData.isAvailable ? 'Yes' : 'No'} />
                    <ReviewRow label="Route" value={(formData.pickupP || formData.dropP) ? `${formData.pickupP || '-'} → ${formData.dropP || '-'}` : undefined} />
                    <ReviewRow label="Pickup Date" value={formData.pickupD} />
                    <ReviewRow label="Drop Date" value={formData.dropD} />
                  </div>
                </div>

                {/* Seats */}
                {formData.sharingType === 'Shared' && seatConfig.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-600"><Users size={13} />Seats ({seatConfig.length})</p>
                    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {seatConfig.map((s) => (
                        <div key={s.seatNumber} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-violet-100 text-[10px] font-extrabold text-violet-700">{s.seatNumber}</span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-700">{s.seatType}{s.seatPrice ? ` · ₹${s.seatPrice}` : ''}</p>
                            <p className="text-[10px] text-slate-400">{s.isBooked ? `Booked${s.bookedBy ? ` by ${s.bookedBy}` : ''}` : 'Available'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner */}
                {(formData.ownerName || formData.ownerId) && (
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600"><UserCircle size={13} />Owner</p>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100">
                      <ReviewRow label="Owner ID" value={formData.ownerId} />
                      <ReviewRow label="Name" value={formData.ownerName} />
                      <ReviewRow label="Email" value={formData.ownerEmail} />
                      <ReviewRow label="Mobile" value={formData.ownerMobile} />
                      <ReviewRow label="Driving Licence" value={formData.ownerDrivingLicence} />
                      <ReviewRow label="Aadhar" value={formData.ownerAadhar} />
                      <ReviewRow label="PAN" value={formData.ownerPAN} />
                      <ReviewRow label="Address" value={[formData.ownerAddress, formData.ownerCity, formData.ownerState, formData.ownerPinCode].filter(Boolean).join(', ') || undefined} />
                    </div>
                  </div>
                )}

                {/* Images summary */}
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600"><ImageIcon size={13} />Images</p>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    {carImages.length === 0 && dlImages.length === 0 ? (
                      <p className="text-xs text-slate-400">No images uploaded.</p>
                    ) : (
                      <p className="text-sm font-semibold text-slate-700">
                        {carImages.length > 0 && `${carImages.length} vehicle image${carImages.length !== 1 ? 's' : ''}`}
                        {carImages.length > 0 && dlImages.length > 0 && ', '}
                        {dlImages.length > 0 && `${dlImages.length} DL scan${dlImages.length !== 1 ? 's' : ''}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ───── Footer Navigation ───────────────────────────────────────── */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4">
            <div>
              {step > 1 && (
                <button type="button" onClick={prev} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  <ArrowLeft size={15} />Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => navigate('/your-cars')} className="px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">Cancel</button>
              {step < TOTAL_STEPS ? (
                <button type="button" onClick={next} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors">
                  Next<ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (<><Loader2 size={16} className="animate-spin" />Processing...</>) : (<><Save size={16} />{isEditMode ? 'Save Changes' : 'Submit Record'}</>)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
