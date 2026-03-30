import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Star, CalendarDays, IndianRupee, Package, RefreshCw,
  AlertCircle, Eye, Pencil, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { fetchFilteredTours } from '../../../redux/slices/tms/travel/tour/tour'
import { selectAuth } from '../../../redux/slices/authSlice'
import { formatCurrency } from '../../utils/format'
import { tableClasses } from '../../components/admin-table'

const selectTour = (state) => state.tour

const StatusBadge = ({ accepted }) =>
  accepted ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">Accepted</span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">Pending</span>
  )

const RunningStatusBadge = ({ status }) => {
  const STATUS_CONFIG = {
    active:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Active' },
    inactive:  { cls: 'bg-slate-50 text-slate-700 border-slate-200',  label: 'Inactive' },
    completed: { cls: 'bg-blue-50 text-blue-700 border-blue-200',     label: 'Completed' },
  };
  const cfg = STATUS_CONFIG[status || 'active'];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i} className="px-4 py-4"><div className="h-4 rounded bg-slate-100" /></td>
    ))}
  </tr>
)

export default function MyTour() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user }   = useSelector(selectAuth)
  const { tours, filterMeta, loading, error } = useSelector(selectTour)

  const page       = filterMeta?.page      ?? 1
  const totalPages = filterMeta?.total != null && filterMeta?.limit
    ? Math.ceil(filterMeta.total / filterMeta.limit)
    : 1

  const loadPage = (p) => {
    if (user?.email) dispatch(fetchFilteredTours({ agencyEmail: user.email, page: p }))
  }

  useEffect(() => {
    if (user?.email) dispatch(fetchFilteredTours({ agencyEmail: user.email }))
  }, [dispatch, user?.email])

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="mx-auto max-w-[1400px] space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Package size={18} className="text-indigo-600" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">TMS</p>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">My Tours</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Showing all tour packages linked to{' '}
              <span className="font-semibold text-slate-700">{user?.email || '—'}</span>
            </p>
          </div>
          <button
            onClick={() => loadPage(1)}
            disabled={loading}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={15} className="shrink-0" />
            {typeof error === 'string' ? error : 'Failed to load tours.'}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <p className="text-sm font-semibold text-slate-600">
              {loading
                ? 'Loading…'
                : `${filterMeta?.total ?? tours.length} tour${(filterMeta?.total ?? tours.length) !== 1 ? 's' : ''} found`}
            </p>
            {filterMeta && (
              <p className="text-[11px] font-medium text-slate-400">
                Page {page} / {totalPages}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className={tableClasses.th}>#</th>
                  <th className={tableClasses.th}>Tour / Agency</th>
                  <th className={tableClasses.th}>Route</th>
                  <th className={tableClasses.th}>Location</th>
                  <th className={tableClasses.th}>Duration</th>
                  <th className={tableClasses.th}>Price</th>
                  <th className={tableClasses.th}>Rating</th>
                  <th className={tableClasses.th}>Running</th>
                  <th className={tableClasses.th}>Status</th>
                  <th className={tableClasses.th}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : tours.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <Package size={22} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">No tours found for your account</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tours.map((tour, idx) => (
                    <tr key={tour._id || idx} className="hover:bg-slate-50/60 transition-colors">
                      {/* # */}
                      <td className={tableClasses.td}>
                        <span className="text-[12px] font-mono font-semibold text-slate-400">
                          {(page - 1) * (filterMeta?.limit ?? 10) + idx + 1}
                        </span>
                      </td>

                      {/* Tour / Agency */}
                      <td className={tableClasses.td}>
                        <div className="flex items-center gap-3">
                          {tour.images?.[0] ? (
                            <img src={tour.images[0]} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover border border-slate-200" />
                          ) : (
                            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <Package size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 max-w-[180px]">
                              {tour.travelAgencyName || '—'}
                            </p>
                            <p className="truncate text-[11px] text-slate-400 max-w-[180px]">
                              {tour.visitngPlaces || tour.visitingPlaces || '—'}
                            </p>
                            {tour.themes && (
                              <span className="mt-0.5 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
                                {tour.themes.split(',')[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Route */}
                      <td className={tableClasses.td}>
                        <div className="flex items-center gap-1 text-sm text-slate-700">
                          <MapPin size={12} className="shrink-0 text-slate-400" />
                          <span className="font-semibold">{tour?.route?.substring(0,30)}</span>
                          
                        </div>
                      </td>

                      {/* Location */}
                      <td className={tableClasses.td}>
                        <p className="text-sm font-semibold text-slate-700">{tour.city || '—'}</p>
                        <p className="text-[11px] text-slate-400">
                          {[tour.state, tour.country].filter(Boolean).join(', ') || '—'}
                        </p>
                      </td>

                      {/* Duration */}
                      <td className={tableClasses.td}>
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="shrink-0 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700">
                            {tour.nights || 0}N / {tour.days || 0}D
                          </span>
                        </div>
                        {tour.isCustomizable && (
                          <span className="mt-0.5 inline-block rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">
                            Customizable
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className={tableClasses.td}>
                        <div className="flex items-center gap-0.5">
                          <IndianRupee size={12} className="shrink-0 text-emerald-600" />
                          <span className="text-sm font-extrabold text-emerald-700">
                            {formatCurrency(tour.price).replace('₹', '').trim()}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className={tableClasses.td}>
                        {tour.starRating ? (
                          <div className="flex items-center gap-1">
                            <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-bold text-slate-700">{tour.starRating}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Running Status */}
                      <td className={tableClasses.td}>
                        <RunningStatusBadge status={tour.runningStatus} />
                      </td>

                      {/* Status */}
                      <td className={tableClasses.td}>
                        <StatusBadge accepted={tour.isAccepted} />
                      </td>

                      {/* Actions */}
                      <td className={tableClasses.td}>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/my-tour/${tour._id}`)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => navigate(`/my-tour/${tour._id}/edit`)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
              <button
                disabled={!filterMeta?.hasPrevPage}
                onClick={() => loadPage(page - 1)}
                className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} className="text-xs text-slate-400 px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => loadPage(p)}
                      className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                        p === page
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

              <button
                disabled={!filterMeta?.hasNextPage}
                onClick={() => loadPage(page + 1)}
                className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
