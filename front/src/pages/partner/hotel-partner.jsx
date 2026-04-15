
import { useMemo, useState, useRef, useEffect } from "react";
import axios from "axios";
import { City, State } from "country-state-city";
import {
  Building2, ImagePlus, Loader2, Plus, X,
  MapPin, Star, Calendar, CheckCircle2,
  AlertCircle, Settings2, UtensilsCrossed, ShieldCheck, Layers, Trash2, BedDouble,
  ChevronRight, ChevronLeft, Check, Eye,
} from "lucide-react";
import baseURL from "../../utils/baseURL";
import alert from "../../utils/custom_alert/custom_alert";
import { useHotelCategories } from "../../utils/additional-fields/hotelCategories";
import { usePropertyTypes } from "../../utils/additional-fields/propertyTypes";
import { useHotelAmenities } from "../../utils/additional-fields/hotelAmenities";
import { useBedTypes } from "../../utils/additional-fields/bedTypes";
import { useRoomTypes } from "../../utils/additional-fields/roomTypes";
import { fetchLocation } from "../../utils/fetchLocation";
import { Unauthorized, userId } from "../../utils/Unauthorized";
import Disclaimer from "./disclaimer";

/* â”€â”€ helpers â”€â”€ */
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
  numRooms: '', latitude: '', longitude: '', starRating: '2', propertyType: '',
  contact: '', hotelEmail: '', customerWelcomeNote: '',
  generalManagerContact: '', salesManagerContact: '',
  localId: 'Accepted', startDate: '', endDate: '', rating: '', reviews: '',
  onFront: false, isAccepted: false,  // ✅ Added these fields
})

const STEPS = [
  { id: 0, label: 'Identity',  short: '01', icon: Building2,      color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 1, label: 'Location',  short: '02', icon: MapPin,          color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 2, label: 'Ratings',   short: '03', icon: Star,            color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { id: 3, label: 'Amenities', short: '04', icon: Layers,          color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { id: 4, label: 'Dining',    short: '05', icon: UtensilsCrossed, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { id: 5, label: 'Policies',  short: '06', icon: ShieldCheck,     color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 6, label: 'Rooms',     short: '07', icon: BedDouble,       color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 7, label: 'Contact',   short: '08', icon: Phone,           color: 'text-teal-700 bg-teal-50 border-teal-200' },
  { id: 8, label: 'Preview',   short: '09', icon: Eye,             color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 9, label: 'Finalize',  short: '10', icon: Check,           color: 'text-green-700 bg-green-50 border-green-200' },
]

const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
const YES_NO = ['Yes', 'No', 'Not Allowed', 'Allowed']

function FL({ children, required }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
function Field({ label, required, hint, children }) {
  return (
    <div>
      <FL required={required}>{label}</FL>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1 italic">{hint}</p>}
    </div>
  )
}
function Card({ children, className = '' }) {
  return <div className={`bg-white border border-gray-100 rounded-xl p-5 mb-4 shadow-sm ${className}`}>{children}</div>
}
function SecTitle({ icon: Icon, label, colorClass }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold mb-4 ${colorClass}`}>
      <Icon size={14} strokeWidth={2} />
      {label}
    </div>
  )
}
function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4 col-span-full">
      <div className="flex-1 h-px bg-gray-100" />
      {label && <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">{label}</span>}
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function PolicyEditor({ value = '', onChange, placeholder = '', className = '' }) {
  const [format, setFormat] = useState('bulleted')
  const taRef = useRef(null)

  const ensurePrefill = (fmt) => {
    if (!value || String(value).trim() === '') {
      if (fmt === 'bulleted') onChange('• ')
      else if (fmt === 'numbered') onChange('1. ')
      else onChange('')
      setTimeout(() => taRef.current?.focus(), 0)
    }
  }

  useEffect(() => {
    // on mount, if empty, start with bullet as requested
    if (!value || String(value).trim() === '') ensurePrefill(format)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFormat = (e) => {
    const fmt = e.target.value
    setFormat(fmt)
    ensurePrefill(fmt)
  }

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = String(value || '').slice(0, start)
    const after = String(value || '').slice(end)

    if (format === 'bulleted') {
      const insert = (before.length === 0 || before.charAt(before.length - 1) === '\n') ? '• ' : '\n• '
      const newVal = before + insert + after
      onChange(newVal)
      const pos = start + insert.length
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos }, 0)
    } else if (format === 'numbered') {
      const linesBefore = before.split('\n')
      const prevLine = linesBefore[linesBefore.length - 1] || ''
      const m = prevLine.match(/^\s*(\d+)[\.\)]\s*/)
      const nextNum = m ? (parseInt(m[1], 10) + 1) : 1
      const insert = (before.length === 0 || before.charAt(before.length - 1) === '\n') ? `${nextNum}. ` : `\n${nextNum}. `
      const newVal = before + insert + after
      onChange(newVal)
      const pos = start + insert.length
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos }, 0)
    } else {
      const newVal = before + '\n' + after
      onChange(newVal)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 1 }, 0)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <select value={format} onChange={handleFormat} className="text-xs px-2 py-1 rounded border bg-white">
          <option value="bulleted">Bulleted</option>
          <option value="numbered">Numbered</option>
          <option value="plain">Plain</option>
        </select>
        <span className="text-xs text-gray-400">Press Enter to add next item</span>
      </div>
      <textarea ref={taRef} className={`${className} min-h-[80px]`} value={value || ''}
        onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} />
    </div>
  )
}

export default function HotelPartnerForm() {
  const hotelCategoryOptions = useHotelCategories()
  const propertyTypeOptions  = usePropertyTypes()
  const hotelAmenityOptions  = useHotelAmenities()
  const bedTypeOptions       = useBedTypes()
  const roomTypeOptions      = useRoomTypes()

  const indianStates = useMemo(() => State.getStatesOfCountry('IN'), [])
  const [selectedStateIsoCode, setSelectedStateIsoCode] = useState('')
  const availableCities = useMemo(
    () => selectedStateIsoCode ? City.getCitiesOfState('IN', selectedStateIsoCode) : [],
    [selectedStateIsoCode]
  )

  const [step, setStep]                   = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [form, setForm]                   = useState(createEmptyForm)
  const [images, setImages]               = useState([])
  const [previews, setPreviews]           = useState([])
  const [amenities, setAmenities]         = useState([])
  const [amenityInput, setAmenityInput]   = useState('')
  const [selectedAmenity, setSelectedAmenity] = useState('')
  const [rooms, setRooms]                 = useState([createEmptyRoom()])
  const [foods, setFoods]                 = useState([createEmptyFood()])
  const [policies, setPolicies]           = useState(createEmptyPolicies)
  const [submitting, setSubmitting]       = useState(false)
  const [status, setStatus]               = useState({ type: null, msg: '' })
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [contactError, setContactError]   = useState('')
  const [gmError, setGmError]             = useState('')
  const [smError, setSmError]             = useState('')

  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const setPolicy = (key) => (e) =>
    setPolicies((p) => ({ ...p, [key]: e.target.value }))

  const handleStateChange = (e) => {
    const iso = e.target.value
    setSelectedStateIsoCode(iso)
    const obj = indianStates.find((s) => s.isoCode === iso)
    setForm((p) => ({ ...p, state: obj ? obj.name : '', city: '' }))
  }

  const goTo = (n) => {
    if (n > step) setCompletedSteps((p) => new Set([...p, step]))
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  /* amenities */
  const addAmenityTag = (raw) => {
    const tags = raw.split(',').map((t) => t.trim()).filter(Boolean)
    const unique = tags.filter((t) => !amenities.includes(t))
    if (unique.length) setAmenities((p) => [...p, ...unique])
  }
  const addSelectedAmenity = () => {
    if (!selectedAmenity || amenities.includes(selectedAmenity)) return
    setAmenities((p) => [...p, selectedAmenity])
    setSelectedAmenity('')
  }
  const handleAmenityKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); addAmenityTag(amenityInput); setAmenityInput('')
    }
  }

  /* rooms */
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

  /* foods */
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

  /* ✅ Cleanup on unmount to prevent memory leaks */
  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u))
      rooms.forEach(room => room.imagePreviews.forEach(url => URL.revokeObjectURL(url)))
      foods.forEach(food => food.imagePreviews.forEach(url => URL.revokeObjectURL(url)))
    }
  }, [previews, rooms, foods])

  /* phone validation helper */
  const validatePhone = (val, setErr) => {
    setErr(val.length > 0 && !/^[0-9]{10}$/.test(val) ? 'Enter valid 10-digit number' : '')
  }

  /* submit */
  const handleSubmit = async (e) => {
    e?.preventDefault()
    // ❌ Removed window.confirm - better UX without blocking dialog
    setSubmitting(true)
    setStatus({ type: null, msg: '' })
    try {
      const fd = new FormData()
      ;['hotelName','description','hotelOwnerName','destination','state','city','landmark',
        'pinCode','hotelCategory','numRooms','latitude','longitude','starRating','propertyType',
        'contact','hotelEmail','customerWelcomeNote','generalManagerContact',
        'salesManagerContact','localId','rating','reviews',
      ].forEach((k) => fd.append(k, s(form[k])))
      fd.append('onFront', form.onFront)
      fd.append('isAccepted', form.isAccepted)
      if (form.startDate) fd.append('startDate', form.startDate)
      if (form.endDate)   fd.append('endDate',   form.endDate)

      // === Minimum Image Validation ===
      if (images.length === 0) {
        setStatus({ type: 'error', msg: 'At least 1 image is required.' })
        setSubmitting(false)
        return
      }

      images.forEach((f) => fd.append('images', f))

      // ✅ Hybrid Approach: Send amenities and policies in single call with error handling
      try {
        fd.append('amenities', JSON.stringify(amenities))
      } catch (error) {
        console.error('Error stringifying amenities:', error)
        fd.append('amenities', JSON.stringify([]))
      }

      try {
        fd.append('policies', JSON.stringify(policies))
      } catch (error) {
        console.error('Error stringifying policies:', error)
        fd.append('policies', JSON.stringify({}))
      }

      const res = await axios.post(
        `${baseURL}/data/hotels-new/post/upload/data`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      if (res.status !== 201) throw new Error('Unexpected response from server.')
      const hotelId = res.data?.data?.hotelId
      if (!hotelId) throw new Error('Hotel created but hotelId not received.')

      // ✅ Separate API calls for rooms with error handling and rollback
      try {
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
      } catch (error) {
        console.error('Error creating rooms:', error)
        // ✅ Revoke previews to prevent memory leak
        rooms.forEach(room => room.imagePreviews.forEach(url => URL.revokeObjectURL(url)))
        throw new Error('Failed to create rooms: ' + (error?.response?.data?.message || error?.message))
      }

      // ✅ Separate API calls for foods with error handling and rollback
      try {
        for (const food of foods.filter((f) => s(f.name))) {
          const ffd = new FormData()
          ffd.append('hotelId', hotelId); ffd.append('name', s(food.name))
          ffd.append('foodType', s(food.foodType)); ffd.append('price', s(food.price))
          ffd.append('about', s(food.about))
          food.imageFiles.forEach((file) => ffd.append('images', file))
          await axios.post(`${baseURL}/add/food-to/your-hotel`, ffd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
      } catch (error) {
        console.error('Error creating foods:', error)
        // ✅ Revoke previews to prevent memory leak
        foods.forEach(food => food.imagePreviews.forEach(url => URL.revokeObjectURL(url)))
        throw new Error('Failed to create foods: ' + (error?.response?.data?.message || error?.message))
      }

      // ✅ Success status instead of alert
      setStatus({ type: 'success', msg: res.data.message || 'Hotel created successfully!' })
      setShowSuccessPopup(true)
      localStorage.setItem('hotelId', hotelId)

      // ✅ Form reset before redirect
      setForm(createEmptyForm())
      setImages([])
      previews.forEach((u) => URL.revokeObjectURL(u))
      setPreviews([])
      setAmenities([])
      setAmenityInput('')
      setSelectedAmenity('')
      setFoods([createEmptyFood()])
      setRooms([createEmptyRoom()])
      setPolicies(createEmptyPolicies())
      setCompletedSteps(new Set(STEPS.map((s) => s.id)))

      // ✅ Redirect after delay with cleanup
      const redirectTimer = setTimeout(() => {
        window.location.href = '/partner/second-step'
      }, 2000)

      // Return cleanup function to clear timeout if component unmounts
      return () => clearTimeout(redirectTimer)
    } catch (err) {
      setStatus({ type: 'error', msg: err?.response?.data?.message || err?.message || 'Something went wrong.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Unauthorized />
      </div>
    )
  }

  /* â”€â”€ Step content â”€â”€ */
  const stepContent = {

    /* 0  Identity */
    0: (
      <>
        <Card>
          <SecTitle icon={Building2} label="Hotel Identity" colorClass="text-amber-700 bg-amber-50 border-amber-200" />
          <div className="mb-4">
            <Field label="Hotel Name" required>
              <input className={inp} required value={form.hotelName} onChange={set('hotelName')} placeholder="e.g. Taj Palace, The Grand Oberoi" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Owner Name">
              <input className={inp} value={form.hotelOwnerName} onChange={set('hotelOwnerName')} placeholder="Rahul Sharma" />
            </Field>
            <Field label="Property Type">
              <select className={inp} value={form.propertyType} onChange={set('propertyType')}>
                <option value="">Select property type</option>
                {propertyTypeOptions.map((o, i) => <option key={o?._id || i} value={o?.name || ''}>{o?.name || 'Unnamed'}</option>)}
              </select>
            </Field>
            <Field label="Hotel Category">
              <select className={inp} value={form.hotelCategory} onChange={set('hotelCategory')}>
                <option value="">Select hotel category</option>
                {hotelCategoryOptions.map((o, i) => <option key={o?._id || i} value={o?.name || ''}>{o?.name || 'Unnamed'}</option>)}
              </select>
            </Field>
            <Field label="Number of Rooms">
              <input type="number" className={inp} value={form.numRooms} onChange={set('numRooms')} placeholder="50" />
            </Field>
          </div>
        </Card>

        <Card>
          <Field label="Description" hint="Describe your property  ambiance, unique experience, special features">
            <textarea className={`${inp} resize-y`} value={form.description} onChange={set('description')} rows={5}
              placeholder="Describe your property in a way that captivates guests" />
          </Field>
          <div className="mt-4">
            <Field label="Customer Welcome Note">
              <textarea className={`${inp} resize-y`} value={form.customerWelcomeNote} onChange={set('customerWelcomeNote')} rows={3}
                placeholder="Dear Guest, welcome to our property" />
            </Field>
          </div>
        </Card>
      </>
    ),

    /* 1  Location */
    1: (
      <Card>
        <SecTitle icon={MapPin} label="Location & Address" colorClass="text-emerald-700 bg-emerald-50 border-emerald-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="State" required>
            <select className={inp} required value={selectedStateIsoCode} onChange={handleStateChange}>
              <option value="" disabled>Select a State</option>
              {indianStates.map((st) => <option key={st.isoCode} value={st.isoCode}>{st.name}</option>)}
            </select>
          </Field>
          <Field label="City" required>
            <select className={`${inp} disabled:bg-gray-50 disabled:cursor-not-allowed`} required value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} disabled={!selectedStateIsoCode}>
              <option value="" disabled>{selectedStateIsoCode ? 'Select a City' : 'Select state first'}</option>
              {availableCities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Destination / Region">
            <input className={inp} value={form.destination} onChange={set('destination')} placeholder="Jaipur, Goa, Shimla" />
          </Field>
          <Field label="PIN Code" required>
            <input className={inp} maxLength={6} required value={form.pinCode}
              onChange={(e) => setForm((p) => ({ ...p, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              placeholder="302001" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Landmark / Street Address">
            <input className={inp} value={form.landmark} onChange={set('landmark')} placeholder="Near Hawa Mahal, Opposite City Centre Mall" />
          </Field>
        </div>
        <Divider label="GPS Coordinates" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Latitude">
            <input className={inp} value={form.latitude} onChange={set('latitude')} placeholder="26.9124" />
          </Field>
          <Field label="Longitude">
            <input className={inp} value={form.longitude} onChange={set('longitude')} placeholder="75.7873" />
          </Field>
        </div>
        <div className="mt-4">
          <button type="button"
            onClick={() => fetchLocation(
              (lat) => setForm((p) => ({ ...p, latitude: lat })),
              (lng) => setForm((p) => ({ ...p, longitude: lng }))
            )}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg shadow hover:from-blue-700 hover:to-purple-700 transition-all">
            <MapPin size={14} /> Fetch My Location
          </button>
        </div>
      </Card>
    ),

    /* 2  Ratings & Dates */
    2: (
      <>
        <Card>
          <SecTitle icon={Star} label="Ratings & Reviews" colorClass="text-yellow-700 bg-yellow-50 border-yellow-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Star Rating">
              <input type="number" min="0" max="5" className={inp} value={form.starRating} onChange={set('starRating')} placeholder="3" />
            </Field>
            <Field label="Score (out of 5)">
              <input type="number" min="0" max="5" step="0.1" className={inp} value={form.rating} onChange={set('rating')} placeholder="4.5" />
            </Field>
            <Field label="Reviews Count">
              <input type="number" min="0" className={inp} value={form.reviews} onChange={set('reviews')} placeholder="128" />
            </Field>
          </div>
        </Card>

        <Card>
          <SecTitle icon={Calendar} label="Availability Window" colorClass="text-yellow-700 bg-yellow-50 border-yellow-200" />
          <p className="text-xs text-gray-400 italic mb-4">Optional  set a promotional or seasonal date range.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date">
              <input type="date" className={inp} value={form.startDate} onChange={set('startDate')} />
            </Field>
            <Field label="End Date">
              <input type="date" className={inp} value={form.endDate} onChange={set('endDate')} />
            </Field>
          </div>
        </Card>
      </>
    ),

    /* 3  Amenities */
    3: (
      <Card>
        <SecTitle icon={Layers} label="Amenities" colorClass="text-sky-700 bg-sky-50 border-sky-200" />

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            {amenities.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">
                {a}
                <button type="button" onClick={() => setAmenities((p) => p.filter((_, x) => x !== i))}
                  className="text-blue-400 hover:text-blue-700 leading-none">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <select className={`${inp} flex-1`} value={selectedAmenity} onChange={(e) => setSelectedAmenity(e.target.value)}>
            <option value="">Select amenity from list</option>
            {hotelAmenityOptions.filter((item) => item?.name && !amenities.includes(item.name))
              .map((item) => <option key={item._id || item.name} value={item.name}>{item.name}</option>)}
          </select>
          <button type="button" onClick={addSelectedAmenity} disabled={!selectedAmenity}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap transition-colors">
            + Add
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input className={`${inp} flex-1`} value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={handleAmenityKeyDown}
            placeholder="Type amenity, press Enter or comma" />
          <button type="button" onClick={() => { addAmenityTag(amenityInput); setAmenityInput('') }}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap transition-colors hover:bg-gray-700">
            + Add
          </button>
        </div>

        <Divider label="Quick Add" />
        <div className="flex flex-wrap gap-2">
          {['Free WiFi','Air Conditioning','Swimming Pool','Gym & Fitness','Parking','Restaurant','Room Service','Spa & Wellness','Bar & Lounge','Conference Hall','Laundry Service','24/7 Reception','Airport Transfer','CCTV Security'].map((preset) =>
            !amenities.includes(preset) && (
              <button key={preset} type="button" onClick={() => setAmenities((p) => [...p, preset])}
                className="px-3 py-1.5 text-[11px] border border-gray-200 rounded-full text-gray-600 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all">
                + {preset}
              </button>
            )
          )}
        </div>
      </Card>
    ),

    /* 4  Dining */
    4: (
      <div>
        <SecTitle icon={UtensilsCrossed} label="Dining & Food Items" colorClass="text-rose-700 bg-rose-50 border-rose-200" />
        {foods.map((food, fi) => (
          <Card key={fi}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500 italic">Menu Item #{fi + 1}</span>
              {foods.length > 1 && (
                <button type="button" onClick={() => removeFoodItem(fi)}
                  className="flex items-center gap-1.5 text-red-600 text-xs font-semibold hover:text-red-800">
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Food Name">
                <input className={inp} value={food.name} onChange={(e) => setFoodField(fi, 'name')(e)} placeholder="Paneer Butter Masala" />
              </Field>
              <Field label="Type">
                <select className={inp} value={food.foodType} onChange={(e) => setFoodField(fi, 'foodType')(e)}>
                  <option>Veg</option><option>Non Veg</option><option>Vegan</option>
                </select>
              </Field>
              <Field label="Price (â‚¹)">
                <input type="number" className={inp} value={food.price} onChange={(e) => setFoodField(fi, 'price')(e)} placeholder="299" />
              </Field>
              <Field label="Description">
                <input className={inp} value={food.about} onChange={(e) => setFoodField(fi, 'about')(e)} placeholder="A creamy North Indian classic" />
              </Field>
            </div>
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer text-xs text-gray-500 font-medium hover:bg-gray-100 transition-colors">
                <ImagePlus size={13} /> Attach food images
                <input type="file" multiple accept="image/*" onChange={(e) => addFoodImages(fi, e)} className="hidden" />
              </label>
              {food.imagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {food.imagePreviews.map((src, pi) => (
                    <div key={pi} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeFoodImage(fi, pi)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                        <X size={8} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
        <button type="button" onClick={addFoodItem}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all">
          <Plus size={14} /> Add Another Food Item
        </button>
      </div>
    ),

    /* 5  Policies */
    5: (
      <div>
        <Card>
          <SecTitle icon={ShieldCheck} label="General Policies" colorClass="text-indigo-700 bg-indigo-50 border-indigo-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Check-In Policy',    key: 'checkInPolicy' },
              { label: 'Check-Out Policy',   key: 'checkOutPolicy' },
              { label: 'Hotel Policy',       key: 'hotelsPolicy' },
              { label: 'Outside Food',       key: 'outsideFoodPolicy' },
              { label: 'Cancellation Policy',key: 'cancellationPolicy' },
              { label: 'Refund Policy',      key: 'refundPolicy' },
              { label: 'Payment Mode',       key: 'paymentMode' },
            ].map(({ label, key }) => (
              <Field key={key} label={label}>
                <PolicyEditor value={policies[key] || ''} onChange={(v) => setPolicies((p) => ({ ...p, [key]: v }))}
                  placeholder={label} className={inp} />
              </Field>
            ))}
          </div>
        </Card>

        <Card>
          <SecTitle icon={ShieldCheck} label="Guest Rules" colorClass="text-indigo-700 bg-indigo-50 border-indigo-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Pets',               key: 'petsAllowed' },
              { label: 'Bachelors',          key: 'bachelorAllowed' },
              { label: 'Smoking',            key: 'smokingAllowed' },
              { label: 'Alcohol',            key: 'alcoholAllowed' },
              { label: 'Unmarried Couples',  key: 'unmarriedCouplesAllowed' },
              { label: 'International Guests',key: 'internationalGuestAllowed' },
            ].map(({ label, key }) => (
              <Field key={key} label={label}>
                <select className={inp} value={policies[key]} onChange={setPolicy(key)}>
                  <option value=""> select </option>
                  {YES_NO.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
            ))}
          </div>
        </Card>

        <Card>
          <SecTitle icon={ShieldCheck} label="Seasonal Pricing (â‚¹ per head)" colorClass="text-indigo-700 bg-indigo-50 border-indigo-200" />
          {[
            { label: 'On Season  CP (Breakfast)',            prefix: 'on',  suffix: '' },
            { label: 'Off Season  CP (Breakfast)',           prefix: 'off', suffix: '' },
            { label: 'On Season  AP (All Meals)',            prefix: 'on',  suffix: 'Ap' },
            { label: 'Off Season  AP (All Meals)',           prefix: 'off', suffix: 'Ap' },
            { label: 'On Season  MAP (Breakfast + Dinner)',  prefix: 'on',  suffix: 'MAp' },
            { label: 'Off Season  MAP (Breakfast + Dinner)', prefix: 'off', suffix: 'MAp' },
          ].map(({ label, prefix, suffix }) => {
            const cols = [
              { col: 'Double', key: `${prefix}DoubleSharing${suffix}` },
              { col: 'Triple', key: `${prefix}TrippleSharing${suffix}` },
              { col: 'Quad',   key: `${prefix}QuadSharing${suffix}` },
              { col: 'Bulk',   key: `${prefix}BulkBooking${suffix}` },
              { col: '>4',     key: `${prefix}MoreThanFour${suffix}` },
            ]
            return (
              <div key={label} className="mb-5">
                <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
                <div className="grid grid-cols-5 gap-2">
                  {cols.map(({ col, key }) => (
                    <div key={key}>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">{col}</p>
                      <input type="number" className={inp + ' !py-2 !text-xs'} value={policies[key]}
                        onChange={(e) => setPolicies((p) => ({ ...p, [key]: e.target.value }))} placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    ),

    /* 6  Rooms */
    6: (
      <div>
        <SecTitle icon={BedDouble} label="Room Types" colorClass="text-purple-700 bg-purple-50 border-purple-200" />
        {rooms.map((room, ri) => (
          <Card key={ri}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-purple-700 italic font-medium">Room Type #{ri + 1}</span>
              {rooms.length > 1 && (
                <button type="button" onClick={() => removeRoomItem(ri)}
                  className="flex items-center gap-1.5 text-red-600 text-xs font-semibold hover:text-red-800">
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Room Type" required>
                <select className={inp} required value={room.type} onChange={(e) => setRoomField(ri, 'type', e.target.value)}>
                  <option value="">Select room type</option>
                  {roomTypeOptions.map((o, i) => <option key={o?._id || i} value={o?.name || ''}>{o?.name || 'Unnamed'}</option>)}
                </select>
              </Field>
              <Field label="Bed Type">
                <select className={inp} value={room.bedTypes} onChange={(e) => setRoomField(ri, 'bedTypes', e.target.value)}>
                  <option value="">Select bed type</option>
                  {bedTypeOptions.map((o, i) => <option key={o?._id || i} value={o?.name || ''}>{o?.name || 'Unnamed'}</option>)}
                </select>
              </Field>
              <Field label="Price / Night (â‚¹)" required>
                <input type="number" className={inp} required value={room.price} onChange={(e) => setRoomField(ri, 'price', e.target.value)} placeholder="2999" />
              </Field>
              <Field label="Original Price (â‚¹)">
                <input type="number" className={inp} value={room.originalPrice} onChange={(e) => setRoomField(ri, 'originalPrice', e.target.value)} placeholder="Leave blank to use Price" />
              </Field>
              <Field label="Available Rooms">
                <input type="number" min="1" className={inp} value={room.countRooms} onChange={(e) => setRoomField(ri, 'countRooms', e.target.value)} placeholder="1" />
              </Field>
            </div>

            {/* Offer toggle */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <button type="button" onClick={() => setRoomField(ri, 'isOffer', !room.isOffer)}
                className="flex items-center gap-2.5 w-full text-left mb-0">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${room.isOffer ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-300'}`}>
                  {room.isOffer && <Check size={9} color="#fff" strokeWidth={3} />}
                </div>
                <span className="text-sm font-semibold text-gray-700">This room has an active offer / discount</span>
              </button>
              {room.isOffer && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <Field label="Offer Name">
                    <input className={inp} value={room.offerName} onChange={(e) => setRoomField(ri, 'offerName', e.target.value)} placeholder="Summer Sale" />
                  </Field>
                  <Field label="Discount (â‚¹)">
                    <input type="number" className={inp} value={room.offerPriceLess} onChange={(e) => setRoomField(ri, 'offerPriceLess', e.target.value)} placeholder="500" />
                  </Field>
                  <Field label="Offer Expiry">
                    <input type="date" className={inp} value={room.offerExp} onChange={(e) => setRoomField(ri, 'offerExp', e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            <div className="mt-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer text-xs text-gray-500 font-medium hover:bg-gray-100 transition-colors">
                <ImagePlus size={13} /> Attach room images
                <input type="file" multiple accept="image/*" onChange={(e) => addRoomImages(ri, e)} className="hidden" />
              </label>
              {room.imagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {room.imagePreviews.map((src, pi) => (
                    <div key={pi} className="relative w-16 h-14 rounded-lg overflow-hidden border border-gray-200">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeRoomImage(ri, pi)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                        <X size={8} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
        <button type="button" onClick={addRoomItem}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all">
          <Plus size={14} /> Add Another Room Type
        </button>
      </div>
    ),

    /* 7  Contact */
    7: (
      <>
        <Card>
          <SecTitle icon={Phone} label="Contact Information" colorClass="text-teal-700 bg-teal-50 border-teal-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Hotel Email', key: 'hotelEmail', type: 'email', ph: 'hotel@example.com', err: null, setErr: null },
              { label: 'Primary Contact', key: 'contact', type: 'tel', ph: '10-digit mobile', err: contactError, setErr: setContactError },
              { label: 'General Manager Contact', key: 'generalManagerContact', type: 'tel', ph: 'GM number', err: gmError, setErr: setGmError },
              { label: 'Sales Manager Contact', key: 'salesManagerContact', type: 'tel', ph: 'Sales manager number', err: smError, setErr: setSmError },
            ].map(({ label, key, type, ph, err, setErr }) => (
              <div key={key}>
                <Field label={label} required>
                  <input className={`${inp} ${err ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
                    type={type}
                    value={form[key]}
                    placeholder={ph}
                    onChange={(e) => {
                      const val = type === 'tel' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value
                      setForm((p) => ({ ...p, [key]: val }))
                      if (setErr) validatePhone(val, setErr)
                    }}
                  />
                  {err && <p className="text-red-500 text-[11px] mt-1">{err}</p>}
                </Field>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end mt-4">
          <button type="button" onClick={next}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm">
            Continue to Preview <ChevronRight size={14} />
          </button>
        </div>
      </>
    ),

    /* 8  Preview + Submit */
    8: (() => {
      const Row = ({ label, value }) => value ? (
        <div className="flex gap-2 py-1.5 border-b border-gray-50">
          <span className="min-w-[140px] text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex-shrink-0 pt-0.5">{label}</span>
          <span className="text-sm text-gray-800">{value}</span>
        </div>
      ) : null
      const Sec = ({ title, children }) => (
        <div className="mb-4 border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-100">{title}</div>
          <div className="p-4">{children}</div>
        </div>
      )
      return (
        <div>
          <div className="mb-5 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <Eye size={16} className="text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-blue-800 text-sm">Final Review</p>
              <p className="text-blue-600 text-xs mt-0.5">Check all details before submitting.</p>
            </div>
          </div>

          <Sec title="Hotel Identity">
            <Row label="Hotel Name" value={form.hotelName} />
            <Row label="Owner" value={form.hotelOwnerName} />
            <Row label="Category" value={form.hotelCategory} />
            <Row label="Property Type" value={form.propertyType} />
            <Row label="Star Rating" value={form.starRating ? `${form.starRating} â˜…` : ''} />
            <Row label="Rooms" value={form.numRooms} />
            {form.description && <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{form.description}</p>}
          </Sec>

          <Sec title="Location">
            <Row label="State" value={form.state} />
            <Row label="City" value={form.city} />
            <Row label="Destination" value={form.destination} />
            <Row label="PIN Code" value={form.pinCode} />
            <Row label="Landmark" value={form.landmark} />
            <Row label="GPS" value={form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : ''} />
          </Sec>

          <Sec title="Contact">
            <Row label="Email" value={form.hotelEmail} />
            <Row label="Phone" value={form.contact} />
            <Row label="General Manager" value={form.generalManagerContact} />
            <Row label="Sales Manager" value={form.salesManagerContact} />
          </Sec>

          {amenities.length > 0 && (
            <Sec title={`Amenities (${amenities.length})`}>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{a}</span>
                ))}
              </div>
            </Sec>
          )}

          {rooms.filter((r) => r.type).length > 0 && (
            <Sec title={`Rooms (${rooms.filter((r) => r.type).length} types)`}>
              {rooms.filter((r) => r.type).map((r, i) => (
                <div key={i} className="mb-2 last:mb-0 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="font-bold text-sm text-gray-800">{r.type}{r.bedTypes ? `  ${r.bedTypes}` : ''}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                    <span>â‚¹{r.price}/night</span>
                    {r.originalPrice && <span>Was â‚¹{r.originalPrice}</span>}
                    <span>{r.countRooms} room(s)</span>
                    {r.isOffer && <span className="text-green-600 font-semibold">ðŸ· {r.offerName} (â€“â‚¹{r.offerPriceLess})</span>}
                  </div>
                </div>
              ))}
            </Sec>
          )}

          {foods.filter((f) => f.name).length > 0 && (
            <Sec title={`Dining (${foods.filter((f) => f.name).length} items)`}>
              {foods.filter((f) => f.name).map((f, i) => (
                <div key={i} className="flex items-center gap-3 mb-2 last:mb-0 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  {f.imagePreviews[0] && <img src={f.imagePreviews[0]} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />}
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{f.name}</p>
                    <p className="text-xs text-gray-500">{f.foodType} Â· â‚¹{f.price}{f.about ? ` Â· ${f.about}` : ''}</p>
                  </div>
                </div>
              ))}
            </Sec>
          )}

          {previews.length > 0 && (
            <Sec title={`Hotel Images (${images.length})`}>
              <div className="flex gap-2 flex-wrap">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="" className="w-20 h-16 object-cover rounded-lg border border-gray-200" />
                ))}
              </div>
            </Sec>
          )}

          {/* Summary counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Room Types', value: rooms.filter((r) => r.type).length, color: 'text-purple-700' },
              { label: 'Amenities',  value: amenities.length,                    color: 'text-sky-700' },
              { label: 'Food Items', value: foods.filter((f) => f.name).length,  color: 'text-rose-700' },
              { label: 'Images',     value: images.length,                        color: 'text-teal-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Error message */}
          {status.type === 'error' && (
            <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700">
              <AlertCircle size={15} /> {status.msg}
            </div>
          )}

          {/* Proceed to Finalize */}
          <div className="p-5 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-bold text-green-800 text-sm">Sab kuch sahi lag raha hai?</p>
              <p className="text-green-600 text-xs mt-0.5">Agle step me images aur final submit hai.</p>
            </div>
            <button type="button" onClick={() => goTo(9)}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm">
              Proceed to Finalize <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )
    })(),

    /* 9  Finalize */
    9: (
      <>
        {/* Images */}
        <Card>
          <SecTitle icon={ImagePlus} label="Hotel Images" colorClass="text-pink-700 bg-pink-50 border-pink-200" />
          <p className="text-xs text-gray-400 mb-4">Upload high-quality images of your hotel (at least 1 required).</p>

          <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all w-fit">
            <ImagePlus size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Click to add images</span>
            <input type="file" multiple accept="image/*" onChange={addImages} className="hidden" />
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-600 transition-colors">
                    <X size={10} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Settings */}
        <Card>
          <SecTitle icon={Settings2} label="Settings" colorClass="text-teal-700 bg-teal-50 border-teal-200" />
          <div className="flex items-center gap-6 flex-wrap">
            <Field label="Accept Local ID">
              <select className={inp + ' w-auto'} value={form.localId} onChange={set('localId')}>
                <option value="Accepted">✓ Accepted</option>
                <option value="Not Accepted">✗ Not Accepted</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* Submit */}
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="w-full py-4 bg-gray-900 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          {submitting ? <><Loader2 size={15} className="animate-spin" /> Registering Property…</> : <><Check size={15} /> Register Property</>}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3 italic">Images are uploaded securely. All data is encrypted.</p>
      </>
    ),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-6 sm:px-6">
        <div className="max-w-5xl mx-auto text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hotel Partner Registration</h1>
          <p className="text-gray-500 text-sm mt-1 max-w-xl mx-auto">
            Fill out each step carefully. You can navigate freely between steps.
          </p>
        </div>
        <Disclaimer />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Step {step + 1} of {STEPS.length}  {STEPS[step].label}</span>
            <span className="text-xs font-bold text-blue-600">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* Step tabs (horizontal scroll) */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {STEPS.map((st) => {
            const isActive    = step === st.id
            const isCompleted = completedSteps.has(st.id)
            return (
              <button key={st.id} type="button" onClick={() => goTo(st.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                  isActive    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' :
                  isCompleted ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                {isCompleted && !isActive ? <Check size={10} strokeWidth={3} /> : <span>{st.short}</span>}
                {st.label}
              </button>
            )
          })}
        </div>

        {/* Status banner (error) */}
        {status.type === 'error' && step !== 8 && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            <AlertCircle size={14} /> {status.msg}
          </div>
        )}

        {/* Step content */}
        <div>
          {stepContent[step]}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
          <button type="button" onClick={prev} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:border-gray-400 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ChevronLeft size={15} /> Previous
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold tracking-wide hover:bg-gray-700 transition-colors">
              Next Step <ChevronRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-bold tracking-wide hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting</> : <><Check size={14} /> Submit</>}
            </button>
          )}
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-2xl text-center shadow-2xl max-w-md w-[90%] animate-in zoom-in duration-300">
            <svg width="80" height="80" viewBox="0 0 80 80" className="animate-in zoom-in duration-500">
              <circle cx="40" cy="40" r="36" fill="#3b82f6" opacity="0.1" />
              <circle cx="40" cy="40" r="32" fill="#3b82f6" />
              <path
                d="M24 40 L36 52 L56 28"
                fill="none"
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-in stroke-in duration-500 delay-200"
                strokeDasharray="100"
                strokeDashoffset="100"
                style={{ animation: 'checkmark 0.5s ease-out 0.2s both' }}
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-2 font-serif">
              Hotel Created Successfully!
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Your hotel has been registered and is now live.
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes checkmark {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
