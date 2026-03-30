import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Building2,
  CarFront,
  Compass,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import {
  createGST,
  deleteGST,
  getAllGST,
  getGST,
  updateGST,
} from '../../../redux/slices/admin/gst'

const GST_SECTION_CONFIG = [
  { type: 'Hotel', icon: Building2, accent: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { type: 'Tour', icon: Compass, accent: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { type: 'Travel', icon: CarFront, accent: 'text-amber-600 bg-amber-50 border-amber-100' },
]

const createEmptyForm = (type) => ({
  type,
  gstPrice: '',
  gstMinThreshold: '',
  gstMaxThreshold: '',
})

const getEntryId = (entry) => entry?._id || entry?.id || entry?.gstId || ''

const getDateLabel = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}

const sortEntries = (entries = []) =>
  [...entries].sort(
    (firstEntry, secondEntry) =>
      new Date(secondEntry.updatedAt || secondEntry.createdAt || 0) -
      new Date(firstEntry.updatedAt || firstEntry.createdAt || 0),
  )

function GSTRuleCard({ type, icon, accent, formValues, latestEntry, entries, loading, onChange, onSave, onCreateNew, onDelete }) {
  const Icon = icon

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}>
            <Icon size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{type} Tax Configuration</h2>
            <p className="text-[13px] font-medium text-slate-500">Manage GST slabs and thresholds for the {type.toLowerCase()} sector.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <Plus size={16} /> New Configuration
        </button>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* Left Side: Configuration Form & Active Rule */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col gap-8">
          
          {/* Active Rule Display */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className={latestEntry ? "text-emerald-500" : "text-slate-300"} /> 
              Currently Active Profile
            </h3>
            
            {latestEntry ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GST Percentage</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">{latestEntry.gstPrice}%</p>
                </div>
                <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Min Threshold</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">₹{latestEntry.gstMinThreshold}</p>
                </div>
                <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Max Threshold</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">₹{latestEntry.gstMaxThreshold}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm font-medium text-slate-500">
                No active configuration mapped for {type.toLowerCase()}.
              </div>
            )}
          </div>

          {/* Form */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Draft / Edit Configuration</h3>
            <div className="grid gap-4 md:grid-cols-3 mb-5">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700">Tax Slab (%)</label>
                <input
                  type="number" min="0" value={formValues.gstPrice} onChange={(e) => onChange('gstPrice', e.target.value)} placeholder="e.g. 18"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-colors focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:font-normal"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700">Min Amount (₹)</label>
                <input
                  type="number" min="0" value={formValues.gstMinThreshold} onChange={(e) => onChange('gstMinThreshold', e.target.value)} placeholder="e.g. 1000"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-colors focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:font-normal"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700">Max Amount (₹)</label>
                <input
                  type="number" min="0" value={formValues.gstMaxThreshold} onChange={(e) => onChange('gstMaxThreshold', e.target.value)} placeholder="e.g. 50000"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-colors focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={loading || formValues.gstPrice === ''}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                <Save size={16} /> {latestEntry ? 'Update Rule' : 'Save New Rule'}
              </button>

              {latestEntry && (
                <button
                  type="button"
                  onClick={() => onDelete(getEntryId(latestEntry))}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <Trash2 size={16} /> Delete Active
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Version History */}
        <div className="w-full lg:w-[340px] xl:w-[400px] bg-slate-50/30 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <History size={14} className="text-slate-400" /> Version History
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{entries.length} logs</span>
          </div>

          <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm font-medium text-slate-500">
                No past records found.
              </div>
            ) : (
              entries.map((entry, index) => {
                const isLatest = index === 0
                return (
                  <article key={getEntryId(entry)} className={`group relative rounded-xl border p-3.5 transition-colors hover:border-slate-300 ${isLatest ? 'bg-white border-indigo-100 shadow-sm' : 'bg-transparent border-slate-200/60'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-slate-900">{entry.gstPrice}% Slab</p>
                          {isLatest && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-inset ring-emerald-500/20">Active</span>}
                        </div>
                        <p className="mt-1 text-[12px] font-medium text-slate-500">
                          ₹{entry.gstMinThreshold} <span className="text-slate-300 mx-1">→</span> ₹{entry.gstMaxThreshold}
                        </p>
                        <p className="mt-2 text-[10px] font-semibold text-slate-400">
                          {getDateLabel(entry.updatedAt || entry.createdAt)}
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => onDelete(getEntryId(entry))}
                        className="rounded-md p-1.5 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>

      </div>
    </section>
  )
}

function GSTManagement() {
  const dispatch = useDispatch()
  const { gstEntries, selectedGST, loading, error } = useSelector((state) => state.adminGst)
  
  // Tab State
  const [activeTab, setActiveTab] = useState('overview')
  const [drafts, setDrafts] = useState({})

  useEffect(() => {
    dispatch(getGST())
    dispatch(getAllGST())
  }, [dispatch])

  const entriesByType = useMemo(() => {
    return GST_SECTION_CONFIG.reduce((accumulator, section) => {
      accumulator[section.type] = sortEntries(
        gstEntries.filter((entry) => String(entry?.type || '').toLowerCase() === section.type.toLowerCase()),
      )
      return accumulator
    }, {})
  }, [gstEntries])

  const forms = useMemo(
    () =>
      GST_SECTION_CONFIG.reduce((accumulator, section) => {
        const latestEntry = entriesByType[section.type]?.[0]
        const draft = drafts[section.type]

        accumulator[section.type] = draft || (
          latestEntry
            ? {
                type: section.type,
                gstPrice: String(latestEntry.gstPrice ?? ''),
                gstMinThreshold: String(latestEntry.gstMinThreshold ?? ''),
                gstMaxThreshold: String(latestEntry.gstMaxThreshold ?? ''),
              }
            : createEmptyForm(section.type)
        )

        return accumulator
      }, {}),
    [drafts, entriesByType],
  )

  const overallLatestLabel = useMemo(() => {
    if (!selectedGST) return 'No configuration loaded'
    return `${selectedGST.type || 'GST'} • ${getDateLabel(selectedGST.updatedAt || selectedGST.createdAt)}`
  }, [selectedGST])

  const handleFormChange = (type, key, value) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [type]: {
        ...forms[type],
        [key]: value,
      },
    }))
  }

  const handleSave = async (type) => {
    const payload = {
      type,
      gstPrice: Number(forms[type].gstPrice),
      gstMinThreshold: Number(forms[type].gstMinThreshold),
      gstMaxThreshold: Number(forms[type].gstMaxThreshold),
    }

    const latestEntry = entriesByType[type]?.[0]
    if (!payload.gstPrice && payload.gstPrice !== 0) return

    if (latestEntry && getEntryId(latestEntry)) {
      await dispatch(updateGST({ ...payload, id: getEntryId(latestEntry), _id: getEntryId(latestEntry) }))
    } else {
      await dispatch(createGST(payload))
    }

    setDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts }
      delete nextDrafts[type]
      return nextDrafts
    })
    await dispatch(getGST())
    await dispatch(getAllGST())
  }

  const handleDelete = async (entryId) => {
    if (!entryId) return
    await dispatch(deleteGST(entryId))
    setDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts }
      GST_SECTION_CONFIG.forEach((section) => {
        if (getEntryId(entriesByType[section.type]?.[0]) === entryId) delete nextDrafts[section.type]
      })
      return nextDrafts
    })
    await dispatch(getGST())
    await dispatch(getAllGST())
  }

  const handleCreateNew = (type) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [type]: createEmptyForm(type),
    }))
  }

  return (
    <div className="min-h-screen bg-slate-50/40 font-sans text-slate-900 selection:bg-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Sticky Top Header Area */}
        <div className="sticky top-0 z-20 -mx-4 bg-slate-50/95 px-4 pb-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Breadcrumb />

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-500 mb-1.5">Tax & Compliance</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">GST Management</h1>
              <p className="mt-2 text-sm font-medium text-slate-500 max-w-2xl">
                Configure sector-wise GST thresholds and maintain historical tax compliance records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { dispatch(getGST()); dispatch(getAllGST()) }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-indigo-500' : ''} />
              {loading ? 'Syncing...' : 'Sync Database'}
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 shadow-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><AlertCircle size={16}/> {error}</span>
            </div>
          )}

          {/* SaaS Style Tab Navigation */}
          <div className="mt-8 border-b border-slate-200">
            <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-colors ${
                  activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                Dashboard Overview
              </button>
              {GST_SECTION_CONFIG.map((sec) => (
                <button
                  key={sec.type}
                  onClick={() => setActiveTab(sec.type)}
                  className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-colors flex items-center gap-2 ${
                    activeTab === sec.type ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  <sec.icon size={14} className={activeTab === sec.type ? 'text-indigo-500' : 'text-slate-400'} />
                  {sec.type} Slabs
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* TAB CONTENT: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Minimalist KPI Metrics */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Total Rules Tracked', value: gstEntries.length },
                { label: 'Hotel Active Slabs', value: entriesByType.Hotel?.length || 0 },
                { label: 'Tour Active Slabs', value: entriesByType.Tour?.length || 0 },
                { label: 'Last System Update', value: overallLatestLabel, isText: true }
              ].map((stat, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <p className={`mt-2 ${stat.isText ? 'text-[13px] font-bold text-slate-700 line-clamp-2' : 'text-3xl font-extrabold text-slate-900'}`}>
                    {loading && !stat.isText ? '-' : stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Current Active Profiles Summary Grid */}
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500"/> Current Live Configurations
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {GST_SECTION_CONFIG.map((sec) => {
                const activeRule = entriesByType[sec.type]?.[0]
                return (
                  <div key={sec.type} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <sec.icon size={16} className="text-slate-400" />
                        <h3 className="font-bold text-slate-900">{sec.type}</h3>
                      </div>
                      {activeRule ? (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 ring-1 ring-inset ring-emerald-500/20">Live</span>
                      ) : (
                        <span className="rounded bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 ring-1 ring-inset ring-slate-200">No Rule</span>
                      )}
                    </div>
                    
                    {activeRule ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-500">Tax Bracket</span>
                          <span className="text-sm font-extrabold text-slate-900 bg-slate-50 px-2 py-0.5 rounded">{activeRule.gstPrice}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-500">Min Threshold</span>
                          <span className="text-sm font-bold text-slate-700">₹{activeRule.gstMinThreshold}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-500">Max Threshold</span>
                          <span className="text-sm font-bold text-slate-700">₹{activeRule.gstMaxThreshold}</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 pt-2 border-t border-dashed border-slate-100">
                          Updated: {getDateLabel(activeRule.updatedAt || activeRule.createdAt)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 py-6 text-center">Setup required in {sec.type} tab.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB CONTENT: DYNAMIC SECTORS (Hotel, Tour, Travel) */}
        {GST_SECTION_CONFIG.map((section) => (
          activeTab === section.type && (
            <div key={section.type} className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <GSTRuleCard
                type={section.type}
                icon={section.icon}
                accent={section.accent}
                formValues={forms[section.type] || createEmptyForm(section.type)}
                latestEntry={entriesByType[section.type]?.[0] || null}
                entries={entriesByType[section.type] || []}
                loading={loading}
                onChange={(key, value) => handleFormChange(section.type, key, value)}
                onSave={() => handleSave(section.type)}
                onCreateNew={() => handleCreateNew(section.type)}
                onDelete={handleDelete}
              />
            </div>
          )
        ))}

      </div>
    </div>
  )
}

export default GSTManagement