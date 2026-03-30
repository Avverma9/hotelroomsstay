import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  PencilLine,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import Breadcrumb from '../../../components/breadcrumb'
import {
  clearHotelUpdateStatus,
  getHotelById,
  updateHotelInfo,
} from '../../../../redux/slices/admin/hotel'

// ─── Helpers ────────────────────────────────────────────────────────────────

const s = (v) => String(v ?? '').trim()

const createHotelForm = (hotel) => {
  const basicInfo = hotel?.basicInfo || {}
  const location  = basicInfo?.location  || {}
  const contacts  = basicInfo?.contacts  || {}

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
    hotelName:    basicInfo?.name   || hotel?.hotelName || '',
    city:         location?.city    || hotel?.city      || '',
    state:        location?.state   || hotel?.state     || '',
    address:      location?.address || hotel?.address   || '',
    pinCode:      location?.pinCode || hotel?.pinCode   || '',
    starRating:   String(basicInfo?.starRating || hotel?.starRating || ''),
    propertyType: propertyType.join(', '),
    hotelEmail:   contacts?.email   || hotel?.hotelEmail || hotel?.email || '',
    phone:        contacts?.phone   || hotel?.phone      || '',
    owner:        basicInfo?.owner  || hotel?.owner      || '',
    description:  basicInfo?.description || hotel?.description || '',
    onFront:      Boolean(hotel?.onFront),
    isAccepted:   Boolean(hotel?.isAccepted),
  }
}

/**
 * Normalize a raw room document into a flat form-friendly shape.
 */
const normalizeRoom = (room, index = 0) => {
  // Handle amenities - convert to comma-separated string for form display
  let amenitiesStr = ''
  if (Array.isArray(room?.amenities)) {
    amenitiesStr = room.amenities.join(', ')
  } else if (typeof room?.amenities === 'string') {
    amenitiesStr = room.amenities
  }

  // Handle images - convert to comma-separated string for form display
  let imagesStr = ''
  if (Array.isArray(room?.images)) {
    imagesStr = room.images.join(', ')
  } else if (typeof room?.images === 'string') {
    imagesStr = room.images
  }

  // Handle nested API response structure (getHotelsById) vs flat DB structure
  const price      = room?.pricing?.basePrice ?? room?.price      ?? room?.originalPrice ?? 0
  const countRooms = room?.inventory?.total   ?? room?.countRooms ?? room?.totalRooms    ?? 0
  const isOffer    = room?.features?.isOffer  ?? room?.isOffer    ?? false
  const offerName  = room?.features?.offerText ?? room?.offerName ?? room?.offerText     ?? ''
  // roomId: prefer roomId field, then id from API mapping (server sets id = roomId)
  const roomId     = room?.roomId || room?.id || ''

  return {
    // Use _id as the stable key for edit/delete operations
    _id:            room?._id || room?.id || `room-${index}`,
    roomId,
    name:           room?.name  || room?.type || `Room ${index + 1}`,
    type:           room?.type  || room?.name || `Room ${index + 1}`,
    bedType:        room?.bedType || room?.bedTypes || '',
    price:          String(price),
    countRooms:     String(countRooms),
    totalRooms:     String(countRooms),
    description:    room?.description || '',
    amenities:      amenitiesStr,
    images:         imagesStr,
    isOffer,
    offerName,
  }
}

const createEmptyRoomForm = () => ({
  // roomId intentionally absent for new rooms — backend generates it
  type:           '',
  bedType:        '',
  price:          '',
  countRooms:     '',
  description:    '',
  amenities:      '',
  images:         '',
  isOffer:        false,
  offerName:      '',
})

/**
 * Build the hotel-level basic info payload (no rooms key).
 */
const buildHotelPayload = (form) => ({
  hotelName:    s(form.hotelName),
  city:         s(form.city),
  state:        s(form.state),
  address:      s(form.address),
  pinCode:      s(form.pinCode),
  starRating:   s(form.starRating),
  propertyType: s(form.propertyType).split(',').map((v) => v.trim()).filter(Boolean),
  hotelEmail:   s(form.hotelEmail),
  phone:        s(form.phone),
  owner:        s(form.owner),
  description:  s(form.description),
  onFront:      form.onFront,
  isAccepted:   form.isAccepted,
})

/**
 * Build a single-room entry for the `rooms` array in the master payload.
 * Pass roomId only when updating an existing room.
 */
const buildRoomEntry = (form, existingRoomId = null) => {
  // Handle amenities - could be string or array
  let amenitiesArr = []
  if (Array.isArray(form.amenities)) {
    amenitiesArr = form.amenities
  } else if (typeof form.amenities === 'string' && form.amenities.trim()) {
    amenitiesArr = form.amenities.split(',').map((v) => v.trim()).filter(Boolean)
  }

  // Handle images - could be string or array
  let imagesArr = []
  if (Array.isArray(form.images)) {
    imagesArr = form.images
  } else if (typeof form.images === 'string' && form.images.trim()) {
    imagesArr = form.images.split(',').map((v) => v.trim()).filter(Boolean)
  }

  const entry = {
    type:        s(form.type),
    name:        s(form.type) || s(form.name),
    bedType:     s(form.bedType),
    bedTypes:    s(form.bedType),
    price:       Number(form.price) || 0,
    countRooms:  Number(form.countRooms) || 1,
    totalRooms:  Number(form.countRooms) || 1,
    description: s(form.description),
    amenities:   amenitiesArr,
    images:      imagesArr,
    isOffer:     Boolean(form.isOffer),
    offerName:   s(form.offerName),
  }
  if (existingRoomId) entry.roomId = existingRoomId
  return entry
}

// ─── Component ───────────────────────────────────────────────────────────────

function HotelEditPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { id }    = useParams()

  const {
    selectedHotel,
    loading,
    updating,
    error,
    updateSuccess,
  } = useSelector((state) => state.hotel)

  const [hotelForm,     setHotelForm]     = useState(() => createHotelForm(null))
  const [roomForm,      setRoomForm]      = useState(createEmptyRoomForm)
  const [editingRoomId, setEditingRoomId] = useState(null) // _id (local key) of room being edited
  const [rooms,         setRooms]         = useState(() => [])
  const [deletedRoomIds, setDeletedRoomIds] = useState(() => [])

  const hotel           = selectedHotel?.data || selectedHotel
  const displayHotelId  = id || hotel?.hotelId || hotel?._id
  const hotelImage      = hotel?.basicInfo?.images?.[0] || hotel?.images?.[0] || ''
  const listPath        =
    location.state?.from ||
    (location.pathname.startsWith('/your-hotels') ? '/your-hotels' : '/hotels')

  // Derive rooms straight from the hotel document — no separate rooms state needed
  const normalizedRooms = useMemo(
    () => (Array.isArray(hotel?.rooms) ? hotel.rooms.map(normalizeRoom) : []),
    [hotel?.rooms],
  )

  // Local staging area for rooms — initialize from normalizedRooms when hotel loads
  useEffect(() => {
    setRooms(normalizedRooms)
  }, [normalizedRooms])

  // ── Load hotel ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) dispatch(getHotelById(id))
  }, [dispatch, id])

  // ── Sync form when hotel loads ──────────────────────────────────────────
  useEffect(() => {
    if (hotel) setHotelForm(createHotelForm(hotel))
  }, [hotel])

  // ── Auto-clear success banner ───────────────────────────────────────────
  useEffect(() => {
    if (!updateSuccess) return
    const t = setTimeout(() => dispatch(clearHotelUpdateStatus()), 2800)
    return () => clearTimeout(t)
  }, [dispatch, updateSuccess])

  // ── Field setters ───────────────────────────────────────────────────────
  const setHotelField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setHotelForm((prev) => ({ ...prev, [key]: value }))
  }

  const setRoomField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setRoomForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── Reset room editor ───────────────────────────────────────────────────
  const resetRoomEditor = () => {
    setEditingRoomId(null)
    setRoomForm(createEmptyRoomForm())
  }

  // ── Save hotel basic info ───────────────────────────────────────────────
  const saveHotel = async (event) => {
    if (event?.preventDefault) event.preventDefault()
    if (!displayHotelId) return
    const hotelPayload = buildHotelPayload(hotelForm)

    // Build rooms payload from staged rooms and deletions
    const roomsPayload = rooms.map((r) => buildRoomEntry(r, r.roomId || null))
    const deletionPayload = deletedRoomIds.map((id) => ({ roomId: id, _delete: true }))
    const hotelData = { ...hotelPayload, rooms: [...roomsPayload, ...deletionPayload] }

    try {
      await dispatch(
        updateHotelInfo({
          hotelId:   displayHotelId,
          hotelData,
        }),
      ).unwrap()
      // clear staged deletions after successful sync
      setDeletedRoomIds([])
      dispatch(getHotelById(displayHotelId))
    } catch (err) {
      console.error('saveHotel failed', err)
    }
  }

  // ── Save room locally (add or update) — staging only, no API call ─────
  const saveRoomLocal = (event) => {
    if (event?.preventDefault) event.preventDefault()

    const makeRoomObject = (existingId) => {
      // When editing, preserve the original roomId from the existing room
      const existingRoom = existingId ? rooms.find((r) => r._id === existingId) : null
      return {
        _id: existingId || `room-temp-${Date.now()}`,
        roomId: existingRoom?.roomId || '', // Preserve existing roomId for updates
        name: roomForm.type || `Room ${rooms.length + 1}`,
        type: roomForm.type,
        bedType: roomForm.bedType,
        price: String(roomForm.price ?? ''),
        countRooms: String(roomForm.countRooms ?? ''),
        totalRooms: String(roomForm.countRooms ?? ''),
        description: roomForm.description,
        amenities: roomForm.amenities,
        images: roomForm.images,
        isOffer: roomForm.isOffer,
        offerName: roomForm.offerName,
      }
    }

    if (editingRoomId) {
      const updated = rooms.map((r) => (r._id === editingRoomId ? { ...r, ...makeRoomObject(editingRoomId) } : r))
      setRooms(updated)
    } else {
      setRooms((prev) => [...prev, makeRoomObject(null)])
    }

    resetRoomEditor()
  }

  // ── Delete room locally (mark server-side ids for deletion on save) ────
  const handleRoomDelete = (room) => {
    const { _id, roomId } = room || {}
    if (!_id) return
    if (!window.confirm('Delete this room from the hotel?')) return

    if (roomId) setDeletedRoomIds((prev) => [...prev, roomId])
    setRooms((prev) => prev.filter((r) => r._id !== _id))

    if (editingRoomId === _id) resetRoomEditor()
  }

  // ── Open room in editor ─────────────────────────────────────────────────
  const handleRoomEdit = (room) => {
    setEditingRoomId(room._id)
    setRoomForm({
      type:        room.type,
      bedType:     room.bedType,
      price:       room.price,
      countRooms:  room.countRooms,
      description: room.description,
      amenities:   room.amenities,
      images:      room.images,
      isOffer:     room.isOffer,
      offerName:   room.offerName,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Loading / error screens ─────────────────────────────────────────────
  if (loading && !hotel) {
    return (
      <div className="mx-auto max-w-7xl bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="rounded-[28px] border border-stone-200 bg-white px-6 py-16 text-center text-sm font-semibold text-stone-500">
          Loading edit hotel workspace...
        </div>
      </div>
    )
  }

  if (error && !hotel) {
    return (
      <div className="mx-auto max-w-7xl bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-16 text-center text-sm font-semibold text-rose-700">
          {error}
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="mx-auto max-w-7xl bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="rounded-[28px] border border-stone-200 bg-white px-6 py-16 text-center text-sm font-semibold text-stone-500">
          Hotel not found.
        </div>
      </div>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb />

      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">Hotel Workspace</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">Edit Hotel & Rooms</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-500">
              Hotel profile, rooms, amenities aur policies — sab ek hi page se manage karo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(`${listPath}/${displayHotelId}`, { state: { from: listPath } })}
            className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
          >
            View Details
          </button>
          <button
            type="button"
            onClick={saveHotel}
            disabled={updating}
            className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-stone-900/10 transition hover:bg-stone-800 disabled:pointer-events-none disabled:opacity-50"
          >
            {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Hotel
          </button>
        </div>
      </div>

      {/* ── Banners ── */}
      {(updateSuccess || error) && (
        <div className="mb-6 grid gap-3">
          {updateSuccess && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {updateSuccess}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

        {/* ── Hotel basic info form ── */}
        <form
          id="hotel-edit-form"
          onSubmit={saveHotel}
          className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-xl shadow-stone-200/50"
        >
          <div className="border-b border-stone-100 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_55%,#f5f5f4_100%)] px-6 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-stone-400">Hotel Profile</p>
                <h2 className="mt-2 text-2xl font-black text-stone-900">{hotelForm.hotelName || 'Unnamed Hotel'}</h2>
                <p className="mt-2 text-sm font-semibold text-stone-500">
                  ID: {displayHotelId} {hotelForm.city ? `• ${hotelForm.city}` : ''}
                </p>
              </div>
              {hotelImage ? (
                <img src={hotelImage} alt={hotelForm.hotelName || 'Hotel'} className="h-24 w-32 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="flex h-24 w-32 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                  <Building2 size={28} />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
            {[
              { label: 'Hotel Name',  key: 'hotelName',  required: true },
              { label: 'Hotel Email', key: 'hotelEmail', required: true, type: 'email' },
              { label: 'City',        key: 'city',       required: true },
              { label: 'State',       key: 'state',      required: true },
            ].map(({ label, key, required, type = 'text' }) => (
              <label key={key} className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">{label}</span>
                <input required={required} type={type} value={hotelForm[key]} onChange={setHotelField(key)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
              </label>
            ))}

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Address</span>
              <input value={hotelForm.address} onChange={setHotelField('address')} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>

            {[
              { label: 'Pin Code',    key: 'pinCode' },
              { label: 'Star Rating', key: 'starRating', type: 'number', min: '0', max: '5' },
              { label: 'Owner',       key: 'owner' },
              { label: 'Phone',       key: 'phone' },
            ].map(({ label, key, type = 'text', min, max }) => (
              <label key={key} className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">{label}</span>
                <input type={type} min={min} max={max} value={hotelForm[key]} onChange={setHotelField(key)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
              </label>
            ))}

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Property Type</span>
              <input value={hotelForm.propertyType} onChange={setHotelField('propertyType')} placeholder="Hotel, Resort" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Description</span>
              <textarea value={hotelForm.description} onChange={setHotelField('description')} rows={5} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </label>
          </div>

          <div className="border-t border-stone-100 px-6 py-5">
            <div className="flex flex-wrap gap-4 rounded-3xl bg-stone-50 px-4 py-4">
              {[
                { label: 'Show on front', key: 'onFront' },
                { label: 'Accepted',      key: 'isAccepted' },
              ].map(({ label, key }) => (
                <label key={key} className="inline-flex items-center gap-3 text-sm font-bold text-stone-700">
                  <input type="checkbox" checked={hotelForm[key]} onChange={setHotelField(key)} className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500" />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </form>

        {/* ── Right column: stats + room editor ── */}
        <div className="space-y-6">

          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-lg shadow-stone-200/40">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-stone-400">Location</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><MapPin size={20} /></div>
                <div>
                  <p className="text-lg font-black text-stone-900">{hotelForm.city || 'Unknown City'}</p>
                  <p className="text-sm font-medium text-stone-500">{hotelForm.state || 'State pending'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-lg shadow-stone-200/40">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-stone-400">Rooms</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><BedDouble size={20} /></div>
                <div>
                  <p className="text-lg font-black text-stone-900">{rooms.length}</p>
                  <p className="text-sm font-medium text-stone-500">Managed room entries</p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-lg shadow-stone-200/40">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-stone-400">Status</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-700"><CheckCircle2 size={20} /></div>
                <div>
                  <p className="text-lg font-black text-stone-900">{hotelForm.isAccepted ? 'Accepted' : 'Pending'}</p>
                  <p className="text-sm font-medium text-stone-500">{hotelForm.onFront ? 'Front listed' : 'Hidden from front'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Room editor ── */}
          <form
            onSubmit={saveRoomLocal}
            className="overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-xl shadow-stone-200/50"
          >
            <div className="border-b border-stone-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)] px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-600">Room Manager</p>
                  <h2 className="mt-2 text-xl font-black text-stone-900">
                    {editingRoomId ? 'Update Room' : 'Add New Room'}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-stone-500">
                    {editingRoomId
                      ? `Editing room: ${editingRoomId}`
                      : 'Naya room add karo — ID backend khud generate karega.'}
                  </p>
                </div>
                {editingRoomId && (
                  <button type="button" onClick={resetRoomEditor} className="rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Room Type</span>
                  <input required value={roomForm.type} onChange={setRoomField('type')} placeholder="Deluxe Room" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Bed Type</span>
                  <input value={roomForm.bedType} onChange={setRoomField('bedType')} placeholder="King Bed" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Price (₹)</span>
                  <input type="number" min="0" value={roomForm.price} onChange={setRoomField('price')} placeholder="2999" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Total Rooms</span>
                  <input type="number" min="1" value={roomForm.countRooms} onChange={setRoomField('countRooms')} placeholder="10" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Amenities</span>
                  <input value={roomForm.amenities} onChange={setRoomField('amenities')} placeholder="WiFi, AC, Breakfast" className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Image URLs</span>
                  <input value={roomForm.images} onChange={setRoomField('images')} placeholder="https://..., https://..." className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Description</span>
                  <textarea value={roomForm.description} onChange={setRoomField('description')} rows={4} placeholder="Room summary for guests and ops team." className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                </label>
              </div>

              {/* Offer toggle */}
              <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-3 text-sm font-bold text-stone-700">
                    <input type="checkbox" checked={roomForm.isOffer} onChange={setRoomField('isOffer')} className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500" />
                    Offer active
                  </label>
                  <input value={roomForm.offerName} onChange={setRoomField('offerName')} placeholder="Flat 20% off" className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 sm:max-w-xs" />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={resetRoomEditor} className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50">
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {updating ? <Loader2 size={16} className="animate-spin" /> : editingRoomId ? <PencilLine size={16} /> : <Plus size={16} />}
                  {editingRoomId ? 'Update (local)' : 'Add (local)'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── Room inventory list ── */}
      <div className="mt-6 overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-xl shadow-stone-200/50">
        <div className="flex flex-col gap-3 border-b border-stone-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-stone-400">Room Inventory</p>
            <h2 className="mt-2 text-2xl font-black text-stone-900">Existing Rooms</h2>
          </div>
          {updating && (
            <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600">
              <Loader2 size={14} className="animate-spin" />
              Syncing...
            </div>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <BedDouble size={28} />
            </div>
            <h3 className="mt-5 text-lg font-black text-stone-900">No rooms found</h3>
            <p className="mt-2 text-sm font-medium text-stone-500">
              Is hotel ke liye abhi room list empty hai. Upar se pehla room add kar sakte ho.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 px-6 py-6">
            {rooms.map((room) => (
              <div
                key={room._id}
                className={`rounded-[26px] border px-5 py-5 transition ${
                  editingRoomId === room._id
                    ? 'border-blue-300 bg-blue-50/70 shadow-lg shadow-blue-100/60'
                    : 'border-stone-200 bg-stone-50/50 hover:border-stone-300 hover:bg-white'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-stone-500">
                        {room.roomId || 'No ID'}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-600">
                        {room.type}
                      </span>
                      {room.isOffer && room.offerName && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          {room.offerName}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-stone-900">{room.name}</h3>
                      <p className="mt-1 text-sm font-medium text-stone-500">{room.bedType || 'Bed type not added'}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm font-semibold text-stone-600">
                      <span className="rounded-2xl bg-white px-3 py-2">₹ {room.price || '0'}</span>
                      <span className="rounded-2xl bg-white px-3 py-2">Rooms: {room.countRooms || '0'}</span>
                    </div>
                    {room.description && (
                      <p className="max-w-3xl text-sm leading-6 text-stone-600">{room.description}</p>
                    )}
                  </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoomEdit(room)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-100"
                      >
                        <PencilLine size={15} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoomDelete(room)}
                        disabled={updating}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HotelEditPage