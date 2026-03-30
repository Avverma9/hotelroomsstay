import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Check,
  Eye,
  Link2,
  PencilLine,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
  Filter,
  ChevronDown
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import { refreshSidebarLinks, selectAuth } from '../../../redux/slices/authSlice'
import { getSidebarLinkLabel, getSidebarLinkPath } from '../../utils/sidebar-links'
import {
  changeSidebarLinkStatus,
  clearSidebarAdminFeedback,
  clearSidebarPermissionState,
  createSidebarLink,
  deleteSidebarLink,
  getDashboardUsers,
  getGroupedSidebarLinks,
  getSidebarLinks,
  getSidebarPermissions,
  getUserSidebarPreview,
  selectAdminSidebar,
  updateSidebarLink,
  updateSidebarPermissions,
} from '../../../redux/slices/admin/sidebar'

const ROLE_OPTIONS = ['Admin', 'Developer', 'PMS', 'TMS', 'CA', 'Rider', 'SuperAdmin']

const getInitialFormState = (link) => ({
  parentLink: link?.parentLink || '',
  label: link?.label || '',
  route: link?.route || link?.childLink || '',
  childLink: link?.childLink || link?.route || '',
  icon: link?.icon || '',
  status: link?.status || 'active',
  role: Array.isArray(link?.role) ? link.role : [],
  order: String(link?.order ?? ''),
  isParentOnly: Boolean(link?.isParentOnly),
})

const normalizePermissionState = (config) => ({
  mode: config?.sidebarPermissions?.mode || 'role_based',
  allowedLinkIds: config?.sidebarPermissions?.allowedLinkIds || [],
  blockedLinkIds: config?.sidebarPermissions?.blockedLinkIds || [],
})

const getGroupedLinksFromFlatList = (links) =>
  links.reduce((groups, link) => {
    const groupKey = link.parentLink || 'Ungrouped'
    groups[groupKey] = groups[groupKey] || []
    groups[groupKey].push(link)
    return groups
  }, {})

// Minimalist Status Dot
const StatusDot = ({ status = '' }) => {
  const isActive = status.toLowerCase() === 'active'
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
      <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
    </div>
  )
}

const LUCIDE_ICON_OPTIONS = Object.keys(LucideIcons)
  .filter((iconName) =>
    /^[A-Z]/.test(iconName) &&
    ![
      'Icon',
      'createLucideIcon',
      'icons',
      'LucideIcon',
      'IconNode',
    ].includes(iconName),
  )
  .sort((first, second) => first.localeCompare(second))

const DASHBOARD_ICON_QUICK_OPTIONS = [
  'LayoutDashboard',
  'Building2',
  'Users',
  'UserRound',
  'Hotel',
  'CalendarDays',
  'ClipboardList',
  'MessageSquare',
  'Bell',
  'Settings',
  'ShieldCheck',
  'BadgeDollarSign',
  'Ticket',
  'Car',
  'Map',
  'Search',
  'RefreshCw',
  'BedDouble',
  'Plane',
  'Compass',
  'Image',
  'MenuSquare',
  'BriefcaseBusiness',
  'MapPinned',
]

function SidebarLinkModal({
  open,
  mode,
  createKind = 'link',
  formState,
  saving,
  parentOptions = [],
  onChange,
  onRoleToggle,
  onClose,
  onSubmit,
}) {
  if (!open) return null

  const [iconSearch, setIconSearch] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const isCreateMode = mode === 'create'
  const isParentCreate = isCreateMode && createKind === 'parent'
  const isChildCreate = isCreateMode && createKind === 'child'
  const shouldUseParentDropdown = isChildCreate || (mode === 'edit' && !formState.isParentOnly)
  const isParentOnlyLocked = isParentCreate || isChildCreate
  const dialogTitle = isParentCreate
    ? 'Create Parent Group'
    : isChildCreate
      ? 'Add Child Link'
      : mode === 'create'
        ? 'Create Sidebar Link'
        : 'Edit Sidebar Link'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm transition-opacity">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {dialogTitle}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {isParentCreate
                ? 'Create a top-level parent group for organizing child links.'
                : isChildCreate
                  ? 'Select an existing parent and add a child route under it.'
                  : 'Configure grouping, route details, and roles.'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6">
          {(() => {
            const SelectedIcon = LucideIcons[formState.icon] || Link2
            const filteredIcons = LUCIDE_ICON_OPTIONS
              .filter((iconName) => iconName.toLowerCase().includes(iconSearch.trim().toLowerCase()))
              .slice(0, 240)

            return (
              <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Parent Group</label>
              {shouldUseParentDropdown ? (
                <select
                  required
                  name="parentLink"
                  value={formState.parentLink}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="">Select parent group</option>
                  {[...new Set([...parentOptions, formState.parentLink].filter(Boolean))].map((parent) => (
                    <option key={parent} value={parent}>
                      {parent}
                    </option>
                  ))}
                </select>
              ) : (
                <input required type="text" name="parentLink" value={formState.parentLink} onChange={onChange} placeholder="e.g. User Management" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Link Label</label>
              <input required type="text" name="label" value={formState.label} onChange={onChange} placeholder="e.g. Dashboard" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Icon Component</label>
              <button
                type="button"
                onClick={() => setShowIconPicker((currentValue) => !currentValue)}
                className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition hover:border-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-700">
                    <SelectedIcon size={18} />
                  </span>
                  <span className="text-left">
                    <span className="block font-semibold">{formState.icon || 'Select icon'}</span>
                    <span className="block text-xs text-gray-500">Lucide React icon picker</span>
                  </span>
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showIconPicker ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Child Link / Route</label>
              <input type="text" name="route" value={formState.route} onChange={onChange} placeholder="e.g. /dashboard/users" disabled={formState.isParentOnly} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Display Order</label>
              <input required min="1" type="number" name="order" value={formState.order} onChange={onChange} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <select name="status" value={formState.status} onChange={onChange} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <label className={`flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 sm:col-span-2 ${isParentOnlyLocked ? 'cursor-default' : 'cursor-pointer hover:bg-gray-100'}`}>
              <input type="checkbox" name="isParentOnly" checked={formState.isParentOnly} onChange={onChange} disabled={isParentOnlyLocked} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer disabled:cursor-not-allowed" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">Parent-only Grouping</span>
                <span className="text-sm text-gray-500">
                  {isParentCreate
                    ? 'Enabled for parent creation. This item will act only as a group header.'
                    : isChildCreate
                      ? 'Disabled for child creation. Child links always need a route.'
                      : 'Acts only as a dropdown header, no page route.'}
                </span>
              </div>
            </label>
          </div>

          {showIconPicker && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Dashboard Quick Icons</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {DASHBOARD_ICON_QUICK_OPTIONS.map((iconName) => {
                    const IconComponent = LucideIcons[iconName]
                    const isSelected = formState.icon === iconName

                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          onChange({ target: { name: 'icon', value: iconName, type: 'text' } })
                          setShowIconPicker(false)
                        }}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                          isSelected
                            ? 'border-gray-900 bg-white text-gray-900 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
                          <IconComponent size={18} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">{iconName}</span>
                        {isSelected && <Check size={14} className="shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Lucide Icons</p>
                  <p className="text-xs text-gray-500">Showing 200+ searchable icon options with preview.</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200">
                  {Math.min(filteredIcons.length, 240)} results
                </span>
              </div>

              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(event) => setIconSearch(event.target.value)}
                  placeholder="Search icons like LayoutDashboard, Hotel, Bell..."
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {filteredIcons.map((iconName) => {
                  const IconComponent = LucideIcons[iconName]
                  const isSelected = formState.icon === iconName

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        onChange({ target: { name: 'icon', value: iconName, type: 'text' } })
                        setShowIconPicker(false)
                      }}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                        isSelected
                          ? 'border-gray-900 bg-white text-gray-900 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-md ${isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        <IconComponent size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{iconName}</span>
                      </span>
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
              </>
            )
          })()}

          <div className="mt-6 border-t border-gray-100 pt-6">
            <label className="text-sm font-semibold text-gray-700">Applicable Roles</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => {
                const isSelected = formState.role.includes(role)
                return (
                  <button
                    key={role} type="button" onClick={() => onRoleToggle(role)}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isSelected ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {role}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-gray-100 pt-5">
            <button type="button" onClick={onClose} className="w-full sm:w-auto rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-70">
              {saving ? 'Saving...' : mode === 'create' ? 'Create Link' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ManageLinks() {
  const dispatch = useDispatch()
  const { user: loggedInUser } = useSelector(selectAuth)
  const {
    links,
    groupedLinks,
    users,
    preview,
    loadingLinks,
    loadingUsers,
    loadingPermissions,
    loadingPreview,
    savingLink,
    savingPermissions,
    error,
    successMessage,
  } = useSelector(selectAdminSidebar)
  
  const [activeTab, setActiveTab] = useState('master') // 'master' | 'permissions'
  const [searchValue, setSearchValue] = useState('')
  const [masterRoleFilter, setMasterRoleFilter] = useState('All')
  const [masterStatusFilter, setMasterStatusFilter] = useState('All')
  const [modalState, setModalState] = useState({ open: false, mode: 'create', createKind: 'link', linkId: null })
  const [linkForm, setLinkForm] = useState(getInitialFormState())
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userSearchRef = useRef(null)
  const [permissionForm, setPermissionForm] = useState(normalizePermissionState())

  useEffect(() => {
    dispatch(getSidebarLinks())
    dispatch(getGroupedSidebarLinks())
    dispatch(getDashboardUsers())
  }, [dispatch])

  useEffect(() => {
    return () => {
      dispatch(clearSidebarAdminFeedback())
      dispatch(clearSidebarPermissionState())
    }
  }, [dispatch])

  const filteredLinks = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    return links
      .filter((link) => {
        const matchesSearch = !query || [link.parentLink, link.label, link.route, link.childLink, link.icon, ...(link.role || [])].join(' ').toLowerCase().includes(query)
        const matchesRole = masterRoleFilter === 'All' || (link.role || []).includes(masterRoleFilter)
        const matchesStatus = masterStatusFilter === 'All' || link.status === masterStatusFilter
        return matchesSearch && matchesRole && matchesStatus
      })
      .sort((first, second) => (first.order ?? 0) - (second.order ?? 0))
  }, [links, masterRoleFilter, masterStatusFilter, searchValue])

  const groupedPermissionLinks = useMemo(
    () => (Object.keys(groupedLinks || {}).length ? groupedLinks : getGroupedLinksFromFlatList(links)),
    [groupedLinks, links],
  )
  const parentGroupOptions = useMemo(
    () =>
      [...new Set(links.map((link) => link.parentLink).filter(Boolean))]
        .sort((first, second) => first.localeCompare(second)),
    [links],
  )
  const selectedUser = useMemo(() => users.find((user) => (user._id || user.id) === selectedUserId) || null, [selectedUserId, users])

  const handleUserChange = async (userId) => {
    setSelectedUserId(userId)
    if (!userId) {
      dispatch(clearSidebarPermissionState())
      setPermissionForm(normalizePermissionState())
      return
    }
    const permissionResponse = await dispatch(getSidebarPermissions(userId)).unwrap()
    setPermissionForm(normalizePermissionState(permissionResponse))
    await dispatch(getUserSidebarPreview(userId))
  }

  const filteredUserSuggestions = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q),
    )
  }, [users, userSearchQuery])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openCreateParentModal = () => {
    setModalState({ open: true, mode: 'create', createKind: 'parent', linkId: null })
    setLinkForm({ ...getInitialFormState(), isParentOnly: true })
  }
  const openCreateChildModal = () => {
    setModalState({ open: true, mode: 'create', createKind: 'child', linkId: null })
    setLinkForm({ ...getInitialFormState(), isParentOnly: false })
  }
  const openEditModal = (link) => {
    setModalState({ open: true, mode: 'edit', createKind: 'link', linkId: link._id || link.id })
    setLinkForm(getInitialFormState(link))
  }
  const closeModal = () => {
    setModalState({ open: false, mode: 'create', createKind: 'link', linkId: null })
    setLinkForm(getInitialFormState())
  }

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target
    setLinkForm((currentForm) => {
      const nextForm = { ...currentForm, [name]: type === 'checkbox' ? checked : value }
      if (name === 'route') nextForm.childLink = value
      if (name === 'isParentOnly' && checked) { nextForm.route = ''; nextForm.childLink = '' }
      return nextForm
    })
  }

  const handleRoleToggle = (role) => {
    setLinkForm((currentForm) => ({
      ...currentForm,
      role: currentForm.role.includes(role) ? currentForm.role.filter((item) => item !== role) : [...currentForm.role, role],
    }))
  }

  const buildLinkPayload = () => {
    const isParentCreate = modalState.mode === 'create' && modalState.createKind === 'parent'
    const isChildCreate = modalState.mode === 'create' && modalState.createKind === 'child'
    const routeValue = linkForm.isParentOnly ? '' : linkForm.route.trim()
    if (!linkForm.parentLink.trim()) throw new Error('Parent group is required.')
    if (!linkForm.label.trim()) throw new Error('Link label is required.')
    if (linkForm.role.length === 0) throw new Error('At least one role is required.')
    if (!linkForm.isParentOnly && !routeValue) throw new Error('Route path is required for non-parent-only links.')
    if (isChildCreate && !parentGroupOptions.includes(linkForm.parentLink.trim())) {
      throw new Error('Please select a valid existing parent group.')
    }
    if (isParentCreate && parentGroupOptions.includes(linkForm.parentLink.trim())) {
      throw new Error('This parent group already exists. Use Add Child for existing parents.')
    }

    return {
      parentLink: linkForm.parentLink.trim(),
      label: linkForm.label.trim(),
      childLink: routeValue,
      route: routeValue,
      icon: linkForm.icon.trim(),
      status: linkForm.status,
      role: linkForm.role,
      order: Number(linkForm.order),
      isParentOnly: linkForm.isParentOnly,
    }
  }

  const handleLinkSubmit = async (event) => {
    event.preventDefault()
    try {
      const payload = buildLinkPayload()
      if (modalState.mode === 'create') await dispatch(createSidebarLink(payload)).unwrap()
      else await dispatch(updateSidebarLink({ id: modalState.linkId, data: payload })).unwrap()
      closeModal()
      dispatch(getSidebarLinks())
      dispatch(getGroupedSidebarLinks())
    } catch (submitError) {
      if (submitError instanceof Error) window.alert(submitError.message)
    }
  }

  const handleStatusToggle = async (link) => {
    await dispatch(changeSidebarLinkStatus({ id: link._id || link.id, status: link.status === 'active' ? 'inactive' : 'active' }))
    dispatch(getSidebarLinks())
  }

  const handleDeleteLink = async (link) => {
    if (!window.confirm(`Delete ${getSidebarLinkLabel(link)}? This action cannot be undone.`)) return
    await dispatch(deleteSidebarLink(link._id || link.id))
    dispatch(getSidebarLinks())
    dispatch(getGroupedSidebarLinks())
  }

  const togglePermissionId = (type, linkId) => {
    setPermissionForm((currentForm) => {
      const targetList = currentForm[type]
      const oppositeType = type === 'allowedLinkIds' ? 'blockedLinkIds' : 'allowedLinkIds'
      const nextTargetList = targetList.includes(linkId) ? targetList.filter((id) => id !== linkId) : [...targetList, linkId]
      return { ...currentForm, [type]: nextTargetList, [oppositeType]: currentForm[oppositeType].filter((id) => id !== linkId) }
    })
  }

  const handlePermissionSave = async () => {
    if (!selectedUserId) return
    await dispatch(updateSidebarPermissions({
      userId: selectedUserId,
      data: { mode: permissionForm.mode, allowedLinkIds: permissionForm.allowedLinkIds, blockedLinkIds: permissionForm.blockedLinkIds },
    })).unwrap()
    dispatch(getUserSidebarPreview(selectedUserId))

    if (loggedInUser?.id === selectedUserId) {
      dispatch(refreshSidebarLinks(selectedUserId))
    }
  }

  return (
    <div className="bg-white px-4 py-8 font-sans text-gray-900 selection:bg-gray-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="sticky top-0 z-20 -mx-4 bg-white/95 px-4 pb-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Breadcrumb />

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Navigation</h1>
                  <p className="mt-2 text-sm text-gray-500">Manage master sidebar routes and user-specific rules.</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button onClick={openCreateParentModal} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                    <Plus size={16} /> Create Parent
                  </button>
                  <button onClick={openCreateChildModal} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60" disabled={parentGroupOptions.length === 0}>
                    <Plus size={16} /> Add Child
                  </button>
                </div>
              </div>

              {/* Custom Tab Navigation */}
              <div className="mt-8 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('master')}
                    className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'master' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Master Directory
                  </button>
                  <button
                    onClick={() => setActiveTab('permissions')}
                    className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                      activeTab === 'permissions' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Access & Permissions
                  </button>
                </nav>
              </div>
            </div>

        {(error || successMessage) && (
          <div className={`mt-6 rounded-md border p-4 text-sm font-medium ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {error || successMessage}
          </div>
        )}

            {/* TAB 1: MASTER DIRECTORY */}
            {activeTab === 'master' && (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* Minimalist Stats */}
                <dl className="mb-8 grid grid-cols-2 gap-px bg-gray-200 sm:grid-cols-4 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                  {[
                    { label: 'Total Links', value: links.length },
                    { label: 'Active Links', value: links.filter((l) => l.status === 'active').length },
                    { label: 'Registered Users', value: users.length },
                    { label: 'Menu Groups', value: new Set(links.map((l) => l.parentLink).filter(Boolean)).size },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white px-6 py-6">
                      <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</dt>
                      <dd className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{stat.value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Inline Filters */}
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-gray-50 p-2 border border-gray-200">
                  <div className="flex flex-col sm:flex-row flex-1 w-full gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search routes..." className="w-full appearance-none rounded-lg border-transparent bg-transparent py-2 pl-9 pr-4 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-colors" />
                    </div>
                    <div className="hidden sm:block w-px bg-gray-300 my-1"></div>
                    <div className="relative flex-1">
                      <select value={masterRoleFilter} onChange={(e) => setMasterRoleFilter(e.target.value)} className="w-full appearance-none rounded-lg border-transparent bg-transparent py-2 pl-4 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-colors cursor-pointer">
                        <option value="All">All Roles</option>
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="hidden sm:block w-px bg-gray-300 my-1"></div>
                    <div className="relative flex-1">
                      <select value={masterStatusFilter} onChange={(e) => setMasterStatusFilter(e.target.value)} className="w-full appearance-none rounded-lg border-transparent bg-transparent py-2 pl-4 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-colors cursor-pointer">
                        <option value="All">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Group / Route', 'Roles', 'Status', 'Order', 'Actions'].map((head) => (
                          <th key={head} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {loadingLinks && filteredLinks.length === 0 && (
                        <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">Loading directory...</td></tr>
                      )}
                      {!loadingLinks && filteredLinks.length === 0 && (
                        <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">No links found matching your criteria.</td></tr>
                      )}
                      {filteredLinks.map((link) => (
                        <tr key={link._id || link.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-gray-900">{link.parentLink}</p>
                            <p className="mt-0.5 text-xs font-medium text-gray-600">{getSidebarLinkLabel(link)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{link.isParentOnly ? 'Parent Header' : getSidebarLinkPath(link)}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                              {(link.role || []).map((role) => (
                                <span key={role} className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 border border-gray-200">{role}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button onClick={() => handleStatusToggle(link)} className="focus:outline-none">
                              <StatusDot status={link.status} />
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{link.order}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEditModal(link)} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"><PencilLine size={16} /></button>
                              <button onClick={() => handleDeleteLink(link)} className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ACCESS & PERMISSIONS */}
            {activeTab === 'permissions' && (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 grid grid-cols-1 gap-8 lg:grid-cols-12">
                
                {/* Left Side: Controls */}
                <div className="lg:col-span-6 flex flex-col space-y-6">
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <UserCog size={18} className="text-gray-400"/> Overrides
                    </h2>
                    
                    <div className="space-y-5">
                      <div ref={userSearchRef} className="relative">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Target User</label>
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => {
                              setUserSearchQuery(e.target.value)
                              setShowUserDropdown(true)
                              if (!e.target.value) {
                                setSelectedUserId('')
                                handleUserChange('')
                              }
                            }}
                            onFocus={() => setShowUserDropdown(true)}
                            placeholder={loadingUsers ? 'Loading users...' : 'Search by name or email...'}
                            disabled={loadingUsers}
                            className="w-full rounded-md border border-gray-300 py-2.5 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                          />
                          {userSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserSearchQuery('')
                                setSelectedUserId('')
                                handleUserChange('')
                                setShowUserDropdown(false)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                        {showUserDropdown && filteredUserSuggestions.length > 0 && (
                          <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg text-sm">
                            {filteredUserSuggestions.map((u) => {
                              const uid = u._id || u.id
                              return (
                                <li
                                  key={uid}
                                  onMouseDown={() => {
                                    setSelectedUserId(uid)
                                    setUserSearchQuery(u.name)
                                    setShowUserDropdown(false)
                                    handleUserChange(uid)
                                  }}
                                  className={`flex cursor-pointer flex-col px-3 py-2 hover:bg-gray-50 ${
                                    selectedUserId === uid ? 'bg-gray-100 font-semibold' : ''
                                  }`}
                                >
                                  <span className="font-medium text-gray-900">{u.name}</span>
                                  <span className="text-xs text-gray-500">{u.email} &middot; {u.role}</span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                        {showUserDropdown && userSearchQuery && filteredUserSuggestions.length === 0 && (
                          <div className="absolute z-30 mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-3 shadow-lg text-sm text-gray-500">
                            No users match &ldquo;{userSearchQuery}&rdquo;
                          </div>
                        )}
                      </div>

                      {selectedUser && (
                        <div className="rounded-md bg-gray-50 p-3 border border-gray-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{selectedUser.name}</p>
                              <p className="text-xs font-medium text-gray-500">{selectedUser.email}</p>
                            </div>
                            <span className="inline-flex rounded border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700">{selectedUser.role}</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Permission Mode</label>
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                          {['role_based', 'custom'].map((mode) => (
                            <button
                              key={mode} type="button" onClick={() => setPermissionForm((prev) => ({ ...prev, mode }))}
                              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-all ${
                                permissionForm.mode === mode ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              {mode === 'role_based' ? 'Role Default' : 'Custom Manual'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Force Allow</span>
                          <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {Object.entries(groupedPermissionLinks).map(([group, links]) => (
                              <div key={group} className="space-y-1">
                                {links.map((l) => (
                                  <label key={l._id || l.id} className="flex items-center gap-2.5 text-sm p-1.5 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                                    <input type="checkbox" checked={permissionForm.allowedLinkIds.includes(l._id || l.id)} onChange={() => togglePermissionId('allowedLinkIds', l._id || l.id)} className="h-4 w-4 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer" />
                                    <span className="truncate font-medium text-gray-700">{getSidebarLinkLabel(l)}</span>
                                  </label>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Force Block</span>
                          <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {Object.entries(groupedPermissionLinks).map(([group, links]) => (
                              <div key={group} className="space-y-1">
                                {links.map((l) => (
                                  <label key={l._id || l.id} className="flex items-center gap-2.5 text-sm p-1.5 hover:bg-gray-200 rounded-md cursor-pointer transition-colors">
                                    <input type="checkbox" checked={permissionForm.blockedLinkIds.includes(l._id || l.id)} onChange={() => togglePermissionId('blockedLinkIds', l._id || l.id)} className="h-4 w-4 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                                    <span className="truncate font-medium text-gray-700">{getSidebarLinkLabel(l)}</span>
                                  </label>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button type="button" onClick={handlePermissionSave} disabled={!selectedUserId || savingPermissions || loadingPermissions} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 transition-colors">
                        <Save size={16} /> {savingPermissions ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Live Preview */}
                <div className="lg:col-span-6">
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sticky top-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Eye size={18} className="text-gray-400"/> Live Sidebar Preview
                    </h2>

                    {!selectedUserId ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                        <Filter size={24} className="text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-500">Select a user to preview.</p>
                      </div>
                    ) : loadingPreview ? (
                       <div className="flex justify-center py-12">
                         <p className="text-sm font-medium text-gray-500 animate-pulse">Building preview...</p>
                       </div>
                    ) : (
                      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {Object.keys(preview).length === 0 ? (
                          <p className="text-sm font-medium text-gray-500 text-center py-8">No accessible links for this user.</p>
                        ) : (
                          Object.entries(preview).map(([group, groupLinks]) => (
                            <div key={group}>
                              <p className="mb-2 text-xs font-bold uppercase text-gray-400 tracking-widest">{group}</p>
                              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                {groupLinks.map((link, idx) => (
                                  <div key={link.id || link._id} className={`px-4 py-3 text-sm flex justify-between items-center ${idx !== groupLinks.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <span className="font-semibold text-gray-700">{getSidebarLinkLabel(link)}</span>
                                    <span className="text-gray-400 text-xs font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{link.icon}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
            
      </div>

      <SidebarLinkModal open={modalState.open} mode={modalState.mode} createKind={modalState.createKind} formState={linkForm} saving={savingLink} parentOptions={parentGroupOptions} onChange={handleFormChange} onRoleToggle={handleRoleToggle} onClose={closeModal} onSubmit={handleLinkSubmit} />
    </div>
  )
}

export default ManageLinks
