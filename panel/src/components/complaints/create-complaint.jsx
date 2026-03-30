import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ChevronLeft, Loader2, Send, ShieldCheck } from 'lucide-react'
import { createComplaint } from '../../../redux/slices/complaintSlice'
import { selectAuth } from '../../../redux/slices/authSlice'
import { getAllHotels } from '../../../redux/slices/admin/hotel'

const REGARDING_OPTIONS = ['Hotel', 'Room', 'Service', 'Staff', 'Cleanliness', 'Food', 'Billing', 'Other']

const InputField = ({ label, required, children }) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
      {label} {required && <span className="text-rose-400">*</span>}
    </label>
    {children}
  </div>
)

const normalizeHotelOption = (hotel) => ({
  id: hotel?._id || hotel?.hotelId || hotel?.id || '',
  hotelName: hotel?.hotelName || hotel?.name || hotel?.basicInfo?.name || '',
  hotelEmail: hotel?.hotelEmail || hotel?.email || hotel?.basicInfo?.contacts?.email || '',
})

export default function CreateComplaint() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useSelector(selectAuth)
  const { allHotels, loading: hotelsLoading } = useSelector((state) => state.hotel)
  const prefilledState = location.state || {}

  const [form, setForm] = useState({
    regarding:  'Hotel',
    issue:      '',
    hotelName:  prefilledState.hotelName || '',
    hotelEmail: prefilledState.hotelEmail || '',
    hotelId:    prefilledState.hotelId || '',
    bookingId:  prefilledState.bookingId || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)    // { complaintId, _id }

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  useEffect(() => {
    if (!allHotels?.length) {
      dispatch(getAllHotels())
    }
  }, [allHotels?.length, dispatch])

  const hotelOptions = useMemo(
    () =>
      (allHotels || [])
        .map(normalizeHotelOption)
        .filter((hotel) => hotel.hotelName)
        .sort((first, second) => first.hotelName.localeCompare(second.hotelName)),
    [allHotels],
  )

  const handleHotelChange = (event) => {
    const selectedHotelName = event.target.value
    const selectedHotel = hotelOptions.find((hotel) => hotel.hotelName === selectedHotelName)

    setForm((currentForm) => ({
      ...currentForm,
      hotelName: selectedHotelName,
      hotelEmail: selectedHotel?.hotelEmail || '',
      hotelId: selectedHotel?.id || '',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.issue.trim()) { setError('Please describe the issue.'); return }

    const userId = user?._id || user?.id || user?.userId || ''
    const payload = {
      userId,
      regarding:  form.regarding,
      issue:      form.issue.trim(),
      hotelName:  form.hotelName.trim(),
      hotelEmail: form.hotelEmail.trim(),
      status:     'Pending',
      ...(form.hotelId.trim()   && { hotelId:   form.hotelId.trim() }),
      ...(form.bookingId.trim() && { bookingId: form.bookingId.trim() }),
    }

    setLoading(true)
    const result = await dispatch(createComplaint(payload))
    setLoading(false)

    if (createComplaint.fulfilled.match(result)) {
      const data = result.payload
      setSuccess({
        complaintId: data?.complaintId || data?.data?.complaintId || '—',
        _id:         data?._id || data?.data?._id,
      })
    } else {
      setError(result?.payload || 'Failed to submit complaint. Please try again.')
    }
  }

  /* ── Success Screen ──────────────────────────────────── */
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 font-sans">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={30} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Complaint Filed!</h2>
            <p className="mt-1 text-sm text-slate-500">Your complaint has been submitted successfully.</p>
          </div>
          <div className="rounded-2xl bg-indigo-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Complaint ID</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-indigo-700">{success.complaintId}</p>
            <p className="mt-0.5 text-[10px] text-indigo-400">Save this for future reference</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {success._id && (
              <button onClick={() => navigate(`/complaint/chat/${success._id}`)}
                className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700">
                Track & Chat Support
              </button>
            )}
            <button onClick={() => navigate('/complaints')}
              className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              View All Complaints
            </button>
            <button onClick={() => { setSuccess(null); setForm({ regarding: 'Hotel', issue: '', hotelName: '', hotelEmail: '', hotelId: '', bookingId: '' }) }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600">
              File Another Complaint
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Form ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-8 font-sans text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
          <ChevronLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-600" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">Complaints</p>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">File a Complaint</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">We'll look into your issue and get back to you.</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">

          {/* Regarding */}
          <InputField label="Complaint Regarding" required>
            <div className="flex flex-wrap gap-2">
              {REGARDING_OPTIONS.map((opt) => (
                <button key={opt} type="button" onClick={() => setForm((p) => ({ ...p, regarding: opt }))}
                  className={`rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-all
                    ${form.regarding === opt
                      ? 'border-indigo-300 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </InputField>

          {/* Issue */}
          <InputField label="Describe the Issue" required>
            <textarea rows={4} value={form.issue} onChange={set('issue')} placeholder="Please describe your complaint in detail..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white resize-none" />
          </InputField>

          {/* Hotel info */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Hotel Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Hotel Name">
                <select value={form.hotelName} onChange={handleHotelChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500">
                  <option value="">{hotelsLoading ? 'Loading hotels...' : 'Select hotel'}</option>
                  {hotelOptions.map((hotel) => (
                    <option key={`${hotel.id}-${hotel.hotelName}`} value={hotel.hotelName}>
                      {hotel.hotelName}
                    </option>
                  ))}
                </select>
              </InputField>
              <InputField label="Hotel Email">
                <input type="email" value={form.hotelEmail} readOnly placeholder="contact@hotel.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500" />
              </InputField>
            </div>
          </div>

          {/* Optional fields */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Optional Reference</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Booking ID">
                <input value={form.bookingId} onChange={set('bookingId')} placeholder="BK-2024-001"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500" />
              </InputField>
              <InputField label="Hotel ID (System)">
                <input value={form.hotelId} onChange={set('hotelId')} placeholder="MongoDB ID if known"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500" />
              </InputField>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{typeof error === 'string' ? error : 'Something went wrong.'}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Send size={14} /> Submit Complaint</>}
          </button>

        </form>

        <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">
          Filing as <span className="text-slate-600">{user?.email || 'guest'}</span>
        </p>
      </div>
    </div>
  )
}
