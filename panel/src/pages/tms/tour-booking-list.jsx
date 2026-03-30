import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bus, RefreshCw, AlertCircle } from 'lucide-react'
import { getBookingsByAgencyEmail } from '../../../redux/slices/tms/travel/tour/tour'
import { selectAuth } from '../../../redux/slices/authSlice'
import TourBookingTable from '../../components/tour/tour-booking-table'

export default function TourBookingList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(selectAuth)
  const { agencyBookings: bookings, loading, error } = useSelector((s) => s.tour)

  const load = () => { if (user?.email) dispatch(getBookingsByAgencyEmail(user.email)) }
  useEffect(() => { load() }, [user?.email])

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="mx-auto max-w-[1400px] space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Bus size={18} className="text-indigo-600" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">TMS — Tours</p>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Tour Bookings</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Bookings for agency: <span className="font-semibold text-slate-700">{user?.email || '—'}</span>
            </p>
          </div>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={16} /> {typeof error === 'string' ? error : 'Failed to load bookings.'}
          </div>
        )}

        <TourBookingTable
          bookings={bookings}
          loading={loading}
          navigate={navigate}
          emptyMessage="No bookings found for this agency."
        />

      </div>
    </div>
  )
}
