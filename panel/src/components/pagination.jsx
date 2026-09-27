import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, total, limit = 20, itemCount, onPageChange, loading = false }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1)

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
      <p className="font-medium text-slate-500">
        Showing {itemCount ? `${(page - 1) * limit + 1}-${Math.min((page - 1) * limit + itemCount, total)}` : 0} of {total} records
      </p>
      <div className="flex items-center justify-center gap-1.5">
        <button type="button" aria-label="Previous page" onClick={() => onPageChange(page - 1)} disabled={page === 1 || loading} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft size={14} /> <span className="hidden sm:inline">Previous</span>
        </button>
        {pages.map((number, index) => (
          <span key={number} className="flex items-center gap-1.5">
            {index > 0 && pages[index - 1] !== number - 1 && <span className="px-0.5 text-slate-400">…</span>}
            <button type="button" onClick={() => onPageChange(number)} disabled={loading} className={`h-8 min-w-8 rounded-lg px-2 font-bold transition ${number === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {number}
            </button>
          </span>
        ))}
        <button type="button" aria-label="Next page" onClick={() => onPageChange(page + 1)} disabled={page === totalPages || loading} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
          <span className="hidden sm:inline">Next</span> <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
