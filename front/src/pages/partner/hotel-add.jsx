import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Building2, ImagePlus, Loader2, Plus, X,
  MapPin, Phone, Mail, Star, Calendar, Check,
  Settings2, UtensilsCrossed, ShieldCheck, Layers, Trash2, BedDouble,
  ChevronRight, ChevronLeft, Eye,
} from 'lucide-react'
import baseURL from '../../utils/baseURL'

/* ── helpers ── */
const s = (v) => String(v ?? '').trim()

const createEmptyRoom = () => ({
  type: '', bedTypes: '', price: '', originalPrice: '', countRooms: '1',
  isOffer: false, offerName: '', offerPriceLess: '', offerExp: '',
  imageFiles: [], imagePreviews: [],
})

const createEmptyFood = () => ({
  name: '', foodType: 'Veg', price: '', about: '',
  imageFiles: [], imagePreviews: [],
})

const createEmptyPolicies = () => ({
  checkInPolicy: '', checkOutPolicy: '', hotelsPolicy: '',
  cancellationPolicy: '', outsideFoodPolicy: '', refundPolicy: '',
  paymentMode: '', petsAllowed: '', bachelorAllowed: '',
  smokingAllowed: '', alcoholAllowed: '', unmarriedCouplesAllowed: '',
  internationalGuestAllowed: '',
  onDoubleSharing: '', onTrippleSharing: '', onQuadSharing: '', onBulkBooking: '', onMoreThanFour: '',
  offDoubleSharing: '', offTrippleSharing: '', offQuadSharing: '', offBulkBooking: '', offMoreThanFour: '',
  onDoubleSharingAp: '', onTrippleSharingAp: '', onQuadSharingAp: '', onBulkBookingAp: '', onMoreThanFourAp: '',
  offDoubleSharingAp: '', offTrippleSharingAp: '', offQuadSharingAp: '', offBulkBookingAp: '', offMoreThanFourAp: '',
  onDoubleSharingMAp: '', onTrippleSharingMAp: '', onQuadSharingMAp: '', onBulkBookingMAp: '', onMoreThanFourMAp: '',
  offDoubleSharingMAp: '', offTrippleSharingMAp: '', offQuadSharingMAp: '', offBulkBookingMAp: '', offMoreThanFourMAp: '',
})

const createEmptyForm = () => ({
  hotelName: '', description: '', hotelOwnerName: '', destination: '',
  state: '', city: '', landmark: '', pinCode: '', hotelCategory: '',
  numRooms: '', latitude: '', longitude: '', starRating: '', propertyType: '',
  contact: '', hotelEmail: '', customerWelcomeNote: '',
  generalManagerContact: '', salesManagerContact: '',
  localId: 'Accepted',
  startDate: '', endDate: '',
})

/* ── Step config ── */
const STEPS = [
  { id: 0, label: 'Identity',   short: '01', icon: Building2,      color: '#b08d57' },
  { id: 1, label: 'Location',   short: '02', icon: MapPin,          color: '#4e8c72' },
  { id: 2, label: 'Details',    short: '03', icon: Star,            color: '#8b6e3a' },
  { id: 3, label: 'Amenities',  short: '04', icon: Layers,          color: '#3a6e8c' },
  { id: 4, label: 'Dining',     short: '05', icon: UtensilsCrossed, color: '#8c4a3a' },
  { id: 5, label: 'Policies',   short: '06', icon: ShieldCheck,     color: '#3a3a8c' },
  { id: 6, label: 'Rooms',      short: '07', icon: BedDouble,       color: '#6e3a8c' },
  { id: 7, label: 'Preview',    short: '08', icon: Eye,             color: '#0369a1' },
  { id: 8, label: 'Finalize',   short: '09', icon: Settings2,       color: '#2a4a2a' },
]

/* ── Input style factory ── */
const makeInp = () => ({
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px',
  fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: '#1a1612',
  background: '#fff',
  border: '1px solid #ddd5c8',
  borderRadius: 6,
  outline: 'none',
  transition: 'border-color .18s, box-shadow .18s',
})

const onFocus = (e) => {
  e.target.style.borderColor = '#b08d57'
  e.target.style.boxShadow = '0 0 0 3px rgba(176,141,87,.12)'
}
const onBlur = (e) => {
  e.target.style.borderColor = '#ddd5c8'
  e.target.style.boxShadow = 'none'
}

/* ── Sub-components ── */
function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: '#7a6e5e',
      marginBottom: 7,
    }}>
      {children}
      {required && <span style={{ color: '#c0392b', fontSize: 14, lineHeight: 1 }}>*</span>}
    </label>
  )
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {hint && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#b0a898', marginTop: 5, fontStyle: 'italic' }}>{hint}</p>}
    </div>
  )
}

function SectionTitle({ icon: Icon, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color={color} strokeWidth={1.8} />
      </div>
      <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 600, color: '#1a1612' }}>{label}</span>
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px', gridColumn: '1 / -1' }}>
      <div style={{ flex: 1, height: '0.5px', background: '#e8e0d5' }} />
      {label && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#c0b4a0', letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: '0.5px', background: '#e8e0d5' }} />
    </div>
  )
}

function PanelCard({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ede6dc',
      borderRadius: 12,
      padding: '28px 28px',
      marginBottom: 20,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Sidebar ── */
function StepSidebar({ current, onJump, completedSteps }) {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column',
      padding: '32px 0',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '0 24px 28px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, color: '#9ca3af', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 5 }}>Partner</div>
        <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 18, color: '#111827', fontWeight: 700 }}>Hotel Registration</div>
      </div>

      <div style={{ flex: 1, padding: '24px 0', overflowY: 'auto' }}>
        {STEPS.map((step) => {
          const isActive    = current === step.id
          const isCompleted = completedSteps.has(step.id)
          const isPast      = step.id < current
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onJump(step.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 24px',
                background: isActive ? '#eff6ff' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all .18s',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                background: isActive ? '#3b82f6' : isPast || isCompleted ? '#ecfdf5' : '#f3f4f6',
                border: isActive ? 'none' : isPast || isCompleted ? '1px solid #6ee7b7' : '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .18s',
              }}>
                {(isPast || isCompleted) && !isActive
                  ? <Check size={12} color="#059669" strokeWidth={2.5} />
                  : <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, fontWeight: 700, color: isActive ? '#fff' : '#9ca3af', letterSpacing: '0.04em' }}>{step.short}</span>
                }
              </div>
              <div>
                <div style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: 12, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#1d4ed8' : isPast || isCompleted ? '#6b7280' : '#9ca3af',
                  transition: 'color .18s',
                }}>{step.label}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, color: '#9ca3af', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>PROGRESS</div>
        <div style={{ height: 3, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((current + 1) / STEPS.length) * 100}%`,
            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            borderRadius: 99,
            transition: 'width .4s ease',
          }} />
        </div>
        <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, color: '#9ca3af', marginTop: 6 }}>
          Step {current + 1} of {STEPS.length}
        </div>
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function HotelAdd() {
  const navigate = useNavigate()

  const [step, setStep]             = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())

  const [form, setForm]             = useState(createEmptyForm)
  const [images, setImages]         = useState([])
  const [previews, setPreviews]     = useState([])
  const [amenities, setAmenities]   = useState([])
  const [amenityInput, setAmenityInput] = useState('')
  const [rooms, setRooms]           = useState([createEmptyRoom()])
  const [foods, setFoods]           = useState([createEmptyFood()])
  const [policies, setPolicies]     = useState(createEmptyPolicies)
  const [status, setStatus]         = useState({ type: null, msg: '' })
  const [submitting, setSubmitting] = useState(false)

  const inp = makeInp()

  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const setPolicy = (key) => (e) =>
    setPolicies((p) => ({ ...p, [key]: e.target.value }))

  /* navigation */
  const goTo = (n) => {
    if (n > step) setCompletedSteps((p) => new Set([...p, step]))
    setStep(n)
  }
  const next = () => step < STEPS.length - 1 && goTo(step + 1)
  const prev = () => step > 0 && goTo(step - 1)

  /* hotel images */
  const addImages = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImages((p) => [...p, ...files])
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))])
  }
  const removeImage = (i) => {
    URL.revokeObjectURL(previews[i])
    setImages((p) => p.filter((_, x) => x !== i))
    setPreviews((p) => p.filter((_, x) => x !== i))
  }

  /* amenity tags */
  const addAmenityTag = (raw) => {
    const tags = raw.split(',').map((t) => t.trim()).filter(Boolean)
    const unique = tags.filter((t) => !amenities.includes(t))
    if (unique.length) setAmenities((p) => [...p, ...unique])
  }
  const handleAmenityKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); addAmenityTag(amenityInput); setAmenityInput('')
    }
  }

  /* room helpers */
  const setRoomField = (ri, key, val) =>
    setRooms((p) => p.map((r, i) => i === ri ? { ...r, [key]: val } : r))

  const addRoomImages = (ri, e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setRooms((p) => p.map((r, i) => i === ri ? {
      ...r, imageFiles: [...r.imageFiles, ...files],
      imagePreviews: [...r.imagePreviews, ...files.map((f) => URL.createObjectURL(f))],
    } : r))
  }
  const removeRoomImage = (ri, ii) => {
    setRooms((p) => p.map((r, i) => {
      if (i !== ri) return r
      URL.revokeObjectURL(r.imagePreviews[ii])
      return { ...r, imageFiles: r.imageFiles.filter((_, x) => x !== ii), imagePreviews: r.imagePreviews.filter((_, x) => x !== ii) }
    }))
  }
  const addRoomItem    = () => setRooms((p) => [...p, createEmptyRoom()])
  const removeRoomItem = (ri) => setRooms((p) => { p[ri].imagePreviews.forEach((u) => URL.revokeObjectURL(u)); return p.filter((_, i) => i !== ri) })

  /* food helpers */
  const setFoodField = (fi, key) => (e) =>
    setFoods((p) => p.map((f, i) => i === fi ? { ...f, [key]: e.target.value } : f))

  const addFoodImages = (fi, e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setFoods((p) => p.map((f, i) => i === fi ? {
      ...f, imageFiles: [...f.imageFiles, ...files],
      imagePreviews: [...f.imagePreviews, ...files.map((file) => URL.createObjectURL(file))],
    } : f))
  }
  const removeFoodImage = (fi, ii) => {
    setFoods((p) => p.map((f, i) => {
      if (i !== fi) return f
      URL.revokeObjectURL(f.imagePreviews[ii])
      return { ...f, imageFiles: f.imageFiles.filter((_, x) => x !== ii), imagePreviews: f.imagePreviews.filter((_, x) => x !== ii) }
    }))
  }
  const addFoodItem    = () => setFoods((p) => [...p, createEmptyFood()])
  const removeFoodItem = (fi) => setFoods((p) => { p[fi].imagePreviews.forEach((u) => URL.revokeObjectURL(u)); return p.filter((_, i) => i !== fi) })

  /* submit */
  const handleSubmit = async () => {
    setSubmitting(true)
    setStatus({ type: null, msg: '' })
    try {
      /* 1 — Create hotel */
      const fd = new FormData()
      ;['hotelName','description','hotelOwnerName','destination','state','city','landmark',
        'pinCode','hotelCategory','numRooms','latitude','longitude','starRating','propertyType',
        'contact','hotelEmail','customerWelcomeNote','generalManagerContact',
        'salesManagerContact','localId',
      ].forEach((k) => fd.append(k, s(form[k])))
      if (form.startDate) fd.append('startDate', form.startDate)
      if (form.endDate)   fd.append('endDate',   form.endDate)
      images.forEach((f) => fd.append('images', f))

      const res = await axios.post(`${baseURL}/data/hotels-new/post/upload/data`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const hotelId = res.data?.data?.hotelId
      if (!hotelId) throw new Error('Hotel created but hotelId missing.')
      localStorage.setItem('hotelId', hotelId)

      /* 2 — Amenities */
      if (amenities.length > 0)
        await axios.post(`${baseURL}/create-a-amenities/to-your-hotel`, { hotelId, amenities })

      /* 3 — Foods */
      for (const food of foods.filter((f) => s(f.name))) {
        const ffd = new FormData()
        ffd.append('hotelId', hotelId); ffd.append('name', s(food.name))
        ffd.append('foodType', s(food.foodType)); ffd.append('price', s(food.price))
        ffd.append('about', s(food.about))
        food.imageFiles.forEach((file) => ffd.append('images', file))
        await axios.post(`${baseURL}/add/food-to/your-hotel`, ffd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }

      /* 4 — Policies */
      if (Object.values(policies).some((v) => s(v)))
        await axios.post(`${baseURL}/add-a-new/policy-to-your/hotel`, { hotelId, ...policies })

      /* 5 — Rooms */
      for (const room of rooms.filter((r) => s(r.type))) {
        const rfd = new FormData()
        rfd.append('hotelId', hotelId); rfd.append('type', s(room.type))
        rfd.append('bedTypes', s(room.bedTypes)); rfd.append('price', s(room.price))
        rfd.append('originalPrice', s(room.originalPrice) || s(room.price))
        rfd.append('countRooms', s(room.countRooms) || '1')
        rfd.append('isOffer', room.isOffer)
        if (room.isOffer) {
          rfd.append('offerName', s(room.offerName))
          rfd.append('offerPriceLess', s(room.offerPriceLess))
          if (room.offerExp) rfd.append('offerExp', room.offerExp)
        }
        room.imageFiles.forEach((file) => rfd.append('images', file))
        await axios.post(`${baseURL}/create-a-room-to-your-hotel`, rfd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }

      setStatus({ type: 'success', msg: `Hotel registered! ID: ${hotelId}` })
      setForm(createEmptyForm()); setImages([]); previews.forEach((u) => URL.revokeObjectURL(u))
      setPreviews([]); setAmenities([]); setAmenityInput('')
      setFoods([createEmptyFood()]); setRooms([createEmptyRoom()]); setPolicies(createEmptyPolicies())
      setCompletedSteps(new Set(STEPS.map((st) => st.id)))
    } catch (err) {
      setStatus({ type: 'error', msg: err?.response?.data?.message || err?.message || 'Something went wrong.' })
    } finally {
      setSubmitting(false)
    }
  }

  /* grid layouts */
  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 22px' }
  const g3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px 22px' }
  const YES_NO = ['Yes', 'No', 'Not Allowed', 'Allowed']

  /* ── Step panels ── */
  const stepContent = {

    /* 0 — Identity */
    0: (
      <>
        <PanelCard>
          <SectionTitle icon={Building2} label="Hotel Identity" color="#b08d57" />
          <div style={{ marginBottom: 20 }}>
            <Field label="Hotel Name" required>
              <input required value={form.hotelName} onChange={set('hotelName')}
                placeholder="e.g. Taj Palace, The Grand Oberoi, Rambagh Palace"
                style={{ ...inp, fontSize: 15, padding: '13px 15px', fontFamily: "'Playfair Display', Georgia, serif" }}
                onFocus={onFocus} onBlur={onBlur} />
            </Field>
          </div>
          <div style={g2}>
            <Field label="Owner Name">
              <input value={form.hotelOwnerName} onChange={set('hotelOwnerName')} placeholder="Rahul Sharma" style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>
            <Field label="Property Type">
              <input value={form.propertyType} onChange={set('propertyType')} placeholder="Hotel · Resort · Villa · Boutique" style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>
            <Field label="Hotel Category">
              <input value={form.hotelCategory} onChange={set('hotelCategory')} placeholder="Luxury · Business · Budget · Heritage" style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>
            <Field label="Number of Rooms">
              <input type="number" value={form.numRooms} onChange={set('numRooms')} placeholder="50" style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>
          </div>
        </PanelCard>
        <PanelCard>
          <Field label="Description" hint="Hotel ki ek compelling description — ambiance, unique experience, special features, history…">
            <textarea value={form.description} onChange={set('description')} rows={5}
              placeholder="Describe your property in a way that captivates guests…"
              style={{ ...inp, resize: 'vertical', lineHeight: 1.8 }} onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <div style={{ marginTop: 18 }}>
            <Field label="Customer Welcome Note">
              <textarea value={form.customerWelcomeNote} onChange={set('customerWelcomeNote')} rows={3}
                placeholder="Dear Guest, welcome to our property…"
                style={{ ...inp, resize: 'vertical', lineHeight: 1.8 }} onFocus={onFocus} onBlur={onBlur} />
            </Field>
          </div>
        </PanelCard>
      </>
    ),

    /* 1 — Location */
    1: (
      <PanelCard>
        <SectionTitle icon={MapPin} label="Location & Address" color="#4e8c72" />
        <div style={g2}>
          <Field label="Destination / Region">
            <input value={form.destination} onChange={set('destination')} placeholder="Jaipur, Goa, Shimla…" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="Pin Code">
            <input type="number" value={form.pinCode} onChange={set('pinCode')} placeholder="302001" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="State" required>
            <input required value={form.state} onChange={set('state')} placeholder="Rajasthan" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </Field>
          <Field label="City" required>
            <input required value={form.city} onChange={set('city')} placeholder="Jaipur" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </Field>
        </div>
        <div style={{ marginTop: 18 }}>
          <Field label="Landmark / Street Address">
            <input value={form.landmark} onChange={set('landmark')} placeholder="Near Hawa Mahal, Opposite City Centre Mall…" style={inp} onFocus={onFocus} onBlur={onBlur} />
          </Field>
        </div>
        <Divider label="GPS Coordinates" />
        <div style={g2}>
          <Field label="Latitude">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: '#c0b4a0', letterSpacing: '0.06em', pointerEvents: 'none' }}>LAT</span>
              <input value={form.latitude} onChange={set('latitude')} placeholder="26.9124" style={{ ...inp, paddingLeft: 40 }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </Field>
          <Field label="Longitude">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: '#c0b4a0', letterSpacing: '0.06em', pointerEvents: 'none' }}>LNG</span>
              <input value={form.longitude} onChange={set('longitude')} placeholder="75.7873" style={{ ...inp, paddingLeft: 40 }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </Field>
        </div>
      </PanelCard>
    ),

    /* 2 — Details */
    2: (
      <>
        <PanelCard>
          <SectionTitle icon={Star} label="Star Rating & Dates" color="#8b6e3a" />
          <div style={g2}>
            <Field label="Star Rating">
              <input type="number" min="1" max="5" value={form.starRating} onChange={set('starRating')} placeholder="3" style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>
            <Field label="Local ID">
              <select value={form.localId} onChange={set('localId')} style={{ ...inp, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                <option value="Accepted">Accepted</option>
                <option value="Not Accepted">Not Accepted</option>
              </select>
            </Field>
          </div>
        </PanelCard>
        <PanelCard>
          <SectionTitle icon={Calendar} label="Availability Window" color="#8b6e3a" />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#b0a898', fontStyle: 'italic', margin: '0 0 18px' }}>
            Optional — set a promotional or seasonal date range for this listing.
          </p>
          <div style={g2}>
            <Field label="Start Date">
              <input type="date" value={form.startDate} onChange={set('startDate')} style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>
            <Field label="End Date">
              <input type="date" value={form.endDate} onChange={set('endDate')} style={inp} onFocus={onFocus} onBlur={onBlur} />
            </Field>
          </div>
        </PanelCard>
      </>
    ),

    /* 3 — Amenities */
    3: (
      <PanelCard>
        <SectionTitle icon={Layers} label="Amenities" color="#3a6e8c" />
        {amenities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, padding: 14, background: '#f8f5f0', borderRadius: 8, border: '1px solid #ede6dc' }}>
            {amenities.map((a, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 99, fontFamily: "'Roboto', sans-serif", fontSize: 11, fontWeight: 500 }}>
                {a}
                <button type="button" onClick={() => setAmenities((p) => p.filter((_, x) => x !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0, color: '#8a7f72' }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <input value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={handleAmenityKeyDown}
            placeholder="Type amenity, press Enter or comma to add…"
            style={{ ...inp, flex: 1 }} onFocus={onFocus} onBlur={onBlur} />
          <button type="button" onClick={() => { addAmenityTag(amenityInput); setAmenityInput('') }}
            style={{ padding: '11px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'Roboto', sans-serif", fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
            + Add
          </button>
        </div>
        <Divider label="Quick Add" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Free WiFi','Air Conditioning','Swimming Pool','Gym & Fitness','Parking','Restaurant','Room Service','Spa & Wellness','Bar & Lounge','Conference Hall','Laundry Service','24/7 Reception','Airport Transfer','CCTV Security'].map((preset) =>
            !amenities.includes(preset) && (
              <button key={preset} type="button" onClick={() => setAmenities((p) => [...p, preset])}
                style={{ padding: '6px 13px', background: '#fff', border: '1px solid #ddd5c8', borderRadius: 99, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#7a6e5e', cursor: 'pointer', transition: 'all .14s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#1d4ed8' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ddd5c8'; e.currentTarget.style.color = '#7a6e5e' }}>
                + {preset}
              </button>
            )
          )}
        </div>
      </PanelCard>
    ),

    /* 4 — Dining */
    4: (
      <div>
        <SectionTitle icon={UtensilsCrossed} label="Dining & Food Items" color="#8c4a3a" />
        {foods.map((food, fi) => (
          <PanelCard key={fi}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, color: '#8a7f72', fontStyle: 'italic' }}>Menu Item #{fi + 1}</span>
              {foods.length > 1 && (
                <button type="button" onClick={() => removeFoodItem(fi)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600 }}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <div style={g2}>
              <Field label="Food Name">
                <input value={food.name} onChange={(e) => setFoodField(fi, 'name')(e)} placeholder="Paneer Butter Masala…" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="Type">
                <select value={food.foodType} onChange={(e) => setFoodField(fi, 'foodType')(e)} style={{ ...inp, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                  <option>Veg</option><option>Non Veg</option><option>Vegan</option>
                </select>
              </Field>
              <Field label="Price (₹)">
                <input type="number" value={food.price} onChange={(e) => setFoodField(fi, 'price')(e)} placeholder="299" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="Description">
                <input value={food.about} onChange={(e) => setFoodField(fi, 'about')(e)} placeholder="A creamy North Indian classic…" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', border: '1px dashed #c0b4a0', borderRadius: 6, background: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#8a7f72', fontWeight: 500 }}>
                <ImagePlus size={13} /> Attach food images
                <input type="file" multiple accept="image/*" onChange={(e) => addFoodImages(fi, e)} style={{ display: 'none' }} />
              </label>
              {food.imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {food.imagePreviews.map((src, pi) => (
                    <div key={pi} style={{ position: 'relative', width: 60, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #ede6dc' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeFoodImage(fi, pi)}
                        style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={9} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PanelCard>
        ))}
        <button type="button" onClick={addFoodItem}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', border: '1px dashed #c0b4a0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#3a3530', transition: 'all .14s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b08d57'; e.currentTarget.style.background = '#faf8f5' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#c0b4a0'; e.currentTarget.style.background = '#fff' }}>
          <Plus size={14} /> Add Another Food Item
        </button>
      </div>
    ),

    /* 5 — Policies */
    5: (
      <div>
        <PanelCard>
          <SectionTitle icon={ShieldCheck} label="General Policies" color="#3a3a8c" />
          <div style={g2}>
            {[
              { label: 'Check-In Policy', key: 'checkInPolicy' },
              { label: 'Check-Out Policy', key: 'checkOutPolicy' },
              { label: 'Hotel Policy', key: 'hotelsPolicy' },
              { label: 'Outside Food', key: 'outsideFoodPolicy' },
              { label: 'Cancellation Policy', key: 'cancellationPolicy' },
              { label: 'Refund Policy', key: 'refundPolicy' },
              { label: 'Payment Mode', key: 'paymentMode' },
            ].map(({ label, key }) => (
              <Field key={key} label={label}>
                <input value={policies[key]} onChange={setPolicy(key)} placeholder={label} style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            ))}
          </div>
        </PanelCard>

        <PanelCard>
          <SectionTitle icon={ShieldCheck} label="Guest Rules" color="#3a3a8c" />
          <div style={g3}>
            {[
              { label: 'Pets', key: 'petsAllowed' },
              { label: 'Bachelors', key: 'bachelorAllowed' },
              { label: 'Smoking', key: 'smokingAllowed' },
              { label: 'Alcohol', key: 'alcoholAllowed' },
              { label: 'Unmarried Couples', key: 'unmarriedCouplesAllowed' },
              { label: 'International Guests', key: 'internationalGuestAllowed' },
            ].map(({ label, key }) => (
              <Field key={key} label={label}>
                <select value={policies[key]} onChange={setPolicy(key)} style={{ ...inp, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">— select —</option>
                  {YES_NO.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
            ))}
          </div>
        </PanelCard>

        <PanelCard>
          <SectionTitle icon={ShieldCheck} label="Seasonal Pricing (₹ per head)" color="#3a3a8c" />
          {[
            { label: 'On Season — CP (Breakfast)',            prefix: 'on',  suffix: '' },
            { label: 'Off Season — CP (Breakfast)',           prefix: 'off', suffix: '' },
            { label: 'On Season — AP (All Meals)',            prefix: 'on',  suffix: 'Ap' },
            { label: 'Off Season — AP (All Meals)',           prefix: 'off', suffix: 'Ap' },
            { label: 'On Season — MAP (Breakfast + Dinner)',  prefix: 'on',  suffix: 'MAp' },
            { label: 'Off Season — MAP (Breakfast + Dinner)', prefix: 'off', suffix: 'MAp' },
          ].map(({ label, prefix, suffix }) => {
            const cols = [
              { col: 'Double', key: `${prefix}DoubleSharing${suffix}` },
              { col: 'Triple', key: `${prefix}TrippleSharing${suffix}` },
              { col: 'Quad',   key: `${prefix}QuadSharing${suffix}` },
              { col: 'Bulk',   key: `${prefix}BulkBooking${suffix}` },
              { col: '>4',     key: `${prefix}MoreThanFour${suffix}` },
            ]
            return (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#5a4f44', marginBottom: 10 }}>{label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {cols.map(({ col, key }) => (
                    <div key={key}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: '#9b8b76', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</div>
                      <input type="number" value={policies[key]} onChange={(e) => setPolicies((p) => ({ ...p, [key]: e.target.value }))} placeholder="0"
                        style={{ ...inp, padding: '9px 10px', fontSize: 12 }} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </PanelCard>
      </div>
    ),

    /* 6 — Rooms */
    6: (
      <div>
        <SectionTitle icon={BedDouble} label="Room Types" color="#6e3a8c" />
        {rooms.map((room, ri) => (
          <PanelCard key={ri}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 14, color: '#6e3a8c', fontStyle: 'italic' }}>Room Type #{ri + 1}</span>
              {rooms.length > 1 && (
                <button type="button" onClick={() => removeRoomItem(ri)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600 }}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <div style={g2}>
              <Field label="Room Type" required>
                <input value={room.type} onChange={(e) => setRoomField(ri, 'type', e.target.value)} placeholder="Deluxe, Suite, Premium, Standard…" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="Bed Type">
                <input value={room.bedTypes} onChange={(e) => setRoomField(ri, 'bedTypes', e.target.value)} placeholder="King, Twin, Double…" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="Price / Night (₹)" required>
                <input type="number" value={room.price} onChange={(e) => setRoomField(ri, 'price', e.target.value)} placeholder="2999" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="Original Price (₹)">
                <input type="number" value={room.originalPrice} onChange={(e) => setRoomField(ri, 'originalPrice', e.target.value)} placeholder="Leave blank to use Price" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="Available Rooms">
                <input type="number" min="1" value={room.countRooms} onChange={(e) => setRoomField(ri, 'countRooms', e.target.value)} placeholder="1" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>

            <div style={{ marginTop: 18, padding: 16, background: '#faf8f5', border: '1px solid #ede6dc', borderRadius: 8 }}>
              <div onClick={() => setRoomField(ri, 'isOffer', !room.isOffer)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', marginBottom: room.isOffer ? 16 : 0 }}>
                <div style={{ width: 18, height: 18, border: `1.5px solid ${room.isOffer ? '#b08d57' : '#c0b4a0'}`, borderRadius: 4, background: room.isOffer ? '#b08d57' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                  {room.isOffer && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#3a3530' }}>This room has an active offer / discount</span>
              </div>
              {room.isOffer && (
                <div style={g3}>
                  <Field label="Offer Name">
                    <input value={room.offerName} onChange={(e) => setRoomField(ri, 'offerName', e.target.value)} placeholder="Summer Sale…" style={inp} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                  <Field label="Discount (₹)">
                    <input type="number" value={room.offerPriceLess} onChange={(e) => setRoomField(ri, 'offerPriceLess', e.target.value)} placeholder="500" style={inp} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                  <Field label="Offer Expiry">
                    <input type="date" value={room.offerExp} onChange={(e) => setRoomField(ri, 'offerExp', e.target.value)} style={inp} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', border: '1px dashed #c0b4a0', borderRadius: 6, background: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#8a7f72', fontWeight: 500 }}>
                <ImagePlus size={13} /> Attach room images
                <input type="file" multiple accept="image/*" onChange={(e) => addRoomImages(ri, e)} style={{ display: 'none' }} />
              </label>
              {room.imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {room.imagePreviews.map((src, pi) => (
                    <div key={pi} style={{ position: 'relative', width: 72, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #ede6dc' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeRoomImage(ri, pi)}
                        style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={9} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PanelCard>
        ))}
        <button type="button" onClick={addRoomItem}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', border: '1px dashed #c0b4a0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#3a3530', transition: 'all .14s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b08d57'; e.currentTarget.style.background = '#faf8f5' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#c0b4a0'; e.currentTarget.style.background = '#fff' }}>
          <Plus size={14} /> Add Another Room Type
        </button>
      </div>
    ),

    /* 7 — Preview */
    7: (() => {
      const Section = ({ title, children }) => (
        <div style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#374151' }}>
            {title}
          </div>
          <div style={{ padding: '18px 20px' }}>{children}</div>
        </div>
      )
      const Row = ({ label, value }) => value ? (
        <div style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
          <span style={{ minWidth: 160, fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, paddingTop: 1 }}>{label}</span>
          <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{value}</span>
        </div>
      ) : null
      const pg2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }

      return (
        <div>
          <div style={{ marginBottom: 24, padding: '16px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Eye size={18} color="#2563eb" strokeWidth={1.8} />
            <div>
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 14 }}>Final Review</div>
              <div style={{ color: '#3b82f6', fontSize: 12, marginTop: 2 }}>Sab data check kar lo — submit ke baad hotel register ho jaayega.</div>
            </div>
          </div>

          <Section title="Hotel Identity">
            <div style={pg2}>
              <Row label="Hotel Name" value={form.hotelName} />
              <Row label="Owner" value={form.hotelOwnerName} />
              <Row label="Property Type" value={form.propertyType} />
              <Row label="Category" value={form.hotelCategory} />
              <Row label="Rooms" value={form.numRooms} />
              <Row label="Star Rating" value={form.starRating ? `${form.starRating} ★` : ''} />
            </div>
            {form.description && <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 6, fontSize: 13, color: '#374151', lineHeight: 1.7, borderLeft: '3px solid #e5e7eb' }}>{form.description}</div>}
          </Section>

          <Section title="Location">
            <div style={pg2}>
              <Row label="City" value={form.city} />
              <Row label="State" value={form.state} />
              <Row label="Destination" value={form.destination} />
              <Row label="Pin Code" value={form.pinCode} />
              <Row label="Landmark" value={form.landmark} />
              <Row label="GPS" value={form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : ''} />
            </div>
          </Section>

          <Section title="Contact Details">
            <div style={pg2}>
              <Row label="Email" value={form.hotelEmail} />
              <Row label="Phone" value={form.contact} />
              <Row label="General Manager" value={form.generalManagerContact} />
              <Row label="Sales Manager" value={form.salesManagerContact} />
            </div>
          </Section>

          {amenities.length > 0 && (
            <Section title={`Amenities (${amenities.length})`}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {amenities.map((a, i) => (
                  <span key={i} style={{ padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 99, fontSize: 12, fontWeight: 500 }}>{a}</span>
                ))}
              </div>
            </Section>
          )}

          {rooms.filter((r) => r.type).length > 0 && (
            <Section title={`Rooms (${rooms.filter((r) => r.type).length} types)`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rooms.filter((r) => r.type).map((r, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 7, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 6 }}>{r.type}{r.bedTypes ? ` — ${r.bedTypes}` : ''}</div>
                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#4b5563' }}>Price: <strong>₹{r.price}</strong></span>
                      {r.originalPrice && <span style={{ fontSize: 12, color: '#4b5563' }}>Original: <strong>₹{r.originalPrice}</strong></span>}
                      <span style={{ fontSize: 12, color: '#4b5563' }}>Available: <strong>{r.countRooms}</strong></span>
                      {r.isOffer && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>🏷 Offer: {r.offerName} (–₹{r.offerPriceLess})</span>}
                    </div>
                    {r.imagePreviews.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {r.imagePreviews.slice(0, 4).map((src, pi) => (
                          <img key={pi} src={src} alt="" style={{ width: 52, height: 44, objectFit: 'cover', borderRadius: 5, border: '1px solid #e5e7eb' }} />
                        ))}
                        {r.imagePreviews.length > 4 && <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>+{r.imagePreviews.length - 4} more</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {foods.filter((f) => f.name).length > 0 && (
            <Section title={`Dining (${foods.filter((f) => f.name).length} items)`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {foods.filter((f) => f.name).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    {f.imagePreviews[0] && <img src={f.imagePreviews[0]} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{f.foodType} · ₹{f.price}{f.about ? ` · ${f.about}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {Object.values(policies).some((v) => v) && (
            <Section title="Policies">
              <div style={pg2}>
                {[{ label: 'Check-In', key: 'checkInPolicy' }, { label: 'Check-Out', key: 'checkOutPolicy' }, { label: 'Cancellation', key: 'cancellationPolicy' }, { label: 'Outside Food', key: 'outsideFoodPolicy' }, { label: 'Payment Mode', key: 'paymentMode' }, { label: 'Pets', key: 'petsAllowed' }, { label: 'Alcohol', key: 'alcoholAllowed' }, { label: 'Smoking', key: 'smokingAllowed' }, { label: 'Bachelors', key: 'bachelorAllowed' }, { label: 'Unmarried Couples', key: 'unmarriedCouplesAllowed' }].map(({ label, key }) =>
                  policies[key] ? <Row key={key} label={label} value={policies[key]} /> : null
                )}
              </div>
            </Section>
          )}

          {previews.length > 0 && (
            <Section title={`Hotel Images (${images.length})`}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: 80, height: 68, objectFit: 'cover', borderRadius: 7, border: '1px solid #e5e7eb' }} />
                ))}
              </div>
            </Section>
          )}

          <div style={{ padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>Sab kuch sahi lag raha hai?</div>
              <div style={{ color: '#16a34a', fontSize: 12, marginTop: 2 }}>Agle step me contact, images aur final submit hai.</div>
            </div>
            <button type="button" onClick={() => goTo(8)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: '#15803d', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', transition: 'background .15s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#166534'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#15803d'}>
              Proceed to Finalize <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )
    })(),

    /* 8 — Finalize */
    8: (
      <div>
        {/* Contact */}
        <PanelCard>
          <SectionTitle icon={Phone} label="Contact Details" color="#2a4a2a" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Hotel Email">
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c0b4a0', pointerEvents: 'none' }} strokeWidth={1.6} />
                <input type="email" value={form.hotelEmail} onChange={set('hotelEmail')} placeholder="info@hotel.com" style={{ ...inp, paddingLeft: 36 }} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </Field>
            <Field label="Hotel Contact">
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c0b4a0', pointerEvents: 'none' }} strokeWidth={1.6} />
                <input type="tel" value={form.contact} onChange={set('contact')} placeholder="9876543210" style={{ ...inp, paddingLeft: 36 }} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </Field>
            <Divider label="Management Contacts" />
            <div style={g2}>
              <Field label="General Manager">
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c0b4a0', pointerEvents: 'none' }} strokeWidth={1.6} />
                  <input value={form.generalManagerContact} onChange={set('generalManagerContact')} placeholder="GM: 9876543210" style={{ ...inp, paddingLeft: 36 }} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </Field>
              <Field label="Sales Manager">
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#c0b4a0', pointerEvents: 'none' }} strokeWidth={1.6} />
                  <input value={form.salesManagerContact} onChange={set('salesManagerContact')} placeholder="Sales: 9876543210" style={{ ...inp, paddingLeft: 36 }} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </Field>
            </div>
          </div>
        </PanelCard>

        {/* Images */}
        <PanelCard>
          <SectionTitle icon={ImagePlus} label="Property Images" color="#2a4a2a" />
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            padding: '40px 20px', border: '1px dashed #c0b4a0', borderRadius: 10,
            background: '#faf8f5', cursor: 'pointer', transition: 'all .18s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b08d57'; e.currentTarget.style.background = '#f5f0e8' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#c0b4a0'; e.currentTarget.style.background = '#faf8f5' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid #ddd5c8', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImagePlus size={20} color="#8a7f72" strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 14, color: '#3a3530', marginBottom: 5 }}>Select property photographs</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#b0a898' }}>JPG · PNG · WEBP — Multiple files allowed</div>
            </div>
            <input type="file" multiple accept="image/*" onChange={addImages} style={{ display: 'none' }} />
          </label>
          {previews.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9b8b76', marginBottom: 12 }}>
                {images.length} file{images.length > 1 ? 's' : ''} selected
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', border: '1px solid #ede6dc' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => removeImage(i)}
                      style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#c0392b'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}>
                      <X size={10} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PanelCard>

        {/* Summary + Submit */}
        <PanelCard>
          <SectionTitle icon={Settings2} label="Submission Summary" color="#2a4a2a" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Room Types', value: rooms.filter((r) => r.type).length, color: '#6e3a8c' },
              { label: 'Amenities',  value: amenities.length,                    color: '#3a6e8c' },
              { label: 'Food Items', value: foods.filter((f) => f.name).length,  color: '#8c4a3a' },
              { label: 'Images',     value: images.length,                        color: '#2a4a2a' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '14px 16px', background: '#f8f5f0', border: '1px solid #ede6dc', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#9b8b76', marginTop: 6, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleSubmit} disabled={submitting}
            style={{
              width: '100%', padding: '15px', background: '#1a1a1a', color: '#ffffff',
              border: 'none', borderRadius: 8,
              fontFamily: "'Roboto', sans-serif", fontSize: 12, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'background .18s',
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#374151' }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#1a1a1a' }}>
            {submitting
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Registering Property…</>
              : <><Plus size={14} /> Register My Property</>}
          </button>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 11, color: '#c0b4a0', textAlign: 'center', marginTop: 14, fontStyle: 'italic' }}>
            Images are uploaded securely to AWS S3. Your property will be reviewed before going live.
          </p>
        </PanelCard>
      </div>
    ),
  }

  /* ── render ── */
  return (
    <div style={{ background: '#f5f7fa', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Status banner */}
      {status.type && (
        <div style={{
          padding: '12px 24px', flexShrink: 0,
          background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
          borderBottom: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {status.type === 'success'
            ? <Check size={16} color="#16a34a" />
            : <X size={16} color="#dc2626" />}
          <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: status.type === 'success' ? '#15803d' : '#dc2626', fontWeight: 500 }}>
            {status.msg}
          </span>
          {status.type === 'success' && (
            <button type="button" onClick={() => navigate('/')}
              style={{ marginLeft: 'auto', padding: '6px 16px', background: '#15803d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontFamily: "'Roboto', sans-serif", fontSize: 12, fontWeight: 600 }}>
              Go to Home
            </button>
          )}
        </div>
      )}

      {/* Body: sidebar + content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <StepSidebar current={step} onJump={goTo} completedSteps={completedSteps} />

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f5f7fa' }}>

          {/* Step header */}
          <div style={{
            background: '#fff', borderBottom: '1px solid #e5e7eb',
            padding: '20px 36px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {(() => { const Icon = STEPS[step].icon; return <Icon size={20} color={STEPS[step].color} strokeWidth={1.6} /> })()}
              <div>
                <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b0a898', marginBottom: 3 }}>
                  Step {STEPS[step].short}
                </div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: '#1a1612', letterSpacing: '-0.01em' }}>
                  {STEPS[step].label}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 0 && (
                <button type="button" onClick={prev}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#fff', color: '#3a3530', border: '1px solid #ddd5c8', borderRadius: 6, cursor: 'pointer', fontFamily: "'Roboto', sans-serif", fontSize: 11, fontWeight: 600, transition: 'all .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#b08d57'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ddd5c8'}>
                  <ChevronLeft size={14} /> Previous
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button type="button" onClick={next}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', background: '#1a1a1a', color: '#ffffff', border: '1px solid #1a1a1a', borderRadius: 6, cursor: 'pointer', fontFamily: "'Roboto', sans-serif", fontSize: 11, fontWeight: 700, transition: 'all .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a1a'}>
                  Next Step <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable step content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '32px 36px', maxWidth: 860, animation: 'fadeSlide .28s ease' }}>
              {stepContent[step]}
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{
            background: '#fff', borderTop: '1px solid #e5e7eb',
            padding: '14px 36px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {STEPS.map((s) => (
                <div key={s.id} onClick={() => goTo(s.id)}
                  style={{ width: step === s.id ? 28 : 8, height: 8, borderRadius: 99, background: step === s.id ? '#b08d57' : completedSteps.has(s.id) ? '#4e8c72' : '#ddd5c8', cursor: 'pointer', transition: 'all .3s ease' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 0 && (
                <button type="button" onClick={prev}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: '#fff', color: '#3a3530', border: '1px solid #ddd5c8', borderRadius: 6, cursor: 'pointer', fontFamily: "'Roboto', sans-serif", fontSize: 12, fontWeight: 600, transition: 'all .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#b08d57'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ddd5c8'}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: '#1a1a1a', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'Roboto', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', transition: 'background .15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a1a'}>
                  Continue to {STEPS[step + 1]?.label} <ChevronRight size={14} />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', background: '#b08d57', color: '#fff', border: 'none', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'Roboto', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', opacity: submitting ? 0.6 : 1, transition: 'background .15s' }}
                  onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#96773e' }}
                  onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#b08d57' }}>
                  {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Registering…</> : <><Plus size={14} /> Register Property</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap');
        * { font-family: 'Roboto', sans-serif !important; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0; }
        input::placeholder, textarea::placeholder { color: #c0b4a0; font-weight: 400; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f5f7fa; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>
    </div>
  )
}
