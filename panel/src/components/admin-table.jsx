import React from 'react'

export const tableClasses = {
  wrapper: 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
  header: 'flex items-center justify-between border-b border-slate-100 px-5 py-4',
  title: 'text-sm font-bold text-slate-900',
  subtitle: 'text-[11px] font-medium text-slate-500',
  th: 'px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500',
  td: 'px-4 py-4',
  actionBtn: 'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors',
  actionBtnPrimary: 'flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors',
}

export default function AdminTable({ title, count, subtitle, loading, error, children, footer }) {
  return (
    <div className={tableClasses.wrapper}>
      <div className={tableClasses.header}>
        <div>
          <p className={tableClasses.title}>{count} {title}</p>
          {subtitle && <p className={tableClasses.subtitle}>{subtitle}</p>}
        </div>
        {loading && <div className="text-xs font-medium text-slate-500">Loading…</div>}
      </div>

      {error && (
        <div className="px-5 py-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{String(error)}</div>
        </div>
      )}

      <div className="overflow-x-auto">
        {children}
      </div>

      {footer && <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">{footer}</div>}
    </div>
  )
}
