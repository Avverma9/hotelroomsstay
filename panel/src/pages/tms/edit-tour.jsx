import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Save, Package, AlertCircle,
  CheckCircle, Loader2,
} from 'lucide-react'
import { getTourById, updateTour } from '../../../redux/slices/tms/travel/tour/tour'

const selectTour = (state) => state.tour

const predefinedAmenities = [
  'WiFi', 'AC', 'Breakfast', 'Swimming Pool', 'Gym', 'Parking',
  'Spa', 'Bar', 'Restaurant', 'Room Service', 'TV', 'Geyser', 'Heater', 'First Aid',
]

/* Convert terms object {key:val} → [{key,value}] for the form */
const termsObjToArray = (obj) => {
  if (!obj || typeof obj !== 'object') return [{ key: '', value: '' }]
  const entries = Object.entries(obj)
  return entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }]
}

/* Convert [{key,value}] → {key:val} for the API */
const termsArrayToObj = (arr) =>
  arr.reduce((acc, { key, value }) => {
    if (key.trim()) acc[key.trim()] = value
    return acc
  }, {})

/* Normalize inclusion/exclusion (array or comma-string) → string for textarea */
const toText = (v) => {
  if (!v) return ''
  if (Array.isArray(v)) return v.join(', ')
  return v
}

const Section = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-600">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

const Label = ({ children, required }) => (
  <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
    {children}{required && <span className="ml-0.5 text-rose-500">*</span>}
  </label>
)

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400'

export default function EditTour() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = new URLSearchParams(location.search).get('from')
  const { tourDetails, loading, error } = useSelector(selectTour)

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)

  /* Fetch tour on mount */
  useEffect(() => {
    if (id) dispatch(getTourById(id))
  }, [dispatch, id])

  /* Populate form once tourDetails loads */
  useEffect(() => {
    if (!tourDetails || tourDetails._id !== id) return
    setForm({
      travelAgencyName: tourDetails.travelAgencyName || '',
      agencyId: tourDetails.agencyId || '',
      agencyPhone: tourDetails.agencyPhone || '',
      agencyEmail: tourDetails.agencyEmail || '',
      country: tourDetails.country || '',
      state: tourDetails.state || '',
      city: tourDetails.city || '',
      visitngPlaces: tourDetails.visitngPlaces || tourDetails.visitingPlaces || '',
      themes: tourDetails.themes || '',
      price: tourDetails.price ?? '',
      nights: tourDetails.nights ?? '',
      days: tourDetails.days ?? '',
      from: tourDetails.from ? tourDetails.from.slice(0, 10) : '',
      to: tourDetails.to ? tourDetails.to.slice(0, 10) : '',
      tourStartDate: tourDetails.tourStartDate ? tourDetails.tourStartDate.slice(0, 10) : '',
      tourEndDate: tourDetails.tourEndDate ? tourDetails.tourEndDate.slice(0, 10) : '',
      isCustomizable: Boolean(tourDetails.isCustomizable),
      starRating: tourDetails.starRating ?? '',
      amenities: Array.isArray(tourDetails.amenities) ? [...tourDetails.amenities] : [],
      inclusion: toText(tourDetails.inclusion),
      exclusion: toText(tourDetails.exclusion),
      dayWise: tourDetails.dayWise?.length
        ? tourDetails.dayWise.map((d) => ({ day: d.day, description: d.description || '' }))
        : [{ day: 1, description: '' }],
      termsAndConditions: termsObjToArray(tourDetails.termsAndConditions),
    })
  }, [tourDetails, id])

  /* Generic field update */
  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    set(name, type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value)
  }

  /* Amenities */
  const toggleAmenity = (a) =>
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }))

  /* Day-wise */
  const setDay = (i, field, value) =>
    setForm((prev) => {
      const days = [...prev.dayWise]
      days[i] = { ...days[i], [field]: value }
      return { ...prev, dayWise: days }
    })

  const addDay = () =>
    setForm((prev) => ({
      ...prev,
      dayWise: [...prev.dayWise, { day: prev.dayWise.length + 1, description: '' }],
    }))

  const removeDay = (i) =>
    setForm((prev) => ({
      ...prev,
      dayWise: prev.dayWise
        .filter((_, idx) => idx !== i)
        .map((d, idx) => ({ ...d, day: idx + 1 })),
    }))

  /* Terms */
  const setTerm = (i, field, value) =>
    setForm((prev) => {
      const terms = [...prev.termsAndConditions]
      terms[i] = { ...terms[i], [field]: value }
      return { ...prev, termsAndConditions: terms }
    })

  const addTerm = () =>
    setForm((prev) => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, { key: '', value: '' }],
    }))

  const removeTerm = (i) =>
    setForm((prev) => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, idx) => idx !== i),
    }))

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaved(false)

    const payload = {
      ...form,
      inclusion: form.inclusion
        ? form.inclusion.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      exclusion: form.exclusion
        ? form.exclusion.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      termsAndConditions: termsArrayToObj(form.termsAndConditions),
    }

    const result = await dispatch(updateTour({ tourId: id, updatedData: payload }))
    if (updateTour.fulfilled.match(result)) {
      setSaved(true)
      setTimeout(() => navigate(from || `/my-tour/${id}`), 1200)
    } else {
      setSaveError(result.payload || 'Failed to save changes.')
    }
    setSaving(false)
  }

  if (loading && !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          <AlertCircle size={16} /> {typeof error === 'string' ? error : 'Failed to load tour.'}
        </div>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(from || `/my-tour/${id}`)}
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="mb-0.5 flex items-center gap-2">
                <Package size={14} className="text-indigo-600" />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">TMS / My Tours</p>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Edit Tour</h1>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {saveError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={15} className="shrink-0" /> {saveError}
          </div>
        )}
        {saved && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle size={15} className="shrink-0" /> Tour updated — redirecting…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Agency Details */}
          <Section title="Agency Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Agency Name</Label>
                <input name="travelAgencyName" value={form.travelAgencyName} onChange={handleChange} className={inputCls} placeholder="Travel Agency Name" />
              </div>
              <div>
                <Label>Agency Email</Label>
                <input name="agencyEmail" type="email" value={form.agencyEmail} onChange={handleChange} className={inputCls} placeholder="agency@example.com" />
              </div>
              <div>
                <Label>Agency Phone</Label>
                <input name="agencyPhone" value={form.agencyPhone} onChange={handleChange} className={inputCls} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <Label>Agency ID</Label>
                <input name="agencyId" value={form.agencyId} onChange={handleChange} className={inputCls} placeholder="Agency ID" />
              </div>
              <div>
                <Label>Star Rating</Label>
                <input name="starRating" type="number" min="1" max="5" value={form.starRating} onChange={handleChange} className={inputCls} placeholder="1–5" />
              </div>
            </div>
          </Section>

          {/* Destination & Schedule */}
          <Section title="Destination & Schedule">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Country</Label>
                <input name="country" value={form.country} onChange={handleChange} className={inputCls} placeholder="AO" />
              </div>
              <div>
                <Label>State</Label>
                <input name="state" value={form.state} onChange={handleChange} className={inputCls} placeholder="State" />
              </div>
              <div>
                <Label>City</Label>
                <input name="city" value={form.city} onChange={handleChange} className={inputCls} placeholder="City" />
              </div>
              <div className="sm:col-span-3">
                <Label>Visiting Places</Label>
                <input name="visitngPlaces" value={form.visitngPlaces} onChange={handleChange} className={inputCls} placeholder="1N Patna | 2N Delhi" />
              </div>
              <div className="sm:col-span-2">
                <Label>Themes</Label>
                <input name="themes" value={form.themes} onChange={handleChange} className={inputCls} placeholder="Vacation, Adventure" />
              </div>
              <div>
                <Label>Price (₹)</Label>
                <input name="price" type="number" min="0" value={form.price} onChange={handleChange} className={inputCls} placeholder="0" />
              </div>
              <div>
                <Label>Nights</Label>
                <input name="nights" type="number" min="0" value={form.nights} onChange={handleChange} className={inputCls} placeholder="2" />
              </div>
              <div>
                <Label>Days</Label>
                <input name="days" type="number" min="0" value={form.days} onChange={handleChange} className={inputCls} placeholder="3" />
              </div>
              <div>
                <Label>Booking From Date</Label>
                <input name="from" type="date" value={form.from} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <Label>Booking To Date</Label>
                <input name="to" type="date" value={form.to} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <Label>Tour Start Date</Label>
                <input name="tourStartDate" type="date" value={form.tourStartDate} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <Label>Tour End Date</Label>
                <input name="tourEndDate" type="date" value={form.tourEndDate} onChange={handleChange} className={inputCls} />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <input
                  id="isCustomizable"
                  name="isCustomizable"
                  type="checkbox"
                  checked={form.isCustomizable}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isCustomizable" className="text-sm font-semibold text-slate-700">Customizable Tour</label>
              </div>
            </div>
          </Section>

          {/* Amenities */}
          <Section title="Amenities">
            <div className="flex flex-wrap gap-2">
              {predefinedAmenities.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                    form.amenities.includes(a)
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Section>

          {/* Inclusion & Exclusion */}
          <Section title="Inclusion & Exclusion">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Included</Label>
                <textarea
                  name="inclusion"
                  rows={4}
                  value={form.inclusion}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Breakfast, AC room, Guide (comma separated)"
                />
                <p className="mt-1 text-[11px] text-slate-400">Separate items with commas</p>
              </div>
              <div>
                <Label>Excluded</Label>
                <textarea
                  name="exclusion"
                  rows={4}
                  value={form.exclusion}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Airfare, Personal expenses (comma separated)"
                />
                <p className="mt-1 text-[11px] text-slate-400">Separate items with commas</p>
              </div>
            </div>
          </Section>

          {/* Day-wise Itinerary */}
          <Section title="Day-wise Itinerary">
            <div className="space-y-3">
              {form.dayWise.map((d, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700">
                    {d.day}
                  </div>
                  <textarea
                    rows={2}
                    value={d.description}
                    onChange={(e) => setDay(i, 'description', e.target.value)}
                    className={`${inputCls} flex-1`}
                    placeholder={`Description for Day ${d.day}`}
                  />
                  {form.dayWise.length > 1 && (
                    <button type="button" onClick={() => removeDay(i)} className="mt-1 rounded-lg border border-rose-200 p-1.5 text-rose-500 transition-colors hover:bg-rose-50">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDay}
                className="flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
              >
                <Plus size={13} /> Add Day
              </button>
            </div>
          </Section>

          {/* Terms & Conditions */}
          <Section title="Terms & Conditions">
            <div className="space-y-3">
              {form.termsAndConditions.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <input
                    value={t.key}
                    onChange={(e) => setTerm(i, 'key', e.target.value)}
                    className={`${inputCls} w-48 shrink-0`}
                    placeholder="Policy Name"
                  />
                  <input
                    value={t.value}
                    onChange={(e) => setTerm(i, 'value', e.target.value)}
                    className={`${inputCls} flex-1`}
                    placeholder="Policy details"
                  />
                  <button type="button" onClick={() => removeTerm(i)} className="mt-1 rounded-lg border border-rose-200 p-1.5 text-rose-500 transition-colors hover:bg-rose-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTerm}
                className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100"
              >
                <Plus size={13} /> Add Policy
              </button>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate(`/my-tour/${id}`)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
