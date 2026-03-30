import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
// Ensure this path matches your file structure
import { getCarById, deleteCarById, getOwnerById, clearSelectedCar, clearSelectedOwner } from '../../../redux/slices/tms/travel/car';
import Breadcrumb from '../../components/breadcrumb';
import { 
  Loader2, 
  AlertTriangle, 
  ArrowLeft, 
  PencilLine, 
  Trash2, 
  CalendarDays, 
  Users, 
  Fuel, 
  Settings2, 
  Tag, 
  Hash, 
  MapPin, 
  UserCircle, 
  Car, 
  Banknote, 
  Phone, 
  Mail, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  Gauge, 
  Activity,
  Image as ImageIcon,
  FileBox,
  CheckCircle2
} from 'lucide-react';

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop";

// Sleek Key-Value Row Component
const InfoRow = ({ icon, label, value, highlight = false }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 group">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">{icon}</span>
        <span className="text-[13px] font-semibold">{label}</span>
      </div>
      <span className={`text-sm font-bold text-right max-w-[60%] truncate ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
};

// Section Container
const DetailSection = ({ title, icon: TitleIcon, items }) => {
  const hasVisibleItems = items.some(item => item.value !== undefined && item.value !== null && item.value !== '');
  if (!hasVisibleItems) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200">
          <TitleIcon size={16} />
        </div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>
      <div className="flex flex-col">
        {items.map((item, idx) => (
          <InfoRow key={`${item.label}-${idx}`} icon={item.icon} label={item.label} value={item.value} highlight={item.highlight} />
        ))}
      </div>
    </div>
  );
};

// Media Gallery Component
const MediaGallery = ({ items, type = 'image' }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm font-medium text-slate-500">
        No media files uploaded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {type === 'image' ? (
        items.map((item, index) => (
          <a
            key={`img-${index}`}
            href={item}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-inset ring-slate-200 shadow-sm"
          >
            <img src={item} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-slate-900/0 transition-colors group-hover:bg-slate-900/10"></div>
          </a>
        ))
      ) : (
        items.map((item, index) => (
          <a
            key={`file-${index}`}
            href={item}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
          >
            <FileBox size={20} className="text-slate-400 shrink-0" />
            <span className="truncate">Document {index + 1}</span>
          </a>
        ))
      )}
    </div>
  );
};

const ViewCar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: carId } = useParams();
  const { selectedCar: car, selectedOwner, loading, error } = useSelector((state) => state.car);

  // Tab State Management
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'owner' | 'media'

  useEffect(() => {
    if (carId) dispatch(getCarById(carId));
    return () => {
      dispatch(clearSelectedCar());
      dispatch(clearSelectedOwner());
    };
  }, [dispatch, carId]);

  useEffect(() => {
    if (!car?.ownerId) return;
    const ownerId = typeof car.ownerId === 'object' ? car.ownerId._id || car.ownerId.id : car.ownerId;
    if (ownerId) dispatch(getOwnerById(ownerId));
  }, [dispatch, car?.ownerId]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to permanently delete this vehicle? This cannot be undone.')) {
      dispatch(deleteCarById(carId))
        .unwrap()
        .then(() => navigate('/your-cars'))
        .catch((err) => console.error('Failed to delete car:', err));
    }
  };

  // Only block the full view when car is not yet fetched; subsequent loads (owner, etc.) show inline
  if (!car) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-slate-500">Fetching vehicle records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center max-w-md shadow-sm">
          <AlertTriangle size={32} className="text-rose-500 mb-2" />
          <h2 className="text-lg font-bold text-rose-900">Unable to load details</h2>
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <button onClick={() => navigate('/your-cars')} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-bold text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200 hover:bg-rose-100 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Derived Data
  const imageUrl = car?.images?.[0] || FALLBACK_IMAGE;
  const ownerRecordRaw = selectedOwner?.data || selectedOwner?.owner || selectedOwner || (car?.ownerId && typeof car.ownerId === 'object' ? car.ownerId : null);
  const ownerRecord = ownerRecordRaw || {};
  
  const ownerIdValue = typeof car.ownerId === 'string' ? car.ownerId : ownerRecord?._id || ownerRecord?.id || car.ownerId;
  const ownerDisplayName = ownerRecord?.name || ownerRecord?.fullName || ownerRecord?.ownerName || ownerRecord?.username || car.ownerName || 'Unknown Owner';
  const ownerDisplayEmail = ownerRecord?.email || ownerRecord?.ownerEmail || ownerRecord?.emailId || car.ownerEmail || 'Not available';
  const ownerDisplayMobile = ownerRecord?.mobile || ownerRecord?.phone || ownerRecord?.ownerMobile || ownerRecord?.mobileNumber || car.ownerMobile || 'Not available';
  const ownerDisplayAadhar = ownerRecord?.aadhar || ownerRecord?.aadharNumber || ownerRecord?.ownerAadhar || ownerRecord?.adharNumber || car.ownerAadhar || 'Not available';
  const ownerDisplayPan = ownerRecord?.pan || ownerRecord?.panNumber || ownerRecord?.ownerPAN || ownerRecord?.panNumber || car.ownerPAN || 'Not available';
  const ownerDisplayLicence = ownerRecord?.drivingLicence || ownerRecord?.drivingLicense || ownerRecord?.ownerDrivingLicence || ownerRecord?.licenseNumber || car.ownerDrivingLicence || 'Not available';

  // Section Configurations
  const specItems = [
    { label: 'Make & Model', value: `${car.make} ${car.model}`, icon: <Car size={14} /> },
    { label: 'Mfg. Year', value: car.year, icon: <CalendarDays size={14} /> },
    { label: 'Registration No.', value: car.vehicleNumber, icon: <Hash size={14} /> },
    { label: 'Color', value: car.color, icon: <Tag size={14} /> },
    { label: 'Fuel Setup', value: car.fuelType, icon: <Fuel size={14} /> },
    { label: 'Transmission', value: car.transmission, icon: <Settings2 size={14} /> },
    { label: 'Seating Limit', value: car.seater ? `${car.seater} Seats` : '', icon: <Users size={14} /> },
    { label: 'Est. Mileage', value: car.mileage ? `${car.mileage} kmpl` : '', icon: <Gauge size={14} /> },
  ];

  const locationItems = [
    { label: 'Default Pickup', value: car.pickupP, icon: <MapPin size={14} /> },
    { label: 'Default Dropoff', value: car.dropP, icon: <MapPin size={14} /> },
  ];

  const ownerItems = [
    { label: 'Full Name', value: ownerDisplayName, icon: <UserCircle size={14} /> },
    { label: 'Contact Phone', value: ownerDisplayMobile, icon: <Phone size={14} /> },
    { label: 'Email Address', value: ownerDisplayEmail, icon: <Mail size={14} /> },
    { label: 'Aadhar KYC', value: ownerDisplayAadhar, icon: <FileText size={14} /> },
    { label: 'PAN Identity', value: ownerDisplayPan, icon: <CreditCard size={14} /> },
    { label: 'Driving Licence', value: ownerDisplayLicence, icon: <ShieldCheck size={14} /> },
    { label: 'System ID', value: ownerIdValue, icon: <Hash size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100">
      
      {/* Sticky Header & Tabs Container */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 pt-3 pb-0 sm:px-6 lg:px-8">

          {/* Top row: back + breadcrumb + actions */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate('/your-cars')} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                <ArrowLeft size={14} />
              </button>
              <Breadcrumb />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link to={`/your-cars/${car._id}/edit`} className="flex h-7 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[11px] font-bold text-white shadow-sm hover:bg-slate-700 transition-colors">
                <PencilLine size={12} /> Edit
              </Link>
              <button onClick={handleDelete} disabled={loading} className="flex h-7 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>

          {/* Title + badges row */}
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">{car.make} {car.model}</h1>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 ring-1 ring-inset ring-indigo-500/20">{car.vehicleType}</span>
            {car.isAvailable ? (
              <span className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Available
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-600 ring-1 ring-inset ring-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> {car.runningStatus || 'Unavailable'}
              </span>
            )}
          </div>

          {/* Section Tabs */}
          <div className="flex space-x-5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap border-b-2 py-2.5 px-0.5 text-xs font-bold transition-colors ${
                activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              Overview & Specs
            </button>
            <button
              onClick={() => setActiveTab('owner')}
              className={`whitespace-nowrap border-b-2 py-2.5 px-0.5 text-xs font-bold transition-colors ${
                activeTab === 'owner' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              Owner & Compliance
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`whitespace-nowrap border-b-2 py-2.5 px-0.5 text-xs font-bold transition-colors ${
                activeTab === 'media' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              Media Gallery
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* TAB 1: OVERVIEW & SPECS */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Quick KPI Row */}
            <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Current Rate', value: car.price ? `₹${car.price}` : `₹${car.perPersonCost || 0}`, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Sharing Mode', value: car.sharingType, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Transmission', value: car.transmission, icon: Settings2, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Mfg. Year', value: car.year, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((stat, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} ring-1 ring-inset ring-current/10`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                      <p className="mt-0.5 text-xl font-extrabold text-slate-900 truncate">{stat.value || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </dl>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7 flex flex-col gap-8">
                {/* Hero Image */}
                <div className="w-full aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm">
                  <img src={imageUrl} alt={`${car.make} ${car.model}`} className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <DetailSection title="Technical Specifications" icon={Settings2} items={specItems} />
                <DetailSection title="Route Preferences" icon={MapPin} items={locationItems} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OWNER & COMPLIANCE */}
        {activeTab === 'owner' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <DetailSection title="Owner & Compliance Profile" icon={UserCircle} items={ownerItems} />
              </div>
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm mb-6">
                   <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
                      <CheckCircle2 size={16} />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">Verification Status</h2>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-4">Identity documents attached for this owner profile.</p>
                  
                  {car.dlImage && car.dlImage.length > 0 ? (
                     <MediaGallery items={car.dlImage} type="file" />
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm font-bold text-slate-400">
                      No compliance documents uploaded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA GALLERY */}
        {activeTab === 'media' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
                    <ImageIcon size={16} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Vehicle Showcase</h2>
                </div>
                <MediaGallery items={car.images} type="image" />
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ViewCar;