import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Image as ImageIcon, Loader2, MapPin, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../../../components/breadcrumb'
import {
  clearLocationsStatus,
  deleteTravelLocation,
  getAllTravelLocations,
} from '../../../../redux/slices/admin/locations'

const getLocationId = (location) => location?._id || location?.id || ''

function ListLocations() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { locations, loading, deleting, error, successMessage } = useSelector((state) => state.locations)

  useEffect(() => {
    dispatch(getAllTravelLocations())
  }, [dispatch])

  useEffect(() => {
    if (!successMessage) return undefined
    const timeout = setTimeout(() => dispatch(clearLocationsStatus()), 2500)
    return () => clearTimeout(timeout)
  }, [dispatch, successMessage])

  const handleDelete = async (id) => {
    if (!id) return
    if (!window.confirm('Delete this travel location?')) return
    await dispatch(deleteTravelLocation(id)).unwrap()
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb />

        <div className="mt-3 mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">Admin · Travel Locations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">List Travel Locations</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-stone-500">
              Saari travel locations yahan dekhiye, images preview kariye, aur zarurat par delete bhi kijiye.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/travel-locations/add')}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <Plus size={15} />
              Add Location
            </button>
            <button
              type="button"
              onClick={() => dispatch(getAllTravelLocations())}
              className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {(error || successMessage) && (
          <div className="mb-6 grid gap-3">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {successMessage}
              </div>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-xl shadow-stone-200/40">
          <div className="flex flex-col gap-4 border-b border-stone-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900">Travel Locations Directory</h2>
                <p className="text-sm font-medium text-stone-500">{locations.length} locations</p>
              </div>
            </div>
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600">
                <Loader2 size={14} className="animate-spin" />
                Syncing...
              </div>
            )}
          </div>

          {loading && locations.length === 0 ? (
            <div className="px-6 py-20 text-center text-sm font-semibold text-stone-500">Loading travel locations...</div>
          ) : locations.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                <MapPin size={28} />
              </div>
              <h3 className="mt-5 text-lg font-black text-stone-900">No locations available</h3>
              <p className="mt-2 text-sm font-medium text-stone-500">
                Abhi tak koi travel location add nahi hui hai.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
              {locations.map((location) => {
                const locationId = getLocationId(location)
                const images = Array.isArray(location?.images) ? location.images : []

                return (
                  <div
                    key={locationId}
                    className="overflow-hidden rounded-[28px] border border-stone-200 bg-stone-50/70 shadow-sm"
                  >
                    <div className="grid h-44 place-items-center bg-stone-100">
                      {images[0] ? (
                        <img
                          src={images[0]}
                          alt={location?.location || 'Travel location'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-stone-400">
                          <ImageIcon size={28} />
                          <span className="text-sm font-semibold">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 px-5 py-5">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-stone-400">Location</p>
                        <h3 className="mt-2 text-xl font-black text-stone-900">{location?.location || 'Unnamed Location'}</h3>
                        <p className="mt-2 font-mono text-[11px] font-semibold text-stone-400">{locationId}</p>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-600">
                        <span>Images</span>
                        <span className="font-black text-stone-900">{images.length}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(locationId)}
                        disabled={deleting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:pointer-events-none disabled:opacity-50"
                      >
                        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete Location
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ListLocations
