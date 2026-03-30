import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Hash, Loader2, MessageSquare, Plus, RefreshCw, 
  Search, ShieldCheck, Trash2, X, CheckCircle2, Building2, 
  CalendarDays, Filter, ChevronRight, Edit3, Info
} from 'lucide-react';
import {
  fetchComplaints,
  filterComplaints,
  updateComplaint,
  deleteComplaint,
  clearError,
} from '../../../redux/slices/complaintSlice';
import { selectAuth } from '../../../redux/slices/authSlice';

/* ── Helpers ─────────────────────────────────────────────── */
const fmtDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-IN', { 
    day: '2-digit', month: 'short', year: 'numeric' 
  });
};

const STATUSES = ['Pending', 'Approved', 'Working', 'Resolved', 'Rejected'];

const STATUS_CONFIG = {
  Pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Approved: { cls: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  Working:  { cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  Resolved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Rejected: { cls: 'bg-rose-50 text-rose-700 border-rose-200',    dot: 'bg-rose-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${cfg.dot}`} />
      {status || 'Pending'}
    </span>
  );
};

const Skeleton = () => (
  <tr className="animate-pulse border-b border-zinc-100 bg-white">
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-6 py-5">
        <div className={`h-4 rounded-md bg-zinc-100 ${i === 4 ? 'w-3/4' : 'w-full'}`} />
      </td>
    ))}
  </tr>
);

/* ── Update Modal ────────────────────────────────────────── */
function UpdateModal({ complaint, onClose, onSave, saving, user }) {
  const [status, setStatus] = useState(complaint.status || 'Pending');
  const [feedBack, setFeedBack] = useState('');

  const submit = () => {
    onSave(complaint._id, {
      status,
      feedBack,
      updatedBy: {
        name: user?.name || user?.fullName || user?.email || 'Admin',
        email: user?.email || '',
        status,
        feedBack,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl shadow-zinc-900/20 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 bg-zinc-50/50">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">Manage Ticket</p>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-zinc-900">Update Status</h2>
              <span className="rounded-md bg-zinc-200/50 px-2 py-0.5 text-xs font-bold text-zinc-500">#{complaint.complaintId}</span>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Status Selection */}
          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Current Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const isActive = status === s;
                const cfg = STATUS_CONFIG[s];
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all duration-200 ${
                      isActive 
                        ? `${cfg.cls.split(' ')[0]} ${cfg.cls.split(' ')[1]} border-${cfg.cls.split('-')[1]}-400 shadow-sm ring-4 ring-${cfg.cls.split('-')[1]}-50`
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Input */}
          <div>
            <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Internal Note / Feedback</label>
            <textarea 
              rows={3} 
              value={feedBack} 
              onChange={(e) => setFeedBack(e.target.value)} 
              placeholder="Add a note about this status change..."
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:text-zinc-400" 
            />
          </div>

          {/* History Log */}
          {Array.isArray(complaint.updatedBy) && complaint.updatedBy.length > 0 && (
            <div>
              <label className="mb-2.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Update History</label>
              <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-1 max-h-48 overflow-y-auto custom-scrollbar">
                {[...complaint.updatedBy].reverse().map((entry, i) => (
                  <div key={i} className="rounded-xl bg-white p-3 shadow-sm border border-zinc-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] uppercase">{entry.name?.charAt(0)}</div>
                        {entry.name}
                      </span>
                      <StatusBadge status={entry.status} />
                    </div>
                    {entry.feedBack && <p className="text-xs font-medium text-zinc-500 pl-6 border-l-2 border-zinc-100 ml-2.5 mt-1">{entry.feedBack}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50/50 p-6">
          <button onClick={submit} disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none">
            {saving ? <><Loader2 size={18} className="animate-spin" /> Applying Update...</> : <><CheckCircle2 size={18} /> Confirm Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm ──────────────────────────────────────── */
function DeleteConfirm({ complaint, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl shadow-zinc-900/20 text-center animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50 mb-5">
          <Trash2 size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-black text-zinc-900">Delete Ticket?</h2>
        <p className="mt-2 text-sm font-medium text-zinc-500 mb-8">
          Ticket <span className="font-bold text-zinc-800">#{complaint.complaintId}</span> and all associated chat logs will be permanently erased.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => onConfirm(complaint._id)} disabled={deleting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none">
            {deleting ? <><Loader2 size={18} className="animate-spin" /> Deleting...</> : <><Trash2 size={18} /> Yes, Delete</>}
          </button>
          <button onClick={onClose} disabled={deleting} className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50 hover:text-zinc-900">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function Complaints() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector(selectAuth);
  const { complaints = [], filteredComplaints = [], loading, error } = useSelector((s) => s.complaints);

  const [filters, setFilters] = useState({ status: '', hotelName: '', hotelEmail: '', complaintId: '' });
  const [applied, setApplied] = useState(false);

  const [updateTarget, setUpdateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = () => dispatch(fetchComplaints());
  
  useEffect(() => { 
    loadData(); 
  }, [dispatch]);

  const displayList = applied ? filteredComplaints : complaints;

  const stats = useMemo(() => {
    return complaints.reduce((acc, c) => { 
      acc[c.status] = (acc[c.status] || 0) + 1; 
      return acc; 
    }, {});
  }, [complaints]);

  const handleFilter = () => {
    const hasAny = Object.values(filters).some((v) => v.trim() !== '');
    if (!hasAny) { setApplied(false); return; }
    dispatch(filterComplaints(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v.trim() !== ''))
    ));
    setApplied(true);
  };

  const handleReset = () => {
    setFilters({ status: '', hotelName: '', hotelEmail: '', complaintId: '' });
    setApplied(false);
    dispatch(clearError());
  };

  const handleSaveUpdate = async (id, data) => {
    setSaving(true);
    await dispatch(updateComplaint({ id, updateData: data })).unwrap().catch(() => {});
    setSaving(false);
    setUpdateTarget(null);
    loadData();
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    await dispatch(deleteComplaint(id)).unwrap().catch(() => {});
    setDeleting(false);
    setDeleteTarget(null);
    loadData();
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 px-4 py-8 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <ShieldCheck size={18} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Admin Control</p>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Support Tickets</h1>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              Manage, monitor, and resolve all incoming system complaints.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadData} 
              disabled={loading}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
            <button 
              onClick={() => navigate('/complaint/create')}
              className="flex h-12 items-center gap-2 rounded-2xl bg-zinc-900 px-6 text-sm font-bold text-white shadow-lg shadow-zinc-900/20 transition-all hover:bg-zinc-800 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus size={18} /> Create Ticket
            </button>
          </div>
        </div>

        {/* ── Stats Grid ─────────────────────────────────── */}
        {complaints.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="col-span-2 lg:col-span-1 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total</p>
              <p className="text-3xl font-black text-zinc-900">{complaints.length}</p>
            </div>
            {[
              ['Pending',  stats.Pending  || 0, 'text-amber-600', 'bg-amber-50'],
              ['Approved', stats.Approved || 0, 'text-blue-600',  'bg-blue-50'],
              ['Working',  stats.Working  || 0, 'text-purple-600','bg-purple-50'],
              ['Resolved', stats.Resolved || 0, 'text-emerald-600','bg-emerald-50'],
              ['Rejected', stats.Rejected || 0, 'text-rose-600',  'bg-rose-50'],
            ].map(([label, count, textColor, bgColor]) => (
              <div key={label} className={`rounded-3xl border border-zinc-100 ${bgColor} p-5 shadow-sm transition-all hover:shadow-md`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${textColor} opacity-80 mb-1`}>{label}</p>
                <p className={`text-3xl font-black ${textColor}`}>{count}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter Bar ─────────────────────────────────── */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={filters.complaintId} onChange={(e) => setFilters((p) => ({ ...p, complaintId: e.target.value }))}
                placeholder="Ticket ID"
                className="w-full rounded-2xl border-none bg-zinc-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-800 outline-none transition-all focus:bg-zinc-100 placeholder:font-medium placeholder:text-zinc-400" />
            </div>
            
            <div className="relative flex-1 min-w-[140px]">
              <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="w-full appearance-none rounded-2xl border-none bg-zinc-50 py-3.5 pl-4 pr-10 text-sm font-semibold text-zinc-800 outline-none transition-all focus:bg-zinc-100 cursor-pointer">
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none rotate-90" />
            </div>
            
            <input value={filters.hotelName} onChange={(e) => setFilters((p) => ({ ...p, hotelName: e.target.value }))}
              placeholder="Hotel Name"
              className="flex-1 min-w-[140px] rounded-2xl border-none bg-zinc-50 py-3.5 px-4 text-sm font-semibold text-zinc-800 outline-none transition-all focus:bg-zinc-100 placeholder:font-medium placeholder:text-zinc-400" />
            
            <input value={filters.hotelEmail} onChange={(e) => setFilters((p) => ({ ...p, hotelEmail: e.target.value }))}
              placeholder="Hotel Email"
              className="flex-1 min-w-[150px] rounded-2xl border-none bg-zinc-50 py-3.5 px-4 text-sm font-semibold text-zinc-800 outline-none transition-all focus:bg-zinc-100 placeholder:font-medium placeholder:text-zinc-400" />
            
            <button onClick={handleFilter} className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95">
              <Filter size={16} /> Filter
            </button>
            
            {applied && (
              <button onClick={handleReset} className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-rose-50 px-6 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100">
                <X size={16} /> Clear
              </button>
            )}
          </div>
          
          {applied && (
             <p className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-widest text-blue-600">
               Showing {filteredComplaints.length} Filtered Result{filteredComplaints.length !== 1 ? 's' : ''}
             </p>
          )}
        </div>

        {/* ── Error State ────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm animate-in fade-in">
            <AlertCircle size={20} className="shrink-0" /> 
            {typeof error === 'string' ? error : 'Failed to load complaints. Please try again.'}
          </div>
        )}

        {/* ── Data Table ─────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/40">
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  {['#', 'Ticket ID', 'Property Details', 'Category', 'Issue & Logs', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-6 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
                ) : displayList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 ring-8 ring-zinc-50/50">
                          <ShieldCheck size={32} className="text-zinc-300" />
                        </div>
                        <h3 className="text-lg font-black text-zinc-900">No Records Found</h3>
                        <p className="mt-1 text-sm font-medium text-zinc-500 max-w-sm">
                          {applied ? "No complaints match your active filters." : "The complaint database is currently empty."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayList.map((c, idx) => (
                    <tr key={c._id || idx} className="group transition-colors hover:bg-zinc-50/80">
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-zinc-300">{String(idx + 1).padStart(2, '0')}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 w-max">
                          <Hash size={12} className="text-zinc-400" />
                          <span className="font-mono text-[11px] font-bold text-zinc-700">
                            {c.complaintId || c._id?.slice(-8) || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 rounded-md bg-blue-50 p-1.5"><Building2 size={14} className="text-blue-500" /></div>
                          <div>
                            <p className="max-w-[160px] truncate text-sm font-bold text-zinc-900">{c.hotelName || '—'}</p>
                            {c.hotelEmail && <p className="max-w-[160px] truncate text-xs font-medium text-zinc-400">{c.hotelEmail}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">
                          {c.regarding || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="max-w-[200px] truncate text-sm font-medium text-zinc-700" title={c.issue}>
                          {c.issue || '—'}
                        </p>
                        {Array.isArray(c.updatedBy) && c.updatedBy.length > 0 && c.updatedBy[c.updatedBy.length - 1]?.feedBack && (
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <Info size={12} className="mt-0.5 shrink-0 text-blue-400" />
                            <p className="max-w-[180px] truncate text-xs font-medium italic text-blue-600" title={c.updatedBy[c.updatedBy.length - 1].feedBack}>
                              Admin Note: {c.updatedBy[c.updatedBy.length - 1].feedBack}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                          <CalendarDays size={14} className="text-zinc-400" />
                          {fmtDate(c.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/complaint/chat/${c._id}`)} title="View Chat"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20 active:scale-95">
                            <MessageSquare size={16} />
                          </button>
                          <button onClick={() => setUpdateTarget(c)} title="Update Status"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-all hover:bg-purple-600 hover:text-white hover:shadow-lg hover:shadow-purple-600/20 active:scale-95">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => setDeleteTarget(c)} title="Delete Ticket"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-600/20 active:scale-95">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Stats */}
          {!loading && displayList.length > 0 && (
            <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Displaying {displayList.length} Support Ticket{displayList.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── Modals ───────────────────────────────────────── */}
      {updateTarget && (
        <UpdateModal 
          complaint={updateTarget} 
          user={user}
          onClose={() => setUpdateTarget(null)} 
          onSave={handleSaveUpdate} 
          saving={saving} 
        />
      )}
      
      {deleteTarget && (
        <DeleteConfirm 
          complaint={deleteTarget}
          onClose={() => setDeleteTarget(null)} 
          onConfirm={handleDelete} 
          deleting={deleting} 
        />
      )}
    </div>
  );
}