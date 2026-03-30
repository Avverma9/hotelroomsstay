import { useEffect, useState, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  CalendarDays,
  X,
  Edit3,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  Filter,
  RotateCcw,
  Map as MapIcon,
} from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import MasterFilter from '../../components/master-filter'
import { tableClasses } from '../../components/admin-table'
import {
  fetchFilteredTours,
  getAllTours,
} from '../../../redux/slices/tms/travel/tour/tour'
import { formatCurrency } from '../../utils/format'

const DEFAULT_FILTERS = {
  q: '',
  country: '',
  state: '',
  city: '',
  fromWhere: '',
  to: '',
  themes: '',
  amenities: '',
  amenitiesMode: '',
  visitingPlace: '',
  visitingPlaces: '',
  minPrice: '',
  maxPrice: '',
  minNights: '',
  maxNights: '',
  minRating: '',
  nights: '',
  price: '',
  starRating: '',
  fromDate: '',
  toDate: '',
  startDate: '',
  endDate: '',
  agencyEmail: '',
  isCustomizable: '',
  hasImages: '',
  hasVehicles: '',
  runningStatus: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const THEMES = [
  'Cultural', 'Adventure', 'Religious', 'Beach', 'Heritage',
  'Hill Station', 'Wildlife', 'Honeymoon', 'Family', 'Group', 'Vacation'
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'completed', label: 'Completed' },
]

const STATUS_CONFIG = {
  active:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  inactive:  { cls: 'bg-slate-50 text-slate-600 border-slate-200',       dot: 'bg-slate-400' },
  completed: { cls: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500' },
}

// Build API params with cleaned values
const buildParams = (filters, page = 1, limit = 10) => {
  const params = { page, limit }
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== '' && val !== null && val !== undefined) {
      params[key] = val
    }
  })
  return params
}

/* =========================================================
   MASTER FILTER SIDEBAR
========================================================= */
const MasterFilterSidebar = ({ filters, onChange, onApply, onReset, isOpen, onClose }) => {
  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 placeholder:font-normal"

  const FilterSection = ({ title, children }) => (
    <div className="border-b border-slate-100 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 mb-3">
        {title}
      </h3>
      {children}
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform bg-white shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none lg:border-r lg:border-slate-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Master Filters</h2>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden">
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            
            {/* Search */}
            <FilterSection title="Search">
              <input 
                type="text" 
                placeholder="Search tours..." 
                value={filters.q} 
                onChange={(e) => onChange('q', e.target.value)} 
                className={inputClass} 
              />
            </FilterSection>

            {/* Location */}
            <FilterSection title="Location">
              <div className="space-y-3">
                <input type="text" placeholder="Country" value={filters.country} onChange={(e) => onChange('country', e.target.value)} className={inputClass} />
                <input type="text" placeholder="State" value={filters.state} onChange={(e) => onChange('state', e.target.value)} className={inputClass} />
                <input type="text" placeholder="City" value={filters.city} onChange={(e) => onChange('city', e.target.value)} className={inputClass} />
              </div>
            </FilterSection>

            {/* Route */}
            <FilterSection title="Route (From - To)">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="From" value={filters.fromWhere} onChange={(e) => onChange('fromWhere', e.target.value)} className={inputClass} />
                <input type="text" placeholder="To" value={filters.to} onChange={(e) => onChange('to', e.target.value)} className={inputClass} />
              </div>
            </FilterSection>

            {/* Visiting Places */}
            <FilterSection title="Visiting Places">
              <input type="text" placeholder="e.g. Taj Mahal, Red Fort" value={filters.visitingPlaces} onChange={(e) => onChange('visitingPlaces', e.target.value)} className={inputClass} />
            </FilterSection>

            {/* Price Range */}
            <FilterSection title="Price Range">
              <div className="flex items-center gap-3">
                <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => onChange('minPrice', e.target.value)} className={inputClass} min={0} />
                <span className="text-slate-300 font-bold">-</span>
                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => onChange('maxPrice', e.target.value)} className={inputClass} min={0} />
              </div>
            </FilterSection>

            {/* Nights Range */}
            <FilterSection title="Duration (Nights)">
              <div className="flex items-center gap-3">
                <input type="number" placeholder="Min" value={filters.minNights} onChange={(e) => onChange('minNights', e.target.value)} className={inputClass} min={0} />
                <span className="text-slate-300 font-bold">-</span>
                <input type="number" placeholder="Max" value={filters.maxNights} onChange={(e) => onChange('maxNights', e.target.value)} className={inputClass} min={0} />
              </div>
            </FilterSection>

            {/* Star Rating */}
            <FilterSection title="Minimum Rating">
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChange('minRating', filters.minRating == r ? '' : r)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                      Number(filters.minRating) === r
                        ? 'bg-white text-amber-500 shadow-sm border border-slate-200/60'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {r}★
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Status */}
            <FilterSection title="Running Status">
              <select 
                value={filters.runningStatus} 
                onChange={(e) => onChange('runningStatus', e.target.value)} 
                className={inputClass}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FilterSection>

            {/* Themes */}
            <FilterSection title="Tour Themes">
              <div className="flex flex-wrap gap-2">
                {THEMES.map((theme) => {
                  const active = (filters.themes || '').split(',').map(t => t.trim()).includes(theme)
                  const toggle = () => {
                    const current = (filters.themes || '').split(',').map(t => t.trim()).filter(Boolean)
                    const updated = active ? current.filter(t => t !== theme) : [...current, theme]
                    onChange('themes', updated.join(','))
                  }
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={toggle}
                      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                        active
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {theme}
                    </button>
                  )
                })}
              </div>
            </FilterSection>

            {/* Date Range */}
            <FilterSection title="Tour Start Date">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">From</label>
                  <input type="date" value={filters.fromDate} onChange={(e) => onChange('fromDate', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">To</label>
                  <input type="date" value={filters.toDate} onChange={(e) => onChange('toDate', e.target.value)} className={inputClass} />
                </div>
              </div>
            </FilterSection>

            {/* Agency Email */}
            <FilterSection title="Agency Email">
              <input type="email" placeholder="agency@example.com" value={filters.agencyEmail} onChange={(e) => onChange('agencyEmail', e.target.value)} className={inputClass} />
            </FilterSection>

            {/* Boolean Filters */}
            <FilterSection title="Additional Filters">
              <div className="space-y-2">
                {[
                  { key: 'isCustomizable', label: 'Customizable Tours' },
                  { key: 'hasImages', label: 'Tours with Images' },
                  { key: 'hasVehicles', label: 'Tours with Vehicles' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters[key] === 'true' || filters[key] === true}
                      onChange={(e) => onChange(key, e.target.checked ? 'true' : '')}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
            <button 
              onClick={onReset} 
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button 
              onClick={onApply} 
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* =========================================================
   TOUR TABLE ROW
========================================================= */
const TourTableRow = ({ tour, onEdit, onView }) => {
  const status = tour.runningStatus || 'active'
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active
  const imageUrl = tour?.images?.[0] || null
  const displayPrice = tour.price || tour.vehicles?.[0]?.pricePerSeat || 0

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`tour-row-${tour._id}`}>
      {/* Tour Info */}
      <td className={tableClasses.td}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-16 overflow-hidden rounded-lg bg-slate-100 shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={tour.travelAgencyName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <MapIcon size={18} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{tour.travelAgencyName || 'Unnamed Tour'}</p>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 size={10} /> {tour.agencyEmail || 'N/A'}
            </p>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className={tableClasses.td}>
        <div className="flex items-start gap-1.5 text-[12px] font-medium text-slate-600">
          <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{[tour.city, tour.state].filter(Boolean).join(', ') || 'N/A'}</span>
        </div>
      </td>

      {/* Price */}
      <td className={tableClasses.td}>
        <span className="text-sm font-bold text-slate-900">{formatCurrency(displayPrice)}</span>
      </td>

      {/* Duration */}
      <td className={tableClasses.td}>
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
          <CalendarDays size={12} className="text-slate-400" />
          {tour.nights ?? 0}N / {tour.days ?? (tour.nights ? tour.nights + 1 : 0)}D
        </div>
      </td>

      {/* Rating */}
      <td className={tableClasses.td}>
        {tour.starRating > 0 ? (
          <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {tour.starRating}
          </div>
        ) : (
          <span className="text-xs text-slate-400">N/A</span>
        )}
      </td>

      {/* Status */}
      <td className={tableClasses.td}>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {status}
        </span>
      </td>

      {/* Actions */}
      <td className={tableClasses.td}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(tour)}
            className={tableClasses.actionBtn}
            title="View"
            data-testid={`view-tour-${tour._id}`}
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEdit(tour)}
            className={tableClasses.actionBtnPrimary}
            title="Edit"
            data-testid={`edit-tour-${tour._id}`}
          >
            <Edit3 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/* =========================================================
   PAGINATION
========================================================= */
const Pagination = ({ page, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} /> Previous
      </button>

      {visible.map((p, i) => {
        const prev = visible[i - 1]
        return (
          <span key={p} className="flex items-center gap-1">
            {prev && p - prev > 1 && <span className="text-slate-400 text-xs px-1">...</span>}
            <button
              onClick={() => onPageChange(p)}
              className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                p === page
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          </span>
        )
      })}

      <button
        disabled={page === totalPages || totalPages === 0}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  )
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
function TourListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { tours, allTours, loading, error, filterMeta } = useSelector((state) => state.tour)

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  
  // Fields configuration for MasterFilter (hotel-style compact filter)
  const filterFields = useMemo(() => [
    { key: 'q', label: 'Search', type: 'text', placeholder: 'Search tours...' },
    { key: 'country', label: 'Country', type: 'text', placeholder: 'Country' },
    { key: 'state', label: 'State', type: 'text', placeholder: 'State' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'City' },
    { key: 'fromWhere', label: 'Route From', type: 'text', placeholder: 'From city' },
    { key: 'to', label: 'Route To', type: 'text', placeholder: 'To city' },
    { key: 'visitingPlace', label: 'Visiting Place', type: 'text', placeholder: 'e.g. Taj Mahal' },
    { key: 'visitingPlaces', label: 'Visiting Places', type: 'text', placeholder: 'Comma separated' },
    { key: 'themes', label: 'Themes', type: 'text', placeholder: 'Theme (comma separated)' },
    { key: 'amenities', label: 'Amenities', type: 'text', placeholder: 'Amenities (comma separated)' },
    { key: 'amenitiesMode', label: 'Amenities Mode', type: 'select', options: [{ value: 'AND', label: 'All (AND)' }, { value: 'OR', label: 'Any (OR)' }], emptyOptionLabel: 'Any Mode' },
    { key: 'minPrice', label: 'Min Price', type: 'number', placeholder: 'Min price' },
    { key: 'maxPrice', label: 'Max Price', type: 'number', placeholder: 'Max price' },
    { key: 'price', label: 'Exact Price', type: 'number', placeholder: 'Exact price' },
    { key: 'minNights', label: 'Min Nights', type: 'number', placeholder: 'Min nights' },
    { key: 'maxNights', label: 'Max Nights', type: 'number', placeholder: 'Max nights' },
    { key: 'nights', label: 'Exact Nights', type: 'number', placeholder: 'Exact nights' },
    { key: 'minRating', label: 'Min Rating', type: 'number', placeholder: 'Min rating (1-5)' },
    { key: 'starRating', label: 'Star Rating', type: 'number', placeholder: 'Exact star rating' },
    { key: 'runningStatus', label: 'Status', type: 'select', options: STATUS_OPTIONS, emptyOptionLabel: 'All Status' },
    { key: 'fromDate', label: 'From Date', type: 'date' },
    { key: 'toDate', label: 'To Date', type: 'date' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    { key: 'agencyEmail', label: 'Agency Email', type: 'text', placeholder: 'agency@example.com' },
    { key: 'isCustomizable', label: 'Customizable', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], emptyOptionLabel: 'Any' },
    { key: 'hasImages', label: 'Has Images', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], emptyOptionLabel: 'Any' },
    { key: 'hasVehicles', label: 'Has Vehicles', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], emptyOptionLabel: 'Any' },
    { key: 'sortBy', label: 'Sort By', type: 'select', options: [
      { value: 'createdAt', label: 'Created Date' },
      { value: 'price', label: 'Price' },
      { value: 'nights', label: 'Nights' },
      { value: 'starRating', label: 'Star Rating' },
    ], emptyOptionLabel: 'Default' },
    { key: 'sortOrder', label: 'Sort Order', type: 'select', options: [
      { value: 'desc', label: 'Descending' },
      { value: 'asc', label: 'Ascending' },
    ], emptyOptionLabel: 'Default' },
  ], [])

  const isFiltered = JSON.stringify(appliedFilters) !== JSON.stringify(DEFAULT_FILTERS)

  // Prefer filtered `tours` when filters are applied; otherwise use `allTours`
  const displayTours = isFiltered ? (tours || []) : (allTours.length > 0 ? allTours : tours)
  const totalPages = filterMeta?.totalPages || Math.ceil((filterMeta?.total || displayTours.length) / limit) || 1

  // Fetch tours on mount and when filters/page change
  useEffect(() => {
    if (isFiltered) {
      dispatch(fetchFilteredTours(buildParams(appliedFilters, page, limit)))
    } else {
      dispatch(getAllTours({ page, limit }))
    }
  }, [dispatch, appliedFilters, page, limit, isFiltered])

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters)
    setPage(1)
  }, [filters])

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setPage(1)
  }, [])

  const handleView = useCallback((tour) => {
    const from = window.location.pathname + window.location.search
    const url = `${window.location.origin}/my-tour/${tour._id}?from=${encodeURIComponent(from)}`
    window.open(url, '_blank')
  }, [])

  const handleEdit = useCallback((tour) => {
    const from = window.location.pathname + window.location.search
    const url = `${window.location.origin}/my-tour/${tour._id}/edit?from=${encodeURIComponent(from)}`
    window.open(url, '_blank')
  }, [])

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb />

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-600">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Tour Management</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              View, edit, and manage all tour packages
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/add-tour-data')}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              data-testid="add-new-tour-btn"
            >
              + Add New Tour
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Master Filter (compact hotel-style) */}
            <div className="mb-4">
              <MasterFilter
                fields={filterFields}
                values={filters}
                onChange={handleFilterChange}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
            </div>
            {/* Active Filters Banner */}
            {isFiltered && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                <Filter size={14} className="text-indigo-600 shrink-0" />
                <span className="text-sm font-semibold text-indigo-700">Filters applied</span>
                <button
                  onClick={handleResetFilters}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <X size={12} /> Clear All
                </button>
              </div>
            )}

            {/* Table Container */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Table Header Stats */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {filterMeta?.total || displayTours.length} Tours Found
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    Showing page {page} of {totalPages}
                  </p>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Loader2 size={14} className="animate-spin" /> Loading...
                  </div>
                )}
              </div>

              {/* Error State */}
              {error && (
                <div className="px-5 py-4">
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {error}
                  </div>
                </div>
              )}

              {/* Table */}
              {displayTours.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="tours-table">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className={tableClasses.th}>Tour</th>
                        <th className={tableClasses.th}>Location</th>
                        <th className={tableClasses.th}>Price</th>
                        <th className={tableClasses.th}>Duration</th>
                        <th className={tableClasses.th}>Rating</th>
                        <th className={tableClasses.th}>Status</th>
                        <th className={tableClasses.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayTours.map((tour) => (
                        <TourTableRow
                          key={tour._id}
                          tour={tour}
                          onView={handleView}
                          onEdit={handleEdit}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !loading ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                    <MapIcon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No Tours Found</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500 max-w-sm">
                    {isFiltered 
                      ? 'No tours match your current filters. Try adjusting or resetting them.'
                      : 'No tours have been added yet. Start by creating a new tour.'
                    }
                  </p>
                  {isFiltered && (
                    <button
                      onClick={handleResetFilters}
                      className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : null}

              {/* Pagination */}
              {displayTours.length > 0 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TourListPage
