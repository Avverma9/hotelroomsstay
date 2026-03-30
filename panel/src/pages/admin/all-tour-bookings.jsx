import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bus, RefreshCw, AlertCircle } from 'lucide-react'
import { getBookings } from '../../../redux/slices/tms/travel/tour/tour'
import TourBookingTable from '../../components/tour/tour-booking-table'
import { formatCurrency } from '../../utils/format'

export default function AllTourBookings() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { bookings, loading, error } = useSelector((s) => s.tour)

  const load = () => dispatch(getBookings())
  useEffect(() => { load() }, [])

  const total     = bookings.length
  const revenue   = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0)
  const confirmed = bookings.filter((b) => b.status?.toLowerCase() === 'confirmed').length
  const pending   = bookings.filter((b) => b.status?.toLowerCase() === 'pending').length
  const cancelled = bookings.filter((b) => b.status?.toLowerCase() === 'cancelled').length

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Bus size={18} className="text-indigo-600" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">Admin — TMS</p>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">All Tour Bookings</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Complete list of all tour bookings across agencies.</p>
          </div>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Stats */}
        {total > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ['Total',     total,                  'bg-slate-50 text-slate-700 border-slate-200'],
              ['Confirmed', confirmed,               'bg-emerald-50 text-emerald-700 border-emerald-200'],
              ['Pending',   pending,                 'bg-amber-50 text-amber-700 border-amber-200'],
              ['Cancelled', cancelled,               'bg-rose-50 text-rose-700 border-rose-200'],
              ['Revenue',   formatCurrency(revenue), 'bg-indigo-50 text-indigo-700 border-indigo-200'],
            ].map(([label, value, cls]) => (
              <div key={label} className={`rounded-2xl border px-4 py-3 ${cls}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
                <p className="mt-0.5 text-xl font-extrabold leading-tight">{value}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={16} /> {typeof error === 'string' ? error : 'Failed to load bookings.'}
          </div>
        )}

        <TourBookingTable
          bookings={bookings}
          loading={loading}
          navigate={navigate}
          emptyMessage="No tour bookings found."
        />

      </div>
    </div>
  )
}
