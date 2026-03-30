import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  BadgeCheck,
  BedDouble,
  CalendarDays,
  ChevronLeft,
  CirclePercent,
  Clock3,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  UserRound,
  Utensils,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../../components/breadcrumb'
import { getHotelById } from '../../../redux/slices/admin/hotel'
import {
  applyCoupon,
  clearAppliedCouponState,
  selectAdminCoupon,
} from '../../../redux/slices/admin/coupon'
import { getGST } from '../../../redux/slices/admin/gst'
import { getSelectedGuest, getSelectedHotel } from '../../utils/booking-storage'
import { createBooking } from '../../../redux/slices/pms/bookings'
import { formatCurrency, formatDateInput as formatDateForInput } from '../../utils/format'


// ─── Helpers ────────────────────────────────────────────────────────────────


const getNightCount = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0
  const start = new Date(checkInDate)
  const end = new Date(checkOutDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
}


/**
 * FIX 1: Unwrap the API response properly.
 * API returns { success, data: { ... } } so we must dig into `.data`.
 * Also handles direct hotel objects and nested `.hotel` key.
 */
const getDetailPayload = (payload) => payload?.data || payload?.hotel || payload || {}


const getImage = (hotel) => {
  const imageList = hotel?.basicInfo?.images || hotel?.images
  if (Array.isArray(imageList) && imageList[0]) return imageList[0]
  return hotel?.image || ''
}


const getRoomList = (hotel) => {
  const roomSource =
    hotel?.rooms ||
    hotel?.roomDetails ||
    hotel?.roomTypes ||
    hotel?.roomsDetails ||
    []


  if (Array.isArray(roomSource) && roomSource.length > 0) {
    return roomSource.map((room, index) => ({
      id: room?._id || room?.id || `${room?.type || room?.name || 'room'}-${index}`,
      name: room?.type || room?.name || `Room ${index + 1}`,
      bedTypes: room?.bedTypes || room?.bedType || room?.beds || 'Standard',
      price: Number(room?.pricing?.finalPrice || room?.pricing?.basePrice || room?.price || 0),
      basePrice: Number(room?.pricing?.basePrice || room?.basePrice || room?.price || 0),
      taxPercent: Number(room?.pricing?.taxPercent || 0),
      taxAmount: Number(room?.pricing?.taxAmount || 0),
      displayPrice: room?.pricing?.displayPrice || '',
      description: room?.description || room?.about || '',
      amenities: room?.amenities || [],
      features: room?.features || {},
      images: room?.images || [],
      inventory: room?.inventory || {},
    }))
  }


  return [
    {
      id: 'default-room',
      name: hotel?.roomType || 'Standard Room',
      bedTypes: hotel?.bedTypes || 'Double Bed',
      price: Number(hotel?.price || hotel?.startingPrice || 0),
      basePrice: Number(hotel?.price || hotel?.startingPrice || 0),
      taxPercent: 0,
      taxAmount: 0,
      displayPrice: '',
      description: 'Comfortable stay setup for your guest.',
      amenities: hotel?.amenities || [],
      features: {},
      images: [],
      inventory: {},
    },
  ]
}


const getFoodList = (hotel) => {
  const foodSource =
    hotel?.foods ||
    hotel?.foodOptions ||
    hotel?.foodDetails ||
    hotel?.meals ||
    []


  if (Array.isArray(foodSource) && foodSource.length > 0) {
    return foodSource.map((food, index) => ({
      id: food?._id || food?.id || `${food?.name || 'food'}-${index}`,
      name: food?.name || food?.title || `Meal ${index + 1}`,
      price: Number(food?.price || food?.amount || 0),
      displayPrice: food?.displayPrice || '',
      description: food?.description || food?.details || '',
      type: food?.type || food?.category || 'Meal',
      images: food?.images || [],
    }))
  }


  return [
    {
      id: 'complimentary-breakfast',
      name: 'Breakfast',
      price: 0,
      displayPrice: '',
      description: 'Complimentary breakfast or pay-at-hotel meal plan.',
      type: 'Meal',
      images: [],
    },
  ]
}


const getAmenityList = (amenities) => {
  if (!Array.isArray(amenities)) return []
  return amenities.flatMap((item) => {
    if (typeof item === 'string') return [item]
    if (Array.isArray(item?.amenities)) return item.amenities.map((a) => a?.name || a).filter(Boolean)
    if (item?.name) return [item.name]
    if (item?.label) return [item.label]
    return []
  })
}


const getRuleList = (rules) => {
  if (!Array.isArray(rules)) return []
  return rules.map((rule) => {
    if (typeof rule === 'string') return rule
    if (rule?.name) return rule.name
    if (rule?.label) return rule.label
    return JSON.stringify(rule)
  })
}


// ─── Component ──────────────────────────────────────────────────────────────


function BookHotel() {
  const dispatch = useDispatch()
  const navigate = useNavigate()


  const storedGuest = useMemo(() => getSelectedGuest(), [])
  const storedHotel = useMemo(() => getSelectedHotel(), [])


  const { selectedHotel, loading, error } = useSelector((state) => state.hotel)
  const { selectedGST } = useSelector((state) => state.adminGst)


  const [checkInDate, setCheckInDate] = useState(() => formatDateForInput(new Date()))
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDateForInput(tomorrow)
  })
  const [numRooms, setNumRooms] = useState(1)
  const [numGuests, setNumGuests] = useState(1)
  const [couponCode, setCouponCode] = useState('')
  const [couponType, setCouponType] = useState('user')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [bookingResponse, setBookingResponse] = useState(null)

  const { user } = useSelector((state) => state.auth)
  const { loading: pmsLoading, error: pmsError } = useSelector((state) => state.pms)
  const {
    applying: couponApplying,
    applyError: couponApplyError,
    applyMessage: couponApplyMessage,
    appliedCoupon,
  } = useSelector(selectAdminCoupon)

  const handleBooking = () => {
    if (!storedGuest || !hotelData) return;

    const bookingData = {
      checkInDate,
      checkOutDate,
      guests: numGuests,
      guestDetails: {
        fullName: storedGuest.userName,
        mobile: storedGuest.mobile,
        email: storedGuest.email,
      },
      user: {
        userId: storedGuest.userId,
        name: storedGuest.userName,
        mobile: storedGuest.mobile,
        email: storedGuest.email,
      },
      hotelDetails: {
        hotelId: hotelData?.hotelId || hotelData?._id,
        hotelName: basicInfo?.name,
        hotelEmail: contacts?.email,
        hotelCity: location?.city,
        hotelOwnerName: basicInfo?.owner,
      },
      numRooms,
      foodDetails: [],
      roomDetails: [
        {
          roomId: selectedRoom.id,
          type: selectedRoom.name,
          bedTypes: selectedRoom.bedTypes,
          price: selectedRoom.price,
        },
      ],
      pm: 'offline',
      isPartialBooking: false,
      partialAmount: 0,
      bookingStatus: 'Confirmed',
      createdBy: {
        user: user.name,
        email: user.email,
      },
      couponCode: appliedCoupon ? couponCode : '',
      discountPrice: appliedCoupon?.discountPrice || 0,
      gstPrice: gstAmount,
      price: grandTotal,
      bookingSource: 'Panel',
      destination: location?.city,
    };

    dispatch(
      createBooking({
        userId: storedGuest.userId,
        hotelId: hotelData.hotelId || hotelData._id,
        bookingData,
      })
    ).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
            setBookingResponse(result.payload.data);
            setShowSuccessPopup(true);
        }
    });
  };

  const handleApplyCoupon = async () => {
    const trimmedCouponCode = String(couponCode || '').trim()
    if (!trimmedCouponCode || !selectedRoom) return

    await dispatch(
      applyCoupon({
        couponType,
        couponCode: trimmedCouponCode,
        hotelId: hotelData.hotelId || hotelData._id,
        hotelIds: [hotelData.hotelId || hotelData._id].filter(Boolean),
        roomId: selectedRoom.id,
        userId: storedGuest.userId,
      }),
    )
  }


  // ── Fetch hotel on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const hotelIdentifier =
      storedHotel?.hotelId || storedHotel?.id || storedHotel?.raw?.hotelId || storedHotel?.raw?._id
    if (hotelIdentifier) dispatch(getHotelById(hotelIdentifier))
  }, [dispatch, storedHotel])


  /**
   * FIX 2: Improved hotelData derivation.
   *
   * The Redux `selectedHotel` might be the raw API response { success, data }
   * or already unwrapped. `getDetailPayload` handles both via `payload?.data`.
   *
   * Previously the condition `selectedHotel?._id || selectedHotel?.hotelId`
   * would FAIL when the Redux state stores the full API envelope
   * { success: true, data: { _id: "...", ... } } because `_id` lives
   * inside `.data`, not at the top level.
   *
   * Now we also check `selectedHotel?.data?._id` and `selectedHotel?.success`
   * so the fetched data is actually used.
   */
  const hotelData = useMemo(
    () =>
      getDetailPayload(
        selectedHotel?._id || selectedHotel?.hotelId || selectedHotel?.data?._id || selectedHotel?.success
          ? selectedHotel
          : storedHotel?.raw || storedHotel,
      ),
    [selectedHotel, storedHotel],
  )


  const basicInfo        = hotelData?.basicInfo || {}
  const location         = basicInfo?.location || {}
  const contacts         = basicInfo?.contacts || {}
  const pricingOverview  = hotelData?.pricingOverview || {}
  const policies         = hotelData?.policies || {}
  const detailedPolicies = policies?.detailed || {}
  const restrictions     = policies?.restrictions || {}
  const gstConfig        = hotelData?.gstConfig || null


  const roomList  = useMemo(() => getRoomList(hotelData), [hotelData])
  const foodList  = useMemo(() => getFoodList(hotelData), [hotelData])
  const amenities = useMemo(() => getAmenityList(hotelData?.amenities), [hotelData])
  const ruleList  = useMemo(() => getRuleList(policies?.rules), [policies?.rules])


  const selectedRoom = useMemo(
    () => roomList.find((r) => r.id === selectedRoomId) || roomList[0] || null,
    [roomList, selectedRoomId],
  )


  // ── Pricing calculation ───────────────────────────────────────────────────
  const nightCount   = getNightCount(checkInDate, checkOutDate)
  const subtotal     = (selectedRoom?.price || 0) * Number(numRooms || 1) * (nightCount || 1)
  const appliedDiscount = Number(appliedCoupon?.discountPrice || 0)
  const discountedSubtotal = Math.max(0, subtotal - appliedDiscount)
  const matchedGST   = String(selectedGST?.type || '').toLowerCase() === 'hotel' ? selectedGST : null
  const gstPercent   = Number(matchedGST?.gstPrice || 0)
  const gstAmount    = Math.round((discountedSubtotal * gstPercent) / 100)
  const grandTotal   = discountedSubtotal + gstAmount


  const guestLabel = storedGuest?.isExistingUser
    ? storedGuest?.userName || storedGuest?.mobile || 'Guest'
    : storedGuest?.mobile || 'Guest'


  // Fetch GST when subtotal changes
  useEffect(() => {
    if (discountedSubtotal <= 0) return
    dispatch(getGST({ type: 'Hotel', gstThreshold: discountedSubtotal }))
  }, [dispatch, discountedSubtotal])

  useEffect(() => {
    dispatch(clearAppliedCouponState())
  }, [dispatch, couponType, selectedRoom?.id, hotelData?.hotelId, hotelData?._id, storedGuest?.userId])


  // ── Guard: missing guest or hotel ─────────────────────────────────────────
  if (!storedGuest || !storedHotel) {
    return (
      <div className="bg-slate-50/70 p-6 md:p-8">
        <Breadcrumb />
        <div className="mx-auto max-w-3xl rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-amber-900">Guest ya hotel selection missing hai.</p>
          <p className="mt-2 text-sm text-amber-700">Pehle guest select karo, phir hotel choose karke yahan aao.</p>
          <button
            type="button"
            onClick={() => navigate('/booking-creation')}
            className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Go to Booking Creation
          </button>
        </div>
      </div>
    )
  }


  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50/70 p-6 md:p-8">
      <Breadcrumb />


      <div className="mx-auto max-w-7xl space-y-6">


        {/* ── Hero Section ──────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">


            {/* Hotel Image */}
            <div className="min-h-[280px] bg-gradient-to-br from-blue-50 to-indigo-100">
              {getImage(hotelData) ? (
                <img
                  src={getImage(hotelData)}
                  alt={basicInfo?.name || 'Hotel'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-indigo-400">
                  <BedDouble size={48} />
                </div>
              )}
            </div>


            {/* Hotel Summary */}
            <div className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/booking-creation/hotels')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft size={16} /> Back to Hotels
                </button>


                <button
                  type="button"
                  onClick={() =>
                    dispatch(getHotelById(storedHotel?.hotelId || storedHotel?.id))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>


              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
                  Hotel Booking
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {basicInfo?.name || storedHotel?.hotelName || 'Hotel'}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    {[location?.city, location?.state].filter(Boolean).join(', ') || 'Location N/A'}
                    {location?.pinCode ? ` – ${location.pinCode}` : ''}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    ID: {detailedPolicies?.hotelId || storedHotel?.hotelId || 'N/A'}
                  </span>
                  {basicInfo?.starRating && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                      {'⭐'.repeat(basicInfo.starRating)} {basicInfo.starRating} Star
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {basicInfo?.description ||
                    location?.address ||
                    'Selected property details loaded for booking.'}
                </p>
              </div>


              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Category', value: basicInfo?.category || 'Standard' },
                  { label: 'Owner', value: basicInfo?.owner || 'N/A' },
                  { label: 'Phone', value: contacts?.phone || 'N/A' },
                  { label: 'Email', value: contacts?.email || 'N/A' },
                  { label: 'Gen. Manager', value: contacts?.generalManager || 'N/A' },
                  { label: 'Sales Manager', value: contacts?.salesManager || 'N/A' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900 truncate">{item.value}</p>
                  </div>
                ))}
              </div>


              {/* Guest Pill */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                    <UserRound size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-400">Guest</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{guestLabel}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {storedGuest?.mobile || 'No mobile'}
                      {storedGuest?.email ? ` · ${storedGuest.email}` : ''}
                    </p>
                  </div>
                </div>
              </div>


              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>


        {/* ── Main Grid ─────────────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">


            {/* Pricing Overview */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
              <SectionHeader icon={<BadgeCheck size={18} />} color="sky" title="Pricing Overview" sub="Base pricing and tax overview from API." />
              <div className="grid gap-4 md:grid-cols-3">
                <InfoTile label="Lowest Base Price" value={formatCurrency(pricingOverview?.lowestBasePrice || 0)} />
                <InfoTile label="Price with Tax" value={formatCurrency(pricingOverview?.lowestPriceWithTax || 0)} />
                <InfoTile
                  label="Display"
                  value={pricingOverview?.displayString || 'N/A'}
                  sub={pricingOverview?.taxNote}
                />
              </div>
            </section>


            {/* Rooms */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
              <SectionHeader icon={<BedDouble size={18} />} color="indigo" title="Rooms" sub="Available room configurations and pricing." />
              <div className="grid gap-4 md:grid-cols-2">
                {roomList.map((room) => (
                  <article
                    key={room.id}
                    className={`rounded-2xl border bg-slate-50/70 p-4 transition ${
                      selectedRoom?.id === room.id
                        ? 'border-indigo-400 ring-2 ring-indigo-100'
                        : 'border-slate-200'
                    }`}
                  >
                    {room.images?.[0] && (
                      <img
                        src={room.images[0]}
                        alt={room.name}
                        className="mb-4 h-44 w-full rounded-2xl object-cover"
                      />
                    )}


                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{room.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{room.bedTypes}</p>
                      </div>
                      {/* FIX 3: Use the flat `room.displayPrice` from getRoomList,
                          not the now-nonexistent `room.pricing.displayPrice`.
                          Fall back to formatting `room.price` if displayPrice is empty. */}
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm">
                        {room.displayPrice || formatCurrency(room.price)}
                      </span>
                    </div>


                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: 'Base', value: formatCurrency(room.basePrice) },
                        { label: 'Tax', value: `${room.taxPercent}%` },
                        { label: 'Available', value: room.inventory?.available ?? 'N/A' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-white px-3 py-2 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>


                    {room.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">{room.description}</p>
                    )}


                    {room.features?.isOffer && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        🎁 {room.features.offerText || 'Special offer available'}
                      </div>
                    )}


                    <button
                      type="button"
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        selectedRoom?.id === room.id
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {selectedRoom?.id === room.id ? '✓ Selected Room' : 'Select Room'}
                    </button>
                  </article>
                ))}
              </div>
            </section>


            {/* Food */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
              <SectionHeader icon={<Utensils size={18} />} color="amber" title="Food Details" sub="Meal options and inclusions for the stay." />
              <div className="grid gap-4 md:grid-cols-2">
                {foodList.map((food) => (
                  <article key={food.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    {food.images?.[0] && (
                      <img
                        src={food.images[0]}
                        alt={food.name}
                        className="mb-4 h-40 w-full rounded-2xl object-cover"
                      />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{food.name}</h3>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          food.type === 'Veg'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {food.type}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-600 shadow-sm">
                        {food.price > 0 ? food.displayPrice || formatCurrency(food.price) : 'Included'}
                      </span>
                    </div>
                    {food.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">{food.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>


            {/* Amenities & Policies */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
              <SectionHeader icon={<ShieldCheck size={18} />} color="violet" title="Amenities & Policies" sub="Everything the guest should know before booking." />


              {/* Amenities */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Amenities</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.length > 0
                    ? amenities.map((item) => (
                        <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {item}
                        </span>
                      ))
                    : <p className="text-sm text-slate-500">No amenities available.</p>}
                </div>
              </div>


              {/* Check-in / Check-out */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900">Stay Timing</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Check-In', value: policies?.checkIn || detailedPolicies?.checkInPolicy },
                    { label: 'Check-Out', value: policies?.checkOut || detailedPolicies?.checkOutPolicy },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock3 size={13} />
                        <span className="text-xs font-bold uppercase tracking-[0.15em]">{item.label}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{item.value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>


              {/* Rules */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Rules</h3>
                  <ul className="mt-3 space-y-2">
                    {ruleList.length > 0
                      ? ruleList.map((rule) => (
                          <li key={rule} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            • {rule}
                          </li>
                        ))
                      : <li className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">No rules listed.</li>}
                  </ul>
                </div>


                {/* Restrictions */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Restrictions</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Pets', value: restrictions?.petsAllowed ?? detailedPolicies?.petsAllowed },
                      { label: 'Smoking', value: restrictions?.smokingAllowed ?? detailedPolicies?.smokingAllowed },
                      { label: 'Alcohol', value: restrictions?.alcoholAllowed ?? detailedPolicies?.alcoholAllowed },
                      { label: 'Bachelors', value: detailedPolicies?.bachelorAllowed },
                      { label: 'Unmarried Couples', value: detailedPolicies?.unmarriedCouplesAllowed },
                      { label: 'Intl. Guests', value: detailedPolicies?.internationalGuestAllowed },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{item.label}</p>
                        <p className={`mt-1.5 text-sm font-semibold ${
                          String(item.value).toLowerCase() === 'yes' || item.value === true
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}>
                          {String(item.value ?? 'N/A')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {/* Policy Cards */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {[
                  { label: 'Hotel Policy', value: detailedPolicies?.hotelsPolicy },
                  { label: 'Cancellation Policy', value: policies?.cancellationText || detailedPolicies?.cancellationPolicy },
                  { label: 'Outside Food Policy', value: detailedPolicies?.outsideFoodPolicy },
                  { label: 'Refund Policy', value: detailedPolicies?.refundPolicy },
                  { label: 'Return Policy', value: detailedPolicies?.returnPolicy },
                  { label: 'Payment Mode', value: detailedPolicies?.paymentMode },
                ].map((item) =>
                  item.value ? (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{item.value}</p>
                    </div>
                  ) : null,
                )}
              </div>
            </section>
          </div>


          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <aside className="space-y-6">


            {/* Booking Card */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
              <SectionHeader icon={<CalendarDays size={18} />} color="emerald" title="Booking Card" sub="Select dates, rooms and coupon." />


              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Check-In</span>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Check-Out</span>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
                    />
                  </label>
                </div>


                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Rooms</span>
                  <input
                    type="number"
                    min="1"
                    value={numRooms}
                    onChange={(e) => {
                      const rooms = Math.max(1, Number(e.target.value) || 1)
                      setNumRooms(rooms)
                      setNumGuests((prev) => Math.min(prev, rooms * 3))
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Guests
                    <span className="ml-2 text-xs font-normal text-slate-400">(max {numRooms * 3} · 3 per room)</span>
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={numRooms * 3}
                    value={numGuests}
                    onChange={(e) => setNumGuests(Math.min(numRooms * 3, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </label>


                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Apply Coupon</span>
                  <div className="space-y-3">
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
                    >
                      <option value="user">User Coupon</option>
                      <option value="partner">Partner Coupon</option>
                    </select>
                    <div className="relative">
                      <CirclePercent size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value)
                          dispatch(clearAppliedCouponState())
                        }}
                        placeholder="Enter coupon code"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponApplying || !couponCode.trim() || !selectedRoom}
                      className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
                    >
                      {couponApplying ? 'Applying Coupon...' : 'Apply Coupon'}
                    </button>
                    {(couponApplyError || couponApplyMessage) && (
                      <div
                        className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                          couponApplyError
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {couponApplyError || couponApplyMessage}
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-700">
                        Discount applied: {formatCurrency(appliedCoupon.discountPrice)} · Final base price {formatCurrency(appliedCoupon.finalPrice)}
                      </div>
                    )}
                  </div>
                </label>


                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">GST Rule</span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                    {matchedGST ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{gstPercent}% GST applied</p>
                        <p className="text-xs text-slate-500">
                          Threshold: {matchedGST.gstMinThreshold} – {matchedGST.gstMaxThreshold || 'Above'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-500">No GST rule matched for current subtotal.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>


            {/* Price Summary */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
              <SectionHeader icon={<Sparkles size={18} />} color="fuchsia" title="Price Summary" sub="Review total before final submit." />


              <div className="space-y-3 text-sm text-slate-600">
                {[
                  { label: 'Selected Room', value: selectedRoom?.name || 'N/A' },
                  { label: 'Base Room Price', value: formatCurrency(selectedRoom?.basePrice || 0) },
                  { label: 'Rooms × Nights', value: `${numRooms} × ${nightCount || 1}` },
                  { label: 'Subtotal', value: formatCurrency(subtotal) },
                  { label: 'Coupon', value: appliedCoupon ? couponCode : 'Not applied' },
                  { label: 'Discount', value: formatCurrency(appliedDiscount) },
                  { label: 'Subtotal After Discount', value: formatCurrency(discountedSubtotal) },
                  { label: `GST (${gstPercent}%)`, value: formatCurrency(gstAmount) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span>{row.label}</span>
                    <span className="font-semibold text-slate-900">{row.value}</span>
                  </div>
                ))}


                {gstConfig?.enabled && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-700">
                    API GST Config: {gstConfig.rate}% · Range ₹{gstConfig.minLimit} – ₹{gstConfig.maxLimit}
                  </div>
                )}


                <div className="border-t border-dashed border-slate-200 pt-3">
                  <div className="flex items-center justify-between text-base font-bold text-slate-900">
                    <span>Grand Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>


              {pmsError && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {pmsError}
                </div>
              )}
              <button
                type="button"
                onClick={handleBooking}
                disabled={pmsLoading}
                className="mt-6 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {pmsLoading ? 'Creating Booking...' : 'Continue Booking'}
              </button>
            </section>
          </aside>
        </div>
      </div>
      {showSuccessPopup && bookingResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Booking Successful!</h2>
            <p className="text-lg"><strong>Booking ID:</strong> {bookingResponse.bookingId}</p>
            <p className="text-lg"><strong>Hotel:</strong> {bookingResponse.hotelDetails.hotelName}</p>
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                setBookingResponse(null);
              }}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg text-lg font-semibold"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


// ─── Small reusable sub-components ──────────────────────────────────────────


const colorMap = {
  sky:     'bg-sky-50 text-sky-600',
  indigo:  'bg-indigo-50 text-indigo-600',
  amber:   'bg-amber-50 text-amber-600',
  violet:  'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-600',
}


function SectionHeader({ icon, color, title, sub }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${colorMap[color] || ''}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}


function InfoTile({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}


export default BookHotel
