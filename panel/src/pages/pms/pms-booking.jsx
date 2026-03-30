import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  CircleAlert,
  Eye,
  Hotel,
  RefreshCw,
  Search,
  Users,
  MapPin,
  Mail,
  ChevronDown,
  PencilLine,
  X,
  UserCog,
  ArrowRight,
  CreditCard,
  BedDouble,
  Clock,
  Info,
  MessageSquarePlus
} from 'lucide-react'

import { selectAuth } from '../../../redux/slices/authSlice'
import {
  clearSelectedBooking,
  clearPmsError,
  fetchBookingById,
  fetchBookingsByQuery,
  fetchPartnerHotelBookings,
  resetPmsFilters,
  sendBookingCancellationOtp,
  selectPms,
  setPmsFilters,
  updateBookingData,
  verifyBookingCancellationOtp,
} from '../../../redux/slices/pms/bookings'
import Breadcrumb from '../../components/breadcrumb'
import MasterFilter from '../../components/master-filter'
import { formatDate, formatDateTime, formatCurrency, formatDateInput } from '../../utils/format'

const statusOptions = [
  'Pending',
  'Confirmed',
  'Failed',
  'Cancelled',
  'Checked-in',
  'Checked-out',
  'No-Show',
]
const sourceOptions = ['app', 'site', 'panel']
const privilegedRoles = new Set(['admin', 'developer'])
const checkedOutEditableRoles = new Set(['admin', 'ca', 'developer'])
const financeRoles = new Set(['ca', 'accounts', 'finance'])
const pmsRoles = new Set(['pms'])
const operationsRoles = new Set([
  'partner',
  'manager',
  'hotel-manager',
  'hotel_manager',
  'hoteladmin',
  'hotel-admin',
  'frontdesk',
  'front-desk',
  'reservation',
  'reservations',
])
const statusLabelMap = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  'checked-in': 'Checked-in',
  'checked-out': 'Checked-out',
  'no-show': 'No-Show',
}

const getStatusLabel = (status = '') => {
  const normalizedStatus = String(status).trim().toLowerCase()
  return statusLabelMap[normalizedStatus] || status || 'Unknown'
}

// Ultra-Modern Pill Status Badge
const StatusBadge = ({ status = '' }) => {
  const normalizedStatus = String(status).toLowerCase()
  let config = { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200/60', dot: 'bg-slate-400' }
  
  if (normalizedStatus === 'confirmed') config = { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/20', dot: 'bg-emerald-500' }
  else if (normalizedStatus === 'pending') config = { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/20', dot: 'bg-amber-500' }
  else if (normalizedStatus === 'failed') config = { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/20', dot: 'bg-orange-500' }
  else if (normalizedStatus === 'cancelled') config = { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-600/20', dot: 'bg-rose-500' }
  else if (normalizedStatus === 'checked-in') config = { bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-600/20', dot: 'bg-cyan-500' }
  else if (normalizedStatus === 'completed' || normalizedStatus === 'checked-out') config = { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-600/20', dot: 'bg-indigo-500' }
  else if (normalizedStatus === 'no-show') config = { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', ring: 'ring-fuchsia-600/20', dot: 'bg-fuchsia-500' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`}></span>
      <span>{getStatusLabel(status)}</span>
    </span>
  )
}

const formatCountMap = (data = {}) => Object.entries(data)

const normalizeSourceLabel = (source = '') => {
  const normalized = String(source).trim().toLowerCase()
  if (!normalized) return 'Unknown'
  if (normalized === 'panel') return 'Panel'
  if (normalized === 'site') return 'Site'
  if (normalized === 'app') return 'App'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}
const getCurrentTimeInput = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const getNightCount = (checkInDate, checkOutDate) => {
  const start = new Date(checkInDate)
  const end = new Date(checkOutDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 1
}

const calculateBookingTotal = ({
  checkInDate,
  checkOutDate,
  roomBasePrice,
  numRooms,
  gstPercent,
}) => {
  const nights = getNightCount(checkInDate, checkOutDate)
  const nightlyBase = Number(roomBasePrice) || 0
  const roomCount = Number(numRooms) || 1
  const gst = Number(gstPercent) || 0
  const subtotal = nightlyBase * nights * roomCount
  return Math.round(subtotal + (subtotal * gst) / 100)
}

const getRoleCapabilities = (role = '', currentStatus = '') => {
  const normalizedRole = String(role || '').trim().toLowerCase()
  const normalizedStatus = String(currentStatus || '').trim().toLowerCase()
  const isPrivileged = privilegedRoles.has(normalizedRole)
  const isFinance = financeRoles.has(normalizedRole)
  const isOperations = operationsRoles.has(normalizedRole)
  const isPms = pmsRoles.has(normalizedRole)
  const isClosedBooking = normalizedStatus === 'checked-out'
  const isCancelledBooking = normalizedStatus === 'cancelled'
  const isTerminalBooking =
    normalizedStatus === 'checked-out' ||
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'failed' ||
    normalizedStatus === 'no-show'

  const capabilities = {
    isPrivileged,
    isFinance,
    isOperations,
    canEditCancelled: isPrivileged,
    canEditCheckedOut: checkedOutEditableRoles.has(normalizedRole),
    canEditFinancials: isPrivileged || isFinance,
    canEditAdvanced: isPrivileged,
    canEditGuestAndHotelDetails: isPrivileged,
    canEditDates: false,
    canEditStatus: false,
    canSendCancellationOtp: false,
  }

  if (isPrivileged) {
    capabilities.canEditStatus = true
    capabilities.canEditDates = !isClosedBooking && !isCancelledBooking
    capabilities.canSendCancellationOtp = !isCancelledBooking && normalizedStatus !== 'checked-out'
    return capabilities
  }

  if (isFinance) {
    capabilities.canEditFinancials = true
    return capabilities
  }

  if (isOperations) {
    capabilities.canEditStatus = !isTerminalBooking
    capabilities.canEditDates = normalizedStatus === 'pending' || normalizedStatus === 'confirmed'
    return capabilities
  }

  // PMS role: can only change booking status — price and dates are always locked
  if (isPms) {
    capabilities.canEditStatus = !isTerminalBooking
    capabilities.canEditDates = false
    capabilities.canEditFinancials = false
    return capabilities
  }

  return capabilities
}

const getEditableStatusOptions = (currentStatus, role = '') => {
  const normalizedStatus = String(currentStatus || '').trim().toLowerCase()
  const capabilities = getRoleCapabilities(role, currentStatus)

  if (capabilities.isPrivileged) {
    return statusOptions
  }

  if (capabilities.isOperations) {
    if (normalizedStatus === 'pending') return ['Pending', 'Confirmed']
    if (normalizedStatus === 'confirmed') return ['Confirmed', 'Checked-in', 'No-Show']
    if (normalizedStatus === 'checked-in') return ['Checked-in', 'Checked-out']
    return [getStatusLabel(currentStatus || 'Pending')]
  }

  // PMS role: Confirmed → Checked-in → Checked-out only
  if (pmsRoles.has(String(role || '').trim().toLowerCase())) {
    if (normalizedStatus === 'confirmed') return ['Confirmed', 'Checked-in']
    if (normalizedStatus === 'checked-in') return ['Checked-in', 'Checked-out']
    return [getStatusLabel(currentStatus || 'Pending')]
  }

  return [getStatusLabel(currentStatus || 'Pending')]
}

const InfoRow = ({ label, value, className = '' }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-100 last:border-0 ${className}`}>
    <span className="text-[13px] font-medium text-slate-500">{label}</span>
    <span className="text-sm font-semibold text-slate-900 mt-1 sm:mt-0 text-left sm:text-right">{value || 'N/A'}</span>
  </div>
)

const getDisplayNameFromPerson = (person, fallbackName = 'System Auto') => {
  if (!person) return fallbackName
  if (typeof person === 'string') return person.trim() || fallbackName
  if (typeof person === 'number') return String(person)
  if (Array.isArray(person)) {
    for (const item of person) {
      const label = getDisplayNameFromPerson(item, '')
      if (label) return label
    }
    return fallbackName
  }
  if (typeof person === 'object') {
    // Only check human-readable name fields — never fall back to role/id/etc.
    const candidate =
      (typeof person.name === 'string' && person.name.trim()) ||
      (typeof person.user === 'string' && person.user.trim()) ||
      (typeof person.fullName === 'string' && person.fullName.trim()) ||
      (typeof person.username === 'string' && person.username.trim()) ||
      (typeof person.displayName === 'string' && person.displayName.trim()) ||
      (typeof person.label === 'string' && person.label.trim()) ||
      (person.firstName && person.lastName ? `${person.firstName} ${person.lastName}`.trim() : null) ||
      (typeof person.email === 'string' && person.email.trim())
    if (candidate) return candidate
    return fallbackName
  }
  return fallbackName
}

// Enterprise Grade Vertical Timeline
const StatusTimeline = ({ history, currentUpdatedAt, currentUserName }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10">
        <Clock size={24} className="text-slate-300 mb-2" />
        <p className="text-sm font-medium text-slate-500">No status history tracked.</p>
        <p className="text-xs text-slate-400 mt-1">Last updated: {formatDateTime(currentUpdatedAt)}</p>
      </div>
    )
  }

  return (
    <div className="relative ml-2 space-y-6 py-2">
      {/* Vertical tracking line */}
      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-100 rounded-full" />
      
      {history.map((entry, index) => {
        const status = (entry.newStatus || '').toLowerCase()
        let dotColor = 'bg-slate-300'
        let ringColor = 'ring-slate-100'
        
        if (status === 'confirmed') { dotColor = 'bg-emerald-500'; ringColor = 'ring-emerald-100' }
        else if (status === 'pending') { dotColor = 'bg-amber-500'; ringColor = 'ring-amber-100' }
        else if (status === 'failed') { dotColor = 'bg-orange-500'; ringColor = 'ring-orange-100' }
        else if (status === 'cancelled') { dotColor = 'bg-rose-500'; ringColor = 'ring-rose-100' }
        else if (status === 'checked-in') { dotColor = 'bg-cyan-500'; ringColor = 'ring-cyan-100' }
        else if (status === 'completed' || status === 'checked-out') { dotColor = 'bg-indigo-500'; ringColor = 'ring-indigo-100' }
        else if (status === 'no-show') { dotColor = 'bg-fuchsia-500'; ringColor = 'ring-fuchsia-100' }

        return (
          <div key={`${entry.changedAt || 'log'}-${index}`} className="relative pl-10">
            {/* Elegant Glow Dot */}
            <div className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ${ringColor}`}>
              <div className={`h-2.5 w-2.5 rounded-full ${dotColor} shadow-sm`} />
            </div>

            {/* Timeline Card */}
            <div className="group rounded-xl border border-slate-200/60 bg-white p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all hover:border-slate-300 hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Update</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                    <span className="text-xs font-medium text-slate-500">{formatDateTime(entry.changedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
                    <span className="text-slate-400 line-through font-medium">{getStatusLabel(entry.previousStatus || 'N/A')}</span>
                    <ArrowRight size={14} className="text-slate-300" />
                    <span className={dotColor.replace('bg-', 'text-')}>{getStatusLabel(entry.newStatus)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/60">
                  <UserCog size={14} className="text-slate-400" />
                  {getDisplayNameFromPerson(entry.changedBy, currentUserName || 'System Auto')}
                </div>
              </div>
              
              {entry.note && (
                <div className="mt-3 rounded-lg bg-slate-50/80 p-3 text-[13px] leading-relaxed text-slate-700 ring-1 ring-inset ring-slate-100">
                  <span className="font-semibold text-slate-900 mr-2">Note:</span>
                  {entry.note}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BookingViewModal({ booking, loading, shouldHideGuestContact, showCreatedBy = false, currentUserName = 'System Auto', onClose }) {
  if (!booking) return null

  const navigate = useNavigate()
  const hotelContactNo = booking?.hotelDetails?.hotelContactNo || booking?.hotelDetails?.contactNo || booking?.hotelDetails?.mobile || 'Not available'
  // const paymentStatus = booking?.paymentStatus || (String(booking?.pm || '').toLowerCase() === 'offline' ? 'Pending (Pay at Hotel)' : 'Completed')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        
        {/* Sticky Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 py-4 z-10">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Booking Details</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{booking?.bookingId}</span>
              <span className="text-xs text-slate-400">• Created {formatDate(booking?.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                navigate('/complaint/create', {
                  state: {
                    bookingId: booking?.bookingId || '',
                    hotelId: booking?.hotelDetails?.hotelId || booking?.hotelId || '',
                    hotelName: booking?.hotelDetails?.hotelName || '',
                    hotelEmail: booking?.hotelDetails?.hotelEmail || '',
                  },
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 focus:outline-none"
            >
              <MessageSquarePlus size={16} />
              Raise a Complaint
            </button>
            <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw size={28} className="animate-spin text-indigo-500 mb-4" />
              <p className="text-sm font-semibold text-slate-500">Loading booking record...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Top Hero Card */}
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{booking.guestDetails?.fullName || booking.user?.name || 'Guest User'}</h3>
                    <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Hotel size={16} className="text-slate-400" />
                      {booking.hotelDetails?.hotelName || 'Property N/A'}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <StatusBadge status={booking.bookingStatus} />
                    <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase ring-1 ring-inset ring-slate-200/60">
                      SRC: {booking.bookingSource || booking.normalizedSource || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {showCreatedBy && (
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                    <UserCog size={16} className="text-violet-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Created By</h3>
                  </div>
                  <InfoRow label="Name" value={booking.createdBy?.user || booking.createdBy?.name || 'Not available'} />
                  <InfoRow label="Email" value={booking.createdBy?.email || 'Not available'} />
                </div>
              )}

              {/* Info Grids */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Guest Profile */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                    <Users size={16} className="text-indigo-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Guest Profile</h3>
                  </div>
                  <InfoRow label="Full Name" value={booking.guestDetails?.fullName || booking.user?.name} />
                  {!shouldHideGuestContact && <InfoRow label="Contact Number" value={booking.guestDetails?.mobile || booking.user?.mobile} />}
                  {!shouldHideGuestContact && (
                    <InfoRow label="Email Address" value={booking.guestDetails?.email || booking.user?.email} className="truncate" />
                  )}
                  <InfoRow label="Total Occupants" value={`${booking.guests || 1} Guest(s)`} />
                </div>

                {/* Stay Itinerary */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                    <CalendarDays size={16} className="text-emerald-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Stay Itinerary</h3>
                  </div>
                  <InfoRow label="Location" value={booking.hotelDetails?.hotelCity || booking.destination} />
                  <InfoRow label="Property Contact" value={hotelContactNo} />
                  <InfoRow label="Check-In" value={`${formatDate(booking.checkInDate)} • ${booking?.checkInTime || '12:00 PM'}`} />
                  <InfoRow label="Check-Out" value={`${formatDate(booking.checkOutDate)} • ${booking?.checkOutTime || '11:00 AM'}`} />
                </div>

                {/* Room Configuration */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                    <BedDouble size={16} className="text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Room Details</h3>
                  </div>
                  <InfoRow label="Rooms Booked" value={booking.numRooms || 1} />
                  <InfoRow label="Room Category" value={booking.roomDetails?.[0]?.type || 'Standard Room'} />
                  <InfoRow label="Bed Layout" value={booking.roomDetails?.[0]?.bedTypes || 'N/A'} />
                  <InfoRow label="Base Price" value={formatCurrency(booking.roomDetails?.[0]?.price)} />
                </div>

                {/* Billing Summary */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                    <CreditCard size={16} className="text-rose-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Billing & Payment</h3>
                  </div>
                  <InfoRow label="Payment Mode" value={booking.pm || 'N/A'} />
                  {/* <InfoRow label="Payment Status" value={paymentStatus} /> */}
                  <InfoRow label="Coupon Code" value={booking.couponCode || 'Not applied'} />
                  <InfoRow label="Taxes / GST" value={formatCurrency(Number(booking.price || 0) - Number(booking.roomDetails?.[0]?.price || 0))} />
                  <div className="flex items-center justify-between pt-4 mt-1 border-t border-dashed border-slate-200">
                    <span className="text-sm font-bold text-slate-900">Grand Total</span>
                    <span className="text-lg font-extrabold text-indigo-600">{formatCurrency(booking.price)}</span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                  <Clock size={18} className="text-slate-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Lifecycle & Timeline</h3>
                </div>
                <StatusTimeline history={booking.statusHistory} currentUpdatedAt={booking.updatedAt} currentUserName={currentUserName} />
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// Note: Ensure your helper functions (formatDateInput, getStatusLabel, getEditableStatusOptions, getNightCount, calculateBookingTotal, StatusBadge) are imported/available in this file.

function BookingEditModal({
  booking,
  loading,
  isLocked,
  isCancelledRestricted = false,
  userRole = '',
  capabilities,
  allowAdvancedEdit = false,
  otpSending = false,
  onClose,
  onSubmit,
  onSendCancellationOtp,
}) {
  const [bookingStatus, setBookingStatus] = useState(booking?.bookingStatus || 'Pending')
  const [pm] = useState(booking?.pm || '')
  const [cancellationReason, setCancellationReason] = useState(booking?.cancellationReason || '')
  const [cancellationOtp, setCancellationOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [checkInDate, setCheckInDate] = useState(formatDateInput(booking?.checkInDate))
  const [checkOutDate, setCheckOutDate] = useState(formatDateInput(booking?.checkOutDate))
  const [checkInTime, setCheckInTime] = useState(booking?.checkInTime || getCurrentTimeInput())
  const [checkOutTime, setCheckOutTime] = useState(booking?.checkOutTime || getCurrentTimeInput())
  const [price, setPrice] = useState(String(booking?.price ?? ''))
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false)
  
  const [guestDetails, setGuestDetails] = useState(() => ({
    fullName: booking?.guestDetails?.fullName || booking?.user?.name || '',
    mobile: booking?.guestDetails?.mobile || booking?.user?.mobile || '',
    email: booking?.guestDetails?.email || booking?.user?.email || '',
  }))
  
  const [hotelDetails, setHotelDetails] = useState(() => ({
    hotelName: booking?.hotelDetails?.hotelName || '',
    hotelCity: booking?.hotelDetails?.hotelCity || booking?.destination || '',
    hotelEmail: booking?.hotelDetails?.hotelEmail || '',
    hotelOwnerName: booking?.hotelDetails?.hotelOwnerName || '',
    destination: booking?.hotelDetails?.destination || booking?.destination || '',
  }))
  
  const [metaFields, setMetaFields] = useState(() => ({
    guests: String(booking?.guests ?? ''),
    numRooms: String(booking?.numRooms ?? ''),
    gstPrice: String(booking?.gstPrice ?? ''),
    discountPrice: String(booking?.discountPrice ?? ''),
    couponCode: booking?.couponCode || '',
    destination: booking?.destination || '',
  }))

  const roleCapabilities = capabilities || getRoleCapabilities(userRole, booking?.bookingStatus)
  const isAdvancedEditEnabled = allowAdvancedEdit && roleCapabilities.canEditAdvanced

  const currentStatus = getStatusLabel(booking?.bookingStatus)
  const editableStatusOptions = getEditableStatusOptions(booking?.bookingStatus, userRole)
  const normalizedCurrentStatus = String(booking?.bookingStatus || '').trim().toLowerCase()
  const normalizedNextStatus = String(bookingStatus || '').trim().toLowerCase()
  const requiresCheckInTime =
    normalizedCurrentStatus === 'confirmed' && normalizedNextStatus === 'checked-in'
  const requiresCheckOutTime =
    normalizedCurrentStatus === 'checked-in' && normalizedNextStatus === 'checked-out'
  const currentNightCount = getNightCount(booking?.checkInDate, booking?.checkOutDate)
  const updatedNightCount = getNightCount(checkInDate, checkOutDate)
  const autoCalculatedPrice = calculateBookingTotal({
    checkInDate,
    checkOutDate,
    roomBasePrice: booking?.roomDetails?.[0]?.price,
    numRooms: metaFields.numRooms || booking?.numRooms || 1,
    gstPercent: metaFields.gstPrice || booking?.gstPrice || 0,
  })
  
  const effectivePrice = isPriceManuallyEdited ? price : String(autoCalculatedPrice)
  const isStatusReadOnly = isLocked || isCancelledRestricted || !roleCapabilities.canEditStatus
  const isCancellationReadOnly =
    isLocked || isCancelledRestricted || !roleCapabilities.canEditCancelled
  const isDatesReadOnly = isLocked || !roleCapabilities.canEditDates
  const isFinancialReadOnly = isLocked || !roleCapabilities.canEditFinancials
  const isCancelling = bookingStatus === 'Cancelled' && !isCancellationReadOnly
  const canSubmitAnyChanges =
    roleCapabilities.canEditStatus ||
    roleCapabilities.canEditDates ||
    roleCapabilities.canEditFinancials ||
    isAdvancedEditEnabled

  if (!booking) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!booking?.bookingId || isLocked) return
    if (!canSubmitAnyChanges) {
      window.alert('You do not have permission to update this booking.')
      return
    }

    if (checkOutDate && checkInDate && new Date(checkOutDate) <= new Date(checkInDate)) {
      window.alert('Check-out date must be after check-in date.')
      return
    }

    if (isCancelling && !cancellationReason.trim()) {
      window.alert('Cancellation reason is required when cancelling a booking.')
      return
    }

    if (isCancelling && !String(cancellationOtp).trim()) {
      window.alert('OTP is required to cancel this booking.')
      return
    }

    if (requiresCheckInTime && !String(checkInTime).trim()) {
      window.alert('Check-in time is required when moving booking to Checked-in.')
      return
    }

    if (requiresCheckOutTime && !String(checkOutTime).trim()) {
      window.alert('Check-out time is required when moving booking to Checked-out.')
      return
    }

    const payload = {}

    if (roleCapabilities.canEditStatus) payload.bookingStatus = bookingStatus
    if (roleCapabilities.canEditDates && checkOutDate) payload.checkOutDate = checkOutDate
    if (roleCapabilities.canEditDates && checkInDate) payload.checkInDate = checkInDate
    if (roleCapabilities.canEditFinancials) payload.price = Number(effectivePrice) || 0
    if (roleCapabilities.canEditStatus && requiresCheckInTime) payload.checkInTime = checkInTime
    if (roleCapabilities.canEditStatus && requiresCheckOutTime) payload.checkOutTime = checkOutTime
    if (isCancelling) {
      onSubmit(booking.bookingId, {
        otp: cancellationOtp.trim(),
        cancellationReason: cancellationReason.trim(),
      })
      return
    }

    if (isAdvancedEditEnabled) {
      payload.guestDetails = {
        ...booking?.guestDetails,
        fullName: guestDetails.fullName.trim(),
        mobile: guestDetails.mobile.trim(),
        email: guestDetails.email.trim(),
      }
      payload.hotelDetails = {
        ...booking?.hotelDetails,
        hotelName: hotelDetails.hotelName.trim(),
        hotelCity: hotelDetails.hotelCity.trim(),
        hotelEmail: hotelDetails.hotelEmail.trim(),
        hotelOwnerName: hotelDetails.hotelOwnerName.trim(),
        destination: hotelDetails.destination.trim(),
      }
      payload.guests = Number(metaFields.guests) || 0
      payload.numRooms = Number(metaFields.numRooms) || 1
      payload.gstPrice = Number(metaFields.gstPrice) || 0
      payload.discountPrice = Number(metaFields.discountPrice) || 0
      payload.destination = metaFields.destination.trim()
    }

    onSubmit(booking.bookingId, payload)
  }

  // Helper for consistent input styling
  const inputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
  const labelClass = "text-[12px] font-semibold text-slate-700 uppercase tracking-wide"
  const handleStatusChange = (nextStatus) => {
    const normalizedStatus = String(nextStatus || '').trim().toLowerCase()
    setBookingStatus(nextStatus)
    if (normalizedStatus !== 'cancelled') {
      setCancellationOtp('')
      setOtpSent(false)
    }

    if (normalizedCurrentStatus === 'confirmed' && normalizedStatus === 'checked-in' && !checkInTime) {
      setCheckInTime(getCurrentTimeInput())
    }

    if (normalizedCurrentStatus === 'checked-in' && normalizedStatus === 'checked-out' && !checkOutTime) {
      setCheckOutTime(getCurrentTimeInput())
    }
  }

  const handleSendOtp = async () => {
    if (!booking?.bookingId) return
    if (!cancellationReason.trim()) {
      window.alert('Cancellation reason is required before sending OTP.')
      return
    }

    await onSendCancellationOtp(booking.bookingId)
    setOtpSent(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200">
        
        {/* Compact Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Booking <span className="font-mono text-slate-500 font-normal ml-1">#{booking.bookingId}</span></h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors focus:outline-none">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="booking-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="space-y-6">
            
            {/* Locked Alert */}
            {(isLocked || isCancelledRestricted || !canSubmitAnyChanges) && (
              <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shadow-sm">
                <CircleAlert size={16} className="shrink-0 mt-0.5" />
                <p>
                  <strong>Restricted:</strong>{' '}
                  {isLocked
                    ? 'This booking is locked because it is checked-out.'
                    : isCancelledRestricted
                      ? 'This booking is already cancelled. Only Admin or Developer can change the status or cancellation reason.'
                      : 'Your role has limited access on this booking. Only allowed operational or financial fields can be updated.'}
                </p>
              </div>
            )}

            {/* Role Access Summary Banner */}
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 shadow-sm">
              <p className="font-bold uppercase tracking-widest text-slate-500 mb-2 text-[10px]">Your Access for this Booking</p>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${roleCapabilities.canEditStatus ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-400 ring-slate-200/60 line-through'}`}>
                  Status Change
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${roleCapabilities.canEditDates ? 'bg-cyan-50 text-cyan-700 ring-cyan-600/20' : 'bg-slate-100 text-slate-400 ring-slate-200/60 line-through'}`}>
                  Edit Dates
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${roleCapabilities.canEditFinancials ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-slate-100 text-slate-400 ring-slate-200/60 line-through'}`}>
                  Edit Financials
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${roleCapabilities.canSendCancellationOtp ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-slate-100 text-slate-400 ring-slate-200/60 line-through'}`}>
                  Cancel Booking
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${roleCapabilities.canEditAdvanced ? 'bg-violet-50 text-violet-700 ring-violet-600/20' : 'bg-slate-100 text-slate-400 ring-slate-200/60 line-through'}`}>
                  Advanced Edit
                </span>
              </div>
            </div>

            {/* Primary Editing Block */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">Primary Details</h3>
                <StatusBadge status={currentStatus} />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className={labelClass}>Status</label>
                    <span className="text-[10px] text-slate-400 font-medium">Curr: {currentStatus}</span>
                  </div>
                  <div className="relative">
                    <select value={bookingStatus} onChange={(e) => handleStatusChange(e.target.value)} disabled={isStatusReadOnly} className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                      {editableStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className={labelClass}>Payment Mode</label>
                    <span className="text-[10px] text-slate-400 font-medium">Read only</span>
                  </div>
                  <input type="text" value={pm} readOnly disabled placeholder="Cash, Card..." className={inputClass} />
                </div>

                {isCancelling && (
                  <div className="md:col-span-2 lg:col-span-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className={`${labelClass} text-rose-600`}>Cancel Reason *</label>
                        </div>
                        <input type="text" value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} disabled={isCancellationReadOnly} placeholder="Required..." className={`${inputClass} border-rose-300 focus:border-rose-500 focus:ring-rose-500`} />
                        <p className="mt-1 text-[11px] font-medium text-rose-500">For cancellation call to admin.</p>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Cancellation OTP</p>
                            <p className="mt-1 text-xs text-slate-500">Send OTP, then verify to complete cancellation.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isCancellationReadOnly || otpSending}
                            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                          >
                            {otpSending ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                          </button>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between mb-1">
                            <label className={`${labelClass} text-rose-600`}>OTP *</label>
                            <span className="text-[10px] text-slate-400 font-medium">{otpSent ? 'Sent' : 'Awaiting send'}</span>
                          </div>
                          <input
                            type="text"
                            value={cancellationOtp}
                            onChange={(e) => setCancellationOtp(e.target.value)}
                            disabled={isCancellationReadOnly}
                            placeholder="Enter OTP"
                            className={`${inputClass} border-rose-300 focus:border-rose-500 focus:ring-rose-500`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between mb-1">
                    <label className={labelClass}>Check-In</label>
                    <span className="text-[10px] text-slate-400 font-medium">{formatDate(booking?.checkInDate)}</span>
                  </div>
                  <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} disabled={isDatesReadOnly} className={inputClass} />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className={labelClass}>Check-Out</label>
                    <span className="text-[10px] text-slate-400 font-medium">{formatDate(booking?.checkOutDate)}</span>
                  </div>
                  <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} disabled={isDatesReadOnly} className={inputClass} />
                </div>

                {requiresCheckInTime && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between mb-1">
                      <label className={`${labelClass} text-emerald-600`}>Check-In Time *</label>
                      <span className="text-[10px] text-slate-400 font-medium">Curr: {booking?.checkInTime || 'N/A'}</span>
                    </div>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      disabled={isLocked || !roleCapabilities.canEditStatus}
                      className={`${inputClass} border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500`}
                    />
                  </div>
                )}

                {requiresCheckOutTime && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between mb-1">
                      <label className={`${labelClass} text-indigo-600`}>Check-Out Time *</label>
                      <span className="text-[10px] text-slate-400 font-medium">Curr: {booking?.checkOutTime || 'N/A'}</span>
                    </div>
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      disabled={isLocked || !roleCapabilities.canEditStatus}
                      className={`${inputClass} border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500`}
                    />
                  </div>
                )}

                {roleCapabilities.canEditFinancials && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className={labelClass}>Total Price (₹)</label>
                      <span className="text-[10px] text-slate-400 font-medium">Curr: {formatCurrency(booking?.price)}</span>
                    </div>
                    <input type="number" value={effectivePrice} onChange={(e) => { setIsPriceManuallyEdited(true); setPrice(e.target.value); }} disabled={isFinancialReadOnly} className={inputClass} />
                  </div>
                )}
              </div>

              {/* Smart Checkout Logic Banner */}
              {updatedNightCount !== currentNightCount && (
                <div className="flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-700 border border-indigo-100">
                  <Info size={14} className="shrink-0" />
                  <p>Nights changed from <strong>{currentNightCount}</strong> to <strong>{updatedNightCount}</strong>. Auto-calc price: <strong>{formatCurrency(autoCalculatedPrice)}</strong>.</p>
                </div>
              )}
            </div>

            {/* Advanced Editing Block (Admins Only) */}
            {isAdvancedEditEnabled && (
              <div className="pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Advanced Operations</h3>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200">Admin Only</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Guest Info Box */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 mb-2">Guest Profile</h4>
                    <div>
                      <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Name</label></div>
                      <input value={guestDetails.fullName} onChange={(e) => setGuestDetails((prev) => ({ ...prev, fullName: e.target.value }))} disabled={isLocked} className={inputClass} />
                    </div>
                    {roleCapabilities.canEditGuestAndHotelDetails && (
                      <>
                        <div>
                          <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Mobile</label></div>
                          <input value={guestDetails.mobile} onChange={(e) => setGuestDetails((prev) => ({ ...prev, mobile: e.target.value }))} disabled={isLocked} className={inputClass} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Email</label></div>
                          <input value={guestDetails.email} onChange={(e) => setGuestDetails((prev) => ({ ...prev, email: e.target.value }))} disabled={isLocked} className={inputClass} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Hotel Info Box */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 mb-2">Property Details</h4>
                    <div>
                      <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Hotel Name</label></div>
                      <input value={hotelDetails.hotelName} onChange={(e) => setHotelDetails((prev) => ({ ...prev, hotelName: e.target.value }))} disabled={isLocked} className={inputClass} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">City</label></div>
                      <input value={hotelDetails.hotelCity} onChange={(e) => setHotelDetails((prev) => ({ ...prev, hotelCity: e.target.value }))} disabled={isLocked} className={inputClass} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Owner Name</label></div>
                      <input value={hotelDetails.hotelOwnerName} onChange={(e) => setHotelDetails((prev) => ({ ...prev, hotelOwnerName: e.target.value }))} disabled={isLocked} className={inputClass} />
                    </div>
                  </div>

                  {/* Meta Details Box */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 mb-2">Booking Meta</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Guests</label></div>
                        <input type="number" value={metaFields.guests} onChange={(e) => setMetaFields((prev) => ({ ...prev, guests: e.target.value }))} disabled={isLocked} className={inputClass} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Rooms</label></div>
                        <input type="number" value={metaFields.numRooms} onChange={(e) => setMetaFields((prev) => ({ ...prev, numRooms: e.target.value }))} disabled={isLocked} className={inputClass} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">GST %</label></div>
                        <input type="number" value={metaFields.gstPrice} onChange={(e) => setMetaFields((prev) => ({ ...prev, gstPrice: e.target.value }))} disabled={isLocked} className={inputClass} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><label className="text-[10px] font-semibold text-slate-500 uppercase">Discount</label></div>
                        <input type="number" value={metaFields.discountPrice} onChange={(e) => setMetaFields((prev) => ({ ...prev, discountPrice: e.target.value }))} disabled={isLocked} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Coupon Code</label>
                        <span className="text-[10px] font-medium text-slate-400">Read only</span>
                      </div>
                      <input value={metaFields.couponCode} disabled className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors focus:outline-none">
            Cancel
          </button>
          <button type="submit" form="booking-edit-form" disabled={loading || isLocked || !canSubmitAnyChanges} className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 transition-colors">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}

function PmsBooking({ title = 'PMS Bookings', fetchMode = 'partner', fixedFilters = {}, hideSourceFilter = false, subtitle = '', showPartnerIdentity = true, extraFilterFields = [], hideGuestContactForNonPrivileged = true, allowAdvancedEditForPrivileged = false, propertyFilterMode = 'select', showCreatedBy = false }) {
  const dispatch = useDispatch()
  const { user } = useSelector(selectAuth)
  const {
    partner,
    summary,
    hotels,
    bookings,
    selectedBooking,
    filters,
    loading,
    detailLoading,
    updatingBooking,
    sendingCancellationOtp,
    verifyingCancellationOtp,
    error,
  } = useSelector(selectPms)
  
  const [activeTab, setActiveTab] = useState('overview') 
  const [modalMode, setModalMode] = useState('')
  const [activeBookingRow, setActiveBookingRow] = useState(null)
  const hasLoadedInitialDataRef = useRef(false)
  const normalizedUserRole = String(user?.role || '').toLowerCase()
  const isPrivilegedUser = privilegedRoles.has(normalizedUserRole)
  const shouldHideGuestContact = hideGuestContactForNonPrivileged && !isPrivilegedUser
  const resolvedBooking = selectedBooking || activeBookingRow
  const normalizedResolvedStatus = String(resolvedBooking?.bookingStatus || '').toLowerCase()
  const resolvedCapabilities = getRoleCapabilities(normalizedUserRole, normalizedResolvedStatus)
  const isCancelledBookingRestricted = normalizedResolvedStatus === 'cancelled' && !isPrivilegedUser
  const isCheckedOutBookingLocked =
    normalizedResolvedStatus === 'checked-out' && !resolvedCapabilities.canEditCheckedOut
  const isBookingLocked = isCheckedOutBookingLocked

  const getBookingIdentifier = (booking) => String(booking?.bookingId || '').trim()
  const appliedFilters = useMemo(() => ({ ...filters, ...fixedFilters }), [filters, fixedFilters])
  const normalizedSourceCounts = useMemo(() => {
    const entries = Object.entries(summary?.sourceCounts || {})
    return entries.reduce((acc, [source, count]) => {
      const label = normalizeSourceLabel(source)
      acc[label] = (acc[label] || 0) + (Number(count) || 0)
      return acc
    }, {})
  }, [summary?.sourceCounts])

  const loadBookings = async (nextFilters = appliedFilters) => {
    if (fetchMode === 'query') await dispatch(fetchBookingsByQuery({ filters: nextFilters, fixedFilters }))
    else if (user?.id) await dispatch(fetchPartnerHotelBookings({ partnerId: user.id, filters: nextFilters }))
  }

  useEffect(() => {
    if (hasLoadedInitialDataRef.current) return
    hasLoadedInitialDataRef.current = true
    // Reset any stale Redux filters left over from other PMS pages (e.g. Panel Booking
    // writes bookingSource:'Panel' into Redux; without this reset, navigating to
    // /your-bookings would carry that filter and return 0 results).
    dispatch(resetPmsFilters())
    const cleanFilters = { ...fixedFilters }
    if (fetchMode === 'query') dispatch(fetchBookingsByQuery({ filters: cleanFilters, fixedFilters }))
    else if (user?.id) dispatch(fetchPartnerHotelBookings({ partnerId: user.id, filters: cleanFilters }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, fetchMode, fixedFilters, user?.id])

  const hotelOptions = useMemo(() => hotels.map((h) => ({ value: h.hotelId, label: h.hotelName || 'Unnamed Hotel' })), [hotels])
  const masterFilterFields = useMemo(() => {
    const baseFields = [
      propertyFilterMode === 'text'
        ? {
            key: 'hotelId',
            label: 'Hotel ID',
            type: 'text',
            placeholder: 'Filter by Hotel ID',
          }
        : {
            key: 'hotelId',
            label: 'Property',
            type: 'select',
            options: hotelOptions,
            emptyOptionLabel: 'All Properties',
          },
      {
        key: 'bookingStatus',
        label: 'Booking Status',
        type: 'select',
        options: statusOptions,
        emptyOptionLabel: 'Any Status',
      },
      {
        key: 'bookingSource',
        label: 'Booking Source',
        type: 'select',
        options: sourceOptions,
        emptyOptionLabel: 'Any Source',
        hidden: hideSourceFilter,
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
      },
      {
        key: 'email',
        label: 'User Email',
        type: 'text',
        placeholder: 'Filter by User Email',
      },
      {
        key: 'userId',
        label: 'User ID',
        type: 'text',
        placeholder: 'Filter by User ID',
      },
      {
        key: 'userMobile',
        label: 'User Mobile',
        type: 'text',
        placeholder: 'Filter by User Mobile',
      },
      {
        key: 'bookingId',
        label: 'Booking ID',
        type: 'text',
        placeholder: 'Filter by Booking ID',
      },
      {
        key: 'hotelEmail',
        label: 'Hotel Email',
        type: 'text',
        placeholder: 'Filter by Hotel Email',
      },
      {
        key: 'hotelCity',
        label: 'Hotel City',
        type: 'text',
        placeholder: 'Filter by Hotel City',
      },
      {
        key: 'couponCode',
        label: 'Coupon Code',
        type: 'text',
        placeholder: 'Filter by Coupon Code',
      },
      {
        key: 'createdBy',
        label: 'Created By',
        type: 'text',
        placeholder: 'Filter by Created By',
      },
    ]

    const overrideFields = extraFilterFields.map((field) => ({
      type: 'text',
      ...field,
    }))

    const fieldMap = new Map()
    ;[...baseFields, ...overrideFields].forEach((field) => {
      fieldMap.set(field.key, field)
    })

    return Array.from(fieldMap.values()).filter(Boolean)
  }, [propertyFilterMode, hotelOptions, hideSourceFilter, extraFilterFields])

  const handleFilterChange = (key, value) => dispatch(setPmsFilters({ [key]: value }))
  const handleApplyFilters = () => loadBookings(appliedFilters)
  const handleResetFilters = () => {
    dispatch(resetPmsFilters())
    loadBookings({})
  }

  const closeBookingModal = () => { setModalMode(''); setActiveBookingRow(null); dispatch(clearSelectedBooking()) }
  const handleViewBooking = async (booking) => {
    const id = getBookingIdentifier(booking)
    setActiveBookingRow(booking)
    setModalMode('view')
    if (id) await dispatch(fetchBookingById(id))
  }
  const handleEditBooking = async (booking) => {
    const id = getBookingIdentifier(booking)
    setActiveBookingRow(booking)
    setModalMode('edit')
    if (id) await dispatch(fetchBookingById(id))
  }
  const handleUpdateBooking = async (bookingId, payload) => {
    if ('otp' in payload) {
      await dispatch(
        verifyBookingCancellationOtp({
          bookingId,
          otp: payload.otp,
          cancellationReason: payload.cancellationReason,
        }),
      ).unwrap()
    } else {
      const resolvedUserName = user?.name || user?.fullName || user?.user || user?.username || user?.email || 'System'
      const enrichedPayload = {
        ...payload,
        ...(payload.bookingStatus && {
          changedBy: {
            userId: user?.id || user?._id || '',
            name:   resolvedUserName,
            email:  user?.email || '',
            role:   user?.role  || '',
          },
          note: payload.note || '',
        }),
      }
      console.debug('[PMS] updateBooking enrichedPayload:', enrichedPayload)
      await dispatch(updateBookingData({ bookingId, updateData: enrichedPayload })).unwrap()
    }
    await loadBookings(appliedFilters)
    closeBookingModal()
  }

  const handleSendCancellationOtp = async (bookingId) => {
    await dispatch(sendBookingCancellationOtp(bookingId)).unwrap()
  }

  const canEditBookingRecord = (booking) => {
    const capabilities = getRoleCapabilities(normalizedUserRole, booking?.bookingStatus)
    return (
      capabilities.canEditStatus ||
      capabilities.canEditDates ||
      capabilities.canEditFinancials ||
      capabilities.canEditAdvanced ||
      pmsRoles.has(normalizedUserRole)
    )
  }

  return (
    <div className="bg-slate-50/40 font-sans text-slate-900 selection:bg-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Area */}
        <div className="mb-8">
          <Breadcrumb />
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <Building2 size={16} className="text-slate-400" />
                  {showPartnerIdentity ? (
                    <>
                      <span className="font-semibold text-slate-800">{partner?.name || user?.name || 'Current Partner'}</span>
                      <span className="text-slate-300">•</span>
                      <span>{partner?.email || user?.email || 'N/A'}</span>
                    </>
                  ) : <span className="font-medium text-slate-600">All bookings across network</span>}
                </div>
              )}
            </div>
            <button onClick={handleApplyFilters} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Sync Data
            </button>
          </div>

          {error && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-medium text-rose-700">
                <CircleAlert size={18} />
                <p>{error}</p>
              </div>
              <button onClick={() => dispatch(clearPmsError())} className="text-sm font-bold text-rose-600 hover:text-rose-800">Dismiss</button>
            </div>
          )}
        </div>

            {/* Custom Tab Navigation */}
            <div className="mb-6 border-b border-slate-200">
              <nav className="-mb-px flex space-x-6 sm:space-x-8">
                <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-all ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}>
                  Dashboard Overview
                </button>
                <button onClick={() => setActiveTab('bookings')} className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bookings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}>
                  Bookings 
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${activeTab === 'bookings' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {summary?.totalBookings ?? bookings.length}
                  </span>
                </button>
              </nav>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Clean KPI Grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
                  {[{ label: 'Total Properties', value: summary?.totalHotels ?? 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' }, { label: 'Total Volume', value: summary?.totalBookings ?? 0, icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' }, { label: 'Active Sources', value: Object.keys(normalizedSourceCounts).length, icon: Search, color: 'text-amber-600', bg: 'bg-amber-50' }, { label: 'Status Types', value: Object.keys(summary?.statusCounts || {}).length, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' }].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} ring-1 ring-inset ring-current/10`}>
                          <stat.icon size={24} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                          <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{loading ? '...' : stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  {/* Mapped Properties */}
                  <div className="lg:col-span-2">
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Hotel size={18} className="text-indigo-500"/> Mapped Portfolio</h2>
                    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                      {hotels.length === 0 ? (
                        <div className="border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm font-medium text-slate-500">
                          No properties mapped to this account.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.8fr)_auto] gap-4 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 sm:grid">
                            <span>Property</span>
                            <span>Location</span>
                            <span>Email</span>
                            <span>Hotel ID</span>
                          </div>
                          {hotels.map((h) => (
                            <div
                              key={h._id || h.hotelId}
                              className="grid gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.8fr)_auto] sm:items-center sm:gap-4"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">
                                  {h.hotelName || 'Unnamed Property'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
                                <MapPin size={15} className="shrink-0 text-slate-400" />
                                <span className="truncate">{[h.city, h.state].filter(Boolean).join(', ') || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
                                <Mail size={15} className="shrink-0 text-slate-400" />
                                <span className="truncate">{h.hotelEmail || 'No email data'}</span>
                              </div>
                              <div className="sm:text-right">
                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                                  ID: {h.hotelId || 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Analytics Widget */}
                  <div>
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Search size={18} className="text-emerald-500"/> Booking Analytics</h2>
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                      <div className="mb-8">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Status Distribution</h3>
                        <div className="space-y-3.5">
                          {formatCountMap(summary?.statusCounts).length === 0 && <p className="text-sm text-slate-500">No metrics found.</p>}
                          {formatCountMap(summary?.statusCounts).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between">
                              <StatusBadge status={k} />
                              <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Source Channels</h3>
                        <div className="space-y-3.5">
                          {formatCountMap(normalizedSourceCounts).length === 0 && <p className="text-sm text-slate-500">No metrics found.</p>}
                          {formatCountMap(normalizedSourceCounts).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-700 capitalize flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>{k}
                              </span>
                              <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BOOKINGS DIRECTORY */}
            {activeTab === 'bookings' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <MasterFilter
                  title="Booking Filters"
                  description="Search bookings by property, status, source, date, and admin filters."
                  fields={masterFilterFields}
                  values={filters}
                  loading={loading}
                  defaultExpanded
                  enableFieldPicker
                  fieldPickerLabel="Select booking filter key"
                  initialActiveFieldKeys={['hotelId', 'bookingStatus', 'date', 'bookingId']}
                  applyLabel="Apply"
                  resetLabel="Reset"
                  onChange={handleFilterChange}
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                />

                {/* Main Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)]">

                  {/* ── MOBILE / SMALL SCREEN: Card list (< md) ── */}
                  <div className="md:hidden">
                    {loading && bookings.length === 0 && (
                      <div className="px-4 py-16 text-center text-sm font-medium text-slate-500">Loading directory…</div>
                    )}
                    {!loading && bookings.length === 0 && (
                      <div className="px-4 py-16 text-center text-sm font-medium text-slate-500">No records found. Try adjusting your filters.</div>
                    )}
                    <div className="divide-y divide-slate-100">
                      {bookings.map((b) => (
                        <div key={b._id || b.bookingId} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                          {/* Row 1: Booking ID + Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-slate-900 truncate">{b.bookingId}</p>
                              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{formatDate(b.createdAt)}</p>
                            </div>
                            <StatusBadge status={b.bookingStatus} />
                          </div>

                          {/* Row 2: Property */}
                          <div className="flex items-start gap-2">
                            <Hotel size={13} className="mt-0.5 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{b.hotelDetails?.hotelName || 'Unnamed Property'}</p>
                              <p className="text-[11px] font-mono text-slate-400">ID: {b.hotelDetails?.hotelId || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Row 3: Guest / Created By */}
                          {showCreatedBy ? (
                            <div className="flex items-start gap-2">
                              <UserCog size={13} className="mt-0.5 shrink-0 text-slate-400" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{b.createdBy?.user || b.createdBy?.name || 'Unknown'}</p>
                                <p className="text-[11px] text-slate-500 truncate">{b.createdBy?.email || 'No email'}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <Users size={13} className="mt-0.5 shrink-0 text-slate-400" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{b.guestDetails?.fullName || b.user?.name || 'Unknown'}</p>
                                {!shouldHideGuestContact && <p className="text-[11px] text-slate-500">{b.guestDetails?.mobile}</p>}
                              </div>
                            </div>
                          )}

                          {/* Row 4: Itinerary + Price + Actions */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                                <CalendarDays size={11} className="shrink-0 text-slate-400" />
                                <span className="truncate">{formatDate(b.checkInDate)}</span>
                                <ArrowRight size={10} className="text-slate-300 shrink-0" />
                                <span className="truncate">{formatDate(b.checkOutDate)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold text-slate-900">{formatCurrency(b.price)}</span>
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{b.normalizedSource || b.bookingSource}</span>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                onClick={() => handleViewBooking(b)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                              >
                                <Eye size={16} />
                              </button>
                              {canEditBookingRecord(b) && (
                                <button
                                  onClick={() => handleEditBooking(b)}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                >
                                  <PencilLine size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── DESKTOP / TABLET: Scrollable table (md+) ── */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/80">
                        <tr>
                          {['Record ID', 'Property', showCreatedBy ? 'Created By' : 'Guest', 'Status', 'Itinerary', 'Financials', ''].map((header) => (
                            <th key={header} className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {loading && bookings.length === 0 && (
                          <tr><td colSpan="7" className="px-6 py-16 text-center text-sm font-medium text-slate-500">Loading directory…</td></tr>
                        )}
                        {!loading && bookings.length === 0 && (
                          <tr><td colSpan="7" className="px-6 py-16 text-center text-sm font-medium text-slate-500">No records found. Try adjusting your filters.</td></tr>
                        )}
                        {bookings.map((b) => (
                          <tr key={b._id || b.bookingId} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 whitespace-nowrap">
                              <p className="text-sm font-extrabold text-slate-900">{b.bookingId}</p>
                              <p className="text-[11px] font-semibold text-slate-400 mt-1">{formatDate(b.createdAt)}</p>
                            </td>
                            <td className="px-5 py-4 max-w-[180px]">
                              <p className="text-sm font-bold text-slate-800 truncate">{b.hotelDetails?.hotelName || 'Unnamed'}</p>
                              <p className="text-[11px] font-mono font-medium text-slate-400 mt-1 truncate">ID: {b.hotelDetails?.hotelId}</p>
                            </td>
                            <td className="px-5 py-4 max-w-[160px]">
                              {showCreatedBy ? (
                                <>
                                  <p className="text-sm font-bold text-slate-800 truncate">{b.createdBy?.user || b.createdBy?.name || 'Unknown'}</p>
                                  <p className="text-[11px] font-semibold text-slate-500 mt-1 truncate">{b.createdBy?.email || 'No email'}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-bold text-slate-800 truncate">{b.guestDetails?.fullName || b.user?.name || 'Unknown'}</p>
                                  {!shouldHideGuestContact && <p className="text-[11px] font-semibold text-slate-500 mt-1">{b.guestDetails?.mobile}</p>}
                                </>
                              )}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <StatusBadge status={b.bookingStatus} />
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-[13px] font-medium text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <span>{formatDate(b.checkInDate)}</span>
                                <ArrowRight size={12} className="text-slate-300" />
                                <span>{formatDate(b.checkOutDate)}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <p className="text-sm font-extrabold text-slate-900">{formatCurrency(b.price)}</p>
                              <span className="inline-flex mt-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{b.normalizedSource || b.bookingSource}</span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleViewBooking(b)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all"><Eye size={16} /></button>
                                {canEditBookingRecord(b) && (
                                  <button onClick={() => handleEditBooking(b)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><PencilLine size={16} /></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}
      </div>

      {modalMode === 'view' && <BookingViewModal booking={resolvedBooking} shouldHideGuestContact={shouldHideGuestContact} showCreatedBy={showCreatedBy} currentUserName={user?.name || user?.fullName || user?.user || 'System Auto'} loading={detailLoading} onClose={closeBookingModal} />}
      {modalMode === 'edit' && <BookingEditModal key={resolvedBooking?.bookingId || 'booking-edit'} booking={resolvedBooking} allowAdvancedEdit={allowAdvancedEditForPrivileged} isLocked={isBookingLocked} isCancelledRestricted={isCancelledBookingRestricted} userRole={normalizedUserRole} capabilities={resolvedCapabilities} loading={updatingBooking || verifyingCancellationOtp || detailLoading} otpSending={sendingCancellationOtp} onClose={closeBookingModal} onSubmit={handleUpdateBooking} onSendCancellationOtp={handleSendCancellationOtp} />}
    </div>
  )
}

export default PmsBooking
