import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Bed,
  Utensils,
  ShieldAlert,
  UserCheck,
  Building,
  Check,
  PencilLine,
  Save,
  X,
  Loader2,
} from 'lucide-react'
import Breadcrumb from '../../../components/breadcrumb'
import { clearHotelUpdateStatus, getHotelById, updateHotelInfo } from '../../../../redux/slices/admin/hotel'

const createHotelEditForm = (hotel) => {
  const basicInfo = hotel?.basicInfo || {}
  const location = basicInfo?.location || {}
  const contacts = basicInfo?.contacts || {}
  const propertyType = Array.isArray(basicInfo?.propertyType)
    ? basicInfo.propertyType
    : basicInfo?.propertyType
      ? [basicInfo.propertyType]
      : Array.isArray(hotel?.propertyType)
        ? hotel.propertyType
        : hotel?.propertyType
          ? [hotel.propertyType]
          : []

  return {
    hotelName: basicInfo?.name || hotel?.hotelName || '',
    city: location?.city || hotel?.city || '',
    state: location?.state || hotel?.state || '',
    address: location?.address || hotel?.address || '',
    pinCode: location?.pinCode || hotel?.pinCode || '',
    starRating: String(basicInfo?.starRating || hotel?.starRating || ''),
    propertyType: propertyType.join(', '),
    hotelEmail: contacts?.email || hotel?.hotelEmail || hotel?.email || '',
    phone: contacts?.phone || hotel?.phone || '',
    owner: basicInfo?.owner || hotel?.owner || '',
    description: basicInfo?.description || hotel?.description || '',
    onFront: Boolean(hotel?.onFront),
    isAccepted: Boolean(hotel?.isAccepted),
  }
}

function HotelEditModal({ hotel, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => createHotelEditForm(hotel))

  useEffect(() => {
    setForm(createHotelEditForm(hotel))
  }, [hotel])

  const setField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave({
      hotelName: form.hotelName.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim(),
      pinCode: form.pinCode.trim(),
      starRating: form.starRating.trim(),
      propertyType: form.propertyType
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      hotelEmail: form.hotelEmail.trim(),
      phone: form.phone.trim(),
      owner: form.owner.trim(),
      description: form.description.trim(),
      onFront: form.onFront,
      isAccepted: form.isAccepted,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_55%,#ffffff_100%)] px-6 py-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600">Edit Hotel</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Update Hotel Details</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{hotel?.hotelId || hotel?._id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Hotel Name</span>
              <input required value={form.hotelName} onChange={setField('hotelName')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Hotel Email</span>
              <input type="email" value={form.hotelEmail} onChange={setField('hotelEmail')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">City</span>
              <input required value={form.city} onChange={setField('city')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">State</span>
              <input required value={form.state} onChange={setField('state')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Address</span>
              <input value={form.address} onChange={setField('address')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pin Code</span>
              <input value={form.pinCode} onChange={setField('pinCode')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Star Rating</span>
              <input type="number" min="0" max="5" value={form.starRating} onChange={setField('starRating')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Owner</span>
              <input value={form.owner} onChange={setField('owner')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Phone</span>
              <input value={form.phone} onChange={setField('phone')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Property Type</span>
              <input value={form.propertyType} onChange={setField('propertyType')} placeholder="Hotel, Resort" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Description</span>
              <textarea value={form.description} onChange={setField('description')} rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.onFront} onChange={setField('onFront')} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              On Front
            </label>
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.isAccepted} onChange={setField('isAccepted')} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Accepted
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function HotelDetails({ listPath, listLabel }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const locationState = useLocation()
  const { id } = useParams()
  const { selectedHotel, loading, updating, error, updateSuccess } = useSelector((state) => state.hotel)
  const [activeTab, setActiveTab] = useState('rooms')
  const [isEditOpen, setIsEditOpen] = useState(false)

  const resolvedListPath =
    listPath ||
    locationState?.state?.from ||
    (locationState.pathname.startsWith('/your-hotels') ? '/your-hotels' : '/hotels')

  const resolvedListLabel =
    listLabel || (resolvedListPath.startsWith('/your-hotels') ? 'Your Hotels' : 'All Hotels')

  useEffect(() => {
    if (id) dispatch(getHotelById(id))
  }, [dispatch, id])

  useEffect(() => {
    if (!updateSuccess) return
    setIsEditOpen(false)
    if (id) dispatch(getHotelById(id))
    const timeout = setTimeout(() => dispatch(clearHotelUpdateStatus()), 2500)
    return () => clearTimeout(timeout)
  }, [dispatch, id, updateSuccess])

  const hotel = selectedHotel?.data || selectedHotel
  const basicInfo = hotel?.basicInfo || {}
  const location = basicInfo?.location || {}
  const contacts = basicInfo?.contacts || {}
  const pricingOverview = hotel?.pricingOverview || {}
  const policies = hotel?.policies || {}
  const detailedPolicies = policies?.detailed || {}
  const restrictions = policies?.restrictions || {}
  const rooms = hotel?.rooms || []
  const foods = hotel?.foods || []
  const amenities = hotel?.amenities || []
  const ratingBreakdown = hotel?.ratingBreakdown || {}
  const propertyTypes = Array.isArray(basicInfo?.propertyType)
    ? basicInfo.propertyType
    : basicInfo?.propertyType
      ? [basicInfo.propertyType]
      : []
  const displayHotelId = hotel?.hotelId || id

  const handleHotelUpdate = async (formData) => {
    await dispatch(
      updateHotelInfo({
        hotelId: displayHotelId,
        hotelData: formData,
      }),
    ).unwrap()
  }

  if (loading && !hotel) {
    return (
      <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
          Loading hotel details...
        </div>
      </div>
    )
  }

  if (error && !hotel) {
    return (
      <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center text-sm text-rose-700">
          {error}
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No hotel data available.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />

      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <button
            type="button"
            onClick={() => navigate(resolvedListPath)}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft size={14} />
            Back to {resolvedListLabel}
          </button>
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {basicInfo.category || 'Hotel'}
            </span>
            <span className="flex items-center text-sm font-bold text-yellow-500">
              <Star size={16} className="mr-1 fill-yellow-500" />
              {hotel?.rating || basicInfo.starRating || 0} ({hotel?.reviewCount || 0} reviews)
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {basicInfo.name || 'Unnamed Hotel'}
          </h1>
          <div className="mt-2 flex items-center text-sm font-medium text-slate-600">
            <MapPin size={16} className="mr-1 text-slate-400" />
            {[location.address, location.city, location.state, location.pinCode]
              .filter(Boolean)
              .join(', ')}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${resolvedListPath}/${displayHotelId}/edit`, { state: { from: resolvedListPath } })}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
        >
          <PencilLine size={16} />
          Update Hotel
        </button>
      </div>

      {updateSuccess && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {updateSuccess}
        </div>
      )}

      {error && hotel && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {basicInfo.images?.length > 0 && (
        <div className="mb-8 grid h-[400px] grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <img src={basicInfo.images[0]} alt={basicInfo.name} className="h-full w-full object-cover" />
          </div>
          <div className="col-span-1 hidden grid-rows-2 gap-2 md:grid">
            {basicInfo.images[1] && <img src={basicInfo.images[1]} alt="Gallery 1" className="h-full w-full object-cover" />}
            {basicInfo.images[2] && <img src={basicInfo.images[2]} alt="Gallery 2" className="h-full w-full object-cover" />}
          </div>
          <div className="col-span-1 hidden grid-rows-2 gap-2 md:grid">
            {(basicInfo.images[3] || basicInfo.images[1]) && (
              <img src={basicInfo.images[3] || basicInfo.images[1]} alt="Gallery 3" className="h-full w-full object-cover" />
            )}
            {(basicInfo.images[4] || basicInfo.images[2]) && (
              <img src={basicInfo.images[4] || basicInfo.images[2]} alt="Gallery 4" className="h-full w-full object-cover" />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">About this property</h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              {basicInfo.description || 'No description available.'}
            </p>

            {detailedPolicies.hotelsPolicy && (
              <div className="rounded-lg bg-blue-50 p-4 text-sm font-medium text-blue-800">
                {detailedPolicies.hotelsPolicy}
              </div>
            )}

            {propertyTypes.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {propertyTypes.map((type, index) => (
                  <span
                    key={`${type}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    <Building size={12} />
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Top Amenities</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {amenities.map((amenity, index) => (
                <div key={`${amenity}-${index}`} className="flex items-center text-sm font-medium text-slate-700">
                  <CheckCircle2 size={16} className="mr-2 text-green-500" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-4 flex space-x-1 rounded-xl bg-slate-200/50 p-1">
              <button
                onClick={() => setActiveTab('rooms')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'rooms' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Available Rooms
              </button>
              <button
                onClick={() => setActiveTab('food')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'food' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Dining & Food
              </button>
            </div>

            {activeTab === 'rooms' && (
              <div className="space-y-4">
                {rooms.map((room, index) => (
                  <div key={`${room.id}-${index}`} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:flex-row">
                    <div className="h-48 w-full sm:h-auto sm:w-64 sm:shrink-0">
                      <img
                        src={room.images?.[0] || 'https://via.placeholder.com/400x300?text=Room'}
                        alt={room.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-bold text-slate-900">{room.name}</h3>
                          {room.features?.isOffer && (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                              {room.features.offerText}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm font-medium text-slate-600">
                          <Bed size={16} className="mr-1.5 text-slate-400" />
                          {room.bedType || room.type}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            Available: {room.inventory?.available ?? 0} / {room.inventory?.total ?? 0}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                        <div>
                          {room.features?.isOffer && (
                            <span className="text-xs text-slate-400 line-through">â‚¹{room.pricing?.basePrice || 0}</span>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900">
                              {room.pricing?.displayPrice || `â‚¹${room.pricing?.finalPrice || room.pricing?.basePrice || 0}`}
                            </span>
                            <span className="text-xs font-medium text-slate-500">/ night</span>
                          </div>
                          <p className="text-[11px] text-slate-400">+ â‚¹{room.pricing?.taxAmount || 0} GST</p>
                        </div>
                        <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700">
                          Select Room
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'food' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {foods.map((food, index) => (
                  <div key={`${food.id}-${index}`} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="h-32 w-full shrink-0">
                      <img
                        src={food.images?.[0] || 'https://via.placeholder.com/400x300?text=Food'}
                        alt={food.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 font-bold text-slate-900">{food.name}</h3>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${food.type?.toLowerCase() === 'veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {food.type}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{food.description}</p>
                      <div className="mt-auto pt-3">
                        <span className="text-lg font-bold text-slate-900">{food.displayPrice || `â‚¹${food.price || 0}`}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">House Rules & Policies</h2>

            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
              <div>
                <span className="block text-xs font-medium text-slate-500">Check-in</span>
                <span className="flex items-center text-sm font-bold text-slate-900">
                  <Clock size={14} className="mr-1.5 text-blue-600" />
                  {policies.checkIn || detailedPolicies.checkInPolicy || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">Check-out</span>
                <span className="flex items-center text-sm font-bold text-slate-900">
                  <Clock size={14} className="mr-1.5 text-blue-600" />
                  {policies.checkOut || detailedPolicies.checkOutPolicy || 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-900">Cancellation Policy</p>
                  <p>{policies.cancellationText || detailedPolicies.cancellationPolicy || 'Not available'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCheck size={18} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-900">General Rules</p>
                  <p>{detailedPolicies.hotelsPolicy || 'Not available'}</p>
                  <ul className="mt-2 space-y-1">
                    {policies.rules?.map((rule, index) => (
                      <li key={`${rule}-${index}`} className="flex items-center gap-2 text-slate-600">
                        <Check size={14} className="text-green-500" /> {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Utensils size={18} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-900">Outside Food</p>
                  <p>{detailedPolicies.outsideFoodPolicy || 'Not available'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 flex flex-col gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  {pricingOverview.displayString || `â‚¹${pricingOverview.lowestBasePrice || 'N/A'}`}
                </span>
                <span className="text-sm font-medium text-slate-500">/ night onwards</span>
              </div>

              {hotel.gstConfig?.enabled && (
                <div className="mb-6 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <span className="font-bold text-slate-900">Note: </span>
                  {pricingOverview.taxNote || 'GST applicable'}
                </div>
              )}

              <button className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700">
                Check Availability
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-slate-900">Contact Details</h3>
              <div className="space-y-3 text-sm font-medium text-slate-700">
                <a href={`tel:${contacts.phone || ''}`} className="flex items-center gap-3 transition hover:text-blue-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Phone size={14} />
                  </div>
                  +91 {contacts.phone || 'N/A'}
                </a>
                <a href={`mailto:${contacts.email || ''}`} className="flex items-center gap-3 transition hover:text-blue-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Mail size={14} />
                  </div>
                  {contacts.email || 'N/A'}
                </a>
              </div>

              <hr className="my-5 border-slate-100" />

              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Management</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Owner</span>
                  <span className="font-bold text-slate-900">{basicInfo.owner || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>General Manager</span>
                  <span className="font-medium text-slate-900">{contacts.generalManager || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Manager</span>
                  <span className="font-medium text-slate-900">{contacts.salesManager || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-slate-900">Restrictions</h3>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>Pets Allowed</span><span className="font-semibold">{restrictions.petsAllowed ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span>Smoking Allowed</span><span className="font-semibold">{restrictions.smokingAllowed ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span>Alcohol Allowed</span><span className="font-semibold">{restrictions.alcoholAllowed ? 'Yes' : 'No'}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-slate-900">Rating Breakdown</h3>
              <div className="space-y-3">
                {Object.keys(ratingBreakdown).length === 0 && (
                  <p className="text-sm text-slate-500">No rating breakdown available.</p>
                )}
                {Object.entries(ratingBreakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-yellow-400" style={{ width: `${(value / 5) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right font-bold text-slate-900">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {isEditOpen && (
        <HotelEditModal
          hotel={hotel}
          saving={updating}
          onClose={() => {
            setIsEditOpen(false)
            dispatch(clearHotelUpdateStatus())
          }}
          onSave={handleHotelUpdate}
        />
      )}
    </>
  )
}

export default HotelDetails



