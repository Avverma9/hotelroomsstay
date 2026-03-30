import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  EllipsisVertical,
  Building2,
  Copy,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageSquareMore,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import PartnerForm from '../../components/partner-form'
import MasterFilter from '../../components/master-filter'
import {
  addPartner,
  addContacts,
  clearPartnerError,
  clearSelectedPartner,
  deleteContact,
  deletePartner,
  getAll,
  getAllPartners,
  findPartnerByQuery,
  getContacts,
  getPartnerById,
  selectPartner,
  updatePartner,
  updatePartnerImage,
  updatePartnerStatus,
} from '../../../redux/slices/partner'

const ROLE_OPTIONS = ['All', 'Admin', 'PMS', 'Developer', 'TMS', 'CA', 'Rider']
const ITEMS_PER_PAGE = 8

const formatDate = (value) => {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const formatDateTime = (value) => {
  if (!value) return 'Offline'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Offline'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || 'NA'

const appendPartnerFormData = (formData, values, includePassword) => {
  formData.append('name', values.name)
  formData.append('email', values.email)
  formData.append('mobile', values.mobile)
  formData.append('role', values.role)
  formData.append('address', values.address)
  formData.append('city', values.city)
  formData.append('state', values.state)
  formData.append('pinCode', values.pinCode)
  formData.append('status', values.status)

  if (includePassword || values.password.trim()) {
    formData.append('password', values.password)
  }

  if (values.imageFile) {
    formData.append('image', values.imageFile)
  }
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value || 'Not available'}</p>
    </div>
  )
}

function CopyableDetailRow({ label, value, masked }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-800 truncate">{value || 'Not available'}</p>
        {value && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            title="Copy"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}

function PartnerDetailsModal({ partner, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Partner Details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Full account information, role mapping, and route access overview.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-6">
          {loading || !partner ? (
            <div className="py-20 text-center text-sm text-slate-500">
              Loading partner details...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center">
                {partner.images?.[0] ? (
                  <img
                    src={partner.images[0]}
                    alt={partner.name || 'Partner'}
                    className="h-24 w-24 rounded-3xl object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-2xl font-bold text-slate-600 ring-1 ring-slate-200">
                    {getInitials(partner.name)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {partner.name || 'Unnamed partner'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{partner.email || 'No email available'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {partner.role || 'No role'}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        partner.status
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {partner.status ? 'Active account' : 'Inactive account'}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        partner.isOnline
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {partner.isOnline ? 'Online now' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <CopyableDetailRow label="Email" value={partner.email} />
                <CopyableDetailRow label="Password" value={partner.password} />
                <DetailRow label="Mobile" value={partner.mobile} />
                <DetailRow label="City" value={partner.city} />
                <DetailRow label="State" value={partner.state} />
                <DetailRow label="PIN Code" value={partner.pinCode} />
                <DetailRow label="Last Seen" value={formatDateTime(partner.lastSeen)} />
                <DetailRow label="Created On" value={formatDate(partner.createdAt)} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Address
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {partner.address || 'No address available'}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Hotel Mapping
                  </h4>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {partner.hotelCount || 0} hotels linked
                  </p>
                  <div className="mt-3 space-y-2">
                    {partner.hotelInfo?.length ? (
                      partner.hotelInfo.map((hotel, index) => (
                        <div key={`${hotel.hotelName}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">{hotel.hotelName}</p>
                          <p className="mt-1 text-xs text-slate-500">{hotel.fullAddress || hotel.email}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No hotel assigned yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Menu Access
                </h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  {partner.menuItems?.length ? (
                    partner.menuItems.map((item) => (
                      <span
                        key={item._id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        {item.title} ({item.path})
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No route access assigned.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactManagementModal({
  partner,
  partners,
  contacts,
  loading,
  onAddContact,
  onDeleteContact,
  onClose,
  findPartnerByQuery,
}) {
  const activeContacts = useMemo(
    () =>
      contacts
        .map((contact) => partners.find((item) => item._id === contact.userId))
        .filter(Boolean),
    [contacts, partners],
  )

  const availablePartners = useMemo(() => {
    const currentContactIds = new Set(contacts.map((contact) => contact.userId))

    return partners.filter(
      (item) => item._id !== partner?._id && !currentContactIds.has(item._id),
    )
  }, [contacts, partner?._id, partners])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Messenger Contacts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage contact list for {partner?.name || 'selected partner'}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Current Contacts</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Existing messenger connections for this user.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {activeContacts.length}
              </span>
            </div>

            <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-1">
              {loading && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  Loading contacts...
                </div>
              )}

              {!loading && activeContacts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No contacts added yet.
                </div>
              )}

              {activeContacts.map((contactPartner) => (
                <div
                  key={contactPartner._id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {contactPartner.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {contactPartner.email || 'No email'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {contactPartner.role || 'No role'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteContact(contactPartner._id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Available Partners</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add more dashboard users to this messenger list.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {availablePartners.length}
              </span>
            </div>

            <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-1">
              {!loading && availablePartners.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No available users left to add.
                </div>
              )}

              {availablePartners.map((availablePartner) => (
                <div
                  key={availablePartner._id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {availablePartner.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {availablePartner.email || 'No email'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {availablePartner.role || 'No role'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddContact(availablePartner._id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Partner() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { partners, selectedPartner, contacts, loading, contactsLoading, error } =
    useSelector(selectPartner)
  const [filterValues, setFilterValues] = useState({
    search: '',
    role: 'All',
    status: 'All',
    city: '',
    isOnline: '',
  })
  const [dialogType, setDialogType] = useState(null)
  const [activePartnerId, setActivePartnerId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionMenuId, setOpenActionMenuId] = useState(null)

  useEffect(() => {
    dispatch(getAllPartners())
  }, [dispatch])

  const masterFilterFields = useMemo(
    () => [
      { key: 'search', placeholder: 'Search by name, email, mobile, city or role', label: 'Search' },
      { key: 'role', type: 'select', options: ROLE_OPTIONS, label: 'Role', emptyOptionLabel: 'Any role' },
      { key: 'status', type: 'select', options: ['All', 'Active', 'Inactive'], label: 'Status', emptyOptionLabel: 'Any status' },
      { key: 'city', placeholder: 'City', label: 'City' },
      {
        key: 'isOnline',
        type: 'select',
        options: [
          { value: '', label: 'Any' },
          { value: 'true', label: 'Online' },
          { value: 'false', label: 'Offline' },
        ],
        label: 'Online',
      },
    ],
    [],
  )

  const handleFilterChange = (key, value) => {
    setFilterValues((current) => ({ ...current, [key]: value }))
  }

  const handleFilterApply = () => {
    const params = {}
    if (filterValues.search?.trim()) params.search = filterValues.search.trim()
    if (filterValues.role && filterValues.role !== 'All') params.role = filterValues.role
    if (filterValues.city?.trim()) params.city = filterValues.city.trim()
    if (filterValues.status && filterValues.status !== 'All')
      params.status = filterValues.status === 'Active'
    if (filterValues.isOnline !== '' && filterValues.isOnline !== undefined) {
      params.isOnline = filterValues.isOnline === true || filterValues.isOnline === 'true'
    }

    if (Object.keys(params).length) {
      dispatch(findPartnerByQuery(params))
    } else {
      dispatch(getAllPartners())
    }
  }

  const handleFilterReset = () => {
    setFilterValues({ search: '', role: 'All', status: 'All', city: '', isOnline: '' })
    dispatch(getAllPartners())
  }

  // Partner list is populated by server-side search or full list
  const filteredPartners = partners

  const stats = useMemo(() => {
    const activePartners = partners.filter((partner) => partner.status).length
    const onlinePartners = partners.filter((partner) => partner.isOnline).length
    const totalHotels = partners.reduce(
      (total, partner) => total + Number(partner.hotelCount || 0),
      0,
    )
    const uniqueRoles = new Set(partners.map((partner) => partner.role).filter(Boolean)).size

    return {
      totalPartners: partners.length,
      activePartners,
      onlinePartners,
      totalHotels,
      uniqueRoles,
    }
  }, [partners])

  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / ITEMS_PER_PAGE))
  const pageStartIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedPartners = filteredPartners.slice(
    pageStartIndex,
    pageStartIndex + ITEMS_PER_PAGE,
  )
  const visiblePageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentPage - 3),
    Math.max(5, currentPage + 2),
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [filterValues])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const closeDialog = () => {
    setDialogType(null)
    setActivePartnerId(null)
    setSubmitting(false)
    setOpenActionMenuId(null)
    dispatch(clearSelectedPartner())
  }

  const openCreateDialog = () => {
    setDialogType('create')
    setActivePartnerId(null)
    dispatch(clearSelectedPartner())
  }

  const openDetailsDialog = async (partnerId) => {
    setDialogType('view')
    setActivePartnerId(partnerId)
    setOpenActionMenuId(null)
    await dispatch(getPartnerById(partnerId))
  }

  const openEditDialog = async (partnerId) => {
    setDialogType('edit')
    setActivePartnerId(partnerId)
    setOpenActionMenuId(null)
    await dispatch(getPartnerById(partnerId))
  }

  const openContactsDialog = async (partnerId) => {
    setDialogType('contacts')
    setActivePartnerId(partnerId)
    setOpenActionMenuId(null)
    await Promise.all([dispatch(getContacts(partnerId)), dispatch(getAll())])
  }

  const handleCreatePartner = async (values) => {
    setSubmitting(true)

    try {
      const formData = new FormData()
      appendPartnerFormData(formData, values, true)

      await dispatch(addPartner(formData)).unwrap()
      closeDialog()
    } catch (submitError) {
      setSubmitting(false)
    }
  }

  const handleUpdatePartner = async (values) => {
    if (!activePartnerId) return

    setSubmitting(true)

    try {
      const formData = new FormData()
      appendPartnerFormData(formData, values, false)

      await dispatch(
        updatePartner({
          userId: activePartnerId,
          partnerData: formData,
        }),
      ).unwrap()

      if (values.imageFile) {
        await dispatch(
          updatePartnerImage({
            userId: activePartnerId,
            imageFile: values.imageFile,
          }),
        ).unwrap()
      }

      closeDialog()
    } catch (submitError) {
      setSubmitting(false)
    }
  }

  const handleStatusToggle = async (partner) => {
    await dispatch(
      updatePartnerStatus({
        userId: partner._id,
        status: !partner.status,
      }),
    )
  }

  const handleDeletePartner = async (partner) => {
    const shouldDelete = window.confirm(
      `Delete ${partner.name || 'this partner'}? This action cannot be undone.`,
    )

    if (!shouldDelete) {
      return
    }

    await dispatch(deletePartner([partner._id]))
    setOpenActionMenuId(null)
  }

  const handleAddContact = async (contactId) => {
    if (!activePartnerId) {
      return
    }

    await dispatch(addContacts({ id: activePartnerId, userId: contactId }))
    await dispatch(getContacts(activePartnerId))
  }

  const handleDeleteContact = async (contactId) => {
    if (!activePartnerId) {
      return
    }

    await dispatch(deleteContact({ id: activePartnerId, userId: contactId }))
    await dispatch(getContacts(activePartnerId))
  }

  const detailPartner =
    activePartnerId && selectedPartner?._id === activePartnerId
      ? selectedPartner
      : partners.find((partner) => partner._id === activePartnerId) || null

  return (
    <div className="bg-slate-50/60 p-5 md:p-6">
      <Breadcrumb />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Partner Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage partner accounts, permissions, and onboarding details from one workspace.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => dispatch(getAllPartners())}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>

          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Partner
          </button>
        </div>
      </div>

            {error && (
              <div className="mb-5 flex flex-col gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:flex-row md:items-center md:justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => dispatch(clearPartnerError())}
                  className="font-semibold text-red-700 transition hover:text-red-900"
                >
                  Dismiss
                </button>
              </div>
            )}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Total Partners',
                  value: stats.totalPartners,
                  icon: Users,
                  style: 'bg-blue-50 text-blue-600',
                },
                {
                  label: 'Active Accounts',
                  value: stats.activePartners,
                  icon: ShieldCheck,
                  style: 'bg-emerald-50 text-emerald-600',
                },
                {
                  label: 'Online Now',
                  value: stats.onlinePartners,
                  icon: RefreshCw,
                  style: 'bg-amber-50 text-amber-600',
                },
                {
                  label: 'Hotels Assigned',
                  value: stats.totalHotels,
                  icon: Building2,
                  style: 'bg-violet-50 text-violet-600',
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                  >
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.style}`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-[15px] font-medium text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      {item.value}
                    </p>
                  </div>
                )
              })}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-200 px-4 py-4 md:px-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-center gap-4">
                    <MasterFilter
                      fields={masterFilterFields}
                      values={filterValues}
                      loading={loading}
                      enableFieldPicker
                      fieldPickerLabel="Add filter"
                      initialActiveFieldKeys={['search', 'role', 'status']}
                      applyLabel="Apply Filters"
                      onChange={handleFilterChange}
                      onApply={handleFilterApply}
                      onReset={handleFilterReset}
                    />

                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        All Partners Table
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {filteredPartners.length} records shown across {stats.uniqueRoles} active roles
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-[220px] max-h-[calc(100vh-280px)] overflow-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th className="sticky top-0 z-10 w-[200px] border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                        Partner
                      </th>
                      <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                        Role
                      </th>
                      <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                        Location
                      </th>
                      <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                        Hotels
                      </th>
                      <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                        Status
                      </th>
                      <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading && paginatedPartners.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center text-sm text-slate-500">
                          Loading partner records...
                        </td>
                      </tr>
                    )}

                    {!loading && filteredPartners.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center text-sm text-slate-500">
                          No partner found for the current filters.
                        </td>
                      </tr>
                    )}

                    {paginatedPartners.map((partner) => (
                      <tr key={partner._id} className="align-top transition hover:bg-slate-50/80">
                        <td className="w-[200px] px-5 py-4">
                          <div className="flex w-[200px] items-center gap-2.5">
                            {partner.images?.[0] ? (
                              <img
                                src={partner.images[0]}
                                alt={partner.name || 'Partner'}
                                className="h-11 min-h-11 w-11 min-w-11 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                                {getInitials(partner.name)}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {partner.name || 'Unnamed partner'}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {partner.email || 'No email added'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {partner.role || 'Not assigned'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[180px]">
                            <p className="text-sm font-medium text-slate-800">
                              {[partner.city, partner.state].filter(Boolean).join(', ') || 'Location unavailable'}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {partner.address || 'No address added'}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[160px]">
                            <p className="text-sm font-semibold text-slate-900">
                              {partner.hotelCount || 0} hotels
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {partner.hotelInfo?.map((item) => item.hotelName).filter(Boolean).join(', ') || 'No hotel mapping'}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[150px]">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleStatusToggle(partner)}
                                className={`relative inline-flex h-6.5 w-11 items-center rounded-full transition ${
                                  partner.status ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition ${
                                    partner.status ? 'translate-x-5.5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className="text-xs font-semibold text-slate-600">
                                {partner.status ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="relative flex min-w-[100px] justify-start">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId((currentId) =>
                                  currentId === partner._id ? null : partner._id,
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              <EllipsisVertical size={16} />
                            </button>

                            {openActionMenuId === partner._id && (
                              <div className="absolute right-0 top-11 z-20 min-w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                                <button
                                  type="button"
                                  onClick={() => openDetailsDialog(partner._id)}
                                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Eye size={16} />
                                  View Details
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEditDialog(partner._id)}
                                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                                >
                                  <PencilLine size={16} />
                                  Edit Partner
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openContactsDialog(partner._id)}
                                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
                                >
                                  <MessageSquareMore size={16} />
                                  Messenger Contacts
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null)
                                    navigate(`/user-complaint?userId=${partner._id}`)
                                  }}
                                  className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-sky-700 transition hover:bg-sky-50"
                                >
                                  <ShieldCheck size={16} />
                                  View Complaints
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePartner(partner)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                                >
                                  <Trash2 size={16} />
                                  Delete Partner
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3.5 md:flex-row md:items-center md:justify-between md:px-5">
                <p className="text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-900">
                    {filteredPartners.length === 0 ? 0 : pageStartIndex + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.min(pageStartIndex + ITEMS_PER_PAGE, filteredPartners.length)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-900">{filteredPartners.length}</span>{' '}
                  partners
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {visiblePageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                        currentPage === pageNumber
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
      </section>

      {dialogType === 'create' && (
        <PartnerForm
          mode="create"
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleCreatePartner}
        />
      )}

      {dialogType === 'edit' && (
        <PartnerForm
          mode="edit"
          partner={detailPartner}
          submitting={submitting}
          onClose={closeDialog}
          onSubmit={handleUpdatePartner}
        />
      )}

      {dialogType === 'view' && (
        <PartnerDetailsModal
          partner={detailPartner}
          loading={loading && selectedPartner?._id !== activePartnerId}
          onClose={closeDialog}
        />
      )}

      {dialogType === 'contacts' && (
        <ContactManagementModal
          partner={detailPartner}
          partners={partners}
          contacts={contacts}
          loading={contactsLoading}
          onAddContact={handleAddContact}
          onDeleteContact={handleDeleteContact}
          onClose={closeDialog}
        />
      )}
    </div>
  )
}

export default Partner
