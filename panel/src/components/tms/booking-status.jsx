/**
 * Shared booking status helpers for cab / car travel bookings.
 * Used by: src/pages/admin/cab-bookings.jsx
 *          src/pages/tms/car-bookings-list.jsx
 */
import { CheckCircle2, Clock, XCircle, Car, MapPin, Flag } from 'lucide-react'

export const STATUS_CFG = {
  pending:    { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-500/20',   dot: 'bg-amber-500',   icon: Clock },
  confirmed:  { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-500/20', dot: 'bg-emerald-500', icon: CheckCircle2 },
  cancelled:  { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-500/20',    dot: 'bg-rose-500',    icon: XCircle },
  failed:     { bg: 'bg-rose-100',   text: 'text-rose-800',    ring: 'ring-rose-600/20',    dot: 'bg-rose-600',    icon: XCircle },
  completed:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-500/20',  dot: 'bg-indigo-500',  icon: CheckCircle2 },
  rejected:   { bg: 'bg-slate-100',  text: 'text-slate-600',   ring: 'ring-slate-300/40',   dot: 'bg-slate-400',   icon: XCircle },
}

// rideStatus configs
export const RIDE_STATUS_CFG = {
  awaitingconfirmation: { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-400/20',   dot: 'bg-amber-500',   icon: Clock,         label: 'Awaiting Confirm' },
  available:            { bg: 'bg-teal-50',    text: 'text-teal-700',    ring: 'ring-teal-400/20',    dot: 'bg-teal-500',    icon: Car,           label: 'Available' },
  'ride in progress':   { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-400/20',    dot: 'bg-blue-500',    icon: MapPin,        label: 'Ride in Progress' },
  'ride completed':     { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-400/20', dot: 'bg-emerald-500', icon: Flag,          label: 'Ride Completed' },
  cancelled:            { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-400/20',    dot: 'bg-rose-500',    icon: XCircle,       label: 'Cancelled' },
  failed:               { bg: 'bg-rose-100',   text: 'text-rose-800',    ring: 'ring-rose-600/20',    dot: 'bg-rose-600',    icon: XCircle,       label: 'Failed' },
}

export const cfgFor = (raw = '') => STATUS_CFG[String(raw).toLowerCase()] ?? STATUS_CFG.pending
export const rideCfgFor = (raw = '') => RIDE_STATUS_CFG[String(raw).toLowerCase()] ?? RIDE_STATUS_CFG.awaitingconfirmation

export const NEXT_STATUSES = {
  pending:   ['Confirmed', 'Cancelled', 'Failed'],
  confirmed: ['Completed', 'Cancelled'],
  completed: [],
  cancelled: [],
  failed:    [],
  rejected:  [],
}

export default function BookingStatusBadge({ status = 'Pending' }) {
  const cfg = cfgFor(status)
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <Icon size={11} />
      {status}
    </span>
  )
}

export function RideStatusBadge({ status = 'AwaitingConfirmation' }) {
  const cfg = rideCfgFor(status)
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <Icon size={11} />
      {cfg.label || status}
    </span>
  )
}
