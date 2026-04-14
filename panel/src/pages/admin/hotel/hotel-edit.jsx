import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BedDouble, Building2, Check,
  CheckCircle2, Loader2, MapPin, PencilLine, Plus,
  Save, ShieldCheck, Trash2, X, ChevronRight,
} from 'lucide-react'
import Breadcrumb from '../../../components/breadcrumb'
import {
  clearHotelUpdateStatus,
  getHotelById,
  updateHotelInfo,
} from '../../../../redux/slices/admin/hotel'
import api from '../../../api'

/* ─── Google Fonts injection ─────────────────────────────────── */
const FontInjector = () => (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
  </>
)

/* ─── Step config ────────────────────────────────────────────── */
const STEPS = [
  { id: 1, key: 'basic',    label: 'Basic Info',      sub: 'Name, location & contacts' },
  { id: 2, key: 'property', label: 'Property Details', sub: 'Type, rating & description' },
  { id: 3, key: 'rooms',    label: 'Rooms',            sub: 'Inventory management' },
  { id: 4, key: 'foods',    label: 'Dining',           sub: 'Food menu management' },
  { id: 5, key: 'policies', label: 'Policies',         sub: 'Rules & terms' },
]

/* ─── Policy config ──────────────────────────────────────────── */
const POLICY_LABELS = [
  { label: 'Check-In Policy',     key: 'checkInPolicy' },
  { label: 'Check-Out Policy',    key: 'checkOutPolicy' },
  { label: 'Hotel Policy',        key: 'hotelsPolicy' },
  { label: 'Outside Food',        key: 'outsideFoodPolicy' },
  { label: 'Cancellation Policy', key: 'cancellationPolicy' },
  { label: 'Refund Policy',       key: 'refundPolicy' },
  { label: 'Payment Mode',        key: 'paymentMode' },
]

const GUEST_RULES = [
  { label: 'Pets',                  key: 'petsAllowed' },
  { label: 'Bachelors',             key: 'bachelorAllowed' },
  { label: 'Smoking',               key: 'smokingAllowed' },
  { label: 'Alcohol',               key: 'alcoholAllowed' },
  { label: 'Unmarried Couples',     key: 'unmarriedCouplesAllowed' },
  { label: 'International Guests',  key: 'internationalGuestAllowed' },
]

const YES_NO = ['Allowed', 'Not Allowed', 'Yes', 'No']

const SEASONAL_SECTIONS = [
  { label: 'On Season — CP (Breakfast)',            prefix: 'on',  suffix: '' },
  { label: 'Off Season — CP (Breakfast)',           prefix: 'off', suffix: '' },
  { label: 'On Season — AP (All Meals)',            prefix: 'on',  suffix: 'Ap' },
  { label: 'Off Season — AP (All Meals)',           prefix: 'off', suffix: 'Ap' },
  { label: 'On Season — MAP (Breakfast + Dinner)',  prefix: 'on',  suffix: 'MAp' },
  { label: 'Off Season — MAP (Breakfast + Dinner)', prefix: 'off', suffix: 'MAp' },
]

const SEASONAL_COLS = [
  { col: 'Double',  keySuffix: 'DoubleSharing' },
  { col: 'Triple',  keySuffix: 'TrippleSharing' },
  { col: 'Quad',    keySuffix: 'QuadSharing' },
  { col: 'Bulk',    keySuffix: 'BulkBooking' },
  { col: '>4',      keySuffix: 'MoreThanFour' },
]

const createEmptyPolicies = () => ({
  checkInPolicy: '', checkOutPolicy: '', hotelsPolicy: '',
  outsideFoodPolicy: '', cancellationPolicy: '', refundPolicy: '', paymentMode: '',
  petsAllowed: '', bachelorAllowed: '', smokingAllowed: '',
  alcoholAllowed: '', unmarriedCouplesAllowed: '', internationalGuestAllowed: '',
  onDoubleSharing: '', onTrippleSharing: '', onQuadSharing: '', onBulkBooking: '', onMoreThanFour: '',
  offDoubleSharing: '', offTrippleSharing: '', offQuadSharing: '', offBulkBooking: '', offMoreThanFour: '',
  onDoubleSharingAp: '', onTrippleSharingAp: '', onQuadSharingAp: '', onBulkBookingAp: '', onMoreThanFourAp: '',
  offDoubleSharingAp: '', offTrippleSharingAp: '', offQuadSharingAp: '', offBulkBookingAp: '', offMoreThanFourAp: '',
  onDoubleSharingMAp: '', onTrippleSharingMAp: '', onQuadSharingMAp: '', onBulkBookingMAp: '', onMoreThanFourMAp: '',
  offDoubleSharingMAp: '', offTrippleSharingMAp: '', offQuadSharingMAp: '', offBulkBookingMAp: '', offMoreThanFourMAp: '',
})

/* ─── PolicyEditor ───────────────────────────────────────────── */
const PolicyEditor = ({ label, value, onChange }) => {
  const [fmt, setFmt] = useState(() => {
    if (!value) return 'bullet'
    if (/^\d+\.\s/m.test(value)) return 'number'
    if (/^[•\-]\s/m.test(value)) return 'bullet'
    return 'plain'
  })
  const taRef = useRef(null)

  const applyFormat = (newFmt) => {
    setFmt(newFmt)
    if (!value && newFmt !== 'plain') {
      onChange(newFmt === 'bullet' ? '• ' : '1. ')
      requestAnimationFrame(() => {
        if (taRef.current) {
          taRef.current.focus()
          taRef.current.selectionStart = taRef.current.selectionEnd = taRef.current.value.length
        }
      })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' || fmt === 'plain') return
    e.preventDefault()
    const ta = taRef.current
    const pos = ta.selectionStart
    const before = value.slice(0, pos)
    const after  = value.slice(pos)
    const lines  = before.split('\n')
    const last   = lines[lines.length - 1]
    let prefix = fmt === 'bullet' ? '• ' : (() => {
      const m = last.match(/^(\d+)\./)
      return m ? `${Number(m[1]) + 1}. ` : '1. '
    })()
    const newVal = before + '\n' + prefix + after
    onChange(newVal)
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos + 1 + prefix.length })
  }

  const handleChange = (e) => {
    let v = e.target.value
    if (fmt === 'bullet' && !v) v = '• '
    if (fmt === 'number' && !v) v = '1. '
    onChange(v)
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}>
          {label}
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          {['bullet', 'number', 'plain'].map((f) => (
            <button
              key={f} type="button"
              onClick={() => applyFormat(f)}
              style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                border: '1px solid',
                borderColor: fmt === f ? '#0f172a' : '#e2e8f0',
                background: fmt === f ? '#0f172a' : 'transparent',
                color: fmt === f ? '#fff' : '#94a3b8',
                transition: 'all .14s',
              }}
            >
              {f === 'bullet' ? '• Bullet' : f === 'number' ? '1. Number' : 'Plain'}
            </button>
          ))}
        </div>
      </div>
      <textarea
        ref={taRef}
        value={value || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Enter ${label.toLowerCase()}...`}
        rows={4}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 16px',
          fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 400,
          color: '#0f172a', background: '#f8fafc',
          border: '1.5px solid #e2e8f0', borderRadius: 10,
          outline: 'none', resize: 'vertical', lineHeight: 1.7,
          transition: 'border-color .15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
      />
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────── */
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
        : hotel?.propertyType ? [hotel.propertyType] : []
  return {
    hotelName:    basicInfo?.name   || hotel?.hotelName || '',
    city:         location?.city    || hotel?.city      || '',
    state:        location?.state   || hotel?.state     || '',
    address:      location?.address || hotel?.address   || hotel?.landmark || '',
    pinCode:      location?.pinCode || hotel?.pinCode   || '',
    starRating:   String(basicInfo?.starRating || hotel?.starRating || ''),
    propertyType: propertyType.join(', '),
    hotelEmail:   contacts?.email   || hotel?.hotelEmail || hotel?.email || '',
    phone:        contacts?.phone   || hotel?.phone      || '',
    owner:        basicInfo?.owner  || hotel?.hotelOwnerName || hotel?.owner || '',
    description:  basicInfo?.description || hotel?.description || '',
    onFront:      Boolean(hotel?.onFront),
    isAccepted:   Boolean(hotel?.isAccepted),
    destination:  hotel?.destination  || '',
    hotelCategory:hotel?.hotelCategory || '',
    latitude:     hotel?.latitude      || '',
    longitude:    hotel?.longitude     || '',
    customerWelcomeNote:    hotel?.customerWelcomeNote    || '',
    generalManagerContact:  hotel?.generalManagerContact  || '',
    salesManagerContact:    hotel?.salesManagerContact    || '',
    localId:      hotel?.localId       || 'Accepted',
  }
}

const normalizeRoom = (room, index = 0) => {
  let amenitiesStr = Array.isArray(room?.amenities) ? room.amenities.join(', ') : (room?.amenities || '')
  let imagesStr    = Array.isArray(room?.images)    ? room.images.join(', ')    : (room?.images    || '')
  const price      = room?.pricing?.basePrice ?? room?.price      ?? room?.originalPrice ?? 0
  const countRooms = room?.inventory?.total   ?? room?.countRooms ?? room?.totalRooms    ?? 0
  const isOffer      = room?.features?.isOffer    ?? room?.isOffer      ?? false
  const offerName    = room?.features?.offerText  ?? room?.offerName    ?? room?.offerText     ?? ''
  const roomId       = room?.roomId || room?.id || ''
  const origPrice    = room?.pricing?.originalPrice ?? room?.originalPrice ?? price
  const offerPLess   = room?.offerPriceLess ?? 0
  const offerExp     = room?.offerExp || room?.features?.offerExp || ''
  return {
    _id: room?._id || room?.id || `room-${index}`,
    roomId,
    name:           room?.name  || room?.type || `Room ${index + 1}`,
    type:           room?.type  || room?.name || `Room ${index + 1}`,
    bedType:        room?.bedType || room?.bedTypes || '',
    price:          String(price),
    originalPrice:  String(origPrice),
    countRooms:     String(countRooms),
    totalRooms:     String(countRooms),
    description:    room?.description || '',
    amenities:      amenitiesStr,
    images:         imagesStr,
    isOffer,
    offerName,
    offerPriceLess: String(offerPLess),
    offerExp,
  }
}

const createEmptyRoomForm = () => ({
  type: '', bedType: '', price: '', originalPrice: '', countRooms: '',
  description: '', amenities: '', images: '', isOffer: false, offerName: '',
  offerPriceLess: '', offerExp: '',
})

const normalizeFood = (food, index = 0) => {
  const foodId = food?.foodId || food?.id || ''
  const images = Array.isArray(food?.images) ? food.images.join(', ') : (food?.images || '')
  return {
    _id: food?._id || foodId || `food-${index}`,
    foodId,
    name: food?.name || food?.title || '',
    foodType: food?.foodType || food?.type || 'Veg',
    price: String(food?.price ?? ''),
    about: food?.about || food?.description || '',
    images,
  }
}

const createEmptyFoodForm = () => ({
  name: '', foodType: 'Veg', price: '', about: '', images: '',
})

const buildFoodEntry = (form, existingFoodId = null) => {
  const imagesArr = Array.isArray(form.images)
    ? form.images
    : (typeof form.images === 'string' && form.images.trim()
        ? form.images.split(',').map((v) => v.trim()).filter(Boolean)
        : [])
  const entry = {
    name: s(form.name),
    foodType: s(form.foodType) || 'Veg',
    price: Number(form.price) || 0,
    about: s(form.about),
    images: imagesArr,
  }
  if (existingFoodId) entry.foodId = existingFoodId
  return entry
}

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
  destination:  s(form.destination),
  hotelCategory:s(form.hotelCategory),
  latitude:     s(form.latitude),
  longitude:    s(form.longitude),
  customerWelcomeNote:   s(form.customerWelcomeNote),
  generalManagerContact: s(form.generalManagerContact),
  salesManagerContact:   s(form.salesManagerContact),
  localId:      s(form.localId) || 'Accepted',
})

const buildRoomEntry = (form, existingRoomId = null) => {
  const amenitiesArr = Array.isArray(form.amenities)
    ? form.amenities
    : (typeof form.amenities === 'string' && form.amenities.trim()
        ? form.amenities.split(',').map((v) => v.trim()).filter(Boolean)
        : [])
  const imagesArr = Array.isArray(form.images)
    ? form.images
    : (typeof form.images === 'string' && form.images.trim()
        ? form.images.split(',').map((v) => v.trim()).filter(Boolean)
        : [])
  const entry = {
    type: s(form.type), name: s(form.type) || s(form.name),
    bedType: s(form.bedType), bedTypes: s(form.bedType),
    price: Number(form.price) || 0,
    originalPrice: Number(form.originalPrice) || Number(form.price) || 0,
    countRooms: Number(form.countRooms) || 1,
    totalRooms: Number(form.countRooms) || 1, description: s(form.description),
    amenities: amenitiesArr, images: imagesArr,
    isOffer: Boolean(form.isOffer), offerName: s(form.offerName),
    offerPriceLess: Number(form.offerPriceLess) || 0,
    ...(s(form.offerExp) ? { offerExp: s(form.offerExp) } : {}),
  }
  if (existingRoomId) entry.roomId = existingRoomId
  return entry
}

/* ─── Shared input style ─────────────────────────────────────── */
const inputCls = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
  color: '#0f172a', background: '#f8fafc',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  outline: 'none', transition: 'all .15s',
}

const FieldInput = ({ label, type = 'text', value, onChange, placeholder, required, min, max }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>
      {label}{required && <span style={{ color: '#f43f5e', marginLeft: 3 }}>*</span>}
    </label>
    <input
      type={type} required={required} min={min} max={max}
      value={value} onChange={onChange} placeholder={placeholder || ''}
      style={inputCls}
      onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)' }}
      onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none' }}
    />
  </div>
)

/* ─── Step Sidebar ───────────────────────────────────────────── */
const StepSidebar = ({ currentStep, completedSteps, hotelName, hotelImage, onStepClick }) => (
  <div style={{
    width: 260, flexShrink: 0, background: '#0f172a', borderRadius: 20,
    padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 8,
    position: 'sticky', top: 24, alignSelf: 'flex-start',
    fontFamily: "'DM Sans', sans-serif",
  }}>
    {/* Hotel identity */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      {hotelImage ? (
        <img src={hotelImage} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={20} color="rgba(255,255,255,0.3)" />
        </div>
      )}
      <div style={{ overflow: 'hidden' }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>Editing</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {hotelName || 'Hotel'}
        </p>
      </div>
    </div>

    {/* Steps */}
    {STEPS.map((step, i) => {
      const done    = completedSteps.includes(step.id)
      const active  = currentStep === step.id
      return (
        <button
          key={step.id} type="button"
          onClick={() => onStepClick(step.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
            transition: 'background .15s', textAlign: 'left', width: '100%',
          }}
          onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
        >
          {/* Circle */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: done ? '#6366f1' : active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
            border: active && !done ? '1.5px solid rgba(99,102,241,0.6)' : 'none',
            fontSize: 11, fontWeight: 700, color: done || active ? '#fff' : 'rgba(255,255,255,0.3)',
          }}>
            {done ? <Check size={13} /> : step.id}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)', margin: 0 }}>
              {step.label}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: 0, marginTop: 1 }}>
              {step.sub}
            </p>
          </div>
        </button>
      )
    })}

    {/* Progress bar */}
    <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Progress</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{completedSteps.length}/{STEPS.length}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
        <div style={{ height: '100%', borderRadius: 3, background: '#6366f1', width: `${(completedSteps.length / STEPS.length) * 100}%`, transition: 'width .4s ease' }} />
      </div>
    </div>
  </div>
)

/* ─── Step Header ────────────────────────────────────────────── */
const StepHeader = ({ step, total }) => (
  <div style={{ marginBottom: 28 }}>
    <p style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
      Step {step.id} of {total}
    </p>
    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>
      {step.label}
    </h2>
    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#64748b', marginTop: 6 }}>
      {step.sub}
    </p>
    <div style={{ width: 40, height: 3, background: '#6366f1', borderRadius: 2, marginTop: 14 }} />
  </div>
)

/* ─── Nav buttons ────────────────────────────────────────────── */
const NavRow = ({ currentStep, totalSteps, onPrev, onNext, onSave, saving }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1.5px solid #f1f5f9' }}>
    <button
      type="button" onClick={onPrev} disabled={currentStep === 1}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
        borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'transparent',
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
        color: currentStep === 1 ? '#cbd5e1' : '#64748b', cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
        transition: 'all .15s',
      }}
    >
      <ArrowLeft size={15} /> Back
    </button>

    <div style={{ display: 'flex', gap: 10 }}>
      {/* Always show save hotel */}
      <button
        type="button" onClick={onSave} disabled={saving}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
          color: '#0f172a', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all .15s',
        }}
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Save
      </button>

      {currentStep < totalSteps && (
        <button
          type="button" onClick={onNext}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
            borderRadius: 10, border: 'none', background: '#6366f1',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            color: '#fff', cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#4f46e5' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#6366f1' }}
        >
          Continue <ArrowRight size={15} />
        </button>
      )}
    </div>
  </div>
)

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
function HotelEditPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { id }   = useParams()

  const { selectedHotel, loading, updating, error, updateSuccess } =
    useSelector((state) => state.hotel)

  const [currentStep,     setCurrentStep]     = useState(1)
  const [completedSteps,  setCompletedSteps]  = useState([])
  const [hotelForm,       setHotelForm]       = useState(() => createHotelForm(null))
  const [roomForm,        setRoomForm]        = useState(createEmptyRoomForm)
  const [editingRoomId,   setEditingRoomId]   = useState(null)
  const [rooms,           setRooms]           = useState([])
  const [deletedRoomIds,  setDeletedRoomIds]  = useState([])
  const [foodForm,        setFoodForm]        = useState(createEmptyFoodForm)
  const [editingFoodId,   setEditingFoodId]   = useState(null)
  const [foods,           setFoods]           = useState([])
  const [deletedFoodIds,  setDeletedFoodIds]  = useState([])
  const [policies,        setPolicies]        = useState(createEmptyPolicies)
  const [policyLoading,   setPolicyLoading]   = useState(false)
  const [policyMsg,       setPolicyMsg]       = useState(null)

  const hotel          = selectedHotel?.data || selectedHotel
  const displayHotelId = id || hotel?.hotelId || hotel?._id
  const hotelImage     = hotel?.basicInfo?.images?.[0] || hotel?.images?.[0] || ''
  const listPath       = location.state?.from ||
    (location.pathname.startsWith('/your-hotels') ? '/your-hotels' : '/hotels')

  const normalizedRooms = useMemo(
    () => (Array.isArray(hotel?.rooms) ? hotel.rooms.map(normalizeRoom) : []),
    [hotel?.rooms],
  )
  const normalizedFoods = useMemo(
    () => (Array.isArray(hotel?.foods) ? hotel.foods.map(normalizeFood) : []),
    [hotel?.foods],
  )

  useEffect(() => { setRooms(normalizedRooms) }, [normalizedRooms])
  useEffect(() => { setFoods(normalizedFoods) }, [normalizedFoods])
  useEffect(() => { if (id) dispatch(getHotelById(id)) }, [dispatch, id])
  useEffect(() => { if (hotel) setHotelForm(createHotelForm(hotel)) }, [hotel])
  useEffect(() => {
    if (!hotel) return
    const dp = hotel?.policies?.[0]?.detailed || hotel?.policies?.[0] || {}
    setPolicies({
      checkInPolicy:     dp.checkInPolicy     || '',
      checkOutPolicy:    dp.checkOutPolicy    || '',
      hotelsPolicy:      dp.hotelsPolicy      || '',
      outsideFoodPolicy: dp.outsideFoodPolicy || '',
      cancellationPolicy:dp.cancellationPolicy|| '',
      refundPolicy:      dp.refundPolicy      || '',
      paymentMode:       dp.paymentMode       || '',
      petsAllowed:             dp.petsAllowed             || '',
      bachelorAllowed:         dp.bachelorAllowed         || '',
      smokingAllowed:          dp.smokingAllowed          || '',
      alcoholAllowed:          dp.alcoholAllowed          || '',
      unmarriedCouplesAllowed: dp.unmarriedCouplesAllowed || '',
      internationalGuestAllowed: dp.internationalGuestAllowed || '',
      onDoubleSharing:    dp.onDoubleSharing    || '',
      onTrippleSharing:   dp.onTrippleSharing   || '',
      onQuadSharing:      dp.onQuadSharing      || '',
      onBulkBooking:      dp.onBulkBooking      || '',
      onMoreThanFour:     dp.onMoreThanFour     || '',
      offDoubleSharing:   dp.offDoubleSharing   || '',
      offTrippleSharing:  dp.offTrippleSharing  || '',
      offQuadSharing:     dp.offQuadSharing     || '',
      offBulkBooking:     dp.offBulkBooking     || '',
      offMoreThanFour:    dp.offMoreThanFour    || '',
      onDoubleSharingAp:  dp.onDoubleSharingAp  || '',
      onTrippleSharingAp: dp.onTrippleSharingAp || '',
      onQuadSharingAp:    dp.onQuadSharingAp    || '',
      onBulkBookingAp:    dp.onBulkBookingAp    || '',
      onMoreThanFourAp:   dp.onMoreThanFourAp   || '',
      offDoubleSharingAp: dp.offDoubleSharingAp || '',
      offTrippleSharingAp:dp.offTrippleSharingAp|| '',
      offQuadSharingAp:   dp.offQuadSharingAp   || '',
      offBulkBookingAp:   dp.offBulkBookingAp   || '',
      offMoreThanFourAp:  dp.offMoreThanFourAp  || '',
      onDoubleSharingMAp:  dp.onDoubleSharingMAp  || '',
      onTrippleSharingMAp: dp.onTrippleSharingMAp || '',
      onQuadSharingMAp:    dp.onQuadSharingMAp    || '',
      onBulkBookingMAp:    dp.onBulkBookingMAp    || '',
      onMoreThanFourMAp:   dp.onMoreThanFourMAp   || '',
      offDoubleSharingMAp: dp.offDoubleSharingMAp || '',
      offTrippleSharingMAp:dp.offTrippleSharingMAp|| '',
      offQuadSharingMAp:   dp.offQuadSharingMAp   || '',
      offBulkBookingMAp:   dp.offBulkBookingMAp   || '',
      offMoreThanFourMAp:  dp.offMoreThanFourMAp  || '',
    })
  }, [hotel])

  useEffect(() => {
    if (!updateSuccess) return
    const t = setTimeout(() => dispatch(clearHotelUpdateStatus()), 2800)
    return () => clearTimeout(t)
  }, [dispatch, updateSuccess])

  useEffect(() => {
    if (!policyMsg) return
    const t = setTimeout(() => setPolicyMsg(null), 3000)
    return () => clearTimeout(t)
  }, [policyMsg])

  const setHotelField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setHotelForm((p) => ({ ...p, [key]: value }))
  }
  const setRoomField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setRoomForm((p) => ({ ...p, [key]: value }))
  }
  const setFoodField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFoodForm((p) => ({ ...p, [key]: value }))
  }

  const markComplete = (step) => {
    setCompletedSteps((p) => p.includes(step) ? p : [...p, step])
  }

  const goNext = () => {
    markComplete(currentStep)
    setCurrentStep((s) => Math.min(s + 1, STEPS.length))
  }
  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const resetRoomEditor = () => { setEditingRoomId(null); setRoomForm(createEmptyRoomForm()) }
  const resetFoodEditor = () => { setEditingFoodId(null); setFoodForm(createEmptyFoodForm()) }

  const savePolicies = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!displayHotelId) return
    setPolicyLoading(true)
    try {
      await api.patch('/patch-a-new/policy-to-your/hotel', { hotelId: displayHotelId, ...policies })
      setPolicyMsg({ type: 'success', text: 'Policies saved!' })
      dispatch(getHotelById(displayHotelId))
    } catch (err) {
      setPolicyMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save policies.' })
    } finally {
      setPolicyLoading(false)
    }
  }

  const saveHotel = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!displayHotelId) return
    const hotelPayload  = buildHotelPayload(hotelForm)
    const roomsPayload  = rooms.map((r) => buildRoomEntry(r, r.roomId || null))
    const deletionPayload = deletedRoomIds.map((rid) => ({ roomId: rid, _delete: true }))
    const foodsPayload = foods.map((f) => buildFoodEntry(f, f.foodId || null))
    const foodDeletionPayload = deletedFoodIds.map((fid) => ({ foodId: fid, _delete: true }))
    try {
      await dispatch(updateHotelInfo({
        hotelId: displayHotelId,
        hotelData: {
          ...hotelPayload,
          rooms: [...roomsPayload, ...deletionPayload],
          foods: [...foodsPayload, ...foodDeletionPayload],
        },
      })).unwrap()
      setDeletedRoomIds([])
      setDeletedFoodIds([])
      dispatch(getHotelById(displayHotelId))
    } catch (err) {
      console.error('saveHotel failed', err)
    }
  }

  const saveRoomLocal = (e) => {
    if (e?.preventDefault) e.preventDefault()
    const makeRoom = (existingId) => {
      const existing = existingId ? rooms.find((r) => r._id === existingId) : null
      return {
        _id: existingId || `room-temp-${Date.now()}`,
        roomId: existing?.roomId || '',
        name: roomForm.type || `Room ${rooms.length + 1}`,
        type: roomForm.type, bedType: roomForm.bedType,
        price: String(roomForm.price ?? ''), countRooms: String(roomForm.countRooms ?? ''),
        totalRooms: String(roomForm.countRooms ?? ''), description: roomForm.description,
        amenities: roomForm.amenities, images: roomForm.images,
        isOffer: roomForm.isOffer, offerName: roomForm.offerName,
      }
    }
    if (editingRoomId) {
      setRooms(rooms.map((r) => r._id === editingRoomId ? { ...r, ...makeRoom(editingRoomId) } : r))
    } else {
      setRooms((p) => [...p, makeRoom(null)])
    }
    resetRoomEditor()
  }

  const handleRoomDelete = (room) => {
    if (!room?._id) return
    if (!window.confirm('Delete this room?')) return
    if (room.roomId) setDeletedRoomIds((p) => [...p, room.roomId])
    setRooms((p) => p.filter((r) => r._id !== room._id))
    if (editingRoomId === room._id) resetRoomEditor()
  }

  const handleRoomEdit = (room) => {
    setEditingRoomId(room._id)
    setRoomForm({
      type: room.type, bedType: room.bedType, price: room.price,
      originalPrice: room.originalPrice || room.price,
      countRooms: room.countRooms, description: room.description,
      amenities: room.amenities, images: room.images,
      isOffer: room.isOffer, offerName: room.offerName,
      offerPriceLess: room.offerPriceLess || '',
      offerExp: room.offerExp || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveFoodLocal = (e) => {
    if (e?.preventDefault) e.preventDefault()
    const makeFood = (existingId) => {
      const existing = existingId ? foods.find((f) => f._id === existingId) : null
      return {
        _id: existingId || `food-temp-${Date.now()}`,
        foodId: existing?.foodId || '',
        name: foodForm.name,
        foodType: foodForm.foodType || 'Veg',
        price: String(foodForm.price ?? ''),
        about: foodForm.about,
        images: foodForm.images,
      }
    }
    if (editingFoodId) {
      setFoods(foods.map((f) => f._id === editingFoodId ? { ...f, ...makeFood(editingFoodId) } : f))
    } else {
      setFoods((p) => [...p, makeFood(null)])
    }
    resetFoodEditor()
  }

  const handleFoodDelete = (food) => {
    if (!food?._id) return
    if (!window.confirm('Delete this food item?')) return
    if (food.foodId) setDeletedFoodIds((p) => [...p, food.foodId])
    setFoods((p) => p.filter((f) => f._id !== food._id))
    if (editingFoodId === food._id) resetFoodEditor()
  }

  const handleFoodEdit = (food) => {
    setEditingFoodId(food._id)
    setFoodForm({
      name: food.name,
      foodType: food.foodType || 'Veg',
      price: food.price,
      about: food.about,
      images: food.images,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Loading / error states ──────────────────────────────── */
  if (loading && !hotel) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: '#94a3b8' }}>
      <FontInjector />
      <Breadcrumb />
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '40px auto', display: 'block' }} />
      <p style={{ fontSize: 13 }}>Loading hotel workspace…</p>
    </div>
  )

  if (error && !hotel) return (
    <div style={{ padding: 40, fontFamily: "'DM Sans', sans-serif" }}>
      <FontInjector />
      <Breadcrumb />
      <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '16px 20px', color: '#be123c', fontSize: 13, fontWeight: 600 }}>{error}</div>
    </div>
  )

  if (!hotel) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: '#94a3b8' }}>
      <FontInjector />
      <Breadcrumb />
      <p style={{ fontSize: 13 }}>Hotel not found.</p>
    </div>
  )

  const currentStepObj = STEPS.find((s) => s.id === currentStep)

  /* ── Main render ─────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 60px', fontFamily: "'DM Sans', sans-serif" }}>
      <FontInjector />
      <Breadcrumb />

      {/* Page title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          type="button" onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #e2e8f0',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#475569', flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6366f1', fontWeight: 700, margin: 0 }}>
            Hotel Workspace
          </p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>
            Edit Hotel
          </h1>
        </div>

        {/* Banners */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {updateSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} /> {updateSuccess}
            </div>
          )}
          {error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#be123c' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Sidebar ── */}
        <StepSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
          hotelName={hotelForm.hotelName}
          hotelImage={hotelImage}
          onStepClick={(id) => setCurrentStep(id)}
        />

        {/* ── Content panel ── */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 20,
          border: '1.5px solid #f1f5f9', padding: '32px 32px 28px',
          boxShadow: '0 4px 24px rgba(15,23,42,0.04)',
        }}>
          <StepHeader step={currentStepObj} total={STEPS.length} />

          {/* ════ STEP 1: Basic Info ════════════════════════════════ */}
          {currentStep === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px 20px' }}>
              <FieldInput label="Hotel Name" required value={hotelForm.hotelName} onChange={setHotelField('hotelName')} />
              <FieldInput label="Hotel Email" type="email" required value={hotelForm.hotelEmail} onChange={setHotelField('hotelEmail')} />
              <FieldInput label="Owner" value={hotelForm.owner} onChange={setHotelField('owner')} />
              <FieldInput label="Phone" value={hotelForm.phone} onChange={setHotelField('phone')} />
              <div style={{ gridColumn: '1 / -1' }}>
                <FieldInput label="Address" value={hotelForm.address} onChange={setHotelField('address')} />
              </div>
              <FieldInput label="City" required value={hotelForm.city} onChange={setHotelField('city')} />
              <FieldInput label="State" required value={hotelForm.state} onChange={setHotelField('state')} />
              <FieldInput label="Pin Code" value={hotelForm.pinCode} onChange={setHotelField('pinCode')} />
              <FieldInput label="Destination" value={hotelForm.destination} onChange={setHotelField('destination')} placeholder="e.g. Shimla" />
            </div>
          )}

          {/* ════ STEP 2: Property Details ══════════════════════════ */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px 20px' }}>
                <FieldInput label="Star Rating" type="number" min="0" max="5" value={hotelForm.starRating} onChange={setHotelField('starRating')} placeholder="e.g. 4" />
                <FieldInput label="Property Type" value={hotelForm.propertyType} onChange={setHotelField('propertyType')} placeholder="Hotel, Resort" />
                <FieldInput label="Hotel Category" value={hotelForm.hotelCategory} onChange={setHotelField('hotelCategory')} placeholder="e.g. Luxury" />
                <FieldInput label="Latitude" value={hotelForm.latitude} onChange={setHotelField('latitude')} placeholder="e.g. 31.1048" />
                <FieldInput label="Longitude" value={hotelForm.longitude} onChange={setHotelField('longitude')} placeholder="e.g. 77.1734" />
                <FieldInput label="General Manager Contact" value={hotelForm.generalManagerContact} onChange={setHotelField('generalManagerContact')} placeholder="+91 XXXXXXXXXX" />
                <FieldInput label="Sales Manager Contact" value={hotelForm.salesManagerContact} onChange={setHotelField('salesManagerContact')} placeholder="+91 XXXXXXXXXX" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>Local ID</label>
                  <select
                    value={hotelForm.localId} onChange={setHotelField('localId')}
                    style={{ ...inputCls }}
                    onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
                    onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                  >
                    <option value="Accepted">Accepted</option>
                    <option value="Not Accepted">Not Accepted</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>
                  Customer Welcome Note
                </label>
                <textarea
                  value={hotelForm.customerWelcomeNote} onChange={setHotelField('customerWelcomeNote')} rows={3}
                  placeholder="Welcome message for guests…"
                  style={{ ...inputCls, resize: 'vertical', lineHeight: 1.7 }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)' }}
                  onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>
                  Description
                </label>
                <textarea
                  value={hotelForm.description} onChange={setHotelField('description')} rows={5}
                  placeholder="Brief description of the property for guests and internal ops…"
                  style={{ ...inputCls, resize: 'vertical', lineHeight: 1.7 }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)' }}
                  onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Status toggles */}
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <p style={{ width: '100%', margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>
                  Visibility Settings
                </p>
                {[
                  { label: 'Show on Front Page', key: 'onFront' },
                  { label: 'Mark as Accepted',   key: 'isAccepted' },
                ].map(({ label, key }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox" checked={hotelForm[key]} onChange={setHotelField(key)}
                      style={{ width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ════ STEP 3: Rooms ════════════════════════════════════ */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Room form */}
              <div style={{ background: '#f8fafc', borderRadius: 14, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 2px' }}>
                      {editingRoomId ? 'Edit Room' : 'Add Room'}
                    </p>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                      {editingRoomId ? 'Changes will save locally. Hit "Save" to push to server.' : 'Fill in room details and add to the list below.'}
                    </p>
                  </div>
                  {editingRoomId && (
                    <button type="button" onClick={resetRoomEditor}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                      <X size={13} /> Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={saveRoomLocal}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 16px' }}>
                    <FieldInput label="Room Type" required value={roomForm.type} onChange={setRoomField('type')} placeholder="Deluxe Room" />
                    <FieldInput label="Bed Type" value={roomForm.bedType} onChange={setRoomField('bedType')} placeholder="King Bed" />
                    <FieldInput label="Price (₹)" type="number" min="0" value={roomForm.price} onChange={setRoomField('price')} placeholder="2999" />
                    <FieldInput label="Total Rooms" type="number" min="1" value={roomForm.countRooms} onChange={setRoomField('countRooms')} placeholder="10" />
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldInput label="Amenities (comma separated)" value={roomForm.amenities} onChange={setRoomField('amenities')} placeholder="WiFi, AC, Breakfast" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldInput label="Image URLs (comma separated)" value={roomForm.images} onChange={setRoomField('images')} placeholder="https://..." />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>Description</label>
                      <textarea
                        value={roomForm.description} onChange={setRoomField('description')} rows={3}
                        placeholder="Short room description…"
                        style={{ ...inputCls, resize: 'vertical', lineHeight: 1.7 }}
                        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
                        onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                      />
                    </div>
                  </div>

                  {/* Offer row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, padding: '14px 16px', background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                      <input type="checkbox" checked={roomForm.isOffer} onChange={setRoomField('isOffer')} style={{ width: 15, height: 15, accentColor: '#6366f1' }} />
                      Active Offer
                    </label>
                    {roomForm.isOffer && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px 14px' }}>
                        <input
                          value={roomForm.offerName} onChange={setRoomField('offerName')} placeholder="Offer name e.g. Flat 20% off"
                          style={{ ...inputCls }}
                          onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
                          onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                        />
                        <FieldInput label="Original Price (₹)" type="number" min="0" value={roomForm.originalPrice} onChange={setRoomField('originalPrice')} placeholder="3999" />
                        <FieldInput label="Offer Price Less (₹)" type="number" min="0" value={roomForm.offerPriceLess} onChange={setRoomField('offerPriceLess')} placeholder="500" />
                        <FieldInput label="Offer Expiry" type="date" value={roomForm.offerExp} onChange={setRoomField('offerExp')} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button type="submit"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
                        borderRadius: 10, border: 'none', background: '#6366f1',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                        color: '#fff', cursor: 'pointer',
                      }}>
                      {editingRoomId ? <><PencilLine size={14} /> Update Room</> : <><Plus size={14} /> Add Room</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Room list */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
                    Saved Rooms ({rooms.length})
                  </p>
                  {updating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6366f1' }}>
                      <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Syncing…
                    </div>
                  )}
                </div>

                {rooms.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 12, border: '1.5px dashed #e2e8f0' }}>
                    <BedDouble size={28} color="#cbd5e1" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No rooms added yet. Use the form above to add the first room.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rooms.map((room) => (
                      <div key={room._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                          borderRadius: 12, border: `1.5px solid ${editingRoomId === room._id ? '#6366f1' : '#f1f5f9'}`,
                          background: editingRoomId === room._id ? '#eef2ff' : '#fafafa',
                          transition: 'all .15s',
                        }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BedDouble size={18} color="#7c3aed" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{room.name}</p>
                            {room.isOffer && room.offerName && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20 }}>{room.offerName}</span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                            {room.bedType || '—'} &nbsp;·&nbsp; ₹{room.price} &nbsp;·&nbsp; {room.countRooms} rooms
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button type="button" onClick={() => handleRoomEdit(room)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <PencilLine size={12} /> Edit
                          </button>
                          <button type="button" onClick={() => handleRoomDelete(room)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #fecdd3', background: '#fff1f2', fontSize: 12, fontWeight: 600, color: '#be123c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Trash2 size={12} /> Del
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ STEP 4: Dining ════════════════════════════════════ */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: '#f8fafc', borderRadius: 14, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 2px' }}>
                      {editingFoodId ? 'Edit Food Item' : 'Add Food Item'}
                    </p>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                      {editingFoodId ? 'Changes will save locally. Hit "Save" to push to server.' : 'Create your hotel menu and keep dining options updated.'}
                    </p>
                  </div>
                  {editingFoodId && (
                    <button type="button" onClick={resetFoodEditor}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                      <X size={13} /> Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={saveFoodLocal}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 16px' }}>
                    <FieldInput label="Food Name" required value={foodForm.name} onChange={setFoodField('name')} placeholder="Paneer Butter Masala" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>Food Type</label>
                      <select
                        value={foodForm.foodType}
                        onChange={setFoodField('foodType')}
                        style={{ ...inputCls }}
                        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
                        onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                      >
                        <option value="Veg">Veg</option>
                        <option value="Non Veg">Non Veg</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                    </div>
                    <FieldInput label="Price (₹)" type="number" min="0" value={foodForm.price} onChange={setFoodField('price')} placeholder="299" />
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8' }}>Description</label>
                      <textarea
                        value={foodForm.about} onChange={setFoodField('about')} rows={3}
                        placeholder="Short description for guests…"
                        style={{ ...inputCls, resize: 'vertical', lineHeight: 1.7 }}
                        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
                        onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldInput label="Image URLs (comma separated)" value={foodForm.images} onChange={setFoodField('images')} placeholder="https://..." />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button type="submit"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
                        borderRadius: 10, border: 'none', background: '#6366f1',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                        color: '#fff', cursor: 'pointer',
                      }}>
                      {editingFoodId ? <><PencilLine size={14} /> Update Food</> : <><Plus size={14} /> Add Food</>}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
                    Saved Food Items ({foods.length})
                  </p>
                  {updating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6366f1' }}>
                      <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Syncing…
                    </div>
                  )}
                </div>

                {foods.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 12, border: '1.5px dashed #e2e8f0' }}>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No food items added yet. Use the form above to add the first menu item.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {foods.map((food) => (
                      <div key={food._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                          borderRadius: 12, border: `1.5px solid ${editingFoodId === food._id ? '#6366f1' : '#f1f5f9'}`,
                          background: editingFoodId === food._id ? '#eef2ff' : '#fafafa',
                          transition: 'all .15s',
                        }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#c2410c' }}>{food.foodType?.slice(0, 3)?.toUpperCase() || 'FOOD'}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{food.name || 'Untitled food item'}</p>
                            <span style={{ fontSize: 10, fontWeight: 700, background: food.foodType?.toLowerCase() === 'veg' ? '#dcfce7' : '#fee2e2', color: food.foodType?.toLowerCase() === 'veg' ? '#15803d' : '#b91c1c', padding: '2px 8px', borderRadius: 20 }}>
                              {food.foodType || 'Veg'}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                            ₹{food.price || 0}{food.about ? ` · ${food.about}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button type="button" onClick={() => handleFoodEdit(food)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <PencilLine size={12} /> Edit
                          </button>
                          <button type="button" onClick={() => handleFoodDelete(food)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #fecdd3', background: '#fff1f2', fontSize: 12, fontWeight: 600, color: '#be123c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Trash2 size={12} /> Del
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ STEP 5: Policies ══════════════════════════════════ */}
          {currentStep === 5 && (
            <div>
              {policyMsg && (
                <div style={{
                  marginBottom: 20, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: policyMsg.type === 'success' ? '#f0fdf4' : '#fff1f2',
                  border: `1px solid ${policyMsg.type === 'success' ? '#bbf7d0' : '#fecdd3'}`,
                  color: policyMsg.type === 'success' ? '#15803d' : '#be123c',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {policyMsg.type === 'success' ? <CheckCircle2 size={14} /> : <X size={14} />}
                  {policyMsg.text}
                </div>
              )}

              {/* General Policies */}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 12px' }}>
                General Policies
              </p>
              {POLICY_LABELS.map(({ label, key }) => (
                <PolicyEditor
                  key={key} label={label}
                  value={policies[key]}
                  onChange={(v) => setPolicies((p) => ({ ...p, [key]: v }))}
                />
              ))}

              {/* Guest Rules */}
              <div style={{ margin: '24px 0 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 12px' }}>
                  Guest Rules
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px 16px' }}>
                  {GUEST_RULES.map(({ label, key }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>{label}</label>
                      <select
                        value={policies[key]} onChange={(e) => setPolicies((p) => ({ ...p, [key]: e.target.value }))}
                        style={{ ...inputCls }}
                        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
                        onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                      >
                        <option value="">-- Select --</option>
                        {YES_NO.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seasonal Pricing */}
              <div style={{ margin: '24px 0 12px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 16px' }}>
                  Seasonal Pricing (per person per night)
                </p>
                {SEASONAL_SECTIONS.map(({ label, prefix, suffix }) => (
                  <div key={`${prefix}${suffix}`} style={{ marginBottom: 18, background: '#f8fafc', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', margin: '0 0 10px', letterSpacing: '0.06em' }}>{label}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px 12px' }}>
                      {SEASONAL_COLS.map(({ col, keySuffix }) => {
                        const cap1 = (str) => str.charAt(0).toUpperCase() + str.slice(1)
                        const fieldKey = `${prefix}${cap1(keySuffix)}${suffix}`
                        return (
                          <div key={fieldKey} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>{col}</label>
                            <input
                              type="number" min="0"
                              value={policies[fieldKey] ?? ''}
                              onChange={(e) => setPolicies((p) => ({ ...p, [fieldKey]: e.target.value }))}
                              placeholder="₹"
                              style={{ ...inputCls, fontSize: 12 }}
                              onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff' }}
                              onBlur={(e)  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button" onClick={savePolicies} disabled={policyLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 24px', borderRadius: 10, border: 'none',
                  background: '#6366f1', fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, fontWeight: 600, color: '#fff', cursor: policyLoading ? 'not-allowed' : 'pointer',
                  opacity: policyLoading ? 0.7 : 1,
                }}>
                {policyLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={15} />}
                Save Policies
              </button>
            </div>
          )}

          {/* ── Nav row ── */}
          <NavRow
            currentStep={currentStep} totalSteps={STEPS.length}
            onPrev={goPrev} onNext={goNext}
            onSave={saveHotel} saving={updating}
          />
        </div>
      </div>
    </div>
  )
}

export default HotelEditPage
