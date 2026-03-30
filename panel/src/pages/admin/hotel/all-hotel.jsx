import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Building2, MapPin, RefreshCw, Search, Star, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../../../components/breadcrumb'
import MasterFilter from '../../../components/master-filter'
import { getAllHotels, getHotelsByFilters } from '../../../../redux/slices/admin/hotel'
import { formatCurrency } from '../../../utils/format'

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
    hotel?.pricingOverview?.lowestBasePrice ||
    (Array.isArray(hotel?.rooms) && (hotel.rooms[0]?.price || hotel.rooms[0]?.pricing?.basePrice)) ||
    0

  return {
    id: hotel?._id || hotel?.hotelId || hotel?.id || '',
    hotelId: hotel?.hotelId || hotel?._id || hotel?.id || hotel?.basicInfo?.hotelId || 'N/A',
    hotelName: hotel?.hotelName || hotel?.name || hotel?.basicInfo?.name || 'Unnamed Hotel',
    city: hotel?.city || hotel?.hotelCity || hotel?.destination || hotel?.basicInfo?.location?.city || 'Unknown',
    state: hotel?.state || hotel?.basicInfo?.location?.state || '',
    address: hotel?.address || hotel?.hotelAddress || hotel?.location || hotel?.basicInfo?.location?.address || '',
    email: hotel?.hotelEmail || hotel?.email || hotel?.basicInfo?.contacts?.email || '',
    image: Array.isArray(hotel?.images)
      ? hotel.images[0]
      : Array.isArray(hotel?.basicInfo?.images)
        ? hotel.basicInfo.images[0]
        : hotel?.image || '',
    starRating: Number(hotel?.starRating || hotel?.basicInfo?.starRating || 0),
    category: hotel?.hotelCategory || hotel?.category || hotel?.basicInfo?.category || '',
    propertyType: Array.isArray(hotel?.propertyType)
      ? hotel.propertyType.join(', ')
      : hotel?.propertyType || '',
    amenities: normalizeAmenityList(hotel?.amenities || hotel),
    startingPrice: Number(startingPrice),
    isOffer: Array.isArray(hotel?.rooms) && hotel.rooms.some((room) => room.isOffer || room?.features?.isOffer),
    offerName: Array.isArray(hotel?.rooms)
      ? hotel.rooms.find((room) => room.isOffer || room?.features?.isOffer)?.offerName ||
        hotel.rooms.find((room) => room.isOffer || room?.features?.isOffer)?.features?.offerText ||
        ''
      : '',
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

function AllHotels({
  title = 'All Hotels',
  subtitle = 'Network ke saare hotels ko card view me dekhiye.',
  enableMasterFilter = true,
  fixedFilters = {},
  detailBasePath = '/hotels',
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { hotels, allHotels, loading, error } = useSelector((state) => state.hotel)
  const [filterValues, setFilterValues] = useState(createEmptyFilters)
  const [simpleSearch, setSimpleSearch] = useState('')
  const lastAutoFetchKeyRef = useRef('')

  const hasFixedFilters = useMemo(
    () => Object.values(fixedFilters).some((value) => String(value || '').trim() !== ''),
    [fixedFilters],
  )

  const autoFetchKey = useMemo(
    () =>
      JSON.stringify({
        mode: enableMasterFilter ? 'all' : 'fixed',
        fixedFilters,
      }),
    [enableMasterFilter, fixedFilters],
  )

  useEffect(() => {
    if (lastAutoFetchKeyRef.current === autoFetchKey) return
    lastAutoFetchKeyRef.current = autoFetchKey

    if (enableMasterFilter || !hasFixedFilters) {
      dispatch(getAllHotels())
    } else {
      dispatch(getHotelsByFilters(fixedFilters))
    }
  }, [autoFetchKey, dispatch, enableMasterFilter, fixedFilters, hasFixedFilters])

  const normalizedHotels = useMemo(() => hotels.map(normalizeHotel), [hotels])
  const sourceHotels = useMemo(() => {
    const baseHotels = allHotels?.length ? allHotels : hotels
    return baseHotels.map(normalizeHotel)
  }, [allHotels, hotels])

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(sourceHotels.map((hotel) => hotel.city).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((city) => ({ value: city, label: city })),
    [sourceHotels],
  )

  const stateOptions = useMemo(
    () =>
      Array.from(new Set(sourceHotels.map((hotel) => hotel.state).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((state) => ({ value: state, label: state })),
    [sourceHotels],
  )

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(sourceHotels.map((hotel) => hotel.category).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((category) => ({ value: category, label: category })),
    [sourceHotels],
  )

  const propertyTypeOptions = useMemo(
    () =>
      Array.from(new Set(sourceHotels.map((hotel) => hotel.propertyType).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((propertyType) => ({ value: propertyType, label: propertyType })),
    [sourceHotels],
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

  const displayedHotels = useMemo(() => {
    if (enableMasterFilter) return normalizedHotels

    const query = simpleSearch.trim().toLowerCase()
    if (!query) return normalizedHotels

    return normalizedHotels.filter((hotel) =>
      [hotel.hotelName, hotel.city, hotel.state, hotel.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [enableMasterFilter, normalizedHotels, simpleSearch])

  const appliedFilterCount = useMemo(
    () => Object.values(filterValues).filter((value) => String(value || '').trim() !== '').length,
    [filterValues],
  )

  const handleFilterChange = (key, value) => {
    setFilterValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleApplyFilters = () => {
    dispatch(getHotelsByFilters(filterValues))
  }

  const handleResetFilters = () => {
    setFilterValues(createEmptyFilters())
    dispatch(getAllHotels())
  }

  const handleRefresh = () => {
    if (enableMasterFilter || !hasFixedFilters) {
      dispatch(getAllHotels())
    } else {
      dispatch(getHotelsByFilters(fixedFilters))
    }
  }

  return (
    <div className="bg-slate-50/70 p-6 md:p-8">
      <Breadcrumb />

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Hotels
          </button>
        </div>

        {enableMasterFilter ? (
          <MasterFilter
            fields={filterFields}
            values={filterValues}
            loading={loading}
            enableFieldPicker
            fieldPickerLabel="Select hotel filter key"
            initialActiveFieldKeys={['search', 'city', 'state', 'hotelCategory']}
            applyLabel="Apply Filters"
            onChange={handleFilterChange}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={simpleSearch}
                onChange={(event) => setSimpleSearch(event.target.value)}
                placeholder="Search by hotel name or destination"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
              />
            </label>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-2">Source: {sourceHotels.length}</span>
            <span className="rounded-full bg-slate-100 px-3 py-2">Showing: {displayedHotels.length}</span>
            {enableMasterFilter && (
              <span className="rounded-full bg-slate-100 px-3 py-2">Active Filters: {appliedFilterCount}</span>
            )}
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading && displayedHotels.length === 0 && (
            <div className="col-span-full rounded-[28px] border border-slate-200 bg-white px-6 py-12 text-center text-sm font-medium text-slate-500 shadow-sm">
              Loading hotels...
            </div>
          )}

          {!loading && displayedHotels.length === 0 && (
            <div className="col-span-full rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Building2 size={32} className="mx-auto text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-slate-900">No hotels found</p>
              <p className="mt-2 text-sm text-slate-500">Filters ya search change karke phir try karo.</p>
            </div>
          )}

          {displayedHotels.map((hotel) => (
            <article
              key={hotel.id || hotel.hotelId}
              onClick={() =>
                navigate(`${detailBasePath}/${encodeURIComponent(hotel.hotelId)}`, {
                  state: { from: detailBasePath },
                })
              }
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.10)]"
            >
              <div className="relative h-40 shrink-0 bg-[linear-gradient(135deg,#dbeafe_0%,#eef2ff_45%,#f8fafc_100%)]">
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

                <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-white/60">{hotel.hotelId}</p>
                  <h3 className="truncate text-sm font-bold leading-tight text-white">{hotel.hotelName}</h3>
                  <div className="mt-0.5 flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={`${hotel.hotelId}-star-${index}`}
                          size={9}
                          className={index < hotel.starRating ? 'fill-amber-400 text-amber-400' : 'text-white/30'}
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

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="space-y-1.5">
                  <p className="line-clamp-2 text-sm text-slate-600">{hotel.address || 'Address not available'}</p>
                  <p className="truncate text-xs font-medium text-slate-500">{hotel.email || 'Email not available'}</p>
                </div>

                {hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hotel.amenities.slice(0, 4).map((amenity, index) => (
                      <span
                        key={`${hotel.hotelId}-amenity-${index}`}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {amenity}
                      </span>
                    ))}
                    {hotel.amenities.length > 4 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        +{hotel.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Starting From</p>
                    <p className="text-lg font-extrabold text-slate-900">
                      {hotel.startingPrice > 0 ? formatCurrency(hotel.startingPrice) : 'Price on request'}
                    </p>
                  </div>

                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Hotel ID: {hotel.hotelId}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

export default AllHotels
