import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Globe,
  Loader2,
  Search,
  Send,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import {
  clearPushStatus,
  pushGlobalNotification,
  pushUserNotification,
  selectNotification,
} from '../../../redux/slices/admin/notification'
import { getAllPartners } from '../../../redux/slices/partner'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 placeholder:font-normal'

const TABS = [
  { id: 'global', label: 'Global Broadcast', icon: Globe, desc: 'Send to all dashboard users at once' },
  { id: 'user', label: 'User Targeted', icon: User, desc: 'Send to specific users' },
]

const EVENT_TYPES = ['general', 'offer', 'alert', 'booking', 'system', 'payment']

const GLOBAL_INIT = { name: '', message: '', path: '' }
const USER_FORM_INIT = { name: '', message: '', path: '', eventType: 'general', metadata: '' }

/* ── UserPicker ─────────────────────────────────────── */
function UserPicker({ selected, onChange }) {
  const dispatch = useDispatch()
  const allPartners = useSelector((s) => s.partner.partners)
  const loading = useSelector((s) => s.partner.loading)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const pickerRef = useRef(null)

  // Fetch partners once
  useEffect(() => {
    if (!allPartners.length) dispatch(getAllPartners())
  }, [dispatch, allPartners.length])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Unique roles from partners list
  const roles = useMemo(() => {
    const set = new Set(allPartners.map((u) => u.role).filter(Boolean))
    return [...set].sort()
  }, [allPartners])

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allPartners.filter((u) => {
      const matchRole = roleFilter ? u.role === roleFilter : true
      const matchSearch = !q || [u.name, u.email, u.mobile].some((v) => v?.toLowerCase().includes(q))
      return matchRole && matchSearch
    })
  }, [allPartners, search, roleFilter])

  const selectedIds = new Set(selected.map((u) => u._id))

  const toggle = (user) => {
    if (selectedIds.has(user._id)) {
      onChange(selected.filter((u) => u._id !== user._id))
    } else {
      onChange([...selected, user])
    }
  }

  const removeSelected = (id) => onChange(selected.filter((u) => u._id !== id))

  return (
    <div ref={pickerRef} className="relative">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <span
              key={u._id}
              className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-800"
            >
              <UserCheck size={11} />
              {u.name || u.email || u.mobile || u._id}
              <button
                type="button"
                onClick={() => removeSelected(u._id)}
                className="ml-0.5 rounded text-violet-400 hover:text-violet-700"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className={selected.length ? 'text-slate-700' : 'font-normal text-slate-400'}>
          {selected.length
            ? `${selected.length} user${selected.length > 1 ? 's' : ''} selected`
            : 'Click to search and select users'}
        </span>
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.14)]">
          {/* Filters */}
          <div className="flex gap-2 border-b border-slate-100 p-3">
            <div className="relative flex-1">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, mobile…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-violet-400 focus:bg-white"
                autoFocus
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-400"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" /> Loading users…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-xs font-semibold text-slate-400">No users found</p>
            )}
            {!loading && filtered.slice(0, 80).map((u) => {
              const isSelected = selectedIds.has(u._id)
              return (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => toggle(u)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 ${isSelected ? 'bg-violet-50' : ''}`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {isSelected ? <UserCheck size={13} /> : (u.name?.[0] || u.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-slate-800">{u.name || '—'}</p>
                    <p className="truncate text-[10px] text-slate-400">{u.email} {u.mobile ? `· ${u.mobile}` : ''}</p>
                  </div>
                  {u.role && (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                      {u.role}
                    </span>
                  )}
                </button>
              )
            })}
            {!loading && filtered.length > 80 && (
              <p className="px-4 py-2 text-center text-[10px] text-slate-400">Refine your search to see more</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
            <p className="text-[10px] font-semibold text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-violet-700"
            >
              Done ({selected.length})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────── */
export default function PushNotification() {
  const dispatch = useDispatch()
  const { pushing, pushError, pushMessage } = useSelector(selectNotification)
  const [activeTab, setActiveTab] = useState('global')
  const [globalForm, setGlobalForm] = useState(GLOBAL_INIT)
  const [userForm, setUserForm] = useState(USER_FORM_INIT)
  const [selectedUsers, setSelectedUsers] = useState([])

  // Clear feedback on tab switch
  useEffect(() => {
    dispatch(clearPushStatus())
  }, [activeTab, dispatch])

  // Auto-clear after 4s
  useEffect(() => {
    if (!pushMessage && !pushError) return
    const t = setTimeout(() => dispatch(clearPushStatus()), 4000)
    return () => clearTimeout(t)
  }, [pushMessage, pushError, dispatch])

  const handleGlobalChange = (e) => {
    const { name, value } = e.target
    setGlobalForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleUserChange = (e) => {
    const { name, value } = e.target
    setUserForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleGlobalSubmit = async (e) => {
    e.preventDefault()
    const { name, message, path } = globalForm
    if (!name.trim() || !message.trim()) return
    const result = await dispatch(
      pushGlobalNotification({ name: name.trim(), message: message.trim(), path: path.trim() }),
    )
    if (result.meta.requestStatus === 'fulfilled') {
      setGlobalForm(GLOBAL_INIT)
    }
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    const { name, message, path, eventType, metadata } = userForm
    if (!name.trim() || !message.trim() || selectedUsers.length === 0) return

    const userIds = selectedUsers.map((u) => u._id)

    let parsedMetadata
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata.trim())
      } catch {
        parsedMetadata = { raw: metadata.trim() }
      }
    }

    const result = await dispatch(
      pushUserNotification({
        name: name.trim(),
        message: message.trim(),
        path: path.trim(),
        userIds,
        eventType,
        metadata: parsedMetadata,
      }),
    )
    if (result.meta.requestStatus === 'fulfilled') {
      setUserForm(USER_FORM_INIT)
      setSelectedUsers([])
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Breadcrumb />

        {/* Header */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-600">Admin</p>
          <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">
            Push Notifications
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Broadcast alerts or target specific users
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                activeTab === id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {pushMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">{pushMessage}</p>
          </div>
        )}
        {pushError && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <X size={16} className="shrink-0 text-rose-600" />
            <p className="text-sm font-semibold text-rose-700">{pushError}</p>
          </div>
        )}

        {/* ── Global Form ─── */}
        {activeTab === 'global' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Globe size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Global Notification</p>
                <p className="text-[11px] text-slate-500">Visible to all logged-in dashboard users</p>
              </div>
            </div>

            <form onSubmit={handleGlobalSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={globalForm.name}
                  onChange={handleGlobalChange}
                  placeholder="e.g. Planned Maintenance"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={globalForm.message}
                  onChange={handleGlobalChange}
                  placeholder="Write the notification body…"
                  rows={3}
                  className={`${inputClass} resize-none`}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Link Path <span className="text-slate-400 ml-1 normal-case font-medium">(optional)</span>
                </label>
                <input
                  type="text"
                  name="path"
                  value={globalForm.path}
                  onChange={handleGlobalChange}
                  placeholder="/dashboard or /hotels"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={pushing || !globalForm.name.trim() || !globalForm.message.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pushing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Send Global Notification
              </button>
            </form>
          </div>
        )}

        {/* ── User Targeted Form ─── */}
        {activeTab === 'user' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <Users size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">User-Targeted Notification</p>
                <p className="text-[11px] text-slate-500">Delivered only to specified user IDs</p>
              </div>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={userForm.name}
                  onChange={handleUserChange}
                  placeholder="e.g. Offer: 20% off"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={userForm.message}
                  onChange={handleUserChange}
                  placeholder="Write the notification body…"
                  rows={3}
                  className={`${inputClass} resize-none`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Event Type
                  </label>
                  <select
                    name="eventType"
                    value={userForm.eventType}
                    onChange={handleUserChange}
                    className={inputClass}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Link Path
                  </label>
                  <input
                    type="text"
                    name="path"
                    value={userForm.path}
                    onChange={handleUserChange}
                    placeholder="/offers/20"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Select Users <span className="text-rose-500">*</span>
                </label>
                <UserPicker selected={selectedUsers} onChange={setSelectedUsers} />
                {selectedUsers.length > 0 && (
                  <p className="mt-1.5 text-[10px] font-semibold text-violet-600">
                    {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} will receive this notification
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Metadata JSON{' '}
                  <span className="ml-1 font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  name="metadata"
                  value={userForm.metadata}
                  onChange={handleUserChange}
                  placeholder='{"bookingId": "BK001", "offerId": "OFF20"}'
                  className={`${inputClass} font-mono text-xs`}
                />
              </div>

              <button
                type="submit"
                disabled={
                  pushing ||
                  !userForm.name.trim() ||
                  !userForm.message.trim() ||
                  selectedUsers.length === 0
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pushing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Send to Users
              </button>
            </form>
          </div>
        )}

        {/* Info card */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <Bell size={15} className="mt-0.5 shrink-0 text-slate-400" />
            <div className="space-y-1 text-[11px] font-medium text-slate-500">
              <p>
                <span className="font-bold text-slate-700">Global</span> — Notification is stored as a broadcast; all users see it once when they load their dashboard.
              </p>
              <p>
                <span className="font-bold text-slate-700">User-targeted</span> — Only the specified User IDs receive and see this notification.
              </p>
              <p>
                The bell icon in the header will show an unread badge until the user marks notifications as seen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
