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
  ChevronDown,
  ChevronUp,
  Info,
  CreditCard,
  Users,
  FileText,
  Settings,
  Tag,
  Map,
  CalendarDays,
  ThumbsUp,
  Percent
} from 'lucide-react'
import Breadcrumb from '../../../components/breadcrumb'
import { clearHotelUpdateStatus, getHotelById, updateHotelInfo } from '../../../../redux/slices/admin/hotel'

const formatCurrency = (value) => {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('en-IN').format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const normalizeFoodDetails = (foods = []) =>
  (Array.isArray(foods) ? foods : [])
    .filter((food) => food && typeof food === 'object')
    .map((food, index) => {
      const images = Array.isArray(food.images)
        ? food.images.filter(Boolean)
        : food.image
          ? [food.image]
          : []
      const type = food.type || food.foodType || 'Veg'
      const description = food.description || food.about || 'Description not available.'
      const price = Number(food.price) || 0
      return {
        id: food.id || food.foodId || food._id || `food-${index}`,
        name: food.name || food.title || `Food Item ${index + 1}`,
        type,
        description,
        images,
        price,
        displayPrice: food.displayPrice || `₹${formatCurrency(price)}`,
      }
    })

const getFoodBadgeClasses = (type = '') => {
  const normalized = String(type).trim().toLowerCase()
  if (normalized === 'veg') return 'bg-green-100 text-green-700 border-green-200'
  if (normalized === 'vegan') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  return 'bg-rose-100 text-rose-700 border-rose-200'
}

const ExpandableText = ({ text, maxLength = 200, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  if (!text) return null

  const shouldTruncate = text.length > maxLength
  const displayText = isExpanded ? text : text.slice(0, maxLength) + (shouldTruncate ? '...' : '')

  return (
    <div className={className}>
      <p className="text-sm leading-relaxed text-slate-600 inline">{displayText}</p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 text-sm font-bold text-blue-600 hover:text-blue-700 focus:outline-none"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  )
}

const FormattedPolicyText = ({ text, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!text) return null
  const lines = String(text).split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return null

  const isBullet = (l) => /^[•\-–\*]\s/.test(l)
  const isNum = (l) => /^\d+\.\s/.test(l)

  const maxLines = 4
  const shouldTruncate = lines.length > maxLines
  const displayLines = isExpanded ? lines : lines.slice(0, maxLines)

  return (
    <div className={className}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {displayLines.map((line, i) => {
          const bullet = isBullet(line)
          const num = isNum(line)
          const pfx = bullet ? '•' : num ? line.match(/^\d+\./)[0] : '›'
          const body = bullet ? line.replace(/^[•\-–\*]\s*/, '') : num ? line.replace(/^\d+\.\s*/, '') : line
          return (
            <li key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ color: '#94a3b8', minWidth: 16, flexShrink: 0, lineHeight: 1.55 }}>{pfx}</span>
              <span className="text-sm text-slate-600" style={{ lineHeight: 1.55 }}>{body}</span>
            </li>
          )
        })}
      </ul>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm font-bold text-blue-600 hover:text-blue-700 focus:outline-none"
        >
          {isExpanded ? 'Show Less' : `View ${lines.length - maxLines} More Items`}
        </button>
      )}
    </div>
  )
}

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 transition hover:bg-slate-50 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-slate-600" />}
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>
      {isOpen && <div className="border-t border-slate-100 bg-white px-6 py-5">{children}</div>}
    </div>
  )
}

function HotelDetails({ listPath, listLabel }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const locationState = useLocation()
  const { id } = useParams()
  const { selectedHotel, loading, updating, error, updateSuccess } = useSelector((state) => state.hotel)
  
  const [activeTab, setActiveTab] = useState('overview')

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
    if (id) dispatch(getHotelById(id))
    const timeout = setTimeout(() => dispatch(clearHotelUpdateStatus()), 2500)
    return () => clearTimeout(timeout)
  }, [dispatch, id, updateSuccess])

  const hotelData = selectedHotel?.data || selectedHotel
  const basicInfo = hotelData?.basicInfo || {}
  const location = basicInfo?.location || {}
  const contacts = basicInfo?.contacts || {}
  const pricingOverview = hotelData?.pricingOverview || {}
  const policies = hotelData?.policies || {}
  const detailedPolicies = policies?.detailed || {}
  const restrictions = policies?.restrictions || {}
  const rooms = hotelData?.rooms || []
  const foods = useMemo(() => normalizeFoodDetails(hotelData?.foods), [hotelData?.foods])
  const amenities = hotelData?.amenities || []
  const ratingBreakdown = hotelData?.ratingBreakdown || {}
  const ratingDistribution = hotelData?.ratingDistribution || {}
  const gstConfig = hotelData?.gstConfig || {}
  
  const propertyTypes = Array.isArray(basicInfo?.propertyType)
    ? basicInfo.propertyType
    : basicInfo?.propertyType
      ? [basicInfo.propertyType]
      : []
  
  const displayHotelId = hotelData?.hotelId || id

  if (loading && !hotelData) {
    return (
      <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-24 shadow-sm">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading comprehensive property data...</p>
        </div>
      </div>
    )
  }

  if (error && !hotelData) {
    return (
      <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center shadow-sm">
          <ShieldAlert size={32} className="mx-auto text-rose-500 mb-3" />
          <p className="text-base font-bold text-rose-800">Failed to load data</p>
          <p className="mt-1 text-sm text-rose-600">{error}</p>
          <button onClick={() => navigate(resolvedListPath)} className="mt-4 text-sm font-semibold text-rose-700 underline focus:outline-none">Return to list</button>
        </div>
      </div>
    )
  }

  if (!hotelData) {
    return (
      <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">No hotel data available to display.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'rooms', label: 'Rooms & Pricing', icon: Bed },
    { id: 'dining', label: 'Dining', icon: Utensils },
    { id: 'policies', label: 'Rules & Policies', icon: FileText },
  ]

  return (
    <>
      <div className="mx-auto max-w-7xl bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />

        {hotelData.customerWelcomeNote && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ThumbsUp size={24} className="text-blue-200" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Welcome Note</p>
                <p className="text-sm font-medium mt-0.5">{hotelData.customerWelcomeNote}</p>
              </div>
            </div>
            {(hotelData.startDate || hotelData.endDate) && (
              <div className="flex items-center gap-4 text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
                <CalendarDays size={18} className="text-blue-200" />
                <span>{formatDate(hotelData.startDate)} - {formatDate(hotelData.endDate)}</span>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <div>
            <button
              type="button"
              onClick={() => navigate(resolvedListPath)}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900 focus:outline-none"
            >
              <ArrowLeft size={16} />
              Back to {resolvedListLabel}
            </button>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                {basicInfo.category || 'Hotel'}
              </span>
              <span className="flex items-center rounded-md bg-yellow-50 px-2.5 py-1 text-sm font-bold text-yellow-700 border border-yellow-200">
                <Star size={14} className="mr-1.5 fill-yellow-500 text-yellow-500" />
                {hotelData.rating || basicInfo.starRating || 0}
                <span className="ml-1.5 font-medium text-yellow-600/70">({hotelData.reviewCount || 0} reviews)</span>
              </span>
              {hotelData.isAccepted && (
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Accepted
                </span>
              )}
              {hotelData.onFront && (
                <span className="rounded-md bg-purple-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-800">
                  Frontpage
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">
              {basicInfo.name || 'Unnamed Property'}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
              <span className="flex items-center">
                <MapPin size={16} className="mr-1.5 text-slate-400" />
                {[location.address, location.city, location.state, location.pinCode].filter(Boolean).join(', ')}
              </span>
              {hotelData.destination && (
                <span className="flex items-center">
                  <Map size={14} className="mr-1.5 text-slate-400" />
                  Destination: {hotelData.destination}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`${resolvedListPath}/${displayHotelId}/edit`, { state: { from: resolvedListPath } })}
            className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
          >
            <PencilLine size={16} />
            Update Hotel
          </button>
        </div>

        {updateSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="text-sm font-bold text-emerald-800">{updateSuccess}</span>
          </div>
        )}

        {error && hotelData && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 flex items-center gap-3">
            <ShieldAlert className="text-rose-500" size={20} />
            <span className="text-sm font-bold text-rose-800">{error}</span>
          </div>
        )}

        {basicInfo.images?.length > 0 && (
          <div className="mb-8 grid h-[300px] md:h-[450px] grid-cols-1 gap-3 overflow-hidden rounded-[24px] md:grid-cols-4">
            <div className="col-span-1 md:col-span-2 h-full">
              <img src={basicInfo.images[0]} alt={basicInfo.name} className="h-full w-full object-cover transition hover:scale-105 duration-700" />
            </div>
            <div className="col-span-1 hidden grid-rows-2 gap-3 md:grid h-full">
              {basicInfo.images[1] ? <img src={basicInfo.images[1]} alt="Gallery 1" className="h-full w-full object-cover transition hover:scale-105 duration-700 rounded-lg" /> : <div className="bg-slate-100 rounded-lg h-full w-full"></div>}
              {basicInfo.images[2] ? <img src={basicInfo.images[2]} alt="Gallery 2" className="h-full w-full object-cover transition hover:scale-105 duration-700 rounded-lg" /> : <div className="bg-slate-100 rounded-lg h-full w-full"></div>}
            </div>
            <div className="col-span-1 hidden grid-rows-2 gap-3 md:grid h-full">
              {basicInfo.images[3] ? <img src={basicInfo.images[3]} alt="Gallery 3" className="h-full w-full object-cover transition hover:scale-105 duration-700 rounded-lg" /> : <div className="bg-slate-100 rounded-lg h-full w-full"></div>}
              {basicInfo.images[4] ? <img src={basicInfo.images[4]} alt="Gallery 4" className="h-full w-full object-cover transition hover:scale-105 duration-700 rounded-lg" /> : <div className="bg-slate-100 rounded-lg h-full w-full"></div>}
            </div>
          </div>
        )}

        <div className="mb-8 border-b border-slate-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto custom-scrollbar" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex whitespace-nowrap items-center py-4 px-1 border-b-2 font-bold text-sm transition-colors focus:outline-none ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon size={16} className={`mr-2 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="space-y-8">
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">About this property</h3>
                  <ExpandableText text={basicInfo.description || 'No description available for this property.'} maxLength={300} />
                  
                  {propertyTypes.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-slate-100">
                      {propertyTypes.map((type, index) => (
                        <span
                          key={`${type}-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200"
                        >
                          <Building size={14} className="text-slate-400" />
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Popular Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                    {amenities.length > 0 ? (
                      amenities.map((amenity, index) => (
                        <div key={`${amenity}-${index}`} className="flex items-center text-sm font-medium text-slate-700">
                          <CheckCircle2 size={18} className="mr-2.5 text-emerald-500 shrink-0" />
                          {amenity}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 col-span-full">No amenities listed.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Key Details</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Check-in / Check-out</span>
                      <div className="flex items-center gap-4 text-slate-700 font-medium">
                        <span className="flex items-center"><Clock size={14} className="mr-1.5 text-slate-400"/> In: {policies.checkIn || detailedPolicies.checkInPolicy || '12:00 PM'}</span>
                        <span className="flex items-center"><Clock size={14} className="mr-1.5 text-slate-400"/> Out: {policies.checkOut || detailedPolicies.checkOutPolicy || '11:00 AM'}</span>
                      </div>
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Contact</span>
                      <div className="space-y-2">
                        {contacts.email && <a href={`mailto:${contacts.email}`} className="flex items-center text-blue-600 hover:underline font-medium"><Mail size={14} className="mr-2" />{contacts.email}</a>}
                        {contacts.phone && <a href={`tel:${contacts.phone}`} className="flex items-center text-slate-700 font-medium"><Phone size={14} className="mr-2 text-slate-400" />{contacts.phone}</a>}
                      </div>
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Management</span>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500">Owner</span>
                        <span className="font-semibold text-slate-900">{basicInfo.owner || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500">General Manager</span>
                        <span className="font-semibold text-slate-900">{contacts.generalManager || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Sales Manager</span>
                        <span className="font-semibold text-slate-900">{contacts.salesManager || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Guest Reviews</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-100 text-yellow-700 font-black text-xl">
                      {hotelData.rating || basicInfo.starRating || '0'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Overall Rating</p>
                      <p className="text-xs text-slate-500">Based on {hotelData.reviewCount || 0} reviews</p>
                    </div>
                  </div>
                  
                  {Object.keys(ratingBreakdown).length > 0 && (
                    <div className="space-y-3 mb-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Breakdown</p>
                      {Object.entries(ratingBreakdown).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-slate-600 w-24 truncate">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className="flex-1 mx-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${(value / 5) * 100}%` }} />
                          </div>
                          <span className="w-6 text-right font-bold text-slate-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {Object.keys(ratingDistribution).length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Distribution</p>
                      {['fiveStar', 'fourStar', 'threeStar', 'twoStar', 'oneStar'].map((key, idx) => {
                        const val = ratingDistribution[key] || 0
                        const total = hotelData.reviewCount || 1 
                        const percent = (val / total) * 100
                        return (
                          <div key={key} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 w-12">{5 - idx} Stars</span>
                            <div className="flex-1 mx-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-yellow-400" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="w-6 text-right font-medium text-slate-500">{val}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Starting Price</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {pricingOverview.displayString || `${pricingOverview.currencySymbol || '₹'}${pricingOverview.lowestBasePrice || 'N/A'}`}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">per night onwards</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Status</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900">
                      {hotelData.availability?.availableRooms || rooms.reduce((sum, r) => sum + (r.inventory?.available || 0), 0)}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      / {hotelData.availability?.totalRooms || rooms.length || 0} rooms
                    </p>
                  </div>
                  <p className={`mt-1 text-xs font-bold ${hotelData.availability?.isFullyBooked ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {hotelData.availability?.status || (hotelData.availability?.isFullyBooked ? 'Fully Booked' : 'Available')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-blue-50 p-5 shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Percent size={64} />
                  </div>
                  <div className="flex items-center gap-2 mb-2 relative z-10">
                    <Tag size={16} className="text-blue-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Taxes & Fees</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-900 leading-snug relative z-10">
                    {pricingOverview.taxNote || 'Check individual rooms for tax details.'}
                  </p>
                  {gstConfig.enabled && (
                    <div className="mt-3 pt-3 border-t border-blue-200/50 flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-800 relative z-10">
                      <span><strong className="font-bold">Rate:</strong> {gstConfig.rate}%</span>
                      <span><strong className="font-bold">Range:</strong> ₹{gstConfig.minLimit} - ₹{gstConfig.maxLimit}</span>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 pt-4">Available Room Categories</h3>
              
              <div className="space-y-5">
                {rooms.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                    <Bed size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-bold text-slate-800">No rooms configured</p>
                    <p className="text-sm text-slate-500 mt-1">Add rooms from the inventory management section.</p>
                  </div>
                ) : (
                  rooms.map((room, index) => (
                    <div key={`${room.id}-${index}`} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:flex-row transition hover:shadow-md">
                      <div className="h-56 w-full sm:h-auto sm:w-72 sm:shrink-0 relative">
                        <img
                          src={room.images?.[0] || 'https://via.placeholder.com/400x300?text=Room'}
                          alt={room.name}
                          className="h-full w-full object-cover"
                        />
                        {room.features?.isOffer && (
                          <div className="absolute top-3 left-3 rounded-lg bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                            {room.features.offerText}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-6">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="text-xl font-bold text-slate-900">{room.name}</h3>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm font-medium text-slate-600">
                            <span className="flex items-center"><Bed size={16} className="mr-1.5 text-slate-400" /> {room.bedType || room.type || 'Standard Bed'}</span>
                            <span className="flex items-center"><Users size={16} className="mr-1.5 text-slate-400" /> Up to {room.occupancy || 2} Guests</span>
                          </div>
                          {room.description && (
                            <p className="mt-3 text-sm text-slate-500 line-clamp-2">{room.description}</p>
                          )}
                          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${
                              (room.inventory?.available ?? 0) > 0 && !room.inventory?.isSoldOut ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {(room.inventory?.available ?? 0) > 0 && !room.inventory?.isSoldOut ? `${room.inventory.available} Left` : 'Sold Out'}
                            </span>
                            {room.amenities?.slice(0, 3).map((am, idx) => (
                              <span key={idx} className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-6 flex items-end justify-between">
                          <div>
                            {room.features?.isOffer && (
                              <span className="text-sm font-medium text-slate-400 line-through">{room.pricing?.currency || '₹'}{room.pricing?.basePrice || 0}</span>
                            )}
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {room.pricing?.displayPrice || `${room.pricing?.currency || '₹'}${room.pricing?.finalPrice || room.pricing?.basePrice || 0}`}
                              </span>
                              <span className="text-sm font-bold text-slate-500">/ night</span>
                            </div>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">+ {room.pricing?.currency || '₹'}{room.pricing?.taxAmount || 0} Taxes ({room.pricing?.taxPercent || 0}%)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'dining' && (
            <div className="space-y-6">
              {foods.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Utensils size={28} className="text-slate-400" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">No Dining Menu Available</p>
                  <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                    This property hasn't uploaded any food or dining menu options yet. Menu items added will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {foods.map((food) => (
                    <div key={food.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row">
                      <div className="relative h-64 md:h-auto md:w-2/5 bg-slate-100 shrink-0">
                        <img
                          src={food.images?.[0] || 'https://via.placeholder.com/500x400?text=Food'}
                          alt={food.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-3 top-3">
                          <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${getFoodBadgeClasses(food.type)}`}>
                            {food.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col p-6 w-full">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="text-xl font-bold text-slate-900">{food.name}</h3>
                          <div className="text-right shrink-0">
                            <p className="text-2xl font-black text-blue-600">{food.displayPrice || `${food.currency || '₹'} ${food.price}`}</p>
                          </div>
                        </div>

                        <div className="flex-1">
                          <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">{food.description}</p>
                        </div>

                        {food.images?.length > 1 && (
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Gallery</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                              {food.images.slice(1).map((image, imageIndex) => (
                                <img
                                  key={`${food.id}-image-${imageIndex}`}
                                  src={image}
                                  alt={`${food.name} view ${imageIndex + 2}`}
                                  className="h-14 w-14 flex-none rounded-lg border border-slate-200 object-cover"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldAlert className="text-blue-600" size={24} />
                    <h3 className="text-lg font-bold text-slate-900">Cancellation & Refund</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-2">Cancellation Policy</h4>
                      <FormattedPolicyText text={policies.cancellationText || detailedPolicies.cancellationPolicy} />
                      {!policies.cancellationText && !detailedPolicies.cancellationPolicy && <p className="text-sm text-slate-500">Standard cancellation policy applies.</p>}
                    </div>
                    <hr className="border-slate-100" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-2">Refund Rules</h4>
                      <FormattedPolicyText text={detailedPolicies.refundPolicy} />
                      {!detailedPolicies.refundPolicy && <p className="text-sm text-slate-500">Subject to cancellation timeline.</p>}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <UserCheck className="text-blue-600" size={24} />
                    <h3 className="text-lg font-bold text-slate-900">Guest Rules</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-2">General Guidelines</h4>
                      <FormattedPolicyText text={detailedPolicies.hotelsPolicy} />
                      {policies.rules?.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {policies.rules.map((rule, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                              <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <hr className="border-slate-100" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-slate-500 mb-1">Unmarried Couples</span>
                        <span className="font-semibold text-slate-800">{detailedPolicies.unmarriedCouplesAllowed || 'Depends'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 mb-1">Bachelors</span>
                        <span className="font-semibold text-slate-800">{detailedPolicies.bachelorAllowed || 'Depends'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 mb-1">International Guests</span>
                        <span className="font-semibold text-slate-800">{detailedPolicies.internationalGuestAllowed || 'Depends'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 mb-1">Pets</span>
                        <span className="font-semibold text-slate-800">{restrictions.petsAllowed || detailedPolicies.petsAllowed === 'Yes' ? 'Allowed' : 'Not Allowed'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 mb-1">Alcohol</span>
                        <span className="font-semibold text-slate-800">{restrictions.alcoholAllowed || detailedPolicies.alcoholAllowed === 'Yes' ? 'Allowed' : 'Not Allowed'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 mb-1">Smoking</span>
                        <span className="font-semibold text-slate-800">{restrictions.smokingAllowed || detailedPolicies.smokingAllowed === 'Yes' ? 'Allowed' : 'Not Allowed'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="text-blue-600" size={24} />
                  <h3 className="text-lg font-bold text-slate-900">Payment & Outside Policies</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">Accepted Payment Modes</h4>
                    <p className="text-sm text-slate-600">{detailedPolicies.paymentMode || 'Credit Card, Debit Card, UPI, Cash'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">Outside Food Policy</h4>
                    <FormattedPolicyText text={detailedPolicies.outsideFoodPolicy} />
                    {!detailedPolicies.outsideFoodPolicy && <p className="text-sm text-slate-600">Please check with front desk.</p>}
                  </div>
                </div>
              </div>

              <CollapsibleSection title="Advanced Pricing & Sharing Configuration" icon={Settings} className="bg-slate-50 border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-emerald-700 bg-emerald-100 py-2 px-3 rounded-lg text-center">Standard Discounts</h4>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="space-y-2 text-sm text-slate-700">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Double Sharing:</span> <span className="font-bold">{detailedPolicies.onDoubleSharing || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Triple Sharing:</span> <span className="font-bold">{detailedPolicies.onTrippleSharing || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Quad Sharing:</span> <span className="font-bold">{detailedPolicies.onQuadSharing || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Bulk Booking:</span> <span className="font-bold">{detailedPolicies.onBulkBooking || 0}%</span></div>
                        <div className="flex justify-between items-center"><span>More Than Four:</span> <span className="font-bold">{detailedPolicies.onMoreThanFour || 0}%</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-blue-700 bg-blue-100 py-2 px-3 rounded-lg text-center">Advance Payment (AP)</h4>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="space-y-2 text-sm text-slate-700">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Double Sharing:</span> <span className="font-bold">{detailedPolicies.onDoubleSharingAp || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Triple Sharing:</span> <span className="font-bold">{detailedPolicies.onTrippleSharingAp || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Quad Sharing:</span> <span className="font-bold">{detailedPolicies.onQuadSharingAp || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Bulk Booking:</span> <span className="font-bold">{detailedPolicies.onBulkBookingAp || 0}%</span></div>
                        <div className="flex justify-between items-center"><span>More Than Four:</span> <span className="font-bold">{detailedPolicies.onMoreThanFourAp || 0}%</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-purple-700 bg-purple-100 py-2 px-3 rounded-lg text-center">Multiple Advance (MAP)</h4>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="space-y-2 text-sm text-slate-700">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Double Sharing:</span> <span className="font-bold">{detailedPolicies.onDoubleSharingMAp || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Triple Sharing:</span> <span className="font-bold">{detailedPolicies.onTrippleSharingMAp || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Quad Sharing:</span> <span className="font-bold">{detailedPolicies.onQuadSharingMAp || 0}%</span></div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-1"><span>Bulk Booking:</span> <span className="font-bold">{detailedPolicies.onBulkBookingMAp || 0}%</span></div>
                        <div className="flex justify-between items-center"><span>More Than Four:</span> <span className="font-bold">{detailedPolicies.onMoreThanFourMAp || 0}%</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 lg:col-span-3 mt-4 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-rose-700 bg-rose-100 py-2 px-3 rounded-lg w-full">Extra Charges Overview (%)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Standard</p>
                        <div className="space-y-2 text-sm text-slate-700">
                          <div className="flex justify-between"><span>Double:</span> <span className="font-bold">{detailedPolicies.offDoubleSharing || 0}%</span></div>
                          <div className="flex justify-between"><span>Triple:</span> <span className="font-bold">{detailedPolicies.offTrippleSharing || 0}%</span></div>
                          <div className="flex justify-between"><span>Quad:</span> <span className="font-bold">{detailedPolicies.offQuadSharing || 0}%</span></div>
                          <div className="flex justify-between"><span>Bulk:</span> <span className="font-bold">{detailedPolicies.offBulkBooking || 0}%</span></div>
                          <div className="flex justify-between"><span>4 Guests:</span> <span className="font-bold">{detailedPolicies.offMoreThanFour || 0}%</span></div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Advance (AP)</p>
                        <div className="space-y-2 text-sm text-slate-700">
                          <div className="flex justify-between"><span>Double:</span> <span className="font-bold">{detailedPolicies.offDoubleSharingAp || 0}%</span></div>
                          <div className="flex justify-between"><span>Triple:</span> <span className="font-bold">{detailedPolicies.offTrippleSharingAp || 0}%</span></div>
                          <div className="flex justify-between"><span>Quad:</span> <span className="font-bold">{detailedPolicies.offQuadSharingAp || 0}%</span></div>
                          <div className="flex justify-between"><span>Bulk:</span> <span className="font-bold">{detailedPolicies.offBulkBookingAp || 0}%</span></div>
                          <div className="flex justify-between"><span>4 Guests:</span> <span className="font-bold">{detailedPolicies.offMoreThanFourAp || 0}%</span></div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Multi Advance (MAP)</p>
                        <div className="space-y-2 text-sm text-slate-700">
                          <div className="flex justify-between"><span>Double:</span> <span className="font-bold">{detailedPolicies.offDoubleSharingMAp || 0}%</span></div>
                          <div className="flex justify-between"><span>Triple:</span> <span className="font-bold">{detailedPolicies.offTrippleSharingMAp || 0}%</span></div>
                          <div className="flex justify-between"><span>Quad:</span> <span className="font-bold">{detailedPolicies.offQuadSharingMAp || 0}%</span></div>
                          <div className="flex justify-between"><span>Bulk:</span> <span className="font-bold">{detailedPolicies.offBulkBookingMAp || 0}%</span></div>
                          <div className="flex justify-between"><span>4 Guests:</span> <span className="font-bold">{detailedPolicies.offMoreThanFourMAp || 0}%</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </CollapsibleSection>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default HotelDetails