import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Building2,
  MapPin,
  RefreshCw,
  UserRound,
  Star,
  Tag,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../../components/breadcrumb'
import MasterFilter from '../../components/master-filter'
import { getAllHotels } from '../../../redux/slices/admin/hotel'
import { getSelectedGuest, saveSelectedHotel } from '../../utils/booking-storage'
import { formatCurrency } from '../../utils/format'

const normalizeAmenityList = (amenities) => {
  if (!amenities) return []

  if (Array.isArray(amenities)) {
    return amenities
      .flatMap((item) => {
        if (typeof item === 'string' || typeof item === 'number') return [String(item)]
        if (Array.isArray(item)) return item.map((entry) => String(entry)).filter(Boolean)
        if (typeof item === 'object' && item !== null) {
          if (Array.isArray(item.amenities)) return normalizeAmenityList(item.amenities)
          if (typeof item.name === 'string') return [item.name]
          if (typeof item.amenity === 'string') return [item.amenity]
          if (typeof item.label === 'string') return [item.label]
          return Object.values(item).filter((value) => typeof value === 'string')
        }
        return []
      })
      .filter(Boolean)
  }

  if (typeof amenities === 'object' && amenities !== null) {
    if (Array.isArray(amenities.amenities)) return normalizeAmenityList(amenities.amenities)
    if (Array.isArray(amenities.list)) return normalizeAmenityList(amenities.list)
  }

  return []
}

const normalizeHotel = (hotel) => {
  const startingPrice =
    hotel?.pricing?.startingFrom ||
    hotel?.pricing?.lowestBasePrice ||
    (Array.isArray(hotel?.rooms) && hotel.rooms[0]?.price) ||
    0

  return {
    id: hotel?._id || hotel?.hotelId || hotel?.id || '',
    hotelId: hotel?.hotelId || hotel?._id || hotel?.id || 'N/A',
    hotelName: hotel?.hotelName || hotel?.name || 'Unnamed Hotel',
    city: hotel?.city || hotel?.hotelCity || hotel?.destination || 'Unknown',
    state: hotel?.state || '',
    address: hotel?.address || hotel?.hotelAddress || hotel?.location || '',
    email: hotel?.hotelEmail || hotel?.email || '',
    image: Array.isArray(hotel?.images) ? hotel.images[0] : hotel?.image || '',
    starRating: Number(hotel?.starRating || 0),
    rating: Number(hotel?.rating || 0),
    reviewCount: Number(hotel?.reviewCount || 0),
    category: hotel?.hotelCategory || hotel?.category || '',
    propertyType: Array.isArray(hotel?.propertyType)
      ? hotel.propertyType.join(', ')
      : hotel?.propertyType || '',
    startingPrice: Number(startingPrice),
    amenities: normalizeAmenityList(hotel?.amenities || hotel?.amenities?.amenities || hotel),
    isOffer: Array.isArray(hotel?.rooms) && hotel.rooms.some((room) => room.isOffer),
    offerName: Array.isArray(hotel?.rooms)
      ? hotel.rooms.find((room) => room.isOffer)?.offerName || ''
      : '',
    raw: hotel,
  }
}

const createEmptyFilters = () => ({
  search: '',
  hotelId: '',
  hotelName: '',
  hotelOwnerName: '',
  hotelEmail: '',
  destination: '',
  city: '',
  state: '',
  landmark: '',
  pinCode: '',
  hotelCategory: '',
  propertyType: '',
  localId: '',
  onFront: '',
  isAccepted: '',
  starRating: '',
  minStarRating: '',
  maxStarRating: '',
  rating: '',
  minRating: '',
  maxRating: '',
  minReviewCount: '',
  maxReviewCount: '',
  latitude: '',
  longitude: '',
  roomId: '',
  type: '',
  roomType: '',
  bedTypes: '',
  amenities: '',
  unmarriedCouplesAllowed: '',
  contact: '',
  generalManagerContact: '',
  salesManagerContact: '',
  customerWelcomeNote: '',
  hasOffer: '',
  roomSoldOut: '',
  onlyAvailable: '',
  countRooms: '',
  requestedRooms: '',
  guests: '',
  minPrice: '',
  maxPrice: '',
  minRoomPrice: '',
  maxRoomPrice: '',
  checkInDate: '',
  checkOutDate: '',
  sortBy: '',
  sortOrder: '',
  page: '',
  limit: '',
})

function BookingCreationHotels() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { hotels, loading, error } = useSelector((state) => state.hotel)

  const [selectedHotelId, setSelectedHotelId] = useState('')
  const [selectedGuest] = useState(() => getSelectedGuest())
  const [draftFilters, setDraftFilters] = useState(createEmptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(createEmptyFilters)

  useEffect(() => {
    dispatch(getAllHotels())
  }, [dispatch])

  const normalizedHotels = useMemo(() => hotels.map(normalizeHotel), [hotels])

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(normalizedHotels.map((hotel) => hotel.city).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((city) => ({ value: city, label: city })),
    [normalizedHotels],
  )

  const stateOptions = useMemo(
    () =>
      Array.from(new Set(normalizedHotels.map((hotel) => hotel.state).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((state) => ({ value: state, label: state })),
    [normalizedHotels],
  )

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(normalizedHotels.map((hotel) => hotel.category).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((category) => ({ value: category, label: category })),
    [normalizedHotels],
  )

  const propertyTypeOptions = useMemo(
    () =>
      Array.from(new Set(normalizedHotels.map((hotel) => hotel.propertyType).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((propertyType) => ({ value: propertyType, label: propertyType })),
    [normalizedHotels],
  )

  const yesNoOptions = useMemo(
    () => [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    [],
  )

  const filterFields = useMemo(
    () => [
      { key: 'search', label: 'Search', type: 'text', placeholder: 'Search hotels' },
      { key: 'hotelId', label: 'Hotel ID', type: 'text', placeholder: 'Filter by Hotel ID' },
      { key: 'hotelName', label: 'Hotel Name', type: 'text', placeholder: 'Filter by Hotel Name' },
      { key: 'hotelOwnerName', label: 'Hotel Owner Name', type: 'text', placeholder: 'Filter by Hotel Owner Name' },
      { key: 'hotelEmail', label: 'Hotel Email', type: 'text', placeholder: 'Filter by Hotel Email' },
      { key: 'destination', label: 'Destination', type: 'text', placeholder: 'Filter by Destination' },
      { key: 'city', label: 'City', type: 'select', options: cityOptions, emptyOptionLabel: 'All Cities' },
      { key: 'state', label: 'State', type: 'select', options: stateOptions, emptyOptionLabel: 'All States' },
      { key: 'landmark', label: 'Landmark', type: 'text', placeholder: 'Filter by Landmark' },
      { key: 'pinCode', label: 'Pin Code', type: 'text', placeholder: 'Filter by Pin Code' },
      { key: 'hotelCategory', label: 'Category', type: 'select', options: categoryOptions, emptyOptionLabel: 'All Categories' },
      { key: 'propertyType', label: 'Property Type', type: 'select', options: propertyTypeOptions, emptyOptionLabel: 'All Property Types' },
      { key: 'localId', label: 'Local ID', type: 'text', placeholder: 'Filter by Local ID' },
      { key: 'onFront', label: 'On Front', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
      { key: 'isAccepted', label: 'Is Accepted', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
      {
        key: 'starRating',
        label: 'Star Rating',
        type: 'select',
        options: [1, 2, 3, 4, 5].map((rating) => ({ value: String(rating), label: `${rating} Star${rating > 1 ? 's' : ''}` })),
        emptyOptionLabel: 'Any Rating',
      },
      { key: 'minStarRating', label: 'Min Star Rating', type: 'number', placeholder: 'Minimum stars' },
      { key: 'maxStarRating', label: 'Max Star Rating', type: 'number', placeholder: 'Maximum stars' },
      { key: 'rating', label: 'Rating', type: 'number', placeholder: 'Exact rating' },
      { key: 'minRating', label: 'Min Rating', type: 'number', placeholder: 'Minimum rating' },
      { key: 'maxRating', label: 'Max Rating', type: 'number', placeholder: 'Maximum rating' },
      { key: 'minReviewCount', label: 'Min Review Count', type: 'number', placeholder: 'Minimum reviews' },
      { key: 'maxReviewCount', label: 'Max Review Count', type: 'number', placeholder: 'Maximum reviews' },
      { key: 'latitude', label: 'Latitude', type: 'text', placeholder: 'Filter by Latitude' },
      { key: 'longitude', label: 'Longitude', type: 'text', placeholder: 'Filter by Longitude' },
      { key: 'roomId', label: 'Room ID', type: 'text', placeholder: 'Filter by Room ID' },
      { key: 'type', label: 'Type', type: 'text', placeholder: 'Filter by Type' },
      { key: 'roomType', label: 'Room Type', type: 'text', placeholder: 'Filter by Room Type' },
      { key: 'bedTypes', label: 'Bed Types', type: 'text', placeholder: 'Filter by Bed Types' },
      { key: 'amenities', label: 'Amenities', type: 'text', placeholder: 'Filter by Amenities' },
      { key: 'unmarriedCouplesAllowed', label: 'Unmarried Couples Allowed', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
      { key: 'contact', label: 'Contact', type: 'text', placeholder: 'Filter by Contact' },
      { key: 'generalManagerContact', label: 'GM Contact', type: 'text', placeholder: 'Filter by GM Contact' },
      { key: 'salesManagerContact', label: 'Sales Contact', type: 'text', placeholder: 'Filter by Sales Contact' },
      { key: 'customerWelcomeNote', label: 'Customer Welcome Note', type: 'text', placeholder: 'Filter by Welcome Note' },
      { key: 'hasOffer', label: 'Has Offer', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
      { key: 'roomSoldOut', label: 'Room Sold Out', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
      { key: 'onlyAvailable', label: 'Only Available', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
      { key: 'countRooms', label: 'Count Rooms', type: 'number', placeholder: 'Count rooms' },
      { key: 'requestedRooms', label: 'Requested Rooms', type: 'number', placeholder: 'Requested rooms' },
      { key: 'guests', label: 'Guests', type: 'number', placeholder: 'Guest count' },
      { key: 'minPrice', label: 'Min Price', type: 'number', placeholder: 'Minimum price' },
      { key: 'maxPrice', label: 'Max Price', type: 'number', placeholder: 'Maximum price' },
      { key: 'minRoomPrice', label: 'Min Room Price', type: 'number', placeholder: 'Minimum room price' },
      { key: 'maxRoomPrice', label: 'Max Room Price', type: 'number', placeholder: 'Maximum room price' },
      { key: 'checkInDate', label: 'Check In Date', type: 'date' },
      { key: 'checkOutDate', label: 'Check Out Date', type: 'date' },
      {
        key: 'sortBy',
        label: 'Sort By',
        type: 'select',
        options: ['hotelName', 'hotelId', 'city', 'state', 'starRating', 'rating', 'reviewCount', 'price'],
        emptyOptionLabel: 'Default Sort',
      },
      {
        key: 'sortOrder',
        label: 'Sort Order',
        type: 'select',
        options: [
          { value: 'asc', label: 'Ascending' },
          { value: 'desc', label: 'Descending' },
        ],
        emptyOptionLabel: 'Default Order',
      },
      { key: 'page', label: 'Page', type: 'number', placeholder: 'Page number' },
      { key: 'limit', label: 'Limit', type: 'number', placeholder: 'Items per page' },
    ],
    [categoryOptions, cityOptions, propertyTypeOptions, stateOptions, yesNoOptions],
  )

  const filteredHotels = useMemo(() => {
    const query = String(appliedFilters.search || '').trim().toLowerCase()
    const toNumber = (value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    const boolMatch = (expected, actual) => {
      if (expected === '') return true
      if (expected === 'true') return Boolean(actual) === true
      if (expected === 'false') return Boolean(actual) === false
      return true
    }
    const includesValue = (source, value) =>
      !String(value || '').trim() ||
      String(source || '').toLowerCase().includes(String(value).trim().toLowerCase())

    return normalizedHotels.filter((hotel) => {
      const starRating = hotel.starRating || 0
      const rating = hotel.rating || 0
      const reviewCount = hotel.reviewCount || 0
      const startingPrice = hotel.startingPrice || 0

      const matchesSearch =
        !query ||
        hotel.hotelName.toLowerCase().includes(query) ||
        hotel.hotelId.toLowerCase().includes(query) ||
        hotel.city.toLowerCase().includes(query) ||
        hotel.state.toLowerCase().includes(query) ||
        hotel.email.toLowerCase().includes(query) ||
        hotel.address.toLowerCase().includes(query)

      const matchesExactText =
        includesValue(hotel.hotelId, appliedFilters.hotelId) &&
        includesValue(hotel.hotelName, appliedFilters.hotelName) &&
        includesValue(hotel.email, appliedFilters.hotelEmail) &&
        includesValue(hotel.city, appliedFilters.city) &&
        includesValue(hotel.state, appliedFilters.state) &&
        includesValue(hotel.category, appliedFilters.hotelCategory) &&
        includesValue(hotel.propertyType, appliedFilters.propertyType) &&
        includesValue(hotel.address, appliedFilters.destination) &&
        includesValue(hotel.address, appliedFilters.landmark) &&
        includesValue(hotel.address, appliedFilters.pinCode) &&
        includesValue(hotel.address, appliedFilters.customerWelcomeNote) &&
        includesValue(hotel.address, appliedFilters.hotelOwnerName) &&
        includesValue(hotel.address, appliedFilters.localId) &&
        includesValue(hotel.address, appliedFilters.roomId) &&
        includesValue(hotel.address, appliedFilters.type) &&
        includesValue(hotel.address, appliedFilters.roomType) &&
        includesValue(hotel.address, appliedFilters.bedTypes) &&
        includesValue(hotel.amenities.join(' '), appliedFilters.amenities) &&
        includesValue(hotel.address, appliedFilters.contact) &&
        includesValue(hotel.address, appliedFilters.generalManagerContact) &&
        includesValue(hotel.address, appliedFilters.salesManagerContact) &&
        includesValue(hotel.address, appliedFilters.latitude) &&
        includesValue(hotel.address, appliedFilters.longitude)

      const exactStar = toNumber(appliedFilters.starRating)
      const minStar = toNumber(appliedFilters.minStarRating)
      const maxStar = toNumber(appliedFilters.maxStarRating)
      const exactRating = toNumber(appliedFilters.rating)
      const minRating = toNumber(appliedFilters.minRating)
      const maxRating = toNumber(appliedFilters.maxRating)
      const minReviews = toNumber(appliedFilters.minReviewCount)
      const maxReviews = toNumber(appliedFilters.maxReviewCount)
      const minPrice = toNumber(appliedFilters.minPrice) ?? toNumber(appliedFilters.minRoomPrice)
      const maxPrice = toNumber(appliedFilters.maxPrice) ?? toNumber(appliedFilters.maxRoomPrice)

      const matchesNumeric =
        (exactStar === null || starRating === exactStar) &&
        (minStar === null || starRating >= minStar) &&
        (maxStar === null || starRating <= maxStar) &&
        (exactRating === null || rating === exactRating) &&
        (minRating === null || rating >= minRating) &&
        (maxRating === null || rating <= maxRating) &&
        (minReviews === null || reviewCount >= minReviews) &&
        (maxReviews === null || reviewCount <= maxReviews) &&
        (minPrice === null || startingPrice >= minPrice) &&
        (maxPrice === null || startingPrice <= maxPrice)

      const matchesBoolean =
        boolMatch(appliedFilters.hasOffer, hotel.isOffer) &&
        boolMatch(appliedFilters.unmarriedCouplesAllowed, hotel.raw?.unmarriedCouplesAllowed) &&
        boolMatch(appliedFilters.onFront, hotel.raw?.onFront) &&
        boolMatch(appliedFilters.isAccepted, hotel.raw?.isAccepted) &&
        boolMatch(appliedFilters.roomSoldOut, hotel.raw?.roomSoldOut) &&
        boolMatch(appliedFilters.onlyAvailable, hotel.raw?.onlyAvailable)

      return matchesSearch && matchesExactText && matchesNumeric && matchesBoolean
    })
  }, [appliedFilters, normalizedHotels])

  const sortedHotels = useMemo(() => {
    const sortBy = appliedFilters.sortBy
    const sortOrder = appliedFilters.sortOrder === 'desc' ? 'desc' : 'asc'
    if (!sortBy) return filteredHotels

    const list = [...filteredHotels]
    list.sort((a, b) => {
      const getSortValue = (hotel) => {
        if (sortBy === 'price') return hotel.startingPrice || 0
        return hotel[sortBy] ?? hotel.raw?.[sortBy] ?? ''
      }

      const aValue = getSortValue(a)
      const bValue = getSortValue(b)

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
      }

      const comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
      return sortOrder === 'desc' ? comparison * -1 : comparison
    })

    return list
  }, [appliedFilters.sortBy, appliedFilters.sortOrder, filteredHotels])

  const visibleHotels = useMemo(() => {
    const page = Math.max(1, Number(appliedFilters.page) || 1)
    const limit = Math.max(1, Number(appliedFilters.limit) || sortedHotels.length || 1)
    const start = (page - 1) * limit
    return sortedHotels.slice(start, start + limit)
  }, [appliedFilters.limit, appliedFilters.page, sortedHotels])

  const guestDisplayName = useMemo(() => {
    if (!selectedGuest) return 'Guest selected'
    if (!selectedGuest.isExistingUser) return selectedGuest.mobile || 'Guest selected'
    return selectedGuest.userName || selectedGuest.mobile || 'Guest selected'
  }, [selectedGuest])

  const appliedFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((value) => String(value || '').trim() !== '').length,
    [appliedFilters],
  )

  const handleHotelSelection = (hotel) => {
    saveSelectedHotel(hotel)
    setSelectedHotelId(hotel.id || hotel.hotelId)
    navigate('/booking-creation/book-hotel')
  }

  const handleFilterChange = (key, value) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters)
  }

  const handleResetFilters = () => {
    const emptyFilters = createEmptyFilters()
    setDraftFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  return (
    <div className="bg-slate-50/70 p-6 md:p-8">
      <Breadcrumb />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Choose Hotel</h1>
            <p className="mt-1 text-sm text-slate-500">
              Booking creation ke liye hotels ko same compact master filter se browse karo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => dispatch(getAllHotels())}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Hotels
          </button>
        </div>

        <section className="sticky top-4 z-30 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Total: {normalizedHotels.length}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Showing: {visibleHotels.length}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Active Filters: {appliedFilterCount}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <MasterFilter
                fields={filterFields}
                values={draftFilters}
                loading={loading}
                enableFieldPicker
                fieldPickerLabel="Select hotel filter key"
                initialActiveFieldKeys={['search', 'city', 'state', 'hotelCategory']}
                applyLabel="Apply"
                onChange={handleFilterChange}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />

              {selectedGuest ? (
                <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 pl-1.5 pr-3 py-1">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <UserRound size={12} />
                  </div>
                  <span className="max-w-[140px] truncate text-xs font-semibold text-slate-800">
                    {guestDisplayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/booking-creation')}
                    className="ml-1 text-[10px] font-bold text-indigo-500 transition hover:text-indigo-700"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/booking-creation')}
                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  + Select Guest
                </button>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading && visibleHotels.length === 0 && (
            <div className="col-span-full rounded-[28px] border border-slate-200 bg-white px-6 py-12 text-center text-sm font-medium text-slate-500 shadow-sm">
              Loading hotels...
            </div>
          )}

          {!loading && visibleHotels.length === 0 && (
            <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Building2 size={32} className="mx-auto text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-slate-900">No hotels match this filter</p>
              <p className="mt-2 text-sm text-slate-500">Search ya filter change karo.</p>
            </div>
          )}

          {visibleHotels.map((hotel) => {
            const isSelected = selectedHotelId === (hotel.id || hotel.hotelId)

            return (
              <article
                key={hotel.id || hotel.hotelId}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.10)] ${
                  isSelected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
                }`}
              >
                <div className="relative h-36 shrink-0 bg-[linear-gradient(135deg,#dbeafe_0%,#eef2ff_45%,#f8fafc_100%)]">
                  {hotel.image ? (
                    <img src={hotel.image} alt={hotel.hotelName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-indigo-400">
                      <Building2 size={28} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                    {hotel.isOffer && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
                        <Tag size={8} />
                        {hotel.offerName || 'Offer'}
                      </span>
                    )}
                    {hotel.category && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                        {hotel.category}
                      </span>
                    )}
                  </div>

                  {hotel.starRating > 0 && (
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold text-white">{hotel.starRating}</span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-white/60">
                      {hotel.hotelId}
                    </p>
                    <h3 className="truncate text-sm font-bold leading-tight text-white">
                      {hotel.hotelName}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={`${hotel.hotelId}-star-${index}`}
                            size={9}
                            className={
                              index < hotel.starRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-white/30'
                            }
                          />
                        ))}
                      </div>
                      {hotel.city && (
                        <span className="flex items-center gap-1 text-[10px] text-white/80">
                          <MapPin size={9} />
                          {[hotel.city, hotel.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hotel.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={`${hotel.id || hotel.hotelId}-amenity-${index}`}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                          +{hotel.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="line-clamp-2 text-sm text-slate-600">
                      {hotel.address || 'Address not available'}
                    </p>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {hotel.email || 'Email not available'}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div>
                      {hotel.startingPrice > 0 ? (
                        <>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">From</p>
                          <p className="text-sm font-extrabold text-slate-900">{formatCurrency(hotel.startingPrice)}</p>
                          <p className="text-[9px] text-slate-400">/night</p>
                        </>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400">Price on request</p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedGuest}
                      onClick={() => handleHotelSelection(hotel)}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Book'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}

export default BookingCreationHotels
