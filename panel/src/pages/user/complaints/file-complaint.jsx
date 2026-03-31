import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Hash, Loader2, MessageSquare, Plus, RefreshCw, 
  Search, ShieldCheck, Trash2, X, CheckCircle2, Building2, 
  CalendarDays, Filter, ChevronRight, Edit3, Info, FileText
} from 'lucide-react';
import {
  fetchComplaints,
  filterComplaints,
  updateComplaint,
  deleteComplaint,
  clearError,
} from '../../../../redux/slices/complaintSlice';
import { selectAuth } from '../../../../redux/slices/authSlice';

/* ── Helpers ─────────────────────────────────────────────── */
const fmtDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200'
  };
  return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const getStatusIcon = (status) => {
  const icons = {
    pending: <AlertCircle size={14} />,
    resolved: <CheckCircle2 size={14} />,
    rejected: <X size={14} />,
    in_progress: <Loader2 size={14} className="animate-spin" />
  };
  return icons[status] || <Info size={14} />;
};

const Skeleton = () => (
  <div className="animate-pulse">
    <div className="border-b border-gray-100 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-6 w-32 rounded-md bg-gray-100" />
          <div className="h-4 w-48 rounded-md bg-gray-100" />
          <div className="h-4 w-64 rounded-md bg-gray-100" />
        </div>
        <div className="ml-4 space-y-2">
          <div className="h-6 w-20 rounded-md bg-gray-100" />
          <div className="h-4 w-16 rounded-md bg-gray-100" />
        </div>
      </div>
    </div>
  </div>
);

export default function FileComplaint() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const { complaints, loading, error, filters } = useSelector((state) => state.complaints);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Fetch only hotel owner's complaints
    dispatch(fetchComplaints({ hotelEmail: user?.email }));
  }, [dispatch, user?.email]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const filteredComplaints = useMemo(() => {
    let filtered = complaints || [];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.complaintId?.toLowerCase().includes(query) ||
        comp.subject?.toLowerCase().includes(query) ||
        comp.description?.toLowerCase().includes(query) ||
        comp.hotelName?.toLowerCase().includes(query) ||
        comp.userName?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(comp => comp.status === statusFilter);
    }

    return filtered;
  }, [complaints, searchQuery, statusFilter]);

  const handleStatusUpdate = (complaintId, newStatus) => {
    dispatch(updateComplaint({ complaintId, status: newStatus }));
  };

  const handleDelete = (complaintId) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      dispatch(deleteComplaint(complaintId));
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetails(true);
  };

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'bg-gray-100 text-gray-700' },
    { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'resolved', label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <FileText size={20} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Filed Complaints</h1>
            </div>
            <p className="text-gray-600">Manage complaints filed for your hotels</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(fetchComplaints({ hotelEmail: user?.email }))}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      statusFilter === option.value
                        ? option.color
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Complaints List */}
        <div className="rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No complaints have been filed for your hotels yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => (
                <div key={complaint._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-gray-500">
                          #{complaint.complaintId}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                          {getStatusIcon(complaint.status)}
                          {complaint.status}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2 truncate">
                        {complaint.subject}
                      </h3>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {complaint.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building2 size={14} />
                          {complaint.hotelName || 'Unknown Hotel'}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays size={14} />
                          {fmtDate(complaint.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          {complaint.userName || 'Unknown User'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(complaint)}
                        className="rounded-lg p-2 text-green-600 hover:bg-green-50 transition-colors"
                        title="View details"
                      >
                        <Info size={16} />
                      </button>
                      
                      {complaint.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(complaint._id, 'in_progress')}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Mark as in progress"
                        >
                          <Loader2 size={16} />
                        </button>
                      )}
                      
                      {complaint.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusUpdate(complaint._id, 'resolved')}
                          className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Mark as resolved"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetails && selectedComplaint && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowDetails(false)} />
              <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Complaint Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complaint ID</label>
                    <p className="text-gray-900">#{selectedComplaint.complaintId}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${getStatusColor(selectedComplaint.status)}`}>
                      {getStatusIcon(selectedComplaint.status)}
                      {selectedComplaint.status}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <p className="text-gray-900">{selectedComplaint.subject}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
                      <p className="text-gray-900">{selectedComplaint.hotelName || 'Unknown Hotel'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                      <p className="text-gray-900">{selectedComplaint.userName || 'Unknown User'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filed On</label>
                    <p className="text-gray-900">{fmtDate(selectedComplaint.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedComplaint.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedComplaint._id, 'in_progress');
                        setShowDetails(false);
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Mark as In Progress
                    </button>
                  )}
                  {selectedComplaint.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedComplaint._id, 'resolved');
                        setShowDetails(false);
                      }}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
