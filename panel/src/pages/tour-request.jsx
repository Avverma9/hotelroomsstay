import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  CalendarDays,
  Star,
  Building2,
  User,
  Phone,
  Mail,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Map as MapIcon,
} from 'lucide-react'
import Breadcrumb from '../components/breadcrumb'
import { getRequestedTours, updateTour } from '../../redux/slices/tms/travel/tour/tour'
import { formatCurrency } from '../utils/format'

const STATUS_CONFIG = {
  pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock,        label: 'Pending Review' },
  approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  rejected: { cls: 'bg-rose-50 text-rose-700 border-rose-200',       icon: XCircle,      label: 'Rejected' },
}

/* =========================================================
   REQUEST CARD
========================================================= */
const RequestCard = ({ tour, onApprove, onReject, onView, updating }) => {
  const status = tour.approvalStatus || tour.status || 'pending'
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const StatusIcon = cfg.icon
  const imageUrl = tour?.images?.[0] || null
  const displayPrice = tour.price || tour.vehicles?.[0]?.pricePerSeat || 0

  return (
    <div 
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
      data-testid={`tour-request-${tour._id}`}
    >
      {/* Header Image */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img src={imageUrl} alt={tour.travelAgencyName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <MapIcon size={36} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
            <StatusIcon size={12} />
            {cfg.label}
          </span>
        </div>

        {/* Title */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white line-clamp-1">{tour.travelAgencyName || 'Unnamed Tour'}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Agency Info */}
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
          <Building2 size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{tour.agencyEmail || 'N/A'}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-[12px] font-medium text-slate-600">
          <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
          <span className="line-clamp-1">{[tour.city, tour.state, tour.country].filter(Boolean).join(', ') || 'N/A'}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-1">
            <CalendarDays size={11} className="text-slate-400" />
            {tour.nights ?? 0}N / {tour.days ?? 0}D
          </div>
          {tour.starRating > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {tour.starRating}
            </div>
          )}
          <span className="font-bold text-indigo-600">{formatCurrency(displayPrice)}</span>
        </div>

        {/* Route */}
        {(tour.from || tour.to) && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">
            <span className="text-slate-400">Route:</span> {tour.from || 'N/A'} → {tour.to || 'N/A'}
          </div>
        )}

        {/* Contact Info */}
        {(tour.agencyPhone || tour.ownerName) && (
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
            {tour.ownerName && (
              <span className="flex items-center gap-1">
                <User size={10} /> {tour.ownerName}
              </span>
            )}
            {tour.agencyPhone && (
              <span className="flex items-center gap-1">
                <Phone size={10} /> {tour.agencyPhone}
              </span>
            )}
          </div>
        )}

        {/* Submitted Date */}
        {tour.createdAt && (
          <p className="text-[10px] font-medium text-slate-400">
            Submitted: {new Date(tour.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 bg-slate-50/50">
        <button
          onClick={() => onView(tour)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          data-testid={`view-request-${tour._id}`}
        >
          <Eye size={13} /> View
        </button>
        {status === 'pending' && (
          <>
            <button
              onClick={() => onApprove(tour)}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              data-testid={`approve-request-${tour._id}`}
            >
              {updating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Approve
            </button>
            <button
              onClick={() => onReject(tour)}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              data-testid={`reject-request-${tour._id}`}
            >
              {updating ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
function TourRequestPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { requestedTours, loading, error } = useSelector((state) => state.tour)

  const [filter, setFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  // Fetch requested tours on mount
  useEffect(() => {
    dispatch(getRequestedTours())
  }, [dispatch])

  const handleRefresh = useCallback(() => {
    dispatch(getRequestedTours())
  }, [dispatch])

  const handleView = useCallback((tour) => {
    navigate(`/my-tour/${tour._id}`)
  }, [navigate])

  const handleApprove = useCallback(async (tour) => {
    if (!window.confirm(`Approve "${tour.travelAgencyName}"?`)) return
    setUpdatingId(tour._id)
    try {
      await dispatch(updateTour({ 
        tourId: tour._id, 
        updatedData: { 
          approvalStatus: 'approved',
          runningStatus: 'active',
          isApproved: true 
        } 
      })).unwrap()
      dispatch(getRequestedTours()) // Refresh list
    } catch (err) {
      alert('Failed to approve: ' + (err?.message || err))
    } finally {
      setUpdatingId(null)
    }
  }, [dispatch])

  const handleReject = useCallback(async (tour) => {
    const reason = window.prompt(`Rejection reason for "${tour.travelAgencyName}":`)
    if (reason === null) return
    setUpdatingId(tour._id)
    try {
      await dispatch(updateTour({ 
        tourId: tour._id, 
        updatedData: { 
          approvalStatus: 'rejected',
          rejectionReason: reason,
          isApproved: false 
        } 
      })).unwrap()
      dispatch(getRequestedTours())
    } catch (err) {
      alert('Failed to reject: ' + (err?.message || err))
    } finally {
      setUpdatingId(null)
    }
  }, [dispatch])

  // Filter tours based on status
  const filteredTours = requestedTours.filter((tour) => {
    if (filter === 'all') return true
    const status = tour.approvalStatus || tour.status || 'pending'
    return status === filter
  })

  // Stats
  const stats = {
    total: requestedTours.length,
    pending: requestedTours.filter(t => (t.approvalStatus || t.status || 'pending') === 'pending').length,
    approved: requestedTours.filter(t => (t.approvalStatus || t.status) === 'approved').length,
    rejected: requestedTours.filter(t => (t.approvalStatus || t.status) === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb />

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-600">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Tour Requests</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Review and manage tour submission requests
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending</p>
            <p className="mt-1 text-2xl font-black text-amber-700">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Approved</p>
            <p className="mt-1 text-2xl font-black text-emerald-700">{stats.approved}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Rejected</p>
            <p className="mt-1 text-2xl font-black text-rose-700">{stats.rejected}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All Requests' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                filter === tab.value
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span className="text-sm font-semibold text-rose-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && !requestedTours.length && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16">
            <Loader2 size={32} className="animate-spin text-indigo-600 mb-4" />
            <p className="text-sm font-semibold text-slate-500">Loading tour requests...</p>
          </div>
        )}

        {/* Tours Grid */}
        {filteredTours.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTours.map((tour) => (
              <RequestCard
                key={tour._id}
                tour={tour}
                onView={handleView}
                onApprove={handleApprove}
                onReject={handleReject}
                updating={updatingId === tour._id}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <MapIcon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Requests Found</h3>
            <p className="mt-1 text-sm font-medium text-slate-500 max-w-sm">
              {filter === 'all' 
                ? 'There are no tour requests to review at the moment.'
                : `No ${filter} requests found.`
              }
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default TourRequestPage
