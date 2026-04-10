import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Search,
  RefreshCw,
  Car,
  CalendarDays,
  MapPin,
  ChevronDown,
  X,
  Eye,
  Pencil,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
} from 'lucide-react'
import {
  getBookingsOfOwner,
  changeBookingStatus,
  updateBooking,
  clearCarError,
  clearCarSuccess,
} from '../../../redux/slices/tms/travel/car'
import { selectAuth } from '../../../redux/slices/authSlice'
import Breadcrumb from '../../components/breadcrumb'
import BookingStatusBadge, { cfgFor, NEXT_STATUSES, STATUS_CFG, RideStatusBadge } from '../../components/tms/booking-status'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/format'

const getBookingsList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.bookings)) return payload.bookings
  return []
}

const getStatusConfig = cfgFor
const ALLOWED_NEXT_STATUSES = NEXT_STATUSES
const STATUS_CONFIG = STATUS_CFG

// ─── Sub-components ───────────────────────────────────────────────────────────

function BookingEditModal({ booking, onClose, onSubmit, saving }) {
  // Build initial passengers: prefer booking.passengers[], else fallback to root fields
  const initPassengers = () => {
    if (Array.isArray(booking.passengers) && booking.passengers.length > 0) {
      return booking.passengers.map((p) => ({ name: p.name || '', mobile: p.mobile || '', email: p.email || '' }))
    }
    return [{ name: booking.passengerName || '', mobile: booking.customerMobile || '', email: booking.customerEmail || '' }]
  }

  const [form, setForm] = useState({
    pickupP:          booking.pickupP          || '',
    dropP:            booking.dropP            || '',
    pickupD:          booking.pickupD ? booking.pickupD.slice(0, 16) : '',
    dropD:            booking.dropD   ? booking.dropD.slice(0, 16)   : '',
    paymentMethod:    booking.paymentMethod    || '',
    paymentId:        booking.paymentId        || '',
    isPaid:           booking.isPaid           ?? false,
    cancellationReason: booking.cancellationReason || '',
  })
  const [passengers, setPassengers] = useState(initPassengers)

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const setPassenger = (idx, field, val) =>
    setPassengers((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))

  const addPassenger = () =>
    setPassengers((prev) => [...prev, { name: '', mobile: '', email: '' }])

  const removePassenger = (idx) =>
    setPassengers((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = (e) => {
    e.preventDefault()
    // Sync primary passenger back into root fields for server backward-compat
    const primary = passengers[0] || {}
    onSubmit(booking._id, {
      ...form,
      passengerName:  primary.name   || '',
      customerMobile: primary.mobile || '',
      customerEmail:  primary.email  || '',
      passengers,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Booking</h2>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{booking.bookingId || booking._id || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Passengers */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Passengers</h3>
              <button
                type="button"
                onClick={addPassenger}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <Plus size={11} /> Add Passenger
              </button>
            </div>
            <div className="space-y-3">
              {passengers.map((p, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    idx === 0 ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-100 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                        idx === 0 ? 'bg-indigo-600' : 'bg-slate-400'
                      }`}>{idx + 1}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {idx === 0 ? 'Primary Passenger' : `Passenger ${idx + 1}`}
                      </span>
                    </div>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removePassenger(idx)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">Full Name</label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => setPassenger(idx, 'name', e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">Mobile</label>
                      <input
                        type="text"
                        value={p.mobile}
                        onChange={(e) => setPassenger(idx, 'mobile', e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-500">Email</label>
                      <input
                        type="email"
                        value={p.email}
                        onChange={(e) => setPassenger(idx, 'email', e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Journey Info */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Journey</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">Pickup Point</label>
                <input
                  type="text"
                  value={form.pickupP}
                  onChange={(e) => set('pickupP', e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">Drop Point</label>
                <input
                  type="text"
                  value={form.dropP}
                  onChange={(e) => set('dropP', e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">Pickup Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.pickupD}
                  onChange={(e) => set('pickupD', e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">Drop Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.dropD}
                  onChange={(e) => set('dropD', e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Payment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => set('paymentMethod', e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white"
                >
                  <option value="">-- Select --</option>
                  <option value="Online">Online</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">Payment ID</label>
                <input
                  type="text"
                  value={form.paymentId}
                  onChange={(e) => set('paymentId', e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:bg-white"
                />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="isPaid"
                  type="checkbox"
                  checked={form.isPaid}
                  onChange={(e) => set('isPaid', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPaid" className="text-sm font-medium text-slate-700">Mark as Paid</label>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Cancellation Reason (if any)</label>
            <textarea
              rows={2}
              value={form.cancellationReason}
              onChange={(e) => set('cancellationReason', e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none resize-none focus:border-indigo-300 focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const StatusBadge = BookingStatusBadge

function BookingDetailModal({ booking, onClose, onStatusChange, onEdit, updating }) {
  if (!booking) return null
  const normalized = String(booking.status || booking.bookingStatus || 'pending').toLowerCase()
  const nextOptions = ALLOWED_NEXT_STATUSES[normalized] || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Booking Details</h2>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{booking.bookingId || booking._id || 'N/A'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(booking)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <Pencil size={13} /> Edit
            </button>
            <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Status row — bookingStatus + rideStatus */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Booking Status</p>
                <StatusBadge status={booking.status || booking.bookingStatus} />
              </div>
              {booking.rideStatus && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ride Status</p>
                  <RideStatusBadge status={booking.rideStatus} />
                </div>
              )}
            </div>
            {nextOptions.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Change Status</p>
                <div className="flex gap-2 flex-wrap justify-end">
                  {nextOptions.map((s) => {
                    const cfg = getStatusConfig(s)
                    return (
                      <button
                        key={s}
                        disabled={updating}
                        onClick={() => onStatusChange(booking._id || booking.bookingId, s)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:opacity-50 ${cfg.bg} ${cfg.text} ring-1 ring-inset ${cfg.ring}`}
                      >
                        {updating ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Car Info */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Car Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Make / Model</span><p className="font-semibold text-slate-900 mt-0.5">{[booking.make, booking.model].filter(Boolean).join(' ') || 'N/A'}</p></div>
              <div><span className="text-slate-500">Vehicle Type</span><p className="font-semibold text-slate-900 mt-0.5">{booking.vehicleType || 'N/A'}</p></div>
              <div><span className="text-slate-500">Plate No.</span><p className="font-semibold text-slate-900 mt-0.5">{booking.vehicleNumber || 'N/A'}</p></div>
              <div><span className="text-slate-500">Color</span><p className="font-semibold text-slate-900 mt-0.5">{booking.color || 'N/A'}</p></div>
              <div><span className="text-slate-500">Sharing Type</span><p className="font-semibold text-slate-900 mt-0.5">{booking.sharingType || 'N/A'}</p></div>
              <div><span className="text-slate-500">Seats Booked</span><p className="font-semibold text-slate-900 mt-0.5">{booking.totalSeatsBooked ?? (booking.seats?.length ?? 'N/A')}</p></div>
            </div>
          </div>

          {/* Journey Info */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Journey</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Pickup Point</span><p className="font-semibold text-slate-900 mt-0.5">{booking.pickupP || 'N/A'}</p></div>
              <div><span className="text-slate-500">Drop Point</span><p className="font-semibold text-slate-900 mt-0.5">{booking.dropP || 'N/A'}</p></div>
              <div><span className="text-slate-500">Pickup Date/Time</span><p className="font-semibold text-slate-900 mt-0.5">{formatDateTime(booking.pickupD) || '—'}</p></div>
              <div><span className="text-slate-500">Drop Date/Time</span><p className="font-semibold text-slate-900 mt-0.5">{formatDateTime(booking.dropD) || '—'}</p></div>
              <div><span className="text-slate-500">Total Price</span><p className="font-bold text-indigo-700 mt-0.5">{formatCurrency(booking.price)}</p></div>
              <div><span className="text-slate-500">Payment</span><p className="font-semibold text-slate-900 mt-0.5">{booking.paymentMethod || '—'} {booking.isPaid ? '✓ Paid' : '✗ Unpaid'}</p></div>
            </div>
          </div>

          {/* Pickup / Drop Codes */}
          {(booking.pickupCode || booking.dropCode) && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Verification Codes</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {booking.pickupCode && <div><span className="text-slate-500">Pickup Code</span><p className="font-mono font-bold text-emerald-700 mt-0.5 text-base tracking-widest">{booking.pickupCode}</p></div>}
                {booking.dropCode && <div><span className="text-slate-500">Drop Code</span><p className="font-mono font-bold text-indigo-700 mt-0.5 text-base tracking-widest">{booking.dropCode}</p></div>}
                {booking.pickupCodeVerifiedAt && <div><span className="text-slate-500">Pickup Verified</span><p className="font-semibold text-slate-900 mt-0.5">{formatDateTime(booking.pickupCodeVerifiedAt)}</p></div>}
                {booking.dropCodeVerifiedAt && <div><span className="text-slate-500">Drop Verified</span><p className="font-semibold text-slate-900 mt-0.5">{formatDateTime(booking.dropCodeVerifiedAt)}</p></div>}
              </div>
            </div>
          )}

          {/* Guest Info */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Guest / Booked By</h3>

            {/* Passengers from passengers[] array (multi-seat bookings) */}
            {Array.isArray(booking.passengers) && booking.passengers.length > 0 ? (
              <div className="space-y-2">
                {booking.passengers.map((p, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border px-3 py-2.5 text-sm ${
                      idx === 0
                        ? 'border-indigo-100 bg-indigo-50/60'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                        idx === 0 ? 'bg-indigo-600' : 'bg-slate-400'
                      }`}>{idx + 1}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {idx === 0 ? 'Primary Passenger' : `Passenger ${idx + 1}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><span className="text-slate-400 text-[11px]">Name</span><p className="font-semibold text-slate-900 text-xs mt-0.5">{p.name || '—'}</p></div>
                      <div><span className="text-slate-400 text-[11px]">Mobile</span><p className="font-semibold text-slate-900 text-xs mt-0.5">{p.mobile || '—'}</p></div>
                      <div><span className="text-slate-400 text-[11px]">Email</span><p className="font-semibold text-slate-900 text-xs mt-0.5 truncate">{p.email || '—'}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback: single-passenger fields */
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Passenger Name</span><p className="font-semibold text-slate-900 mt-0.5">{booking.passengerName || booking.bookedBy || 'N/A'}</p></div>
                <div><span className="text-slate-500">Mobile</span><p className="font-semibold text-slate-900 mt-0.5">{booking.customerMobile || 'N/A'}</p></div>
                <div className="col-span-2"><span className="text-slate-500">Email</span><p className="font-semibold text-slate-900 mt-0.5 truncate">{booking.customerEmail || 'N/A'}</p></div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm pt-1">
              <div><span className="text-slate-500">Booked On</span><p className="font-semibold text-slate-900 mt-0.5">{formatDateTime(booking.createdAt)}</p></div>
              {booking.assignedDriverName && <div><span className="text-slate-500">Driver</span><p className="font-semibold text-slate-900 mt-0.5">{booking.assignedDriverName}</p></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CarBookingsList({ ownerId: propOwnerId }) {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const { ownerBookings, owners, loading, error, success } = useSelector((state) => state.car)

  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [editingBooking, setEditingBooking]   = useState(null)
  const [updating, setUpdating]         = useState(false)
  const [saving, setSaving]             = useState(false)

  // Owner ID: prop se aaya ho, ya logged-in user ka id
  const resolvedOwnerId = propOwnerId || user?.id || user?._id || ''

  const bookingsList = useMemo(() => getBookingsList(ownerBookings), [ownerBookings])

  const statusOptions = useMemo(() => {
    const statuses = new Set(bookingsList.map((b) => b.status || b.bookingStatus).filter(Boolean))
    return ['All', ...Array.from(statuses)]
  }, [bookingsList])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookingsList.filter((b) => {
      const matchStatus = statusFilter === 'All' || (b.status || b.bookingStatus) === statusFilter
      const matchSearch = !q ||
        [b.make, b.model, b.vehicleType, b.vehicleNumber].some((f) => String(f || '').toLowerCase().includes(q)) ||
        [b.passengerName, b.bookedBy, b.customerMobile].some((f) => String(f || '').toLowerCase().includes(q)) ||
        [b.pickupP, b.dropP].some((f) => String(f || '').toLowerCase().includes(q)) ||
        String(b.bookingId || b._id || '').toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [bookingsList, search, statusFilter])

  const load = () => {
    if (resolvedOwnerId) dispatch(getBookingsOfOwner(resolvedOwnerId))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedOwnerId])

  useEffect(() => {
    return () => {
      dispatch(clearCarError())
      dispatch(clearCarSuccess())
    }
  }, [dispatch])

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => dispatch(clearCarSuccess()), 3000)
      return () => clearTimeout(t)
    }
  }, [success, dispatch])

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!bookingId) return
    setUpdating(true)
    try {
      await dispatch(changeBookingStatus({ bookingId, status: newStatus })).unwrap()
      load()
      setSelectedBooking((prev) => prev ? { ...prev, status: newStatus, bookingStatus: newStatus } : prev)
    } finally {
      setUpdating(false)
    }
  }

  const handleEditSubmit = async (bookingId, bookingData) => {
    if (!bookingId) return
    setSaving(true)
    try {
      await dispatch(updateBooking({ bookingId, bookingData })).unwrap()
      load()
      setEditingBooking(null)
      setSelectedBooking(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-50/70 p-6 md:p-8 min-h-screen">
      <Breadcrumb />

      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header ── */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#eef2ff_100%)] px-6 py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">TMS – Travel Management</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Car Bookings</h1>
                <p className="mt-1 text-sm text-slate-500">Owner ke saare car bookings ek jagah</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Total: {bookingsList.length}
                </span>
                <button
                  onClick={load}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Alerts ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
            <button onClick={() => dispatch(clearCarError())} className="ml-auto text-rose-500 hover:text-rose-800"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} className="shrink-0" />
            {success}
          </div>
        )}

        {/* ── Search + Filter ── */}
        <section className="sticky top-4 z-20 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by car, guest, route, or booking ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
              />
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
              Showing {filtered.length}
            </span>
          </div>
        </section>

        {/* ── Table ── */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          {loading && bookingsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-indigo-500 mb-3" />
              <p className="text-sm font-medium text-slate-500">Bookings load ho rahe hain...</p>
            </div>
          ) : !loading && filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Car size={36} className="text-slate-300 mb-3" />
              <p className="text-base font-semibold text-slate-700">Koi booking nahi mili</p>
              <p className="mt-1 text-sm text-slate-400">Filter change karo ya refresh karo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    {['Booking ID', 'Vehicle', 'Route', 'Passenger', 'Pickup Date', 'Price', 'Booking Status', 'Ride Status', ''].map((h) => (
                      <th key={h} className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((b) => {
                    const status = b.status || b.bookingStatus || 'Pending'
                    const rideStatus = b.rideStatus || 'AwaitingConfirmation'
                    const cfg = getStatusConfig(status)
                    const vehicleName = [b.make, b.model].filter(Boolean).join(' ') || b.vehicleType || 'N/A'
                    const passengerName = b.passengerName || b.bookedBy || 'N/A'
                    return (
                      <tr key={b._id} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-mono text-xs font-bold text-slate-700">{b.bookingId || String(b._id || '').slice(-8).toUpperCase()}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(b.createdAt)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <Car size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{vehicleName}</p>
                              <p className="text-[11px] text-slate-400">{b.vehicleNumber || b.sharingType || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px]">
                              {[b.pickupP, b.dropP].filter(Boolean).join(' → ') || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">{passengerName}</p>
                          <p className="text-[11px] text-slate-400">{b.customerMobile || ''}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <CalendarDays size={13} className="text-slate-400" />
                            {formatDate(b.pickupD)}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(b.price)}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <RideStatusBadge status={rideStatus} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingBooking(b)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-amber-50 hover:text-amber-600"
                              title="Edit booking"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                              title="View details"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── Detail Modal ── */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
          onEdit={(b) => { setSelectedBooking(null); setEditingBooking(b) }}
          updating={updating}
        />
      )}

      {/* ── Edit Modal ── */}
      {editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSubmit={handleEditSubmit}
          saving={saving}
        />
      )}
    </div>
  )
}
