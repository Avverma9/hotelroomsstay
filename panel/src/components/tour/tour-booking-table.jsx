/**
 * Reusable TourBookingTable component.
 * Used by: src/pages/tms/tour-booking-list.jsx
 *          src/pages/admin/all-tour-bookings.jsx
 *
 * Props:
 *   bookings      — array of booking objects
 *   loading       — boolean
 *   navigate      — react-router useNavigate fn
 *   emptyMessage  — string shown when no bookings (optional)
 */
import {
  Package, MapPin, CalendarDays, Users, IndianRupee,
  ChevronRight, Hash, Eye, Pencil,
} from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format'

const StatusBadge = ({ status }) => {
  const map = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  const s = (status || 'pending').toLowerCase()
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${map[s] || map.pending}`}>
      {s}
    </span>
  )
}

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 10 }).map((_, i) => (
      <td key={i} className="px-4 py-4"><div className="h-4 rounded bg-slate-100" /></td>
    ))}
  </tr>
)

const COL_HEADERS = ['#', 'Booking ID', 'Agency / Tour', 'Route', 'Passengers', 'Seats', 'Travel Date', 'Amount', 'Status', 'Actions']

export default function TourBookingTable({
  bookings = [],
  loading = false,
  navigate,
  emptyMessage = 'No bookings found.',
}) {
  const revenue = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {COL_HEADERS.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <Package size={22} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              bookings.map((b, idx) => {
                const adults   = b.numberOfAdults   ?? b.passengers?.filter(p => p.type === 'adult').length  ?? 0
                const children = b.numberOfChildren ?? b.passengers?.filter(p => p.type === 'child').length ?? 0
                const seats    = Array.isArray(b.seats) ? b.seats.join(', ') : (b.seats || '—')
                return (
                  <tr key={b._id || idx} className="transition-colors hover:bg-slate-50/60">

                    {/* # */}
                    <td className="px-4 py-4">
                      <span className="font-mono text-[12px] font-semibold text-slate-400">{idx + 1}</span>
                    </td>

                    {/* Booking ID */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Hash size={11} className="shrink-0 text-slate-300" />
                        <span className="font-mono text-[11px] font-bold text-slate-600 max-w-[110px] truncate">
                          {b.bookingCode || b._id || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Agency / Tour */}
                    <td className="px-4 py-4">
                      <p className="max-w-[170px] truncate text-sm font-bold text-slate-800">{b.travelAgencyName || '—'}</p>
                      {b.visitngPlaces && (
                        <p className="flex items-center gap-1 text-[11px] text-slate-400 max-w-[170px] truncate">
                          <MapPin size={9} /> {b.visitngPlaces}
                        </p>
                      )}
                    </td>

                    {/* Route */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-600">
                        <span>{b?.route?.substring(0, 30) || '—'}</span>
                       
                       
                      </div>
                    </td>

                    {/* Passengers */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                        <Users size={12} className="text-slate-400" />
                        <span>{adults}A</span>
                        {children > 0 && <span className="text-slate-400">+ {children}C</span>}
                      </div>
                    </td>

                    {/* Seats */}
                    <td className="px-4 py-4">
                      <span className="block max-w-[90px] truncate text-[11px] font-semibold text-slate-600" title={seats}>
                        {seats}
                      </span>
                    </td>

                    {/* Travel Date */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
                        <CalendarDays size={12} className="text-slate-400" />
                        {formatDate(b.tourStartDate)}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-0.5 text-sm font-extrabold text-slate-900">
                        <IndianRupee size={12} className="shrink-0 text-slate-400" />
                        {(b.totalAmount ?? 0).toLocaleString('en-IN')}
                      </div>
                      {b.tax > 0 && (
                        <p className="text-[10px] text-slate-400">incl. GST ₹{b.tax}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={b.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/my-tour/${b.tourId || b._id}`)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => navigate(`/my-tour/${b.tourId || b._id}/edit`)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      </div>
                    </td>

                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && bookings.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="text-[12px] font-semibold text-slate-500">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </p>
          <p className="text-[12px] font-extrabold text-slate-700">
            Total Revenue: <span className="text-indigo-600">{formatCurrency(revenue)}</span>
          </p>
        </div>
      )}
    </div>
  )
}
