import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  BadgePercent,
  Building2,
  CheckSquare,
  Loader2,
  RefreshCw,
  Square,
  Ticket,
  X,
} from 'lucide-react'
import Breadcrumb from '../../../components/breadcrumb'
import MasterFilter from '../../../components/master-filter'
import { getAllHotels, getHotelsByFilters } from '../../../../redux/slices/admin/hotel'
import {
  bulkApplyCouponToHotels,
  bulkRemoveCouponsFromHotels,
  clearBulkStatus,
} from '../../../../redux/slices/admin/bulk'

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

const normalizeRoomOptions = (rooms = []) =>
  rooms
    .map((room, index) => {
      const roomId = room?.roomId || room?._id || room?.id || ''
      const roomType = room?.type || room?.name || room?.roomType || `Room ${index + 1}`
      const bedType = room?.bedType || room?.bedTypes || room?.beds || ''

      if (!roomId) return null

      return {
        value: roomId,
        label: `${roomType}${bedType ? ` · ${bedType}` : ''} (${roomId})`,
      }
    })
    .filter(Boolean)

const normalizeHotel = (hotel) => ({
  id: hotel?._id || hotel?.hotelId || hotel?.id || '',
  hotelId: hotel?.hotelId || hotel?._id || hotel?.id || hotel?.basicInfo?.hotelId || 'N/A',
  hotelName: hotel?.hotelName || hotel?.name || hotel?.basicInfo?.name || 'Unnamed Hotel',
  city: hotel?.city || hotel?.hotelCity || hotel?.destination || hotel?.basicInfo?.location?.city || 'Unknown',
  state: hotel?.state || hotel?.basicInfo?.location?.state || '',
  address: hotel?.address || hotel?.hotelAddress || hotel?.location || hotel?.basicInfo?.location?.address || '',
  email: hotel?.hotelEmail || hotel?.email || hotel?.basicInfo?.contacts?.email || '',
  category: hotel?.hotelCategory || hotel?.category || hotel?.basicInfo?.category || '',
  propertyType: Array.isArray(hotel?.propertyType) ? hotel.propertyType.join(', ') : hotel?.propertyType || '',
  amenities: normalizeAmenityList(hotel?.amenities || hotel),
  starRating: Number(hotel?.starRating || hotel?.basicInfo?.starRating || 0),
  totalRooms: Array.isArray(hotel?.rooms) ? hotel.rooms.length : Number(hotel?.countRooms || hotel?.numRooms || 0),
  onFront: Boolean(hotel?.onFront),
  isAccepted: Boolean(hotel?.isAccepted),
  soldOut: Boolean(hotel?.soldOut),
  rooms: hotel?.rooms || hotel?.roomDetails || hotel?.roomTypes || hotel?.roomsDetails || [],
})

const createEmptyFilters = () => ({
  search: '', hotelId: '', hotelName: '', hotelOwnerName: '', hotelEmail: '', destination: '', city: '',
  state: '', landmark: '', pinCode: '', hotelCategory: '', propertyType: '', localId: '', onFront: '',
  isAccepted: '', starRating: '', minStarRating: '', maxStarRating: '', rating: '', minRating: '',
  maxRating: '', minReviewCount: '', maxReviewCount: '', latitude: '', longitude: '', roomId: '',
  type: '', roomType: '', bedTypes: '', amenities: '', unmarriedCouplesAllowed: '', contact: '',
  generalManagerContact: '', salesManagerContact: '', customerWelcomeNote: '', hasOffer: '',
  roomSoldOut: '', onlyAvailable: '', countRooms: '', requestedRooms: '', guests: '', minPrice: '',
  maxPrice: '', minRoomPrice: '', maxRoomPrice: '', checkInDate: '', checkOutDate: '', sortBy: '',
  sortOrder: '', page: '', limit: '',
})

function RoomSelector({ options = [], selectedValues = [], onToggle, title, note, tone = 'violet' }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 px-4 py-4">
      <div className="mb-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">{title}</p>
        {note && <p className="mt-1 text-sm font-medium text-stone-500">{note}</p>}
      </div>

      {options.length === 0 ? (
        <p className="text-sm font-semibold text-stone-400">No matching rooms available for selection.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = selectedValues.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggle(option.value)}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                  active
                    ? tone === 'amber'
                      ? 'border-amber-300 bg-amber-100 text-amber-700'
                      : 'border-violet-300 bg-violet-100 text-violet-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BulkCouponManage() {
  const dispatch = useDispatch()
  const { hotels, allHotels, loading, error } = useSelector((state) => state.hotel)
  const {
    applyingCoupon,
    removingCoupons,
    error: bulkError,
    couponApplyResult,
    couponRemoveResult,
  } = useSelector((state) => state.bulk)

  const [filterValues, setFilterValues] = useState(createEmptyFilters)
  const [selectedHotelIds, setSelectedHotelIds] = useState([])
  const [couponCode, setCouponCode] = useState('')
  const [selectedRoomIds, setSelectedRoomIds] = useState([])
  const [rowLoadingId, setRowLoadingId] = useState(null)
  const [localError, setLocalError] = useState('')
  const [rowCouponDialog, setRowCouponDialog] = useState(null)
  const autoFetchRef = useRef('')

  useEffect(() => {
    if (autoFetchRef.current === 'loaded') return
    autoFetchRef.current = 'loaded'
    dispatch(getAllHotels())
  }, [dispatch])

  const normalizedHotels = useMemo(() => hotels.map(normalizeHotel), [hotels])
  const sourceHotels = useMemo(() => (allHotels?.length ? allHotels : hotels).map(normalizeHotel), [allHotels, hotels])
  const selectedHotels = useMemo(
    () => normalizedHotels.filter((hotel) => selectedHotelIds.includes(hotel.hotelId)),
    [normalizedHotels, selectedHotelIds],
  )

  const cityOptions = useMemo(() => Array.from(new Set(sourceHotels.map((hotel) => hotel.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((city) => ({ value: city, label: city })), [sourceHotels])
  const stateOptions = useMemo(() => Array.from(new Set(sourceHotels.map((hotel) => hotel.state).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((state) => ({ value: state, label: state })), [sourceHotels])
  const categoryOptions = useMemo(() => Array.from(new Set(sourceHotels.map((hotel) => hotel.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((category) => ({ value: category, label: category })), [sourceHotels])
  const propertyTypeOptions = useMemo(() => Array.from(new Set(sourceHotels.map((hotel) => hotel.propertyType).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((propertyType) => ({ value: propertyType, label: propertyType })), [sourceHotels])
  const yesNoOptions = useMemo(() => [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], [])

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
      { key: 'starRating', label: 'Star Rating', type: 'select', options: [1, 2, 3, 4, 5].map((rating) => ({ value: String(rating), label: `${rating} Star${rating > 1 ? 's' : ''}` })), emptyOptionLabel: 'Any Rating' },
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
      { key: 'sortBy', label: 'Sort By', type: 'select', options: ['hotelName', 'hotelId', 'city', 'state', 'starRating', 'rating', 'reviewCount', 'price'], emptyOptionLabel: 'Default Sort' },
      { key: 'sortOrder', label: 'Sort Order', type: 'select', options: [{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }], emptyOptionLabel: 'Default Order' },
      { key: 'page', label: 'Page', type: 'number', placeholder: 'Page number' },
      { key: 'limit', label: 'Limit', type: 'number', placeholder: 'Items per page' },
    ],
    [categoryOptions, cityOptions, propertyTypeOptions, stateOptions, yesNoOptions],
  )

  const commonRoomOptions = useMemo(() => {
    if (selectedHotels.length === 0) return []

    const roomLists = selectedHotels.map((hotel) => normalizeRoomOptions(hotel.rooms))
    if (roomLists.length === 1) return roomLists[0]

    const counts = new Map()
    roomLists.forEach((list) => {
      Array.from(new Set(list.map((room) => room.value))).forEach((roomId) => {
        counts.set(roomId, (counts.get(roomId) || 0) + 1)
      })
    })

    return roomLists[0].filter((room) => counts.get(room.value) === roomLists.length)
  }, [selectedHotels])

  useEffect(() => {
    setSelectedRoomIds((current) =>
      current.filter((roomId) => commonRoomOptions.some((room) => room.value === roomId)),
    )
  }, [commonRoomOptions])

  const toggleHotel = (hotelId) => {
    setSelectedHotelIds((current) =>
      current.includes(hotelId) ? current.filter((item) => item !== hotelId) : [...current, hotelId],
    )
  }

  const toggleAll = () => {
    const visibleIds = normalizedHotels.map((hotel) => hotel.hotelId)
    const allSelected = visibleIds.every((hotelId) => selectedHotelIds.includes(hotelId))

    setSelectedHotelIds((current) =>
      allSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds])),
    )
  }

  const toggleBulkRoom = (roomId) => {
    setSelectedRoomIds((current) =>
      current.includes(roomId) ? current.filter((item) => item !== roomId) : [...current, roomId],
    )
  }

  const refreshHotels = () => dispatch(getAllHotels())

  const clearMessages = () => {
    setLocalError('')
    dispatch(clearBulkStatus())
  }

  const handleApplyCoupon = async (hotelIds, roomIds = selectedRoomIds) => {
    if (!couponCode.trim()) {
      setLocalError('Coupon code required hai.')
      return
    }

    setLocalError('')
    await dispatch(
      bulkApplyCouponToHotels({
        couponCode: couponCode.trim(),
        hotelIds,
        ...(roomIds.length ? { roomIds } : {}),
      }),
    ).unwrap()
    refreshHotels()
  }

  const handleRemoveCoupons = async (hotelIds) => {
    setLocalError('')
    await dispatch(bulkRemoveCouponsFromHotels({ hotelIds })).unwrap()
    refreshHotels()
  }

  const handleRowApply = (hotelId) => {
    if (!couponCode.trim()) {
      setLocalError('Single hotel coupon apply se pehle coupon code enter kijiye.')
      return
    }

    const hotel = normalizedHotels.find((item) => item.hotelId === hotelId)
    if (!hotel) return

    setRowCouponDialog({
      hotelId,
      hotelName: hotel.hotelName,
      roomOptions: normalizeRoomOptions(hotel.rooms),
      selectedRoomIds: [],
    })
  }

  const allSelected = normalizedHotels.length > 0 && normalizedHotels.every((hotel) => selectedHotelIds.includes(hotel.hotelId))
  const isBusy = applyingCoupon || removingCoupons
  const hasMessages = error || bulkError || localError || couponApplyResult || couponRemoveResult

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb />

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-600">Admin · Bulk Coupon Ops</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">Bulk Coupon Manage</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-stone-500">
              Bulk coupon apply aur remove ko dedicated page me shift kiya gaya hai. Isme `All Hotels` wala same master filter aur room-aware selection flow available hai.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshHotels}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        <div className="mb-6 rounded-[30px] border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-stone-400">Master Filter</p>
              <h2 className="mt-2 text-2xl font-black text-stone-900">Filter Hotels Like All Hotels Page</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-500">
                Bulk coupon manage page par bhi same `All Hotels` master filter keys available hain.
              </p>
            </div>
          <div className="flex flex-wrap items-center gap-3">
            <MasterFilter
              fields={filterFields}
              values={filterValues}
              loading={loading}
              initialActiveFieldKeys={['search', 'hotelId', 'hotelName', 'hotelEmail', 'city', 'state', 'isAccepted', 'onFront']}
              onChange={(key, value) => setFilterValues((current) => ({ ...current, [key]: value }))}
              onApply={() => dispatch(getHotelsByFilters(filterValues))}
              onReset={() => {
                setFilterValues(createEmptyFilters())
                dispatch(getAllHotels())
              }}
            />
          </div>
        </div>
        </div>

        {hasMessages && (
          <div className="mb-6 grid gap-3">
            {(error || bulkError || localError) && (
              <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                <span>{localError || bulkError || error}</span>
                <button type="button" onClick={clearMessages} className="text-rose-500 transition hover:text-rose-700">
                  <X size={15} />
                </button>
              </div>
            )}
            {couponApplyResult && <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700">{couponApplyResult.message}</div>}
            {couponRemoveResult && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">{couponRemoveResult.message}</div>}
          </div>
        )}

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-xl shadow-stone-200/40">
            <div className="border-b border-stone-100 px-6 py-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-violet-600">Bulk Apply</p>
              <h2 className="mt-2 text-2xl font-black text-stone-900">Apply Coupon to Selected Hotels</h2>
            </div>
            <div className="grid gap-5 px-6 py-6">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Coupon Code</p>
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="e.g. SUMMER20"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                />
              </div>

              <RoomSelector
                options={commonRoomOptions}
                selectedValues={selectedRoomIds}
                onToggle={toggleBulkRoom}
                title={selectedHotels.length > 1 ? 'Common Room IDs Across Selected Hotels' : 'Room IDs For Selected Hotel'}
                note={selectedHotels.length > 1 ? 'Selected hotels sab me jo same room IDs milte hain, wahi yahan dikhte hain.' : 'Single selected hotel ke room IDs yahan se choose kiye ja sakte hain.'}
              />

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleApplyCoupon(selectedHotelIds)}
                  disabled={applyingCoupon || selectedHotelIds.length === 0}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {applyingCoupon ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                  Apply Coupon
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoomIds([])}
                  className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
                >
                  Clear Rooms
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-xl shadow-stone-200/40">
            <div className="border-b border-stone-100 px-6 py-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-600">Bulk Remove</p>
              <h2 className="mt-2 text-2xl font-black text-stone-900">Remove Coupons from Selected Hotels</h2>
            </div>
            <div className="grid gap-5 px-6 py-6">
              <div className="rounded-[24px] border border-amber-200 bg-amber-50/80 px-5 py-5 text-sm font-semibold leading-6 text-amber-700">
                Selected hotel IDs ke active room offers aur coupons reset ho jayenge.
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCoupons(selectedHotelIds)}
                disabled={removingCoupons || selectedHotelIds.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-50"
              >
                {removingCoupons ? <Loader2 size={16} className="animate-spin" /> : <BadgePercent size={16} />}
                Remove Coupons
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-xl shadow-stone-200/40">
          <div className="flex flex-col gap-4 border-b border-stone-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900">Hotels Directory</h2>
                <p className="text-sm font-medium text-stone-500">{normalizedHotels.length} hotels</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {selectedHotelIds.length > 0 && (
                <div className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
                  {selectedHotelIds.length} selected
                </div>
              )}
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  {['', 'Hotel', 'Location', 'Email', 'Status', 'Rooms', 'Type', 'Action'].map((column) => (
                    <th key={column} className="whitespace-nowrap px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={8} className="px-6 py-5 text-sm font-semibold text-stone-400">Loading hotels...</td>
                    </tr>
                  ))
                ) : normalizedHotels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                        <Building2 size={28} />
                      </div>
                      <h3 className="mt-5 text-lg font-black text-stone-900">No hotels found</h3>
                      <p className="mt-2 text-sm font-medium text-stone-500">Try resetting filters and refresh the hotel directory.</p>
                    </td>
                  </tr>
                ) : (
                  normalizedHotels.map((hotel) => {
                    const isSelected = selectedHotelIds.includes(hotel.hotelId)
                    const isRowLoading = rowLoadingId === hotel.hotelId
                    return (
                      <tr key={hotel.hotelId} className={isSelected ? 'bg-violet-50/40' : 'hover:bg-stone-50/70'}>
                        <td className="px-6 py-4">
                          <button type="button" onClick={() => toggleHotel(hotel.hotelId)} className={`transition ${isSelected ? 'text-violet-600' : 'text-stone-400 hover:text-stone-700'}`}>
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-stone-900">{hotel.hotelName}</p>
                          <p className="mt-1 font-mono text-[11px] font-semibold text-stone-400">#{hotel.hotelId}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-stone-600">{[hotel.city, hotel.state].filter(Boolean).join(', ') || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-stone-500">{hotel.email || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${hotel.isAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{hotel.isAccepted ? 'Accepted' : 'Pending'}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${hotel.onFront ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'}`}>{hotel.onFront ? 'Front' : 'Back'}</span>
                            {hotel.soldOut && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">Sold Out</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-stone-700">{hotel.totalRooms || '0'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-stone-600">{hotel.propertyType || hotel.category || 'N/A'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRowApply(hotel.hotelId)}
                              disabled={isRowLoading || isBusy}
                              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-50"
                            >
                              {isRowLoading ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
                              Select Rooms
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                setRowLoadingId(hotel.hotelId)
                                try {
                                  await handleRemoveCoupons([hotel.hotelId])
                                } finally {
                                  setRowLoadingId(null)
                                }
                              }}
                              disabled={isRowLoading || isBusy}
                              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:pointer-events-none disabled:opacity-50"
                            >
                              {isRowLoading ? <Loader2 size={14} className="animate-spin" /> : <BadgePercent size={14} />}
                              Remove
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
        </div>

        {rowCouponDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-2xl shadow-stone-900/10">
              <div className="flex items-start justify-between border-b border-stone-100 px-6 py-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-violet-600">Single Hotel Coupon</p>
                  <h2 className="mt-2 text-2xl font-black text-stone-900">Select Rooms for {rowCouponDialog.hotelName}</h2>
                  <p className="mt-2 text-sm font-medium text-stone-500">Room select karoge to sirf un room IDs par coupon apply hoga. Blank chhodo to eligible rooms par apply ho jayega.</p>
                </div>
                <button type="button" onClick={() => setRowCouponDialog(null)} className="rounded-full border border-stone-200 bg-white p-2 text-stone-500 transition hover:bg-stone-50 hover:text-stone-800">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-5 px-6 py-6">
                <RoomSelector
                  options={rowCouponDialog.roomOptions}
                  selectedValues={rowCouponDialog.selectedRoomIds}
                  onToggle={(roomId) =>
                    setRowCouponDialog((current) => ({
                      ...current,
                      selectedRoomIds: current.selectedRoomIds.includes(roomId)
                        ? current.selectedRoomIds.filter((item) => item !== roomId)
                        : [...current.selectedRoomIds, roomId],
                    }))
                  }
                  title="Available Room IDs"
                  note="Aap multiple rooms choose kar sakte ho."
                />

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setRowCouponDialog(null)} className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setRowLoadingId(rowCouponDialog.hotelId)
                      try {
                        await handleApplyCoupon([rowCouponDialog.hotelId], rowCouponDialog.selectedRoomIds)
                        setRowCouponDialog(null)
                      } finally {
                        setRowLoadingId(null)
                      }
                    }}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                    Apply Coupon
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BulkCouponManage
