import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Car,
  Loader2,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  Users,
  Fuel,
  Settings2,
  Gauge,
  MapPin,
  X,
  Banknote,
  CalendarDays,
  Hash,
  Tag,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  User,
  IndianRupee,
  Receipt,
} from 'lucide-react'
import { getAllCars, getSeatsData, bookCar } from '../../../redux/slices/tms/travel/car'
import { selectAuth } from '../../../redux/slices/authSlice'
import Breadcrumb from '../../components/breadcrumb'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop'

const StatusBadge = ({ runningStatus, isAvailable }) => {
  const statusStr = runningStatus || (isAvailable ? 'Available' : 'Unavailable')
  const lower = statusStr.toLowerCase()
  let cls = 'bg-slate-500/90'
  let dot = 'bg-white'
  if (lower.includes('trip')) { cls = 'bg-indigo-500/90'; dot = 'bg-white animate-pulse' }
  else if (lower.includes('available')) cls = 'bg-emerald-500/90'
  else if (lower.includes('completed')) cls = 'bg-purple-500/90'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {statusStr}
    </span>
  )
}

// ── Seat Grid (selectable for booking) ───────────────────────────────────────
const SeatGrid = ({ seatsData, totalSeats, selectable = false, selectedSeatIds, onToggleSeat }) => {
  const seats = Array.isArray(seatsData) ? seatsData : []

  if (!seats.length && !totalSeats) return null

  // Private car or no seat config — show generic grid (no selection)
  if (!seats.length && totalSeats) {
    return (
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: totalSeats }).map((_, i) => (
          <div
            key={i}
            className="flex h-9 w-full items-center justify-center rounded-lg border-2 border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400"
          >
            {i + 1}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {seats.map((seat, i) => {
        const seatNum = seat.seatNumber || seat.number || i + 1
        const seatId  = seat._id || seat.id || String(seatNum)
        const isBooked   = seat.isBooked  || seat.booked  || seat.status === 'booked'
        const isBlocked  = seat.isBlocked || seat.blocked || seat.status === 'blocked'
        const isSelected = selectedSeatIds?.has(seatId)

        let cls = 'border-emerald-200 bg-emerald-50 text-emerald-700'
        if (isBooked)        cls = 'border-rose-200 bg-rose-50 text-rose-500 cursor-not-allowed'
        else if (isBlocked)  cls = 'border-amber-200 bg-amber-50 text-amber-500 cursor-not-allowed'
        else if (isSelected) cls = 'border-indigo-500 bg-indigo-600 text-white ring-2 ring-indigo-300'
        else if (selectable) cls += ' cursor-pointer hover:border-indigo-400 hover:bg-emerald-100'

        return (
          <button
            key={seatId}
            type="button"
            disabled={isBooked || isBlocked || !selectable}
            onClick={() => selectable && !isBooked && !isBlocked && onToggleSeat?.(seat)}
            className={`flex h-9 w-full flex-col items-center justify-center rounded-lg border-2 text-[9px] font-bold transition-all ${cls}`}
          >
            <span>{seatNum}</span>
            {isBooked   && <span className="text-[7px] leading-none">Booked</span>}
            {isSelected && !isBooked && <span className="text-[7px] leading-none">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────
const CarDetailDrawer = ({ car, onClose }) => {
  const dispatch = useDispatch()
  const { seatsData, loading } = useSelector((state) => state.car)
  const { user } = useSelector(selectAuth)
  const image = car?.images?.[0] || FALLBACK_IMAGE
  const isShared = car?.sharingType === 'Shared'

  // ── View state: 'detail' | 'book' ─────────────────────────────────────────
  const [view, setView] = useState('detail')

  // ── Seat selection (Shared only) ───────────────────────────────────────────
  // Map of seatId → seat object for O(1) toggle
  const [selectedSeatMap, setSelectedSeatMap] = useState(new Map())
  const selectedSeatIds = new Set(selectedSeatMap.keys())
  const selectedSeatsArr = Array.from(selectedSeatMap.values())
  const selectedSeatTotal = selectedSeatsArr.reduce((sum, s) => sum + Number(s.seatPrice || 0), 0)

  const handleToggleSeat = (seat) => {
    const id = seat._id || seat.id || String(seat.seatNumber)
    setSelectedSeatMap((prev) => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, seat)
      return next
    })
  }

  // ── Customer form fields ───────────────────────────────────────────────────
  const [form, setForm] = useState({ customerMobile: '', customerEmail: '' })
  const handleFormField = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  // ── Booking result ─────────────────────────────────────────────────────────
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError]     = useState('')
  const [bookingResult, setBookingResult]   = useState(null) // response data

  useEffect(() => {
    if (car?._id) dispatch(getSeatsData(car._id))
  }, [dispatch, car?._id])

  // ── Validate before submit ─────────────────────────────────────────────────
  const canBook = () => {
    if (!form.customerMobile.trim()) return false
    if (isShared && selectedSeatMap.size === 0) return false
    return true
  }

  // ── Submit booking ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canBook()) {
      setBookingError(isShared ? 'Please select at least one seat and enter mobile number.' : 'Mobile number is required.')
      return
    }
    setBookingLoading(true)
    setBookingError('')
    try {
      const payload = {
        userId:         user?._id || user?.id || user?.userId || '',
        carId:          car._id,
        customerMobile: form.customerMobile.trim(),
        sharingType:    car.sharingType,
        vehicleType:    car.vehicleType,
      }
      if (form.customerEmail.trim()) {
        payload.customerEmail = form.customerEmail.trim()
        payload.bookedBy      = form.customerEmail.trim()
      } else {
        payload.bookedBy = form.customerMobile.trim()
      }
      // Shared: send selected seat _ids
      if (isShared && selectedSeatMap.size > 0) {
        payload.seats = Array.from(selectedSeatMap.keys())
      }
      const result = await dispatch(bookCar(payload)).unwrap()
      setBookingResult(result?.data || result)
    } catch (err) {
      setBookingError(typeof err === 'string' ? err : err?.message || 'Booking failed. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const specs = [
    { icon: <Hash size={13} />, label: 'Vehicle No.', value: car.vehicleNumber },
    { icon: <Tag size={13} />, label: 'Color', value: car.color },
    { icon: <Fuel size={13} />, label: 'Fuel', value: car.fuelType },
    { icon: <Settings2 size={13} />, label: 'Transmission', value: car.transmission },
    { icon: <Gauge size={13} />, label: 'Mileage', value: car.mileage ? `${car.mileage} kmpl` : null },
    { icon: <CalendarDays size={13} />, label: 'Year', value: car.year },
    { icon: <Users size={13} />, label: 'Seater', value: car.seater ? `${car.seater} Seats` : null },
    { icon: <Banknote size={13} />, label: 'Rate', value: car.price ? `₹${car.price}/${isShared ? 'seat' : 'day'}` : null },
  ].filter((s) => s.value)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{car.make} {car.model}</p>
            <p className="text-[10px] text-slate-400">{car.vehicleNumber} · {car.vehicleType}</p>
          </div>
          <button onClick={onClose} className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── BOOKING SUCCESS SCREEN ── */}
        {bookingResult && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 py-12 text-center overflow-y-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Booking Confirmed!</h2>
              <p className="mt-1 text-xs text-slate-500">{car.make} {car.model} successfully booked.</p>
            </div>
            {/* Price breakdown */}
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left space-y-3">
              {bookingResult.basePrice !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500">Base Price</span>
                  <span className="font-bold text-slate-900">₹{bookingResult.basePrice}</span>
                </div>
              )}
              {bookingResult.gstRate !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500">GST ({bookingResult.gstRate}%)</span>
                  <span className="font-bold text-slate-900">₹{bookingResult.gstAmount}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Total Payable</span>
                <span className="text-xl font-extrabold text-indigo-600">₹{bookingResult.price}</span>
              </div>
            </div>
            {bookingResult.bookingId && (
              <p className="text-[10px] font-mono text-slate-400">Booking ID: {bookingResult.bookingId}</p>
            )}
            <button onClick={onClose} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
              Done
            </button>
          </div>
        )}

        {/* ── DETAIL + BOOK VIEWS ── */}
        {!bookingResult && (
          <div className="flex flex-1 flex-col overflow-y-auto">

            {/* Image */}
            <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-100">
              <img src={image} alt={`${car.make} ${car.model}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-lg font-extrabold text-white">{car.make} {car.model}</p>
                  <p className="text-xs text-slate-300">{car.year} · {car.color}</p>
                </div>
                <StatusBadge runningStatus={car.runningStatus} isAvailable={car.isAvailable} />
              </div>
            </div>

            {/* KPI pills */}
            <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
              {[
                { label: 'Type', value: car.vehicleType },
                { label: 'Mode', value: car.sharingType },
                { label: 'Price', value: car.price ? `₹${car.price}` : 'On request' },
                { label: 'Seats', value: car.seater || '-' },
              ].map((kpi) => (
                <div key={kpi.label} className="flex flex-col items-center rounded-xl bg-slate-50 px-4 py-2 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</span>
                  <span className="text-sm font-extrabold text-slate-900">{kpi.value}</span>
                </div>
              ))}
            </div>

            {/* ── DETAIL view ── */}
            {view === 'detail' && (
              <>
                {/* Specs */}
                <div className="border-b border-slate-100 px-5 py-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Specifications</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {specs.map((spec) => (
                      <div key={spec.label} className="flex items-center gap-2">
                        <span className="shrink-0 text-slate-400">{spec.icon}</span>
                        <span className="text-[11px] text-slate-500 shrink-0">{spec.label}:</span>
                        <span className="truncate text-[11px] font-semibold text-slate-800">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route */}
                {(car.pickupP || car.dropP) && (
                  <div className="border-b border-slate-100 px-5 py-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Route</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <MapPin size={13} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{car.pickupP || 'Any'}</span>
                      <span className="mx-1 text-slate-300">→</span>
                      <MapPin size={13} className="text-rose-400 shrink-0" />
                      <span className="truncate">{car.dropP || 'Any'}</span>
                    </div>
                  </div>
                )}

                {/* Seat layout (read-only in detail view) */}
                <div className="px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seat Layout</p>
                    <div className="flex items-center gap-3 text-[9px] font-bold">
                      <span className="flex items-center gap-1 text-emerald-600"><span className="h-2 w-2 rounded bg-emerald-200 border border-emerald-300" /> Available</span>
                      <span className="flex items-center gap-1 text-rose-500"><span className="h-2 w-2 rounded bg-rose-200 border border-rose-300" /> Booked</span>
                    </div>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-indigo-500" /></div>
                  ) : (
                    <SeatGrid seatsData={seatsData} totalSeats={car.seater} selectable={false} />
                  )}
                </div>

                {/* Footer CTA */}
                <div className="sticky bottom-0 border-t border-slate-100 bg-white px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    {car.isAvailable ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> : <XCircle size={13} className="text-rose-400 shrink-0" />}
                    <span className="text-xs font-semibold text-slate-500">
                      {car.isAvailable ? 'Available for booking' : `Unavailable · ${car.runningStatus || ''}`}
                    </span>
                  </div>
                  <button
                    disabled={!car.isAvailable}
                    onClick={() => setView('book')}
                    className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Book Now
                  </button>
                </div>
              </>
            )}

            {/* ── BOOK view ── */}
            {view === 'book' && (
              <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                  {/* Error banner */}
                  {bookingError && (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">
                      <span>{bookingError}</span>
                      <button type="button" onClick={() => setBookingError('')}><X size={13} /></button>
                    </div>
                  )}

                  {/* Seat selection — Shared only */}
                  {isShared && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Select Seats <span className="text-rose-500">*</span></p>
                      {loading ? (
                        <div className="flex items-center justify-center py-6"><Loader2 size={18} className="animate-spin text-indigo-500" /></div>
                      ) : (
                        <SeatGrid
                          seatsData={seatsData}
                          totalSeats={car.seater}
                          selectable
                          selectedSeatIds={selectedSeatIds}
                          onToggleSeat={handleToggleSeat}
                        />
                      )}

                      {/* Selected seat summary */}
                      {selectedSeatMap.size > 0 && (
                        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 space-y-1">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {selectedSeatsArr.map((s) => (
                              <span key={s._id || s.seatNumber} className="rounded-lg bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Seat {s.seatNumber}
                                {s.seatPrice ? ` · ₹${s.seatPrice}` : ''}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-500">{selectedSeatMap.size} seat{selectedSeatMap.size > 1 ? 's' : ''} selected</span>
                            {selectedSeatTotal > 0 && (
                              <span className="text-indigo-700">₹{selectedSeatTotal} (before GST)</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer info */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Customer Details</p>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">Mobile Number <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          required
                          type="tel"
                          name="customerMobile"
                          value={form.customerMobile}
                          onChange={handleFormField}
                          placeholder="9876543210"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700">Email <span className="text-slate-400 font-normal">(optional)</span></label>
                      <div className="relative">
                        <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          name="customerEmail"
                          value={form.customerEmail}
                          onChange={handleFormField}
                          placeholder="customer@example.com"
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GST note */}
                  <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                    <Receipt size={13} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-amber-700">GST will be automatically applied by the server based on total seat price. Final amount will be shown after booking.</p>
                  </div>

                  {/* Private car note */}
                  {!isShared && (
                    <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <IndianRupee size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-slate-600">Private vehicle — all seats will be booked. Rate: ₹{car.price || 0}/day + GST.</p>
                    </div>
                  )}
                </div>

                {/* Sticky submit footer */}
                <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3.5 space-y-2">
                  <button
                    type="submit"
                    disabled={bookingLoading || !canBook()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {bookingLoading ? <><Loader2 size={14} className="animate-spin" />Processing…</> : 'Confirm Booking'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setView('detail'); setBookingError('') }}
                    className="w-full rounded-xl py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    ← Back to Car Details
                  </button>
                </div>
              </form>
            )}

          </div>
        )}
      </div>
    </>
  )
}

// ── Car Card ───────────────────────────────────────────────────────────────────
const CarCard = ({ car, onBook }) => {
  const image = car?.images?.[0] || FALLBACK_IMAGE
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300">
      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
        <img src={image} alt={`${car.make} ${car.model}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent" />
        <div className="absolute left-2.5 top-2.5">
          <StatusBadge runningStatus={car.runningStatus} isAvailable={car.isAvailable} />
        </div>
        <div className="absolute bottom-2.5 left-3 right-3">
          <p className="truncate text-sm font-extrabold text-white leading-tight">{car.make} {car.model}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">{car.year}</span>
            {car.color && <span className="text-[10px] text-slate-300">• {car.color}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="mb-2.5 flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex flex-wrap gap-1">
            {car.vehicleType && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">{car.vehicleType}</span>}
            {car.sharingType && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">{car.sharingType}</span>}
            {car.vehicleNumber && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-indigo-600 border border-indigo-100">{car.vehicleNumber}</span>}
          </div>
          <div className="shrink-0 text-right">
            <span className="text-sm font-extrabold text-slate-900">₹{car.price || car.perPersonCost || 0}</span>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">/{car.sharingType === 'Shared' ? 'seat' : 'day'}</p>
          </div>
        </div>

        <div className="mb-2.5 grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] font-medium text-slate-600">
          <div className="flex items-center gap-1.5"><Users size={12} className="text-slate-400 shrink-0" />{car.seater || '-'} Seats</div>
          <div className="flex items-center gap-1.5"><Fuel size={12} className="text-slate-400 shrink-0" />{car.fuelType || '-'}</div>
          <div className="flex items-center gap-1.5"><Settings2 size={12} className="text-slate-400 shrink-0" />{car.transmission || '-'}</div>
          <div className="flex items-center gap-1.5"><Gauge size={12} className="text-slate-400 shrink-0" />{car.mileage ? `${car.mileage} kmpl` : '-'}</div>
        </div>

        {(car.pickupP || car.dropP) && (
          <div className="mb-2.5 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 border border-slate-100">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{car.pickupP || 'Any'} <span className="text-slate-300 mx-0.5">→</span> {car.dropP || 'Any'}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => onBook(car)}
          className="mt-auto w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          disabled={!car.isAvailable}
        >
          {car.isAvailable ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AllCars() {
  const dispatch = useDispatch()
  const { cars, loading, error } = useSelector((state) => state.car)

  const [searchTerm, setSearchTerm]       = useState('')
  const [typeFilter, setTypeFilter]       = useState('')
  const [sharingFilter, setSharingFilter] = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [selectedCar, setSelectedCar]     = useState(null)

  useEffect(() => { dispatch(getAllCars()) }, [dispatch])

  const filteredCars = useMemo(() => {
    if (!Array.isArray(cars)) return []
    const q = searchTerm.toLowerCase()
    return cars.filter((car) => {
      const matchesSearch = !q ||
        (car.make || '').toLowerCase().includes(q) ||
        (car.model || '').toLowerCase().includes(q) ||
        (car.vehicleNumber || '').toLowerCase().includes(q) ||
        (car.ownerName || '').toLowerCase().includes(q)
      const matchesType    = !typeFilter    || car.vehicleType === typeFilter
      const matchesSharing = !sharingFilter || car.sharingType === sharingFilter
      const matchesStatus  = !statusFilter  || (car.runningStatus || (car.isAvailable ? 'Available' : 'Unavailable')).toLowerCase().includes(statusFilter.toLowerCase())
      return matchesSearch && matchesType && matchesSharing && matchesStatus
    })
  }, [cars, searchTerm, typeFilter, sharingFilter, statusFilter])

  const hasActiveFilters = searchTerm || typeFilter || sharingFilter || statusFilter

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('')
    setSharingFilter('')
    setStatusFilter('')
  }

  return (
    <div className="min-h-screen bg-slate-50/40 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-5">
          <Breadcrumb />
          <div className="mt-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">All Cars</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500">Browse and book available vehicles.</p>
          </div>
        </div>

        {/* Filter toolbar */}
        {!loading && !error && Array.isArray(cars) && cars.length > 0 && (
          <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-sm lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-col divide-y divide-slate-100 sm:flex-row sm:divide-x sm:divide-y-0">
              <div className="relative flex-[1.5] group">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search make, model, number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent py-2 pl-8 pr-3 text-xs font-semibold text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
              <div className="relative flex-1 shrink-0">
                <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full appearance-none bg-transparent py-2 pl-8 pr-7 text-xs font-semibold text-slate-700 outline-none cursor-pointer">
                  <option value="">All Types</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Bus">Bus</option>
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative flex-1 shrink-0">
                <select value={sharingFilter} onChange={(e) => setSharingFilter(e.target.value)} className="w-full appearance-none bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none cursor-pointer">
                  <option value="">All Modes</option>
                  <option value="Private">Private</option>
                  <option value="Shared">Shared</option>
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative flex-1 shrink-0">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none cursor-pointer">
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="On A Trip">On A Trip</option>
                  <option value="Completed">Completed</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 pb-1 lg:pb-0">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors">Clear</button>
              )}
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">{filteredCars.length} Records</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-indigo-600 mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading cars...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 shadow-sm">
            <AlertTriangle size={16} />{error}
          </div>
        )}

        {!loading && !error && Array.isArray(cars) && cars.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3">
              <Car size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Cars Found</h3>
            <p className="mt-1 text-xs text-slate-500">No vehicles have been registered yet.</p>
          </div>
        )}

        {!loading && !error && Array.isArray(cars) && cars.length > 0 && filteredCars.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
            <Search size={24} className="text-slate-300 mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Matches Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
          </div>
        )}

        {!loading && !error && filteredCars.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCars.map((car) => (
              <CarCard key={car._id} car={car} onBook={setSelectedCar} />
            ))}
          </div>
        )}
      </div>

      {/* Book Now Drawer */}
      {selectedCar && (
        <CarDetailDrawer car={selectedCar} onClose={() => setSelectedCar(null)} />
      )}
    </div>
  )
}
