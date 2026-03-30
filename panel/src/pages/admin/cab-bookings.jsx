import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Car,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  Eye,
  PencilLine,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  MapPin,
  ArrowRight,
  Phone,
  Mail,
  CalendarDays,
  Hash,
} from 'lucide-react'
import {
  getTravelBookings,
  changeBookingStatus,
  clearCarError,
  clearCarSuccess,
} from '../../../redux/slices/tms/travel/car'
import Breadcrumb from '../../components/breadcrumb'
import BookingStatusBadge, { cfgFor, NEXT_STATUSES, STATUS_CFG } from '../../components/tms/booking-status'
import { formatDate as fmt, formatDateTime as fmtDT, formatCurrency as fmtCurrency } from '../../utils/format'

const StatusBadge = BookingStatusBadge
const NEXT = NEXT_STATUSES

function BookingModal({ booking, mode, onClose, onStatusChange, updating }) {
  const [nextStatus, setNextStatus] = useState('')
  if (!booking) return null

  const normalized = String(booking.bookingStatus || 'pending').toLowerCase()
  const nextOpts = NEXT[normalized] ?? []

  const handleConfirm = () => {
    if (!nextStatus) return
    onStatusChange(booking._id, nextStatus)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 max-h-[92vh]">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {mode === 'edit' ? 'Edit Booking Status' : 'Booking Details'}
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{booking.bookingId}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Status row */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Current Status</p>
              <StatusBadge status={booking.bookingStatus} />
            </div>
            {mode === 'edit' && nextOpts.length === 0 && (
              <p className="text-xs font-semibold text-slate-400 italic">No further status changes allowed.</p>
            )}
          </div>

          {/* Edit: status selector */}
          {mode === 'edit' && nextOpts.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">Change Status To</p>
              <div className="flex flex-wrap gap-2">
                {nextOpts.map((s) => {
                  const c = cfgFor(s)
                  const selected = nextStatus === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNextStatus(s)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold ring-2 ring-inset transition-all ${
                        selected
                          ? `${c.bg} ${c.text} ring-current shadow-sm scale-105`
                          : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
              {nextStatus && (
                <button
                  onClick={handleConfirm}
                  disabled={updating}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {updating
                    ? <><Loader2 size={14} className="animate-spin" />Saving…</>
                    : `Confirm → ${nextStatus}`
                  }
                </button>
              )}
            </div>
          )}

          {/* Journey */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-3">Journey</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pickup</p>
                <p className="font-bold text-slate-900 capitalize">{booking.pickupP || '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{fmtDT(booking.pickupD)}</p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-slate-300" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Drop</p>
                <p className="font-bold text-slate-900 capitalize">{booking.dropP || '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{fmtDT(booking.dropD)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Vehicle No.</p>
                <p className="font-mono font-semibold text-slate-800 mt-0.5">{booking.vehicleNumber || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Type</p>
                <p className="font-semibold text-slate-800 mt-0.5">{booking.vehicleType} · {booking.sharingType}</p>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-3">Customer</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Booked By</p>
                <p className="font-semibold text-slate-900 mt-0.5">{booking.bookedBy || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Mobile</p>
                <p className="font-semibold text-slate-900 mt-0.5">{booking.customerMobile || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Email</p>
                <p className="font-semibold text-slate-900 mt-0.5 truncate">{booking.customerEmail || '—'}</p>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-3">Financials</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Seat Price Total</span>
                <span className="font-semibold text-slate-900">{fmtCurrency(booking.totalSeatPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GST ({booking.gstPrice}%)</span>
                <span className="font-semibold text-slate-900">
                  {fmtCurrency(Math.round(Number(booking.totalSeatPrice || 0) * Number(booking.gstPrice || 0) / 100))}
                </span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 mt-1">
                <span className="font-bold text-slate-800">Grand Total</span>
                <span className="text-lg font-extrabold text-indigo-600">{fmtCurrency(booking.price)}</span>
              </div>
            </div>
          </div>

          {/* Seats */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Booked Seats
              </p>
              {Array.isArray(booking.seats) && booking.seats.length > 0 && (
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {Array.isArray(booking.seats) && booking.seats.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {booking.seats.map((s, i) => (
                  <div
                    key={s._id || i}
                    className="flex flex-col items-center justify-center rounded-xl bg-indigo-50 px-3 py-3 ring-1 ring-inset ring-indigo-200"
                  >
                    <span className="text-base font-extrabold text-indigo-700">
                      #{s.seatNumber ?? i + 1}
                    </span>
                    {s.seatType && (
                      <span className="mt-0.5 text-[10px] font-semibold text-indigo-400 capitalize">
                        {s.seatType}
                      </span>
                    )}
                    {s.seatPrice ? (
                      <span className="mt-1 text-[11px] font-bold text-indigo-600">
                        ₹{s.seatPrice}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                  <Users size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {booking.sharingType === 'Private' ? 'Entire vehicle booked (Private)' : 'No specific seats assigned'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {booking.sharingType === 'Shared' ? 'Seats may be assigned at boarding.' : 'Full vehicle reserved for this booking.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Meta */}
          <p className="text-center text-[11px] text-slate-400">
            Booked on {fmtDT(booking.bookingDate)} · User ID: {booking.userId}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ALL_STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Rejected']

export default function AllCarBookings() {
  const dispatch = useDispatch()
  const { bookings, loading, error, success } = useSelector((state) => state.car)

  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter]     = useState('All')
  const [modal, setModal]               = useState(null)   // { booking, mode: 'view'|'edit' }
  const [updating, setUpdating]         = useState(false)

  useEffect(() => {
    dispatch(getTravelBookings())
  }, [dispatch])

  // Auto-dismiss toasts
  useEffect(() => {
    if (!success && !error) return
    const t = setTimeout(() => {
      if (success) dispatch(clearCarSuccess())
      if (error)   dispatch(clearCarError())
    }, 3000)
    return () => clearTimeout(t)
  }, [dispatch, success, error])

  // ── Filtered list ────────────────────────────────────────────────────────
  const bookingList = useMemo(() => {
    const raw = Array.isArray(bookings) ? bookings : []
    return raw.filter((b) => {
      const q = search.trim().toLowerCase()
      if (q) {
        const hay = [
          b.bookingId, b.vehicleNumber, b.bookedBy,
          b.customerMobile, b.customerEmail,
          b.pickupP, b.dropP, b.vehicleType,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (statusFilter !== 'All' && b.bookingStatus !== statusFilter) return false
      if (typeFilter  !== 'All' && b.sharingType  !== typeFilter)     return false
      return true
    })
  }, [bookings, search, statusFilter, typeFilter])

  // ── KPI counts ───────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const raw = Array.isArray(bookings) ? bookings : []
    return raw.reduce((acc, b) => {
      const s = b.bookingStatus || 'Pending'
      acc[s] = (acc[s] || 0) + 1
      return acc
    }, {})
  }, [bookings])

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (id, nextStatus) => {
    setUpdating(true)
    try {
      await dispatch(changeBookingStatus({ bookingId: id, status: nextStatus })).unwrap()
      dispatch(getTravelBookings())
      setModal(null)
    } catch {
      /* error is stored in Redux state */
    } finally {
      setUpdating(false)
    }
  }

  const openModal = (booking, mode) => setModal({ booking, mode })
  const closeModal = () => setModal(null)

  const canEdit = (b) => {
    const s = String(b.bookingStatus || '').toLowerCase()
    return (NEXT[s] ?? []).length > 0
  }

  return (
    <div className="min-h-full bg-slate-50/40 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <Breadcrumb />
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">All Car Bookings</h1>
              <p className="mt-1 text-sm text-slate-500">All travel bookings across the platform</p>
            </div>
            <button
              onClick={() => dispatch(getTravelBookings())}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Toasts ── */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-sm">
            <div className="flex items-center gap-2"><AlertTriangle size={16} />{error}</div>
            <button onClick={() => dispatch(clearCarError())}><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 shadow-sm">
            <CheckCircle2 size={16} />{success}
          </div>
        )}

        {/* ── KPI strip ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Total', value: bookings.length, bg: 'bg-slate-100', text: 'text-slate-700' },
            ...ALL_STATUSES.map((s) => {
              const c = cfgFor(s)
              return { label: s, value: counts[s] || 0, bg: c.bg, text: c.text }
            }),
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-2xl border border-slate-200/60 p-4 shadow-sm ${kpi.bg}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${kpi.text}`}>{kpi.label}</p>
              <p className="mt-1.5 text-2xl font-extrabold text-slate-900">{loading ? '…' : kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="mb-6 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Filter size={15} />
              </div>
              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Filters</span>
            </div>

            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search booking ID, mobile, name, vehicle…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-sm font-medium text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white"
              >
                <option value="All">All Status</option>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white"
              >
                <option value="All">All Types</option>
                <option value="Shared">Shared</option>
                <option value="Private">Private</option>
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {(search || statusFilter !== 'All' || typeFilter !== 'All') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('All'); setTypeFilter('All') }}
                className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Table / Cards container ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">

          {/* MOBILE CARDS (< md) */}
          <div className="md:hidden">
            {loading && bookingList.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <Loader2 size={28} className="animate-spin text-indigo-500" />
                <p className="text-sm font-medium">Loading bookings…</p>
              </div>
            )}
            {!loading && bookingList.length === 0 && (
              <div className="py-16 text-center">
                <Car size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No bookings found.</p>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {bookingList.map((b) => (
                <div key={b._id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                  {/* ID + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-slate-900">{b.bookingId}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{fmt(b.bookingDate)}</p>
                    </div>
                    <StatusBadge status={b.bookingStatus} />
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center gap-2">
                    <Car size={13} className="shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">{b.vehicleType} · {b.sharingType}</p>
                      <p className="text-[11px] font-mono text-slate-400">{b.vehicleNumber}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin size={12} className="shrink-0 text-emerald-500" />
                    <span className="capitalize truncate">{b.pickupP}</span>
                    <ArrowRight size={11} className="shrink-0 text-slate-300" />
                    <MapPin size={12} className="shrink-0 text-rose-400" />
                    <span className="capitalize truncate">{b.dropP}</span>
                  </div>

                  {/* Customer + Price + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold text-slate-800 truncate">{b.bookedBy}</p>
                      <p className="text-[11px] text-slate-500">{b.customerMobile}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-extrabold text-indigo-700">{fmtCurrency(b.price)}</span>
                      <button
                        onClick={() => openModal(b, 'view')}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                      >
                        <Eye size={16} />
                      </button>
                      {canEdit(b) && (
                        <button
                          onClick={() => openModal(b, 'edit')}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                          <PencilLine size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DESKTOP TABLE (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  {['Booking ID', 'Vehicle', 'Route', 'Pickup Date', 'Booked By', 'Mobile', 'Total', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">

                {loading && bookingList.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Loader2 size={28} className="animate-spin text-indigo-500" />
                      <p className="text-sm font-medium">Loading bookings…</p>
                    </div>
                  </td></tr>
                )}

                {!loading && bookingList.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-16 text-center">
                    <Car size={32} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">No bookings found. Try adjusting filters.</p>
                  </td></tr>
                )}

                {bookingList.map((b) => (
                  <tr key={b._id} className="group hover:bg-slate-50/50 transition-colors">

                    {/* Booking ID */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-mono text-sm font-bold text-slate-900">{b.bookingId}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{fmt(b.bookingDate)}</p>
                    </td>

                    {/* Vehicle */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-800">{b.vehicleType}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] font-mono text-slate-400">{b.vehicleNumber}</p>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${
                          b.sharingType === 'Shared'
                            ? 'bg-cyan-50 text-cyan-700 ring-cyan-200'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}>{b.sharingType}</span>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <span className="capitalize">{b.pickupP}</span>
                        <ArrowRight size={12} className="text-slate-300 shrink-0" />
                        <span className="capitalize">{b.dropP}</span>
                      </div>
                    </td>

                    {/* Pickup date */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-slate-700">{fmt(b.pickupD)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{fmt(b.dropD)} (drop)</p>
                    </td>

                    {/* Booked By */}
                    <td className="px-5 py-4 max-w-[140px]">
                      <p className="text-sm font-semibold text-slate-800 truncate">{b.bookedBy || '—'}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{b.customerEmail}</p>
                    </td>

                    {/* Mobile */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-slate-800">{b.customerMobile}</p>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-extrabold text-slate-900">{fmtCurrency(b.price)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">GST {b.gstPrice}%</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={b.bookingStatus} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openModal(b, 'view')}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                          <Eye size={15} />
                        </button>
                        {canEdit(b) && (
                          <button
                            onClick={() => openModal(b, 'edit')}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                          >
                            <PencilLine size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Result count */}
        {!loading && bookingList.length > 0 && (
          <p className="mt-3 text-right text-xs font-medium text-slate-400">
            Showing {bookingList.length} of {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <BookingModal
          booking={modal.booking}
          mode={modal.mode}
          onClose={closeModal}
          onStatusChange={handleStatusChange}
          updating={updating}
        />
      )}
    </div>
  )
}

