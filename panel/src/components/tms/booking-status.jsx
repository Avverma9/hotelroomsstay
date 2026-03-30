/**
 * Shared booking status helpers for cab / car travel bookings.
 * Used by: src/pages/admin/cab-bookings.jsx
 *          src/pages/tms/car-bookings-list.jsx
 */
import { CheckCircle2, Clock, XCircle } from 'lucide-react'

export const STATUS_CFG = {
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-500/20',   dot: 'bg-amber-500',   icon: Clock },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-500/20', dot: 'bg-emerald-500', icon: CheckCircle2 },
  cancelled: { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-500/20',    dot: 'bg-rose-500',    icon: XCircle },
  completed: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-500/20',  dot: 'bg-indigo-500',  icon: CheckCircle2 },
  rejected:  { bg: 'bg-slate-100',  text: 'text-slate-600',   ring: 'ring-slate-300/40',   dot: 'bg-slate-400',   icon: XCircle },
}

export const cfgFor = (raw = '') => STATUS_CFG[String(raw).toLowerCase()] ?? STATUS_CFG.pending

export const NEXT_STATUSES = {
  pending:   ['Confirmed', 'Cancelled', 'Rejected'],
  confirmed: ['Completed', 'Cancelled'],
  completed: [],
  cancelled: [],
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
