import React, { useState, useMemo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Star,
  MapPin,
  Wifi,
  Wind,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Utensils,
  Info,
  Clock,
  ShieldCheck,
  Tag,
  X,
  Plus,
  Minus,
  User,
  Phone,
  Calendar,
  CreditCard,
  BedDouble,
  RefreshCw
} from 'lucide-react'

// Renders stored policy text with bullet/number list formatting
const FormattedPolicyText = ({ text, className = '' }) => {
  if (!text) return null
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) return null
  const isBullet = l => /^[•\-–\*]\s/.test(l)
  const isNum    = l => /^\d+\.\s/.test(l)
  if (lines.length === 1 && !isBullet(lines[0]) && !isNum(lines[0]))
    return <span className={className}>{text}</span>
  return (
    <ul className={className} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {lines.map((line, i) => {
        const bullet = isBullet(line)
        const num    = isNum(line)
        const pfx    = bullet ? '•' : num ? line.match(/^\d+\./)[0] : '›'
        const body   = bullet ? line.replace(/^[•\-–\*]\s*/, '') : num ? line.replace(/^\d+\.\s*/, '') : line
        return (
          <li key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 3 }}>
            <span style={{ color: '#888', minWidth: 16, flexShrink: 0, lineHeight: 1.55 }}>{pfx}</span>
            <span style={{ lineHeight: 1.55 }}>{body}</span>
          </li>
        )
      })}
    </ul>
  )
}

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
import { formatCurrency } from '../../utils/format'

const formatYMD = (d) => {
  if (!d || isNaN(new Date(d).getTime())) return ''
  const date = new Date(d)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getNightCount = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0
  const start = new Date(checkInDate)
  const end = new Date(checkOutDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
}

const getDetailPayload = (payload) => payload?.data || payload?.hotel || payload || {}

const getImages = (hotel) => {
  const imageList = hotel?.basicInfo?.images || hotel?.images || []
  if (Array.isArray(imageList) && imageList.length > 0) return imageList
  if (hotel?.image) return [hotel.image]
  return []
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
      name: room?.name || room?.type || `Room ${index + 1}`,
      type: room?.type || 'Standard',
      bedType: room?.bedTypes || room?.bedType || room?.beds || 'Standard',
      pricing: {
        basePrice: Number(room?.basePrice || room?.pricing?.basePrice || room?.price || 0),
        taxPercent: Number(room?.gstPercent || room?.pricing?.taxPercent || 12),
      },
      description: room?.description || room?.about || '',
      amenities: room?.amenities || [],
      images: room?.images || [],
      inventory: {
        total: room?.totalCount || room?.inventory?.total || 1,
        available: room?.availableCount ?? room?.inventory?.available ?? 1
      },
      isOffer: room?.isOffer || false,
      offerName: room?.offerName || ''
    }))
  }

  return [
    {
      id: 'default-room',
      name: hotel?.roomType || 'Standard Room',
      type: 'Standard',
      bedType: hotel?.bedTypes || 'Double Bed',
      pricing: {
        basePrice: Number(hotel?.price || hotel?.startingPrice || 0),
        taxPercent: 12,
      },
      description: 'Comfortable stay setup for your guest.',
      amenities: hotel?.amenities || [],
      images: [],
      inventory: { total: 1, available: 1 },
      isOffer: false,
      offerName: ''
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
      description: food?.description || food?.details || '',
      type: food?.type || food?.category || 'Meal',
      image: (food?.images && food.images[0]) || food?.image || '',
    }))
  }
  return []
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

export default function BookHotel() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const storedGuest = useMemo(() => getSelectedGuest(), [])
  const storedHotel = useMemo(() => getSelectedHotel(), [])

  const { selectedHotel, loading: hotelLoading, error } = useSelector((state) => state.hotel)
  const { selectedGST } = useSelector((state) => state.adminGst)
  const { user } = useSelector((state) => state.auth)
  const { loading: pmsLoading, error: pmsError } = useSelector((state) => state.pms)
  const {
    applying: couponApplying,
    applyError: couponApplyError,
    applyMessage: couponApplyMessage,
    appliedCoupon,
  } = useSelector(selectAdminCoupon)

  const todayStr = formatYMD(new Date())
  const tomorrowDate = new Date()
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = formatYMD(tomorrowDate)

  const [checkIn, setCheckIn] = useState(todayStr)
  const [checkOut, setCheckOut] = useState(tomorrowStr)
  
  const [roomCount, setRoomCount] = useState(1)
  const [guests, setGuests] = useState(2)
  const [selectedFoods, setSelectedFoods] = useState([])
  const [couponInput, setCouponInput] = useState('')
  const [couponType, setCouponType] = useState('user')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showPolicy, setShowPolicy] = useState(false)
  const [viewAmenitiesRoom, setViewAmenitiesRoom] = useState(null)
  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [bookingResponse, setBookingResponse] = useState(null)

  useEffect(() => {
    const hotelIdentifier =
      storedHotel?.hotelId || storedHotel?.id || storedHotel?.raw?.hotelId || storedHotel?.raw?._id
    if (hotelIdentifier) dispatch(getHotelById(hotelIdentifier))
  }, [dispatch, storedHotel])

  const hotelData = useMemo(
    () =>
      getDetailPayload(
        selectedHotel?._id || selectedHotel?.hotelId || selectedHotel?.data?._id || selectedHotel?.success
          ? selectedHotel
          : storedHotel?.raw || storedHotel,
      ),
    [selectedHotel, storedHotel],
  )

  const basicInfo = hotelData?.basicInfo || {}
  const location = basicInfo?.location || {}
  const contacts = basicInfo?.contacts || {}
  const policies = hotelData?.policies || {}
  const detailedPolicies = policies?.detailed || {}

  const hotelImages = useMemo(() => getImages(hotelData), [hotelData])
  const roomList = useMemo(() => getRoomList(hotelData), [hotelData])
  const foodList = useMemo(() => getFoodList(hotelData), [hotelData])
  const amenities = useMemo(() => getAmenityList(hotelData?.amenities), [hotelData])

  useEffect(() => {
    if (!selectedRoomId && roomList.length > 0) {
      setSelectedRoomId(roomList[0].id)
    }
  }, [roomList, selectedRoomId])

  const selectedRoom = useMemo(
    () => roomList.find((r) => r.id === selectedRoomId) || roomList[0] || null,
    [roomList, selectedRoomId],
  )

  useEffect(() => {
    if (hotelImages.length === 0) return
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [hotelImages.length])

  useEffect(() => {
    if (guests > roomCount * 3) {
      setGuests(roomCount * 3)
    }
  }, [roomCount, guests])

  const numberOfNights = getNightCount(checkIn, checkOut)

  const totals = useMemo(() => {
    if (!selectedRoom) return { subtotal: 0, tax: 0, discount: 0, total: 0, roomSubtotal: 0, foodSubtotal: 0 }
    const roomSubtotal = selectedRoom.pricing.basePrice * roomCount * numberOfNights
    const foodSubtotal = selectedFoods.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const subtotal = roomSubtotal + foodSubtotal
    
    let discount = 0
    if (appliedCoupon) {
       discount = Number(appliedCoupon.discountPrice || 0)
    }
    const discountedSubtotal = Math.max(0, subtotal - discount)
    
    const matchedGST = String(selectedGST?.type || '').toLowerCase() === 'hotel' ? selectedGST : null
    const gstPercent = Number(matchedGST?.gstPrice || selectedRoom.pricing.taxPercent || 12)
    const tax = Math.round((discountedSubtotal * gstPercent) / 100)
    
    return { 
      roomSubtotal,
      foodSubtotal,
      subtotal, 
      tax, 
      discount, 
      total: discountedSubtotal + tax,
      gstPercent
    }
  }, [selectedRoom, roomCount, numberOfNights, selectedFoods, appliedCoupon, selectedGST])

  useEffect(() => {
    if (totals.subtotal <= 0) return
    dispatch(getGST({ type: 'Hotel', gstThreshold: Math.max(0, totals.subtotal - totals.discount) }))
  }, [dispatch, totals.subtotal, totals.discount])

  useEffect(() => {
    dispatch(clearAppliedCouponState())
  }, [dispatch, couponType, selectedRoom?.id, hotelData?.hotelId, hotelData?._id, storedGuest?.userId])

  const handleApplyCoupon = async () => {
    const trimmedCouponCode = String(couponInput || '').trim()
    if (!trimmedCouponCode || !selectedRoom) return

    // Debug logging to check hotelData structure
    console.log('hotelData:', hotelData)
    console.log('selectedHotel:', selectedHotel)
    console.log('storedHotel:', storedHotel)
    console.log('trimmedCouponCode:', trimmedCouponCode)

    // Extract hotelId from multiple possible sources
    let extractedHotelId = 
      hotelData?.hotelId || 
      hotelData?._id || 
      hotelData?.data?.hotelId || 
      hotelData?.data?._id ||
      selectedHotel?.hotelId ||
      selectedHotel?._id ||
      selectedHotel?.data?.hotelId ||
      selectedHotel?.data?._id ||
      storedHotel?.hotelId ||
      storedHotel?._id ||
      storedHotel?.raw?.hotelId ||
      storedHotel?.raw?._id

    console.log('extractedHotelId:', extractedHotelId)

    // If still no hotelId, try to get from storedHotel directly
    if (!extractedHotelId && storedHotel) {
      extractedHotelId = storedHotel.hotelId || storedHotel.id || '48291034' // Fallback for testing
      console.log('Fallback hotelId:', extractedHotelId)
    }

    if (!extractedHotelId) {
      console.error('No hotelId found for coupon application')
      return
    }

    // Final validation
    if (!extractedHotelId || extractedHotelId === 'undefined' || extractedHotelId === 'null') {
      console.error('Invalid hotelId detected:', extractedHotelId)
      return
    }

    // Validate coupon code is not an error message
    if (trimmedCouponCode.includes('message') || trimmedCouponCode.includes('required')) {
      console.error('Invalid coupon code detected:', trimmedCouponCode)
      return
    }

    console.log('Final hotelId for coupon:', extractedHotelId)
    console.log('Final coupon code:', trimmedCouponCode)

    await dispatch(
      applyCoupon({
        couponType,
        couponCode: trimmedCouponCode,
        hotelId: extractedHotelId,
        hotelIds: [extractedHotelId].filter(Boolean),
        roomId: selectedRoom.id,
        userId: storedGuest.userId,
      }),
    )
  }

  const updateFoodQuantity = (food, delta) => {
    setSelectedFoods(prev => {
      const existing = prev.find(f => f.id === food.id)
      if (existing) {
        const newQty = existing.quantity + delta
        if (newQty <= 0) return prev.filter(f => f.id !== food.id)
        return prev.map(f => f.id === food.id ? { ...f, quantity: newQty } : f)
      }
      if (delta > 0) return [...prev, { ...food, quantity: 1 }]
      return prev
    })
  }

  const handleCheckInChange = (e) => {
    const newIn = e.target.value
    setCheckIn(newIn)
    
    const inDate = new Date(newIn)
    const outDate = new Date(checkOut)
    
    if (inDate >= outDate) {
      const nextDay = new Date(inDate)
      nextDay.setDate(nextDay.getDate() + 1)
      setCheckOut(formatYMD(nextDay))
    }
  }

  const getMinCheckOut = () => {
    const d = new Date(checkIn)
    d.setDate(d.getDate() + 1)
    return formatYMD(d)
  }

  const handleBooking = () => {
    if (!storedGuest || !hotelData || !selectedRoom) return

    const bookingData = {
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guests: guests,
      guestDetails: [{
        fullName: storedGuest.userName,
        mobile: storedGuest.mobile,
        email: storedGuest.email,
      }],
      user: {
        userId: storedGuest.userId,
        name: storedGuest.userName,
        mobile: storedGuest.mobile,
        email: storedGuest.email,
      },
      hotelDetails: {
        hotelId: hotelData?.hotelId || hotelData?._id,
        hotelName: basicInfo?.name || storedHotel?.hotelName,
        hotelEmail: contacts?.email,
        hotelCity: location?.city,
        hotelOwnerName: basicInfo?.owner,
      },
      numRooms: roomCount,
      foodDetails: selectedFoods.map(f => ({
          foodId: f.id,
          name: f.name,
          price: f.price,
          quantity: f.quantity
      })),
      roomDetails: [
        {
          roomId: selectedRoom.id,
          type: selectedRoom.name,
          bedTypes: selectedRoom.bedType,
          price: selectedRoom.pricing.basePrice,
        },
      ],
      pm: 'offline',
      isPartialBooking: false,
      partialAmount: 0,
      bookingStatus: 'Confirmed',
      createdBy: {
        user: user?.name || 'Admin',
        email: user?.email || '',
      },
      couponCode: appliedCoupon ? couponInput : '',
      discountPrice: appliedCoupon?.discountPrice || 0,
      gstPrice: totals.tax,
      price: totals.total,
      bookingSource: 'Panel',
      destination: location?.city || storedHotel?.destination || '',
    }

    dispatch(
      createBooking({
        userId: storedGuest.userId,
        hotelId: hotelData.hotelId || hotelData._id,
        bookingData,
      })
    ).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
            setBookingResponse(result.payload.data || result.payload)
            setShowSuccessPopup(true)
        }
    })
  }

  const PolicyModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPolicy(false)}>
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            Hotel Policies
          </h2>
          <button onClick={() => setShowPolicy(false)} className="p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto max-h-[70vh] space-y-6">
          <div className="grid grid-cols-2 gap-4 pb-6 border-b">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Check-In Time</p>
              <p className="text-lg font-bold text-slate-800">{policies?.checkIn || detailedPolicies?.checkInPolicy || '12:00 PM'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Check-Out Time</p>
              <p className="text-lg font-bold text-slate-800">{policies?.checkOut || detailedPolicies?.checkOutPolicy || '11:00 AM'}</p>
            </div>
          </div>
          <div className="space-y-6">
            <section>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Cancellation Policy
              </h4>
              {policies?.cancellationText || detailedPolicies?.cancellationPolicy
                ? <FormattedPolicyText text={policies?.cancellationText || detailedPolicies?.cancellationPolicy} className="text-slate-600 text-sm leading-relaxed" />
                : <span className="text-slate-600 text-sm">Standard cancellation policy applies.</span>}
            </section>
            <section>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Guest & Child Policy
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">{policies?.childPolicy || 'Children are welcome. Extra bedding may incur charges.'}</p>
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Smoking Rules</h4>
                <p className="text-slate-600 text-sm">{policies?.smokingPolicy || (detailedPolicies?.smokingAllowed ? 'Smoking allowed in designated areas.' : 'Smoking is strictly prohibited.')}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Pet Policy</h4>
                <p className="text-slate-600 text-sm">{policies?.petPolicy || (detailedPolicies?.petsAllowed ? 'Pets are allowed.' : 'Pets are strictly not allowed.')}</p>
              </div>
            </section>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h4 className="font-bold text-indigo-900 mb-1">Required Documents</h4>
              <p className="text-indigo-700 text-sm">{policies?.idPolicy || 'Original Aadhar card, Passport, or Valid Government ID required at check-in.'}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <button onClick={() => setShowPolicy(false)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">
            Close
          </button>
        </div>
      </div>
    </div>
  )

  const AmenitiesModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewAmenitiesRoom(null)}>
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-indigo-400" />
            Room Amenities
          </h2>
          <button onClick={() => setViewAmenitiesRoom(null)} className="p-1.5 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
            <h3 className="font-bold text-slate-900 mb-4">{viewAmenitiesRoom?.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              {viewAmenitiesRoom?.amenities.map(a => (
                <div key={a} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold text-slate-700">{a}</span>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  )

  if (!storedGuest || !storedHotel) {
    return (
      <div className="bg-slate-50/70 p-6 md:p-8 min-h-screen">
        <Breadcrumb />
        <div className="mx-auto max-w-3xl rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-10 text-center mt-10">
          <p className="text-lg font-semibold text-amber-900">Guest or hotel selection is missing.</p>
          <p className="mt-2 text-sm text-amber-700">Please select a guest and then choose a hotel to proceed.</p>
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {showPolicy && <PolicyModal />}
      {viewAmenitiesRoom && <AmenitiesModal />}
      
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/booking-creation/hotels')}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:block"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
                {basicInfo?.name ? basicInfo.name.charAt(0).toUpperCase() : 'H'}
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-indigo-900 leading-none">{basicInfo?.name || storedHotel?.hotelName || 'Hotel'}</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{basicInfo?.category || 'Standard'} Property</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => dispatch(getHotelById(storedHotel?.hotelId || storedHotel?.id))}
               className="p-2 hover:bg-slate-100 rounded-full transition-colors"
               disabled={hotelLoading}
             >
               <RefreshCw size={18} className={`text-slate-600 ${hotelLoading ? 'animate-spin' : ''}`} />
             </button>
            <button onClick={() => setShowPolicy(true)} className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors hidden sm:block">
              View Policies
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {error && (
             <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
               {error}
             </div>
          )}

          <section className="bg-white rounded-3xl overflow-hidden shadow-xl border border-white flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-7 flex flex-col">
                <div className="relative h-[320px] w-full bg-slate-100 flex items-center justify-center">
                  {hotelImages.length > 0 ? (
                    <img src={hotelImages[currentImageIndex]} className="w-full h-full object-cover" alt="Hotel" />
                  ) : (
                    <BedDouble size={48} className="text-slate-300" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded">STAR PROPERTY</span>
                      {basicInfo?.starRating && (
                        <div className="flex text-yellow-400">
                          {[...Array(basicInfo.starRating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                        </div>
                      )}
                    </div>
                    <h2 className="text-2xl font-black">{basicInfo?.name || storedHotel?.hotelName || 'Hotel'}</h2>
                  </div>
                </div>
                {hotelImages.length > 1 && (
                  <div className="flex gap-2 p-2 bg-slate-900 overflow-x-auto">
                    {hotelImages.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img} 
                        alt="Thumbnail"
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-16 w-24 flex-shrink-0 object-cover rounded-lg cursor-pointer transition-all ${currentImageIndex === idx ? 'ring-2 ring-indigo-400 opacity-100' : 'opacity-40 hover:opacity-100'}`} 
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-5 p-6 flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg"><MapPin className="w-5 h-5 text-indigo-600" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{location?.city || 'City'}, {location?.state || 'State'}</p>
                      <p className="text-xs text-slate-500">{location?.address || 'Address not available'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4 border-t">
                    <div className="p-2 bg-slate-50 rounded-lg"><User className="w-5 h-5 text-slate-600" /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Property Owner</p>
                      <p className="text-sm font-bold text-slate-900">{basicInfo?.owner || 'N/A'}</p>
                      <div className="flex items-center gap-1 text-indigo-600 mt-1">
                        <Phone className="w-3 h-3" />
                        <span className="text-xs font-bold">{contacts?.phone ? `+91 ${contacts.phone}` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden h-32 border relative group bg-slate-100">
                    {location?.coordinates?.lat && location?.coordinates?.lng ? (
                      <iframe 
                        title="map"
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        src={`https://maps.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}&z=14&output=embed`}
                        className="grayscale-[0.5] contrast-[1.1]"
                      />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">Map unavailable</div>
                    )}
                    <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              Hotel Description
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              {basicInfo?.description || 'Selected property details loaded for booking.'}
            </p>
            <div className="pt-6 border-t">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-widest">Premium Amenities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.length > 0 ? amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 transition-hover hover:border-indigo-200">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-xs font-bold text-slate-700 truncate">{a}</span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 col-span-full">No amenities listed.</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Available Rooms</h3>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">Live Availability</span>
            </div>
            <div className="space-y-3">
              {roomList.map((room) => {
                const taxes = Math.round((room.pricing.basePrice * room.pricing.taxPercent) / 100)
                const finalPrice = room.pricing.basePrice + taxes
                
                return (
                  <div 
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`group cursor-pointer rounded-2xl border-2 transition-all flex flex-col sm:flex-row overflow-hidden h-auto sm:h-36 ${
                      selectedRoom?.id === room.id 
                      ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-50 shadow-md' 
                      : 'border-white bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="w-full sm:w-48 relative overflow-hidden h-36 sm:h-full bg-slate-100 flex items-center justify-center">
                      {room.images.length > 0 ? (
                        <img src={room.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={room.name} />
                      ) : (
                        <BedDouble className="text-slate-300" size={32} />
                      )}
                      {room.isOffer && room.offerName && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-md z-10 flex items-center gap-1 uppercase tracking-widest">
                          <Tag className="w-3 h-3" />
                          {room.offerName}
                        </div>
                      )}
                      {selectedRoom?.id === room.id && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex justify-between items-center">
                      <div className="flex-1 pr-4">
                        <h4 className="font-black text-slate-900">{room.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{room.bedType} • {room.type}</p>
                        <div className="flex gap-2 mt-3 flex-wrap items-center">
                          {room.amenities.slice(0, 3).map(a => (
                            <span key={a} className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase max-w-[80px] truncate">{a}</span>
                          ))}
                          {room.amenities.length > 3 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewAmenitiesRoom(room) }}
                              className="text-[9px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded uppercase transition-colors"
                            >
                              +{room.amenities.length - 3} More
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between h-full w-32 shrink-0">
                        <div className="flex justify-end">
                          {room.inventory.available <= 5 ? (
                            <p className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded inline-block animate-pulse">Only {room.inventory.available} left!</p>
                          ) : (
                            <p className="text-[10px] font-black text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded inline-block">{room.inventory.available} available</p>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Base: {formatCurrency(room.pricing.basePrice)}</p>
                          <p className="text-xl font-black text-indigo-600">{formatCurrency(finalPrice)}</p>
                          <p className="text-[9px] font-bold text-slate-500">Includes {formatCurrency(taxes)} taxes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {foodList.length > 0 && (
            <section>
              <h3 className="text-lg font-black mb-6">Food & Dining</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {foodList.map((food) => {
                  const selected = selectedFoods.find(f => f.id === food.id)
                  return (
                    <div key={food.id} className="bg-white p-3 rounded-2xl border flex items-center gap-4 transition-all hover:shadow-lg">
                      {food.image ? (
                        <img src={food.image} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt={food.name} />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                           <Utensils size={20} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-sm leading-none">{food.name}</h4>
                        <p className="text-indigo-600 font-black text-xs mt-1">{formatCurrency(food.price)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
                        <button onClick={() => updateFoodQuantity(food, -1)} className="p-1 hover:bg-white rounded-lg"><Minus className="w-3 h-3" /></button>
                        <span className="w-4 text-center font-black text-xs">{selected?.quantity || 0}</span>
                        <button onClick={() => updateFoodQuantity(food, 1)} className="p-1 hover:bg-white rounded-lg"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="bg-white rounded-3xl border shadow-xl sticky top-24 overflow-hidden border-indigo-100">
            <div className="bg-slate-900 p-6 text-white relative">
              <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard className="w-16 h-16" /></div>
              <h3 className="text-lg font-black tracking-tight">Booking Summary</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                Guest: {storedGuest?.userName || storedGuest?.mobile || 'Guest'}
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Check-In Date</label>
                  <input 
                    type="date" 
                    min={todayStr}
                    value={checkIn}
                    onChange={handleCheckInChange}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Check-Out Date</label>
                  <input 
                    type="date" 
                    min={getMinCheckOut()}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <p className="font-black text-sm text-slate-900 uppercase">Rooms</p>
                    <p className="text-[10px] text-slate-400 font-bold truncate max-w-[140px]">{selectedRoom?.name || 'Select Room'}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border">
                    <button onClick={() => setRoomCount(Math.max(1, roomCount - 1))} className="w-6 h-6 rounded-lg bg-white border flex items-center justify-center shadow-sm">-</button>
                    <span className="font-black text-sm w-4 text-center">{roomCount}</span>
                    <button onClick={() => setRoomCount(Math.min(selectedRoom?.inventory?.available || 1, roomCount + 1))} className="w-6 h-6 rounded-lg bg-white border flex items-center justify-center shadow-sm">+</button>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <p className="font-black text-sm text-slate-900 uppercase">Guests</p>
                    <p className="text-[10px] text-slate-400 font-bold">Max 3 per room</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border">
                    <button 
                      onClick={() => setGuests(Math.max(1, guests - 1))} 
                      className="w-6 h-6 rounded-lg bg-white border flex items-center justify-center shadow-sm"
                    >-</button>
                    <span className="font-black text-sm w-4 text-center">{guests}</span>
                    <button 
                      onClick={() => setGuests(Math.min(roomCount * 3, guests + 1))} 
                      disabled={guests >= roomCount * 3}
                      className={`w-6 h-6 rounded-lg bg-white border flex items-center justify-center shadow-sm ${guests >= roomCount * 3 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >+</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Base Fare ({roomCount} Room{roomCount > 1 ? 's' : ''} × {numberOfNights} Night{numberOfNights > 1 ? 's' : ''})</span>
                    <span className="text-slate-900">{formatCurrency(totals.roomSubtotal)}</span>
                  </div>
                  {selectedFoods.length > 0 && (
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Add-ons ({selectedFoods.length})</span>
                      <span className="text-slate-900">{formatCurrency(totals.foodSubtotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Taxes ({totals.gstPercent}% GST)</span>
                    <span className="text-slate-900">{formatCurrency(totals.tax)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-xs font-black text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                      <span>Discount ({appliedCoupon.couponCode || couponInput})</span>
                      <span>-{formatCurrency(totals.discount)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value)}
                    className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white"
                  >
                    <option value="partner">PARTNER</option>
                  </select>
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="PROMO CODE"
                      value={couponInput}
                      onChange={(e) => {
                         setCouponInput(e.target.value)
                         dispatch(clearAppliedCouponState())
                      }}
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                  <button 
                     onClick={handleApplyCoupon} 
                     disabled={couponApplying || !couponInput.trim() || !selectedRoom}
                     className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 uppercase disabled:opacity-50"
                  >
                     Apply
                  </button>
                </div>
                {(couponApplyError || couponApplyMessage) && (
                   <p className={`text-[10px] font-bold ml-1 ${couponApplyError ? 'text-red-500' : 'text-emerald-600'}`}>
                     {couponApplyError || couponApplyMessage}
                   </p>
                )}
                {appliedCoupon && !couponApplyError && (
                  <div className="flex items-center justify-between px-3 py-2 bg-green-600 text-white rounded-xl shadow-lg animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Coupon Applied!</span></div>
                    <button onClick={() => {
                        dispatch(clearAppliedCouponState())
                        setCouponInput('')
                    }}><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Payable Amount</p>
                    <p className="text-4xl font-black text-slate-900">{formatCurrency(totals.total)}</p>
                  </div>
                </div>
                
                {pmsError && (
                   <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-bold">
                     {pmsError}
                   </div>
                )}

                <button 
                  onClick={handleBooking}
                  disabled={pmsLoading || !selectedRoom}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transform active:scale-95 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:transform-none"
                >
                  {pmsLoading ? 'Processing...' : 'Book Now'}
                  {!pmsLoading && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {showSuccessPopup && bookingResponse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Booking Successful!</h2>
            <div className="bg-slate-50 rounded-xl p-4 my-6 text-left border">
               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Booking ID</p>
               <p className="text-sm font-black text-slate-900 mb-3">{bookingResponse.bookingId}</p>
               <p className="text-xs text-slate-500 font-bold uppercase mb-1">Hotel</p>
               <p className="text-sm font-black text-slate-900">{bookingResponse.hotelDetails?.hotelName || basicInfo?.name}</p>
            </div>
            <button
              onClick={() => {
                setShowSuccessPopup(false)
                setBookingResponse(null)
                navigate('/booking-creation')
              }}
              className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <footer className="bg-white border-t py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{basicInfo?.name || 'Hotel'} • Managed by {basicInfo?.owner || 'Owner'}</p>
          <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} Property Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}