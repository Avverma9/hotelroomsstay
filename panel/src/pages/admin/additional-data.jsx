// src/pages/admin/AdditionalData.jsx

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  BadgeCheck,
  BedDouble,
  BriefcaseBusiness,
  ConciergeBell,
  MapPinned,
  Plane,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import Breadcrumb from '../../components/breadcrumb'
import {
  addAmenity,
  addBedTypes,
  addRole,
  addRoomTypes,
  addTourTheme,
  addTravelAmenity,
  clearAdditionalCollectionError,
  clearAdditionalFeedback,
  deleteAmenity,
  deleteBedTypes,
  deleteRole,
  deleteRoomTypes,
  deleteTourThemes,
  deleteTravelAmenity,
  getAmenities,
  getBedTypes,
  getRole,
  getRoomTypes,
  getTourThemes,
  getTravelAmenities,
  selectAdminAdditional,
} from '../../../redux/slices/admin/additional'

const DATASET_CONFIG = [
  {
    key: 'roles',
    title: 'Roles',
    placeholder: 'Search Roles...',
    inputPlaceholder: 'Add role',
    singularLabel: 'role',
    icon: BriefcaseBusiness,
    fetchAction: getRole,
    addAction: addRole,
    deleteAction: deleteRole,
  },
  {
    key: 'roomTypes',
    title: 'Room Types',
    placeholder: 'Search Room Types...',
    inputPlaceholder: 'Add room type',
    singularLabel: 'room type',
    icon: MapPinned,
    fetchAction: getRoomTypes,
    addAction: addRoomTypes,
    deleteAction: deleteRoomTypes,
  },
  {
    key: 'bedTypes',
    title: 'Bed Types',
    placeholder: 'Search Bed Types...',
    inputPlaceholder: 'Add bed type',
    singularLabel: 'bed type',
    icon: BedDouble,
    fetchAction: getBedTypes,
    addAction: addBedTypes,
    deleteAction: deleteBedTypes,
  },
  {
    key: 'amenities',
    title: 'Hotel Amenities',
    placeholder: 'Search Hotel Amenities...',
    inputPlaceholder: 'Add hotel amenity',
    singularLabel: 'hotel amenity',
    icon: BadgeCheck,
    fetchAction: getAmenities,
    addAction: addAmenity,
    deleteAction: deleteAmenity,
  },
  {
    key: 'travelAmenities',
    title: 'Travel Amenities',
    placeholder: 'Search Travel Amenities...',
    inputPlaceholder: 'Add travel amenity',
    singularLabel: 'travel amenity',
    icon: Plane,
    fetchAction: getTravelAmenities,
    addAction: addTravelAmenity,
    deleteAction: deleteTravelAmenity,
  },
  {
    key: 'tourThemes',
    title: 'Tour Themes',
    placeholder: 'Search Tour Themes...',
    inputPlaceholder: 'Add tour theme',
    singularLabel: 'tour theme',
    icon: RefreshCw,
    fetchAction: getTourThemes,
    addAction: addTourTheme,
    deleteAction: deleteTourThemes,
  },
]

const getItemId = (item) =>
  item?._id ||
  item?.id ||
  item?.uuid ||
  item?.value ||
  item?.name ||
  item?.role ||
  ''

const getItemLabel = (item) =>
  item?.name ||
  item?.role ||
  item?.title ||
  item?.label ||
  item?.value ||
  'Untitled'

function DatasetCard({
  title,
  icon,
  placeholder,
  inputPlaceholder,
  singularLabel,
  collection,
  value,
  onChange,
  onSubmit,
  onDelete,
}) {
  const Icon = icon

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60">
      {/* header */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon size={16} />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        </div>

        {/* “Add New” + inline input look */}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 rounded-lg bg-white px-2 py-1 shadow-sm"
        >
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={inputPlaceholder}
            className="h-7 w-40 border-none bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={collection.saving}
            className="inline-flex items-center rounded-md bg-blue-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {collection.saving ? 'Saving...' : 'Add'}
          </button>
        </form>
      </header>

      {/* search */}
      <div className="border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
          <span className="text-[11px]">🔍</span>
          <input
            className="h-5 w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            placeholder={placeholder}
            // agar real search chahiye to yahan se alag state use karo
            onChange={() => {}}
          />
        </div>
      </div>

      {/* list */}
      <div className="flex-1 bg-white px-4 py-2">
        {collection.error && (
          <div className="mb-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {collection.error}
          </div>
        )}

        <div className="max-h-56 space-y-1 overflow-y-auto pr-1 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/70">
          {collection.loading && collection.items.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-400">
              Loading...
            </div>
          ) : collection.items.length === 0 ? (
            <div className="h-24 rounded-lg border border-dashed border-slate-200 px-3 py-3 text-slate-400">
              No {singularLabel}s found.
            </div>
          ) : (
            collection.items.map((item) => {
              const id = getItemId(item)
              return (
                <div
                  key={id || getItemLabel(item)}
                  className="flex items-center justify-between rounded-lg px-1.5 py-1 hover:bg-slate-50"
                >
                  <span className="truncate text-[13px] text-slate-700">
                    {getItemLabel(item)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(id)}
                    disabled={!id || collection.deleting}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-[11px] text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

function AdditionalData() {
  const dispatch = useDispatch()
  const { feedback, globalError, ...collections } = useSelector(selectAdminAdditional)

  const [formValues, setFormValues] = useState(() =>
    DATASET_CONFIG.reduce((acc, item) => {
      acc[item.key] = ''
      return acc
    }, {}),
  )

  useEffect(() => {
    DATASET_CONFIG.forEach((cfg) => {
      dispatch(cfg.fetchAction())
    })
  }, [dispatch])

  const totalItems = useMemo(
    () =>
      DATASET_CONFIG.reduce(
        (count, cfg) => count + (collections[cfg.key]?.items?.length || 0),
        0,
      ),
    [collections],
  )

  const loadingSections = useMemo(
    () => DATASET_CONFIG.filter((cfg) => collections[cfg.key]?.loading).length,
    [collections],
  )

  const handleValueChange = (key, value) => {
    dispatch(clearAdditionalCollectionError(key))
    dispatch(clearAdditionalFeedback())
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleCreate = (config) => async (event) => {
    event.preventDefault()
    const raw = formValues[config.key].trim()
    if (!raw) return

    try {
      await dispatch(config.addAction(raw)).unwrap()
      setFormValues((prev) => ({ ...prev, [config.key]: '' }))
      await dispatch(config.fetchAction())
    } catch {
      // slice error state already set
    }
  }

  const handleDelete = (config) => async (id) => {
    if (!id) return
    try {
      await dispatch(config.deleteAction(id)).unwrap()
      await dispatch(config.fetchAction())
    } catch {
      // slice error state already set
    }
  }

  return (
    <div className="bg-slate-50 p-4 md:p-6">
      <Breadcrumb />

            {/* Top summary bar */}
            <section className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Additional Data Center
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Manage roles, room/bed types, amenities and tour themes in a single view.
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-700">
                    Datasets: <span className="font-semibold">{DATASET_CONFIG.length}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-700">
                    Total Items: <span className="font-semibold">{totalItems}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-700">
                    Loading: <span className="font-semibold">{loadingSections}</span>
                  </div>
                </div>
              </div>
            </section>

            {feedback && (
              <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {feedback}
              </div>
            )}

            {globalError && (
              <div className="mb-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {globalError}
              </div>
            )}

      {/* 3x2 grid like screenshot */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DATASET_CONFIG.map((cfg) => (
          <DatasetCard
            key={cfg.key}
            title={cfg.title}
            icon={cfg.icon}
            placeholder={cfg.placeholder}
            inputPlaceholder={cfg.inputPlaceholder}
            singularLabel={cfg.singularLabel}
            collection={collections[cfg.key] || { items: [], loading: false, error: null }}
            value={formValues[cfg.key]}
            onChange={(v) => handleValueChange(cfg.key, v)}
            onSubmit={handleCreate(cfg)}
            onDelete={handleDelete(cfg)}
          />
        ))}
      </div>
    </div>
  )
}

export default AdditionalData
