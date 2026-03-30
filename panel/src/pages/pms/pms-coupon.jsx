import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  BadgePercent, BedDouble, Building2, CheckCircle2,
  Loader2, MapPin, RefreshCw, Star, Tag, X, ChevronRight,
} from 'lucide-react'
import { tableClasses } from '../../components/admin-table'
import { selectAuth } from '../../../redux/slices/authSlice'
import { getHotelsByFilters } from '../../../redux/slices/admin/hotel'
import {
  applyCoupon,
  clearAppliedCouponState,
  selectAdminCoupon,
} from '../../../redux/slices/admin/coupon'

/* ── helpers ──────────────────────────────────────────── */
const normalizeRooms = (rooms = []) =>
  rooms
    .map((room) => {
      const id = room?.roomId || room?._id || room?.id || ''
      const type = room?.type || room?.name || room?.roomType || 'Room'
      const bed = room?.bedType || room?.bedTypes || room?.beds || ''
      const price = room?.price || room?.pricing?.basePrice || 0
      if (!id) return null
      return { id, type, bed, price }
    })
    .filter(Boolean)

const normalizeHotel = (h) => ({
  id: h?._id || h?.hotelId || h?.id || '',
  hotelId: h?.hotelId || h?._id || h?.basicInfo?.hotelId || 'N/A',
  hotelName: h?.hotelName || h?.name || h?.basicInfo?.name || 'Unnamed Hotel',
  city: h?.city || h?.hotelCity || h?.basicInfo?.location?.city || '',
  state: h?.state || h?.basicInfo?.location?.state || '',
  email: h?.hotelEmail || h?.email || h?.basicInfo?.contacts?.email || '',
  starRating: Number(h?.starRating || h?.basicInfo?.starRating || 0),
  isAccepted: Boolean(h?.isAccepted),
  rooms: normalizeRooms(h?.rooms || h?.roomDetails || h?.roomTypes || []),
})

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

/* ── StatusBadge ─────────────────────────────────────── */
const StatusBadge = ({ accepted }) =>
  accepted ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Pending
    </span>
  )

/* ── ApplyCouponModal ─────────────────────────────────── */
function ApplyCouponModal({ hotel, onClose }) {
  const dispatch = useDispatch()
  const { applying, applyError, applyMessage, appliedCoupon } = useSelector(selectAdminCoupon)

  const [couponCode, setCouponCode] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')

  useEffect(() => {
    return () => { dispatch(clearAppliedCouponState()) }
  }, [dispatch])

  const handleApply = async () => {
    const code = couponCode.trim()
    if (!code) return
    dispatch(
      applyCoupon({
        couponType: 'partner',
        couponCode: code,
        hotelId: hotel.id,
        hotelIds: [hotel.id],
      }),
    )
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 placeholder:font-normal'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <BadgePercent size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Apply Coupon</p>
              <p className="text-[11px] font-medium text-slate-500 truncate max-w-[220px]">
                {hotel.hotelName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Hotel info strip */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <Building2 size={15} className="shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-slate-700 truncate">{hotel.hotelName}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin size={10} />{[hotel.city, hotel.state].filter(Boolean).join(', ') || 'N/A'}
              </p>
            </div>
            {hotel.starRating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-slate-700">{hotel.starRating}</span>
              </div>
            )}
          </div>

          {/* Rooms */}
          {hotel.rooms.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Rooms ({hotel.rooms.length})
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {hotel.rooms.map((room) => {
                  const active = selectedRoomId === room.id
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoomId(active ? '' : room.id)}
                      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all ${
                        active
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <BedDouble size={12} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold truncate">{room.type}</p>
                        {room.bed && <p className="text-slate-400 truncate">{room.bed}</p>}
                        {room.price > 0 && (
                          <p className="font-semibold text-emerald-600">{fmt(room.price)}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Coupon Code Input */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Coupon Code <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code…"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className={inputClass}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              />
              <button
                type="button"
                onClick={handleApply}
                disabled={applying || !couponCode.trim()}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {applying ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
                Apply
              </button>
            </div>
          </div>

          {/* Error */}
          {applyError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {applyError}
            </div>
          )}

          {/* Success Result */}
          {applyMessage && appliedCoupon && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <p className="text-sm font-bold text-emerald-800">{applyMessage}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { label: 'Original', value: fmt(appliedCoupon.originalPrice), cls: 'text-slate-700' },
                  { label: 'Discount', value: `- ${fmt(appliedCoupon.discountPrice)}`, cls: 'text-rose-600' },
                  { label: 'Final Price', value: fmt(appliedCoupon.finalPrice), cls: 'text-emerald-700 font-extrabold' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="rounded-lg border border-white/80 bg-white/60 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${cls}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────── */
export default function PmsCoupon() {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const { hotels: rawHotels, loading, error } = useSelector((s) => s.hotel)
  const [activeHotel, setActiveHotel] = useState(null)

  const hotels = useMemo(() => (rawHotels || []).map(normalizeHotel), [rawHotels])

  const loadHotels = useCallback(() => {
    if (user?.email) {
      dispatch(getHotelsByFilters({ ownerHotelEmail: user.email }))
    }
  }, [dispatch, user?.email])

  useEffect(() => { loadHotels() }, [loadHotels])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-600">PMS</p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">Coupon Management</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Apply coupons to your hotel rooms
            </p>
          </div>
          <button
            onClick={loadHotels}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Table header bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {loading ? 'Loading hotels…' : `${hotels.length} Hotel${hotels.length !== 1 ? 's' : ''}`}
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                Filtered by your account: <span className="text-slate-600">{user?.email || '—'}</span>
              </p>
            </div>
            {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
          </div>

          {/* Shimmer */}
          {loading && hotels.length === 0 && (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="h-4 w-48 rounded bg-slate-100" />
                  <div className="h-4 w-24 rounded bg-slate-100" />
                  <div className="ml-auto h-8 w-28 rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && hotels.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-300 mb-4">
                <Building2 size={24} />
              </div>
              <p className="text-base font-bold text-slate-700">No hotels found</p>
              <p className="mt-1 text-sm text-slate-400">
                No hotels are linked to <span className="font-semibold">{user?.email}</span>
              </p>
            </div>
          )}

          {/* Hotels Table */}
          {hotels.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className={tableClasses.th}>Hotel</th>
                    <th className={tableClasses.th}>Location</th>
                    <th className={tableClasses.th}>Rooms</th>
                    <th className={tableClasses.th}>Rating</th>
                    <th className={tableClasses.th}>Status</th>
                    <th className={tableClasses.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hotels.map((hotel) => (
                    <tr
                      key={hotel.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Hotel */}
                      <td className={tableClasses.td}>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                            <Building2 size={15} className="text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                              {hotel.hotelName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400">{hotel.hotelId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className={tableClasses.td}>
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          {[hotel.city, hotel.state].filter(Boolean).join(', ') || 'N/A'}
                        </div>
                      </td>

                      {/* Rooms count */}
                      <td className={tableClasses.td}>
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          <BedDouble size={11} className="text-slate-400" />
                          {hotel.rooms.length}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className={tableClasses.td}>
                        {hotel.starRating > 0 ? (
                          <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            {hotel.starRating}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className={tableClasses.td}>
                        <StatusBadge accepted={hotel.isAccepted} />
                      </td>

                      {/* Action */}
                      <td className={tableClasses.td}>
                        <button
                          type="button"
                          onClick={() => setActiveHotel(hotel)}
                          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <BadgePercent size={13} />
                          Apply Coupon
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Apply Coupon Modal */}
      {activeHotel && (
        <ApplyCouponModal hotel={activeHotel} onClose={() => setActiveHotel(null)} />
      )}
    </div>
  )
}