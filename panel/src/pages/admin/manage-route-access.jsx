import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  LockOpen,
  RefreshCw,
  Route,
  Save,
  Search,
  Shield,
  Terminal,
  User,
  Users,
  X,
} from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import { getDashboardUsers, selectAdminSidebar } from '../../../redux/slices/admin/sidebar'
import {
  checkRouteAccess,
  clearCheckResult,
  clearRouteAdminFeedback,
  getRoutePermissions,
  selectAdminRoute,
  updateRoutePermissions,
} from '../../../redux/slices/admin/route'
import { ROUTE_LIST, getGroupedRoutes, ALL_ROUTE_PATHS } from '../../../util/routeList'



const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={onChange}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
  </button>
)

const RouteRow = ({ route, allowed, onToggle, isAllowAll }) => {
  const effectiveAllowed = isAllowAll ? true : allowed
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <Route size={14} className="shrink-0 text-slate-400" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{route.label}</p>
          <p className="text-[11px] font-mono text-slate-400 truncate">{route.path}</p>
          {route.description && <p className="text-[10px] text-slate-400 truncate">{route.description}</p>}
        </div>
        {route.isDynamic && <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">dynamic</span>}
        {route.isAdmin && <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">admin</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`text-[11px] font-semibold ${effectiveAllowed ? 'text-emerald-600' : 'text-rose-500'}`}>{effectiveAllowed ? 'Allowed' : 'Blocked'}</span>
        <ToggleSwitch checked={effectiveAllowed} onChange={onToggle} disabled={isAllowAll} />
      </div>
    </div>
  )
}

const RouteGroup = ({ group, allowedSet, onToggle, onToggleGroup, isAllowAll }) => {
  const [open, setOpen] = useState(true)
  const allAllowed = isAllowAll || group.routes.every((r) => allowedSet.has(r.path))
  const someAllowed = isAllowAll || group.routes.some((r) => allowedSet.has(r.path))
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-2.5 text-left">
          {open ? <ChevronDown size={15} className="shrink-0 text-slate-400" /> : <ChevronRight size={15} className="shrink-0 text-slate-400" />}
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${group.color}`}>{group.label}</span>
          <span className="text-[11px] text-slate-400 font-medium">{group.routes.length} route{group.routes.length !== 1 ? 's' : ''}</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-slate-500">{allAllowed ? 'All allowed' : someAllowed ? 'Partial' : 'All blocked'}</span>
          {!isAllowAll && (
            <button type="button" onClick={() => onToggleGroup(group.routes.map((r) => r.path), !allAllowed)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${allAllowed ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
              {allAllowed ? 'Block All' : 'Allow All'}
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white p-3 space-y-2">
          {group.routes.map((route) => (
            <RouteRow key={route.path} route={route} allowed={allowedSet.has(route.path)} onToggle={() => onToggle(route.path)} isAllowAll={isAllowAll} />
          ))}
        </div>
      )}
    </div>
  )
}

const CheckRoutePanel = ({ userId, checkResult, checking, onCheck, onClear }) => {
  const [inputPath, setInputPath] = useState('')
  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = inputPath.trim()
    if (!trimmed) return
    onCheck(trimmed.startsWith('/') ? trimmed : `/${trimmed}`)
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Terminal size={15} className="text-slate-500" />
          <h3 className="text-sm font-extrabold text-slate-900">Test Route Access</h3>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">Verify whether this user can access a specific route path</p>
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-slate-400">/</span>
            <input type="text" value={inputPath}
              onChange={(e) => { setInputPath(e.target.value); if (checkResult) onClear() }}
              placeholder="tour/123 or hotels/123"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-5 pr-3 text-sm font-mono text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/10" />
          </div>
          <button type="submit" disabled={checking || !inputPath.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {checking ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Search size={13} />}
            Check
          </button>
        </form>
        {checkResult && (
          <div className={`mt-3 rounded-xl border p-3.5 ${checkResult.hasAccess ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <div className="mb-2.5 flex items-center gap-2">
              {checkResult.hasAccess ? <Check size={15} className="text-emerald-600" /> : <Lock size={15} className="text-rose-500" />}
              <span className={`text-sm font-bold ${checkResult.hasAccess ? 'text-emerald-700' : 'text-rose-700'}`}>
                {checkResult.hasAccess ? 'Access Allowed' : 'Access Denied'}
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex gap-2"><span className="w-28 shrink-0 text-slate-500">Route path</span><span className="text-slate-800">{checkResult.routePath}</span></div>
              <div className="flex gap-2">
                <span className="w-28 shrink-0 text-slate-500">Rule type</span>
                <span className={`font-bold ${checkResult.hasAccess ? 'text-emerald-700' : 'text-rose-600'}`}>{checkResult.matchedRuleType}</span>
              </div>
              {checkResult.matchedPattern && (
                <div className="flex gap-2"><span className="w-28 shrink-0 text-slate-500">Matched</span><span className="text-indigo-700">{checkResult.matchedPattern}</span></div>
              )}
              {checkResult.routePermissions?.mode && (
                <div className="flex gap-2"><span className="w-28 shrink-0 text-slate-500">Mode</span><span className="text-slate-700">{checkResult.routePermissions.mode}</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ManageRouteAccess() {
  const dispatch = useDispatch()
  const { users, loadingUsers, error: usersError } = useSelector(selectAdminSidebar)
  const { routePermissions, loading: loadingRoutePermissions, saving: savingRoutePermissions, checkResult, checking, successMessage, error } = useSelector(selectAdminRoute)

  const [selectedUserId, setSelectedUserId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [routeSearch, setRouteSearch] = useState('')
  const [mode, setMode] = useState('allow_all')
  const [allowedSet, setAllowedSet] = useState(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const allRoutes = ROUTE_LIST
  const allPaths = ALL_ROUTE_PATHS
  const groupedRoutes = useMemo(() => getGroupedRoutes(), [])

  const filteredGroups = useMemo(() => {
    if (!routeSearch.trim()) return groupedRoutes
    const q = routeSearch.toLowerCase()
    return groupedRoutes
      .map((g) => ({ ...g, routes: g.routes.filter((r) => r.path.toLowerCase().includes(q) || r.label.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)) }))
      .filter((g) => g.routes.length > 0)
  }, [groupedRoutes, routeSearch])

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users
    const q = userSearch.toLowerCase()
    return users.filter((u) => u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q))
  }, [users, userSearch])

  useEffect(() => { dispatch(getDashboardUsers()) }, [dispatch])

  // Robust user id across different API shapes
  const getUserId = (u) => u?._id || u?.id || u?.userId || ''

  useEffect(() => {
    if (!selectedUserId) {
      setMode('allow_all'); setAllowedSet(new Set(allPaths)); setHasChanges(false)
      dispatch(clearCheckResult()); return
    }
    dispatch(getRoutePermissions(selectedUserId))
    dispatch(clearCheckResult())
  }, [selectedUserId, dispatch, allPaths])

  useEffect(() => {
    if (!selectedUserId) return
    if (!routePermissions) {
      setMode('allow_all'); setAllowedSet(new Set(allPaths))
    } else {
      const { mode: loadedMode = 'allow_all', allowedRoutes = [], blockedRoutes = [] } = routePermissions
      setMode(loadedMode)
      if (loadedMode === 'custom') {
        setAllowedSet(new Set(allowedRoutes))
      } else {
        const blockedSet = new Set(blockedRoutes)
        setAllowedSet(new Set(allPaths.filter((p) => !blockedSet.has(p))))
      }
    }
    setHasChanges(false)
  }, [routePermissions, selectedUserId, allPaths])

  useEffect(() => {
    if (successMessage) {
      setFeedback({ type: 'success', message: successMessage })
      const t = setTimeout(() => { setFeedback(null); dispatch(clearRouteAdminFeedback()) }, 3000)
      return () => clearTimeout(t)
    }
    if (error) setFeedback({ type: 'error', message: error })
  }, [successMessage, error, dispatch])

  const toggleRoute = (path) => {
    setAllowedSet((prev) => { const next = new Set(prev); if (next.has(path)) next.delete(path); else next.add(path); return next })
    setHasChanges(true)
  }
  const toggleGroup = (paths, allow) => {
    setAllowedSet((prev) => { const next = new Set(prev); paths.forEach((p) => (allow ? next.add(p) : next.delete(p))); return next })
    setHasChanges(true)
  }
  const allowAll = () => { setAllowedSet(new Set(allPaths)); setHasChanges(true) }
  const blockAll = () => { setAllowedSet(new Set()); setHasChanges(true) }

  const handleModeChange = (newMode) => {
    if (newMode === mode) return
    setMode(newMode)
    if (newMode === 'allow_all') {
      setAllowedSet(new Set(allPaths))
    } else if (newMode === 'custom' && routePermissions?.mode === 'custom') {
      // Restore the saved custom config so switching back doesn't wipe the original selection
      setAllowedSet(new Set(routePermissions.allowedRoutes || []))
    }
    setHasChanges(true)
  }

  const handleSave = () => {
    if (!selectedUserId) return
    const allowedRoutes = mode === 'custom' ? [...allowedSet] : []
    // In allow_all mode, no routes are ever blocked — send empty array
    const blockedRoutes = mode === 'allow_all' ? [] : allPaths.filter((p) => !allowedSet.has(p))
    dispatch(updateRoutePermissions({ userId: selectedUserId, mode, allowedRoutes, blockedRoutes }))
    setHasChanges(false)
  }

  const handleCheckRoute = (routePath) => {
    if (!selectedUserId) return
    dispatch(checkRouteAccess({ userId: selectedUserId, routePath }))
  }

  const selectedUser = users.find((u) => getUserId(u) === selectedUserId)
  const allowedCount = mode === 'allow_all' ? allRoutes.length : allowedSet.size
  const totalCount = allRoutes.length

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb />
        <div className="mt-4 mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Shield size={20} className="text-indigo-600" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">Admin</p>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Manage Route Access</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">Grant or revoke access to specific routes for each dashboard user.</p>
          </div>
          {selectedUserId && hasChanges && (
            <button onClick={handleSave} disabled={savingRoutePermissions}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60">
              <Save size={15} />{savingRoutePermissions ? 'Saving…' : 'Save Permissions'}
            </button>
          )}
        </div>

        {feedback && (
          <div className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            <div className="flex items-center gap-2">{feedback.type === 'success' ? <Check size={15} /> : <X size={15} />}{feedback.message}</div>
            <button onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100"><X size={14} /></button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3.5">
                <div className="flex items-center gap-2"><Users size={15} className="text-slate-500" /><h2 className="text-sm font-extrabold text-slate-900">Select User</h2></div>
                <p className="mt-0.5 text-[11px] text-slate-500">Choose a user to manage their route access</p>
              </div>
              <div className="p-3">
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search users…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/10" />
                </div>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8 text-slate-400"><div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" /></div>
                ) : usersError && users.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <AlertCircle size={20} className="text-rose-400" />
                    <p className="text-xs font-semibold text-rose-600">Failed to load users</p>
                    <button onClick={() => dispatch(getDashboardUsers())} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                ) : (
                  <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                    {filteredUsers.length === 0 ? (
                      <p className="py-4 text-center text-sm text-slate-400">{userSearch ? 'No users match your search' : 'No users found'}</p>
                    ) : filteredUsers.map((user) => {
                      const uid = getUserId(user)
                      const isSelected = selectedUserId === uid
                      return (
                        <button key={uid || user.email} type="button" onClick={() => uid && setSelectedUserId(uid)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'} ${!uid ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-800'}`}>{user.name || user.email || 'Unknown User'}</p>
                            {user.name && <p className={`truncate text-[11px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{user.email}</p>}
                          </div>
                          {user.role && <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{user.role}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {selectedUserId && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-indigo-500" />
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Access Summary</p>
                  </div>
                  <span className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${mode === 'allow_all' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                    {mode === 'allow_all' ? 'Allow All' : 'Custom'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                    <p className="text-2xl font-extrabold text-emerald-600">{allowedCount}</p>
                    <p className="text-[11px] font-bold text-emerald-600">Allowed</p>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-center">
                    <p className="text-2xl font-extrabold text-rose-500">{totalCount - allowedCount}</p>
                    <p className="text-[11px] font-bold text-rose-500">Blocked</p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${totalCount > 0 ? (allowedCount / totalCount) * 100 : 0}%` }} />
                </div>
                <p className="text-center text-[11px] font-medium text-slate-500">
                  {totalCount > 0 ? Math.round((allowedCount / totalCount) * 100) : 0}% access granted
                </p>
              </div>
            )}
          </aside>

          <main>
            {!selectedUserId ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50"><Lock size={22} className="text-slate-300" /></div>
                  <p className="text-sm font-semibold text-slate-500">Select a user to manage their route access</p>
                </div>
              </div>
            ) : loadingRoutePermissions ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  <span className="text-sm font-medium">Loading permissions…</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button type="button" onClick={() => handleModeChange('allow_all')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${mode === 'allow_all' ? 'border border-emerald-200 bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Allow All
                      </button>
                      <button type="button" onClick={() => handleModeChange('custom')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${mode === 'custom' ? 'border border-violet-200 bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        Custom
                      </button>
                    </div>
                    <p className="hidden text-[11px] font-medium text-slate-400 sm:block">
                      {mode === 'allow_all' ? 'All routes fully allowed — switch to Custom to restrict specific routes' : 'Only toggled-on routes are accessible'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Search routes…" value={routeSearch} onChange={(e) => setRouteSearch(e.target.value)}
                        className="w-44 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/10" />
                      {routeSearch && <button onClick={() => setRouteSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
                    </div>
                    {mode !== 'allow_all' && (
                      <button onClick={allowAll} className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100">
                        <LockOpen size={13} /> Allow All
                      </button>
                    )}
                    {mode !== 'allow_all' && (
                      <button onClick={blockAll} className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100">
                        <Lock size={13} /> Block All
                      </button>
                    )}
                    {hasChanges && (
                      <button onClick={handleSave} disabled={savingRoutePermissions}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-60">
                        <Save size={13} />{savingRoutePermissions ? 'Saving…' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>

                {selectedUser && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700">
                      {(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-slate-600">
                      Managing access for <span className="text-slate-900">{selectedUser.name || selectedUser.email}</span>
                      {selectedUser.role && <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{selectedUser.role}</span>}
                    </p>
                  </div>
                )}

                {filteredGroups.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
                    <p className="text-sm font-medium">No routes match your search</p>
                  </div>
                ) : filteredGroups.map((group) => (
                  <RouteGroup key={group.key} group={group} allowedSet={allowedSet} onToggle={toggleRoute} onToggleGroup={toggleGroup} isAllowAll={mode === 'allow_all'} />
                ))}

                <CheckRoutePanel userId={selectedUserId} checkResult={checkResult} checking={checking}
                  onCheck={handleCheckRoute} onClear={() => dispatch(clearCheckResult())} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
