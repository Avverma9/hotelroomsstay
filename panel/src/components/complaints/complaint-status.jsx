/**
 * Shared complaint status helpers.
 * Used by: src/pages/admin/complaints.jsx
 *          src/pages/complaints/my-complaints.jsx
 */

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const STATUS_CONFIG = {
  Pending:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-400'   },
  Approved:  { cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-400'    },
  Working:   { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-400'  },
  Resolved:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',dot: 'bg-emerald-500' },
  Rejected:  { cls: 'bg-rose-50 text-rose-700 border-rose-200',         dot: 'bg-rose-400'    },
}

export const STATUSES = ['Pending', 'Approved', 'Working', 'Resolved', 'Rejected']

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status || 'Pending'}
    </span>
  )
}
