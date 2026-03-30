import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Trash2,
  PencilLine,
  Eye,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Plus,
  ChevronDown,
  X,
  UserCircle,
  FileText,
  CalendarDays,
  Hash,
  UploadCloud,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import {
  getAllOwners,
  clearSelectedOwner,
  deleteOwnerById,
  updateOwner,
} from "../../../redux/slices/tms/travel/car";
import Breadcrumb from "../../components/breadcrumb";
import { formatDate } from '../../utils/format';

// --- Helpers ---
const getAvatarInitials = (name = "Unknown") => name.charAt(0).toUpperCase();
const getAvatarColor = (name = "A") => {
  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

function CopyButton({ value }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  if (!value) return null;
  return (
    <button type="button" onClick={handleCopy} className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" title="Copy">
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    </button>
  );
}

// --- Modals ---

// 1. View Modal
const OwnerViewModal = ({ owner, onClose }) => {
  if (!owner) return null;
  const imageUrl = owner.images && owner.images.length > 0 ? owner.images[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Owner Profile</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500 font-mono">ID: {owner._id}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors focus:outline-none">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
            {imageUrl ? (
              <img src={imageUrl} alt={owner.name} className="h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-slate-50 shadow-sm" />
            ) : (
              <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white shadow-sm ring-4 ring-slate-50 ${getAvatarColor(owner.name)}`}>
                {getAvatarInitials(owner.name)}
              </div>
            )}
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-extrabold text-slate-900">{owner.name || "Unnamed Owner"}</h3>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 ring-1 ring-inset ring-indigo-500/20">{owner.role || 'TMS'}</span>
                <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><CalendarDays size={14}/> Joined {formatDate(owner.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500 flex items-center gap-2"><Phone size={16} className="text-slate-400"/> Mobile</span><span className="text-sm font-bold text-slate-900">{owner.mobile || 'N/A'}</span></div>
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-slate-500 flex items-center gap-2 shrink-0"><Mail size={16} className="text-slate-400"/> Email</span><div className="flex items-center gap-1 min-w-0"><span className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{owner.email || 'N/A'}</span><CopyButton value={owner.email} /></div></div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Location</h4>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4"><span className="text-sm font-medium text-slate-500 flex items-center gap-2 shrink-0"><MapPin size={16} className="text-slate-400"/> Address</span><span className="text-sm font-bold text-slate-900 text-right">{owner.address || 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">City / State</span><span className="text-sm font-bold text-slate-900">{[owner.city, owner.state].filter(Boolean).join(', ') || 'N/A'}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Pincode</span><span className="text-sm font-bold text-slate-900">{owner.pinCode || 'N/A'}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Compliance & Documents</h4>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500"/> Driving Licence No.</span>
                <span className="text-sm font-bold text-slate-900">{owner.dl || 'N/A'}</span>
              </div>
              {owner.dlImage && owner.dlImage.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                  {owner.dlImage.map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="block aspect-video rounded-xl border border-slate-200 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all">
                      <img src={img} alt="DL Document" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Edit Modal
const OwnerEditModal = ({ owner, onClose, onSave, saving, saveError }) => {
  const [formData, setFormData] = useState({
    name: owner?.name || '',
    email: owner?.email || '',
    mobile: String(owner?.mobile || ''),
    role: owner?.role || 'TMS',
    dl: owner?.dl || '',
    city: owner?.city || '',
    state: owner?.state || '',
    address: owner?.address || '',
    pinCode: String(owner?.pinCode || ''),
  });
  const [newDlImages, setNewDlImages] = useState([]);
  const existingDlImages = owner?.dlImage || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDlFileChange = (e) => {
    if (e.target.files) setNewDlImages(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const removeDlFile = (idx) => setNewDlImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...owner, ...formData }, newDlImages);
  };

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 placeholder:font-normal";
  const labelClass = "mb-1.5 block text-[13px] font-bold text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 max-h-[90vh]">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Owner Profile</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500 font-mono">ID: {owner._id}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors focus:outline-none">
            <X size={20} />
          </button>
        </div>

        {/* Error banner */}
        {saveError && (
          <div className="shrink-0 flex items-center gap-2.5 border-b border-rose-100 bg-rose-50 px-6 py-3 text-sm font-bold text-rose-700">
            <AlertTriangle size={15} />{saveError}
          </div>
        )}

        <form id="owner-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Personal Details */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
              <UserCircle size={16} className="text-indigo-500" /> Personal Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name <span className="text-rose-500">*</span></label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Ramesh Kumar" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ramesh@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Mobile Number <span className="text-rose-500">*</span></label>
                <input required type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="9876543210" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>System Role</label>
                <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="TMS" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-amber-500" /> Address Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Full Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="12 Main Street, Sector 5" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Delhi" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Delhi" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pin Code</label>
                <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} placeholder="110001" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> Compliance
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Driving Licence No.</label>
                <input type="text" name="dl" value={formData.dl} onChange={handleChange} placeholder="DL0420220012345" className={inputClass} />
              </div>

              {/* Existing DL Images */}
              {existingDlImages.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Existing DL Scans</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {existingDlImages.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="block aspect-video overflow-hidden rounded-xl border border-slate-200 hover:ring-2 hover:ring-indigo-400 transition-all">
                        <img src={url} alt={`DL ${i + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new DL images */}
              <div className="sm:col-span-2">
                <label className={labelClass}>Upload New DL Scan(s)</label>
                <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <UploadCloud className="h-6 w-6 text-slate-400" />
                    <label htmlFor="edit-dl-images" className="relative cursor-pointer rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-slate-200 transition-colors">
                      <span>Choose files</span>
                      <input id="edit-dl-images" type="file" multiple className="sr-only"
                        onChange={handleDlFileChange} accept="image/*,.pdf" />
                    </label>
                    <span className="text-xs text-slate-400">PNG, JPG, PDF</span>
                  </div>
                </div>
                {newDlImages.length > 0 && (
                  <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {newDlImages.map((file, i) => (
                      <li key={i} className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                        <span className="truncate flex-1">{file.name}</span>
                        <button type="button" onClick={() => removeDlFile(i)} className="shrink-0 text-slate-400 hover:text-rose-500"><X size={13} /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 bg-white ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors focus:outline-none">
            Cancel
          </button>
          <button type="submit" form="owner-edit-form" disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
            {saving ? <><Loader2 size={15} className="animate-spin" />Saving…</> : <><CheckCircle2 size={15} />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Component ---
export default function CarsOwner() {
  const dispatch = useDispatch();
  const { owners = [], loading, error } = useSelector((state) => state.car || {});

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  
  // Modals State
  const [modalMode, setModalMode] = useState(null); // 'view' | 'edit' | null
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    dispatch(getAllOwners());
    return () => {
      dispatch(clearSelectedOwner());
    };
  }, [dispatch]);

  const handleDelete = (ownerId) => {
    if (!window.confirm("Are you sure you want to permanently delete this owner profile?")) return;
    dispatch(deleteOwnerById(ownerId));
  };

  const handleEditSave = async (updatedData, dlImages = []) => {
    setSaving(true);
    setSaveError('');
    try {
      const fd = new FormData();
      const skip = ['_id', '__v', 'createdAt', 'updatedAt', 'dlImage', 'images'];
      Object.keys(updatedData).forEach((key) => {
        if (!skip.includes(key) && updatedData[key] !== undefined && updatedData[key] !== null && updatedData[key] !== '') {
          fd.append(key, updatedData[key]);
        }
      });
      dlImages.forEach((file) => fd.append('dlImage', file));

      await dispatch(updateOwner({ ownerId: updatedData._id, ownerData: fd })).unwrap();
      await dispatch(getAllOwners()).unwrap();
      setModalMode(null);
      setSelectedOwner(null);
      setSaveError('');
    } catch (err) {
      setSaveError(typeof err === 'string' ? err : err?.message || 'Failed to update owner. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Derive unique states for the filter dropdown dynamically from data
  const availableStates = useMemo(() => {
    const states = owners.map(o => o.state).filter(state => state && state.trim() !== "");
    return [...new Set(states)].sort();
  }, [owners]);

  // Apply Search and Filters
  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (owner.name || "").toLowerCase().includes(searchLower) ||
        (owner.email || "").toLowerCase().includes(searchLower) ||
        String(owner.mobile || "").includes(searchLower) ||
        (owner.dl || "").toLowerCase().includes(searchLower);

      const matchesState = stateFilter ? owner.state === stateFilter : true;

      return matchesSearch && matchesState;
    });
  }, [owners, searchTerm, stateFilter]);

  return (
    <div className="min-h-screen bg-slate-50/40 font-sans text-slate-900 selection:bg-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <Breadcrumb />
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 mb-1.5">
                Travel Management
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Travel Owners & Drivers
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500 max-w-2xl">
                Manage registered car owners, drivers, and their compliance documents in a unified directory.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <Plus size={18} /> Add Owner
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 shadow-sm">
            <AlertTriangle size={18} />
            <p>{error}</p>
          </div>
        )}

        {/* Filters Toolbar */}
        {!loading && !error && owners.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row flex-1 gap-0 w-full divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              
              {/* Search Input */}
              <div className="relative flex-1 group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search name, email, phone, or DL..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full appearance-none bg-transparent py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 rounded-xl sm:rounded-none sm:rounded-l-xl transition-colors placeholder:font-normal placeholder:text-slate-400"
                />
              </div>

              {/* State Filter Dropdown */}
              <div className="relative sm:w-64 group shrink-0">
                <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <select 
                  value={stateFilter} 
                  onChange={(e) => setStateFilter(e.target.value)} 
                  className="w-full appearance-none bg-transparent py-3 pl-10 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <option value="">All States / Regions</option>
                  {availableStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Count Badge */}
            <div className="flex items-center gap-2 px-2 sm:px-0 w-full sm:w-auto pb-2 sm:pb-0">
              <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {filteredOwners.length} Records
              </div>
            </div>
          </div>
        )}

        {/* Content Area - Data Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-sm font-bold text-slate-500">Fetching directory...</p>
          </div>
        ) : !error && owners.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
              <UserCircle size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">No Owners Found</h3>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-sm">
              Your directory is currently empty. Register a new car owner or driver to get started.
            </p>
            <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800">
              <Plus size={18} /> Register First Owner
            </button>
          </div>
        ) : filteredOwners.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <Search size={32} className="text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No Matches Found</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Try adjusting your search terms or state filter.</p>
            <button 
              onClick={() => { setSearchTerm(''); setStateFilter(''); }} 
              className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Profile</th>
                    <th className="px-6 py-4 text-left text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Contact</th>
                    <th className="px-6 py-4 text-left text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Location</th>
                    <th className="px-6 py-4 text-left text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Compliance</th>
                    <th className="px-6 py-4 text-right text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredOwners.map((owner) => {
                    const imageUrl = owner.images && owner.images.length > 0 ? owner.images[0] : null;
                    return (
                      <tr key={owner._id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            {imageUrl ? (
                              <img src={imageUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100" />
                            ) : (
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${getAvatarColor(owner.name)}`}>
                                {getAvatarInitials(owner.name)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">{owner.name || "Unnamed"}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-600">{owner.role || 'TMS'}</span>
                                <span className="text-[11px] font-mono text-slate-400">ID:{owner._id?.slice(-5)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1 text-[13px] font-medium text-slate-600">
                            <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {owner.mobile || 'N/A'}</div>
                            <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/> <span className="truncate max-w-[150px]">{owner.email || 'N/A'}</span></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start gap-2 text-[13px] font-medium text-slate-600">
                            <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0"/> 
                            <div className="flex flex-col">
                              <span className="truncate max-w-[150px]">{owner.city || 'N/A'},</span>
                              <span>{owner.state || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {owner.dl ? (
                             <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 w-fit ring-1 ring-inset ring-emerald-500/20">
                               <ShieldCheck size={14} /> Verified
                             </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-500 w-fit ring-1 ring-inset ring-slate-200">
                               Pending
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setSelectedOwner(owner); setModalMode('view'); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all"><Eye size={16} /></button>
                            <button onClick={() => { setSelectedOwner(owner); setModalMode('edit'); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><PencilLine size={16} /></button>
                            <button onClick={() => handleDelete(owner._id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Render Modals */}
      {modalMode === 'view' && selectedOwner && (
        <OwnerViewModal owner={selectedOwner} onClose={() => { setModalMode(null); setSelectedOwner(null); }} />
      )}
      
      {modalMode === 'edit' && selectedOwner && (
        <OwnerEditModal
          owner={selectedOwner}
          onClose={() => { if (!saving) { setModalMode(null); setSelectedOwner(null); setSaveError(''); } }}
          onSave={handleEditSave}
          saving={saving}
          saveError={saveError}
        />
      )}

    </div>
  );
}