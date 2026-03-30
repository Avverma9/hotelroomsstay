import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, CalendarDays, IndianRupee, Star, Package,
  CheckCircle, XCircle, Wifi, Car, Users, Pencil, AlertCircle,
  ScrollText, ListChecks, Route, Image as ImageIcon,
} from 'lucide-react'
import { getTourById } from '../../../redux/slices/tms/travel/tour/tour'

const selectTour = (state) => state.tour

const Section = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
      <Icon size={15} className="text-indigo-600" />
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-600">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

const Field = ({ label, value, className = '' }) => (
  <div className={className}>
    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
  </div>
)

const SkeletonSection = () => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-4 rounded bg-slate-100" />
    ))}
  </div>
)

export default function ViewTour() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = new URLSearchParams(location.search).get('from')
  const { tourDetails: tour, loading, error } = useSelector(selectTour)

  useEffect(() => {
    if (id) dispatch(getTourById(id))
  }, [dispatch, id])

  const termsEntries = tour?.termsAndConditions
    ? Object.entries(tour.termsAndConditions)
    : []

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(from || '/my-tour')}
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="mb-0.5 flex items-center gap-2">
                <Package size={14} className="text-indigo-600" />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">TMS / My Tours</p>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Tour Details</h1>
            </div>
          </div>
          {tour && (
            <button
              onClick={() => navigate(`/my-tour/${id}/edit${from ? `?from=${encodeURIComponent(from)}` : ''}`)}
              className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 shadow-sm transition-colors hover:bg-violet-100"
            >
              <Pencil size={13} /> Edit Tour
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={15} className="shrink-0" />
            {typeof error === 'string' ? error : 'Failed to load tour details.'}
          </div>
        )}

        {loading ? (
          <>
            <SkeletonSection />
            <SkeletonSection />
            <SkeletonSection />
          </>
        ) : tour ? (
          <>
            {/* Agency Info */}
            <Section icon={Package} title="Agency Information">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Agency Name" value={tour.travelAgencyName} className="col-span-2 sm:col-span-4" />
                <Field label="Email" value={tour.agencyEmail} className="col-span-2" />
                <Field label="Phone" value={tour.agencyPhone} />
                <Field label="Agency ID" value={tour.agencyId} />
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Status</p>
                  {tour.isAccepted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle size={11} /> Accepted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                      <XCircle size={11} /> Pending
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Rating</p>
                  {tour.starRating ? (
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-slate-700">{tour.starRating} / 5</span>
                    </div>
                  ) : <p className="text-sm text-slate-400">Not rated</p>}
                </div>
              </div>
            </Section>

            {/* Destination & Schedule */}
            <Section icon={MapPin} title="Destination & Schedule">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Country" value={tour.country} />
                <Field label="State" value={tour.state} />
                <Field label="City" value={tour.city} />
                <Field label="Themes" value={tour.themes} />
                <Field label="Visiting Places" value={tour.visitngPlaces || tour.visitingPlaces} className="col-span-2 sm:col-span-4" />
                <Field
                  label="Tour Start Date"
                  value={tour.tourStartDate ? new Date(tour.tourStartDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) : undefined}
                />
                <Field
                  label="From"
                  value={tour.from ? new Date(tour.from).toLocaleDateString('en-IN', { dateStyle: 'long' }) : undefined}
                />
                <Field
                  label="To"
                  value={tour.to ? new Date(tour.to).toLocaleDateString('en-IN', { dateStyle: 'long' }) : undefined}
                />
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Duration</p>
                  <p className="text-sm font-semibold text-slate-800">{tour.nights}N / {tour.days}D</p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Price</p>
                  <p className="text-sm font-extrabold text-emerald-700">
                    ₹{Number(tour.price).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Customizable</p>
                  <p className="text-sm font-semibold text-slate-800">{tour.isCustomizable ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </Section>

            {/* Amenities */}
            {tour.amenities?.length > 0 && (
              <Section icon={Wifi} title="Amenities">
                <div className="flex flex-wrap gap-2">
                  {tour.amenities.map((a, i) => (
                    <span key={i} className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                      {a}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Inclusion & Exclusion */}
            {(tour.inclusion?.length > 0 || tour.exclusion?.length > 0) && (
              <Section icon={ListChecks} title="Inclusion & Exclusion">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {tour.inclusion?.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Included</p>
                      <ul className="space-y-1.5">
                        {(Array.isArray(tour.inclusion) ? tour.inclusion : tour.inclusion.split(',')).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                            {item.trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {tour.exclusion?.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-rose-600">Excluded</p>
                      <ul className="space-y-1.5">
                        {(Array.isArray(tour.exclusion) ? tour.exclusion : tour.exclusion.split(',')).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <XCircle size={13} className="mt-0.5 shrink-0 text-rose-400" />
                            {item.trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Day-wise Itinerary */}
            {tour.dayWise?.length > 0 && (
              <Section icon={Route} title="Day-wise Itinerary">
                <div className="space-y-3">
                  {tour.dayWise.map((d, i) => (
                    <div key={d._id || i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700">
                          {d.day}
                        </div>
                        {i < tour.dayWise.length - 1 && (
                          <div className="mt-1 h-full w-px bg-slate-200" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="mb-0.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Day {d.day}</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{d.description || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Vehicles */}
            {tour.vehicles?.length > 0 && (
              <Section icon={Car} title="Vehicles">
                <div className="space-y-4">
                  {tour.vehicles.map((v, i) => (
                    <div key={v._id || i} className="rounded-xl border border-slate-200 p-4">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Field label="Vehicle Name" value={v.name} className="col-span-2" />
                        <Field label="Vehicle Number" value={v.vehicleNumber} />
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Status</p>
                          {v.isActive
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">Active</span>
                            : <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">Inactive</span>
                          }
                        </div>
                        <Field label="Seater Type" value={v.seaterType} />
                        <Field label="Total Seats" value={v.totalSeats} />
                        <Field label="Booked Seats" value={v.bookedSeats?.length ?? 0} />
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Price / Seat</p>
                          <p className="text-sm font-extrabold text-emerald-700">₹{Number(v.pricePerSeat).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Layout</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {v.seatConfig?.rows} rows · {v.seatConfig?.left}L × {v.seatConfig?.right}R
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Available</p>
                          <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                            <Users size={13} className="text-slate-400" />
                            {(v.totalSeats || 0) - (v.bookedSeats?.length || 0)} seats
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Terms & Conditions */}
            {termsEntries.length > 0 && (
              <Section icon={ScrollText} title="Terms & Conditions">
                <div className="space-y-3">
                  {termsEntries.map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="mb-0.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{key}</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Images */}
            {tour.images?.length > 0 && (
              <Section icon={ImageIcon} title="Images">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {tour.images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Tour image ${i + 1}`}
                      className="aspect-video w-full rounded-xl object-cover border border-slate-200"
                    />
                  ))}
                </div>
              </Section>
            )}
          </>
        ) : !loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <Package size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Tour not found</p>
          </div>
        )}
      </div>
    </div>
  )
}
