/**
 * Tour Booking Details Page
 * Route: /admin-tour/booking/:id
 * Shows full booking info + inline edit modal.
 * Edit mode auto-opens when URL has ?edit=true
 */
import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bus, ArrowLeft, RefreshCw, Pencil, X, Save, Loader2,
  Hash, CalendarDays, Users, IndianRupee, MapPin, Phone,
  Mail, CreditCard, CheckCircle2, XCircle, Clock, Package,
  AlertCircle, ChevronDown, ChevronUp, User, Baby,
  Banknote, Tag, Receipt, Building2,
} from 'lucide-react'
import { getBookingsByBookingId, updateBooking } from '../../../redux/slices/tms/travel/tour/tour'
import { formatCurrency, formatDate } from '../../utils/format'

/* ── helpers ────────────────────────────────────────────── */
const STATUS_CONFIG = {
  confirmed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={13} /> },
  pending:   { cls: 'bg-amber-50   text-amber-700   border-amber-200',   icon: <Clock size={13} /> },
  cancelled: { cls: 'bg-rose-50    text-rose-700    border-rose-200',    icon: <XCircle size={13} /> },
  held:      { cls: 'bg-blue-50    text-blue-700    border-blue-200',    icon: <Clock size={13} /> },
  failed:    { cls: 'bg-slate-50   text-slate-500   border-slate-200',   icon: <XCircle size={13} /> },
}

const StatusBadge = ({ status, lg }) => {
  const s = (status || 'pending').toLowerCase()
  const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold capitalize ${lg ? 'text-sm' : 'text-[11px]'} ${cfg.cls}`}>
      {cfg.icon} {s}
    </span>
  )
}

const Field = ({ label, value, mono, className = '' }) =>
  value != null && value !== '' ? (
    <div className={className}>
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  ) : null

const SectionCard = ({ title, icon, children, collapsible }) => {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div
        className={`flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="text-indigo-500">{icon}</span>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-600">{title}</p>
        </div>
        {collapsible && (open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />)}
      </div>
      {(!collapsible || open) && <div className="p-5">{children}</div>}
    </div>
  )
}

/* ── Edit Modal ─────────────────────────────────────────── */
function EditModal({ booking, onClose, onSaved }) {
  const dispatch = useDispatch()
  const { loading } = useSelector(s => s.tour)

  const [form, setForm] = useState({
    status:            booking.status            || 'pending',
    tourStartDate:     booking.tourStartDate     ? booking.tourStartDate.slice(0, 10) : '',
    from:              booking.from              ? booking.from.slice(0, 10) : '',
    to:                booking.to               ? booking.to.slice(0, 10) : '',
    numberOfAdults:    booking.numberOfAdults    ?? 1,
    numberOfChildren:  booking.numberOfChildren  ?? 0,
    seats:             (booking.seats || []).join(', '),
    travelAgencyName:  booking.travelAgencyName  || '',
    agencyPhone:       booking.agencyPhone       || '',
    agencyEmail:       booking.agencyEmail       || '',
    basePrice:         booking.basePrice         ?? 0,
    seatPrice:         booking.seatPrice         ?? 0,
    tax:               booking.tax               ?? 0,
    discount:          booking.discount          ?? 0,
    totalAmount:       booking.totalAmount       ?? 0,
    isPaid:            booking.payment?.isPaid   ?? false,
    paymentMode:       booking.payment?.mode     || '',
    collectedBy:       booking.payment?.collectedBy || '',
    paidAt:            booking.payment?.paidAt   ? booking.payment.paidAt.slice(0, 10) : '',
    passengers:        (booking.passengers || []).map(p => ({ ...p })),
  })
  const [error, setError] = useState('')

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const updatePassenger = (idx, key, val) => {
    setForm(prev => {
      const arr = [...prev.passengers]
      arr[idx] = { ...arr[idx], [key]: val }
      return { ...prev, passengers: arr }
    })
  }
  const addPassenger    = () => setForm(prev => ({ ...prev, passengers: [...prev.passengers, { type: 'adult', fullName: '', gender: '', dateOfBirth: '' }] }))
  const removePassenger = (idx) => setForm(prev => ({ ...prev, passengers: prev.passengers.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    setError('')
    const seatsArr = form.seats.split(',').map(s => s.trim()).filter(Boolean)
    const payload = {
      status:           form.status,
      tourStartDate:    form.tourStartDate || undefined,
      from:             form.from          || undefined,
      to:               form.to            || undefined,
      numberOfAdults:   Number(form.numberOfAdults),
      numberOfChildren: Number(form.numberOfChildren),
      seats:            seatsArr,
      travelAgencyName: form.travelAgencyName,
      agencyPhone:      form.agencyPhone,
      agencyEmail:      form.agencyEmail,
      basePrice:        Number(form.basePrice),
      seatPrice:        Number(form.seatPrice),
      tax:              Number(form.tax),
      discount:         Number(form.discount),
      totalAmount:      Number(form.totalAmount),
      passengers:       form.passengers,
      'payment.isPaid':      form.isPaid,
      'payment.mode':        form.paymentMode,
      'payment.collectedBy': form.collectedBy,
      'payment.paidAt':      form.paidAt || undefined,
    }
    const res = await dispatch(updateBooking({ bookingId: booking._id, updatedData: payload }))
    if (updateBooking.rejected.match(res)) {
      setError(res.payload || 'Update failed')
    } else {
      onSaved()
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100'
  const labelCls = 'mb-1 block text-[11px] font-bold text-slate-600'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4 pt-8">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <p className="text-sm font-extrabold text-slate-900">Edit Booking</p>
            <p className="font-mono text-[11px] text-slate-400">{booking.bookingCode}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-6 p-6">

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {/* Status */}
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Booking Status</p>
            <div className="flex flex-wrap gap-2">
              {['pending', 'confirmed', 'cancelled', 'held', 'failed'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`rounded-xl border px-4 py-1.5 text-xs font-bold capitalize transition-all ${
                    form.status === s
                      ? STATUS_CONFIG[s]?.cls + ' ring-2 ring-offset-1 ring-indigo-300'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Dates</p>
            <div className="grid grid-cols-3 gap-3">
              {[['tourStartDate', 'Tour Start Date'], ['from', 'Journey From'], ['to', 'Journey To']].map(([k, lbl]) => (
                <div key={k}>
                  <label className={labelCls}>{lbl}</label>
                  <input type="date" value={form[k]} onChange={e => set(k, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Passengers count + seats */}
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Passengers & Seats</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Adults</label>
                <input type="number" min={0} value={form.numberOfAdults} onChange={e => set('numberOfAdults', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Children</label>
                <input type="number" min={0} value={form.numberOfChildren} onChange={e => set('numberOfChildren', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Seats (comma-separated)</label>
                <input type="text" value={form.seats} onChange={e => set('seats', e.target.value)} placeholder="1A, 2B, 3C" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Agency info */}
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Agency Details</p>
            <div className="grid grid-cols-3 gap-3">
              {[['travelAgencyName', 'Agency Name'], ['agencyPhone', 'Phone'], ['agencyEmail', 'Email']].map(([k, lbl]) => (
                <div key={k}>
                  <label className={labelCls}>{lbl}</label>
                  <input type="text" value={form[k]} onChange={e => set(k, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Pricing (₹)</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {[['basePrice', 'Base'], ['seatPrice', 'Seat'], ['tax', 'GST'], ['discount', 'Discount'], ['totalAmount', 'Total']].map(([k, lbl]) => (
                <div key={k}>
                  <label className={labelCls}>{lbl}</label>
                  <input type="number" min={0} value={form[k]} onChange={e => set(k, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Payment</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className={labelCls}>Mode</label>
                <select value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Paid?</label>
                <select value={form.isPaid ? 'yes' : 'no'} onChange={e => set('isPaid', e.target.value === 'yes')} className={inputCls}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Collected By</label>
                <input type="text" value={form.collectedBy} onChange={e => set('collectedBy', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Paid At</label>
                <input type="date" value={form.paidAt} onChange={e => set('paidAt', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Passengers list */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Passenger Details</p>
              <button type="button" onClick={addPassenger} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100">
                + Add Passenger
              </button>
            </div>
            {form.passengers.length === 0 ? (
              <p className="text-xs text-slate-400">No passengers added.</p>
            ) : (
              <div className="space-y-3">
                {form.passengers.map((p, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Passenger {idx + 1}</span>
                      <button type="button" onClick={() => removePassenger(idx)} className="rounded p-1 text-slate-400 hover:text-rose-500">
                        <X size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <label className={labelCls}>Type</label>
                        <select value={p.type} onChange={e => updatePassenger(idx, 'type', e.target.value)} className={inputCls}>
                          <option value="adult">Adult</option>
                          <option value="child">Child</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Full Name</label>
                        <input type="text" value={p.fullName || ''} onChange={e => updatePassenger(idx, 'fullName', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Gender</label>
                        <select value={p.gender || ''} onChange={e => updatePassenger(idx, 'gender', e.target.value)} className={inputCls}>
                          <option value="">—</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Date of Birth</label>
                        <input type="date" value={p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : ''} onChange={e => updatePassenger(idx, 'dateOfBirth', e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────── */
export default function TourBookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useDispatch()
  const { bookingDetails, loading, error } = useSelector(s => s.tour)

  const [editOpen, setEditOpen] = useState(searchParams.get('edit') === 'true')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const load = useCallback(() => dispatch(getBookingsByBookingId(id)), [dispatch, id])
  useEffect(() => { load() }, [load])

  const booking = bookingDetails

  const handleEditClose = () => {
    setEditOpen(false)
    setSearchParams({})
  }
  const handleSaved = () => {
    setSaveSuccess(true)
    setEditOpen(false)
    setSearchParams({})
    load()
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  /* ── loading ── */
  if (loading && !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-semibold">Loading booking…</p>
        </div>
      </div>
    )
  }

  /* ── error ── */
  if (error && !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle size={28} className="mx-auto mb-3 text-rose-400" />
          <p className="text-sm font-bold text-rose-700">{typeof error === 'string' ? error : 'Failed to load booking'}</p>
          <button onClick={() => navigate(-1)} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">Go Back</button>
        </div>
      </div>
    )
  }

  if (!booking) return null

  const adults   = booking.numberOfAdults   ?? 0
  const children = booking.numberOfChildren ?? 0
  const seats    = Array.isArray(booking.seats) ? booking.seats : []
  const pax      = booking.passengers || []

  return (
    <>
      {editOpen && <EditModal booking={booking} onClose={handleEditClose} onSaved={handleSaved} />}

      <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-5">

          {/* ── Top bar ── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Bus size={16} className="text-indigo-500" />
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">Admin — TMS / Tour Booking</p>
                </div>
                <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  Booking Details
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                <Pencil size={13} /> Edit Booking
              </button>
            </div>
          </div>

          {/* ── Success toast ── */}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={15} /> Booking updated successfully.
            </div>
          )}

          {/* ── Hero card ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-slate-300" />
                  <span className="font-mono text-lg font-extrabold text-slate-800 tracking-wide">{booking.bookingCode || booking._id}</span>
                  <StatusBadge status={booking.status} lg />
                </div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Building2 size={13} className="text-slate-400" />
                  {booking.travelAgencyName || '—'}
                </p>
                {booking.visitngPlaces && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <MapPin size={13} className="text-indigo-400" />
                    {booking.visitngPlaces}
                  </p>
                )}
                <p className="flex items-center gap-2 text-[11px] text-slate-400">
                  <CalendarDays size={12} />
                  Booked on {formatDate(booking.createdAt)}
                </p>
              </div>

              {/* Amount hero */}
              <div className="shrink-0 rounded-2xl bg-indigo-50 border border-indigo-100 px-6 py-4 text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Total Amount</p>
                <p className="mt-0.5 text-2xl font-extrabold text-indigo-700">{formatCurrency(booking.totalAmount)}</p>
                {booking.tax > 0 && (
                  <p className="text-[11px] text-indigo-400">incl. GST ₹{booking.tax?.toLocaleString('en-IN')}</p>
                )}
                <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${booking.payment?.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {booking.payment?.isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                  {booking.payment?.isPaid ? 'Paid' : 'Unpaid'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Two-column grid ── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* Booking Info */}
            <SectionCard title="Booking Info" icon={<Package size={15} />}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="Booking ID"    value={booking._id}          mono />
                <Field label="Booking Code"  value={booking.bookingCode}  mono />
                <Field label="Tour ID"       value={booking.tourId}       mono />
                <Field label="Vehicle ID"    value={booking.vehicleId}    mono />
                <Field label="Status"        value={<StatusBadge status={booking.status} />} />
                <Field label="Source"        value={booking.bookingSource ? <span className="capitalize">{booking.bookingSource}</span> : null} />
                <Field label="Tour Start"    value={formatDate(booking.tourStartDate)} />
                <Field label="Journey"       value={booking.from && booking.to ? `${formatDate(booking.from)} → ${formatDate(booking.to)}` : null} />
                <Field label="Nights / Days" value={booking.nights != null ? `${booking.nights}N / ${booking.days}D` : null} />
                <Field label="Customizable"  value={booking.isCustomizable ? 'Yes' : 'No'} />
              </div>
            </SectionCard>

            {/* Agency Details */}
            <SectionCard title="Agency Details" icon={<Building2 size={15} />}>
              <div className="space-y-4">
                <Field label="Agency Name"   value={booking.travelAgencyName} />
                <Field label="Phone"         value={booking.agencyPhone ? (
                  <a href={`tel:${booking.agencyPhone}`} className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                    <Phone size={12} /> {booking.agencyPhone}
                  </a>
                ) : null} />
                <Field label="Email"         value={booking.agencyEmail ? (
                  <a href={`mailto:${booking.agencyEmail}`} className="flex items-center gap-1.5 text-indigo-600 hover:underline">
                    <Mail size={12} /> {booking.agencyEmail}
                  </a>
                ) : null} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Country" value={booking.country} />
                  <Field label="State"   value={booking.state}   />
                  <Field label="City"    value={booking.city}    />
                </div>
                <Field label="Theme" value={booking.themes} />
              </div>
            </SectionCard>

            {/* Pricing Breakdown */}
            <SectionCard title="Pricing Breakdown" icon={<Receipt size={15} />}>
              <div className="space-y-2.5">
                {[
                  ['Base Price',    booking.basePrice,    'text-slate-700'],
                  ['Seat Price',    booking.seatPrice,    'text-slate-700'],
                  ['GST / Tax',     booking.tax,          'text-amber-600'],
                  ['Discount',      booking.discount,     'text-emerald-600'],
                ].filter(([, v]) => v != null && v !== 0).map(([lbl, val, cls]) => (
                  <div key={lbl} className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-500">{lbl}</span>
                    <span className={`text-sm font-bold ${cls}`}>₹{Number(val).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2 mt-2">
                  <span className="text-sm font-extrabold text-indigo-700">Total Amount</span>
                  <span className="text-base font-extrabold text-indigo-700">₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </SectionCard>

            {/* Payment Info */}
            <SectionCard title="Payment Info" icon={<CreditCard size={15} />}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="Is Paid"       value={booking.payment?.isPaid ? '✅ Yes' : '❌ No'} />
                <Field label="Mode"          value={booking.payment?.mode   ? <span className="capitalize">{booking.payment.mode}</span> : null} />
                <Field label="Provider"      value={booking.payment?.provider} />
                <Field label="Order ID"      value={booking.payment?.orderId}     mono />
                <Field label="Transaction ID" value={booking.payment?.paymentId}  mono />
                <Field label="Paid At"       value={formatDate(booking.payment?.paidAt)} />
                <Field label="Collected By"  value={booking.payment?.collectedBy} />
              </div>
            </SectionCard>
          </div>

          {/* ── Passengers ── */}
          <SectionCard title={`Passengers  (${adults}A + ${children}C)`} icon={<Users size={15} />}>
            {/* Counts */}
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5">
                <User size={14} className="text-indigo-500" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Adults</p>
                  <p className="text-sm font-extrabold text-slate-800">{adults}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5">
                <Baby size={14} className="text-amber-500" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Children</p>
                  <p className="text-sm font-extrabold text-slate-800">{children}</p>
                </div>
              </div>
              {seats.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5">
                  <Tag size={14} className="text-emerald-500" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Seats</p>
                    <p className="font-mono text-sm font-extrabold text-slate-800">{seats.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Passengers table */}
            {pax.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      {['#', 'Name', 'Type', 'Gender', 'Date of Birth'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pax.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{p.fullName || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${p.type === 'adult' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                            {p.type === 'adult' ? <User size={10} /> : <Baby size={10} />} {p.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-xs text-slate-600">{p.gender || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{p.dateOfBirth ? formatDate(p.dateOfBirth) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No passenger details recorded.</p>
            )}
          </SectionCard>

          {/* ── Tour Policy Snapshot ── */}
          {(booking.amenities?.length || booking.inclusion?.length || booking.exclusion?.length || booking.dayWise?.length) ? (
            <SectionCard title="Tour Snapshot" icon={<Package size={15} />} collapsible>
              <div className="space-y-5">
                {booking.amenities?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {booking.amenities.map((a, i) => (
                        <span key={i} className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {booking.inclusion?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Inclusions</p>
                    <ul className="space-y-1">
                      {booking.inclusion.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {booking.exclusion?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Exclusions</p>
                    <ul className="space-y-1">
                      {booking.exclusion.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700"><XCircle size={12} className="mt-0.5 shrink-0 text-rose-400" />{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {booking.dayWise?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Day-wise Itinerary</p>
                    <div className="space-y-2">
                      {booking.dayWise.map((d, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="mb-1 text-[11px] font-extrabold text-indigo-600">Day {d.day}</p>
                          <p className="text-xs text-slate-700">{d.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          ) : null}

        </div>
      </div>
    </>
  )
}
