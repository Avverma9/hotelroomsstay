import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Building2,
  CheckSquare,
  ChevronDown,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Square,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import Breadcrumb from '../../../components/breadcrumb'
import MasterFilter from '../../../components/master-filter'
import { getAllHotels, getHotelsByFilters } from '../../../../redux/slices/admin/hotel'
import {
  bulkCreateHotels,
  bulkDeleteHotels,
  bulkUpdateHotels,
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
})

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

const parseBooleanField = (value) => {
  if (value === '') return undefined
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}

const defaultJson = `[
  {
    "hotelName": "Hotel Royal One",
    "city": "Jaipur",
    "state": "Rajasthan",
    "hotelEmail": "royalone@example.com",
    "propertyType": ["Hotel"],
    "rooms": []
  }
]`

const ACTIONS = [
  { id: 'update', label: 'Update Status', icon: ShieldCheck, accent: 'blue' },
  { id: 'create', label: 'Bulk Create', icon: Upload, accent: 'emerald' },
  { id: 'delete', label: 'Delete Hotel', icon: Trash2, accent: 'rose' },
]

const toneClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
}

const buttonClasses = {
  blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
  rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
}

const cardClasses = {
  rose: 'border-rose-200 bg-rose-50/70',
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 pr-10 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" />
    </div>
  )
}

function BulkManagement() {
  const dispatch = useDispatch()
  const { hotels, allHotels, loading, error } = useSelector((state) => state.hotel)
  const {
    creating,
    updating,
    deleting,
    error: bulkError,
    createResult,
    updateResult,
    deleteResult,
  } = useSelector((state) => state.bulk)

  const [filterValues, setFilterValues] = useState(createEmptyFilters)
  const [selectedHotelIds, setSelectedHotelIds] = useState([])
  const [activeActionId, setActiveActionId] = useState('update')
  const [actionConfig, setActionConfig] = useState({})
  const [rowLoadingId, setRowLoadingId] = useState(null)
  const [localError, setLocalError] = useState('')
  const autoFetchRef = useRef('')

  useEffect(() => {
    if (autoFetchRef.current === 'loaded') return
    autoFetchRef.current = 'loaded'
    dispatch(getAllHotels())
  }, [dispatch])

  const normalizedHotels = useMemo(() => hotels.map(normalizeHotel), [hotels])
  const sourceHotels = useMemo(() => (allHotels?.length ? allHotels : hotels).map(normalizeHotel), [allHotels, hotels])

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

  const refreshHotels = () => dispatch(getAllHotels())
  const clearMessages = () => {
    setLocalError('')
    dispatch(clearBulkStatus())
  }

  const toggleHotel = (hotelId) => {
    setSelectedHotelIds((current) =>
      current.includes(hotelId) ? current.filter((item) => item !== hotelId) : [...current, hotelId],
    )
  }

  const allSelected = normalizedHotels.length > 0 && normalizedHotels.every((hotel) => selectedHotelIds.includes(hotel.hotelId))

  const toggleAll = () => {
    const visibleIds = normalizedHotels.map((hotel) => hotel.hotelId)
    setSelectedHotelIds((current) =>
      allSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds])),
    )
  }

  const executeAction = async (hotelIds) => {
    setLocalError('')

    if (activeActionId === 'create') {
      let payload
      try {
        payload = JSON.parse(actionConfig.json || defaultJson)
      } catch {
        setLocalError('Invalid JSON payload. Valid array paste kijiye.')
        return
      }

      if (!Array.isArray(payload)) {
        setLocalError('JSON payload array hona chahiye.')
        return
      }

      await dispatch(bulkCreateHotels(payload)).unwrap()
      refreshHotels()
      return
    }

    if (activeActionId === 'update') {
      const payload = {
        hotelIds,
        isAccepted: parseBooleanField(actionConfig.isAccepted),
        onFront: parseBooleanField(actionConfig.onFront),
        soldOut: parseBooleanField(actionConfig.soldOut),
      }
      Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])
      await dispatch(bulkUpdateHotels(payload)).unwrap()
      refreshHotels()
      return
    }

    if (activeActionId === 'delete') {
      if (!window.confirm(`Permanently delete ${hotelIds.length} hotel(s)?`)) return
      await dispatch(bulkDeleteHotels({ hotelIds })).unwrap()
      setSelectedHotelIds((current) => current.filter((id) => !hotelIds.includes(id)))
      refreshHotels()
    }
  }

  const handleRowAction = async (hotelId) => {
    setRowLoadingId(hotelId)
    try {
      await executeAction([hotelId])
    } finally {
      setRowLoadingId(null)
    }
  }

  const handleBulkAction = async () => {
    if (activeActionId === 'create') {
      await executeAction([])
      return
    }

    if (selectedHotelIds.length === 0) {
      setLocalError('Select at least one hotel first.')
      return
    }

    await executeAction(selectedHotelIds)
  }

  const activeAction = ACTIONS.find((action) => action.id === activeActionId)
  const isBusy = creating || updating || deleting
  const hasMessages = error || bulkError || localError || createResult || updateResult || deleteResult

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb />

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">Admin · Bulk Operations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">Bulk Hotel Management</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-stone-500">
              Yeh page ab sirf hotel create, status update, aur delete operations ke liye dedicated hai.
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
                Yahi same filter keys use ho rahi hain jo `All Hotels` page par available hain.
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
            {createResult && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{createResult.message}</div>}
            {updateResult && <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{updateResult.message}</div>}
            {deleteResult && <div className="rounded-2xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm font-bold text-stone-700">{deleteResult.message}</div>}
          </div>
        )}

        <div className="mb-6 overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-xl shadow-stone-200/40">
          <div className="flex flex-col gap-5 border-b border-stone-100 px-6 py-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-stone-400">Select Action</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {ACTIONS.map((action) => {
                  const active = activeActionId === action.id
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => setActiveActionId(action.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                        active ? toneClasses[action.accent] : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <action.icon size={15} />
                      {action.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="min-w-[220px] rounded-[26px] border border-stone-200 bg-stone-50 px-5 py-5">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-stone-400">
                {activeAction.id === 'create' ? 'Run Action' : `Apply To ${selectedHotelIds.length} Selected`}
              </p>
              <button
                type="button"
                onClick={handleBulkAction}
                disabled={isBusy}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition disabled:pointer-events-none disabled:opacity-50 ${buttonClasses[activeAction.accent]}`}
              >
                {isBusy ? <Loader2 size={16} className="animate-spin" /> : <activeAction.icon size={16} />}
                {isBusy ? 'Running...' : activeAction.id === 'create' ? 'Bulk Create' : `Run: ${activeAction.label}`}
              </button>
            </div>
          </div>

          <div className="grid gap-5 px-6 py-6 lg:grid-cols-3">
            {activeAction.id === 'update' && (
              <>
                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Accepted</p>
                  <SelectField value={actionConfig.isAccepted || ''} onChange={(event) => setActionConfig((current) => ({ ...current, isAccepted: event.target.value }))} placeholder="Unchanged" options={[{ value: 'true', label: 'Set Accepted' }, { value: 'false', label: 'Set Pending' }]} />
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">On Front</p>
                  <SelectField value={actionConfig.onFront || ''} onChange={(event) => setActionConfig((current) => ({ ...current, onFront: event.target.value }))} placeholder="Unchanged" options={[{ value: 'true', label: 'Show on Front' }, { value: 'false', label: 'Remove from Front' }]} />
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Sold Out</p>
                  <SelectField value={actionConfig.soldOut || ''} onChange={(event) => setActionConfig((current) => ({ ...current, soldOut: event.target.value }))} placeholder="Unchanged" options={[{ value: 'true', label: 'Mark Sold Out' }, { value: 'false', label: 'Mark Live' }]} />
                </div>
              </>
            )}

            {activeAction.id === 'create' && (
              <div className="lg:col-span-3">
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">JSON Payload Array</p>
                <textarea value={actionConfig.json || defaultJson} onChange={(event) => setActionConfig((current) => ({ ...current, json: event.target.value }))} rows={6} className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 font-mono text-xs font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
              </div>
            )}

            {activeAction.id === 'delete' && (
              <div className={`rounded-[24px] border px-5 py-5 text-sm font-semibold leading-6 ${cardClasses.rose}`}>
                Permanent delete operation hai. Run karne se pehle confirmation dialog aayega.
              </div>
            )}
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
                <div className={`rounded-full border px-3 py-1.5 text-xs font-black ${toneClasses[activeAction.accent]}`}>
                  {selectedHotelIds.length} selected
                </div>
              )}
              <button type="button" onClick={toggleAll} className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
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
                      <tr key={hotel.hotelId} className={isSelected ? 'bg-blue-50/40' : 'hover:bg-stone-50/70'}>
                        <td className="px-6 py-4">
                          <button type="button" onClick={() => toggleHotel(hotel.hotelId)} className={`transition ${isSelected ? 'text-blue-600' : 'text-stone-400 hover:text-stone-700'}`}>
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
                          <button type="button" onClick={() => handleRowAction(hotel.hotelId)} disabled={isRowLoading || isBusy} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition disabled:pointer-events-none disabled:opacity-50 ${buttonClasses[activeAction.accent]}`}>
                            {isRowLoading ? <Loader2 size={14} className="animate-spin" /> : <activeAction.icon size={14} />}
                            {isRowLoading ? 'Running...' : 'Take Action'}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {normalizedHotels.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50/70 px-6 py-4 text-sm md:flex-row md:items-center md:justify-between">
              <p className="font-semibold text-stone-500">
                {normalizedHotels.length} hotels visible{selectedHotelIds.length > 0 ? ` · ${selectedHotelIds.length} selected` : ''}
              </p>
              <div className="inline-flex items-center gap-2 font-semibold text-stone-500">
                <Zap size={13} />
                Active action: <span className="font-black text-stone-800">{activeAction.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkManagement
