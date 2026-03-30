import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ImagePlus, Loader2, MapPin, UploadCloud, X } from 'lucide-react'
import Breadcrumb from '../../../components/breadcrumb'
import {
  addTravelLocation,
  clearLocationsStatus,
} from '../../../../redux/slices/admin/locations'

function AddLocations() {
  const dispatch = useDispatch()
  const { creating, error, successMessage } = useSelector((state) => state.locations)
  const [location, setLocation] = useState('')
  const [files, setFiles] = useState([])

  useEffect(() => {
    if (!successMessage) return undefined
    const timeout = setTimeout(() => dispatch(clearLocationsStatus()), 2500)
    return () => clearTimeout(timeout)
  }, [dispatch, successMessage])

  const previews = useMemo(
    () => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [files],
  )

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    },
    [previews],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    await dispatch(addTravelLocation({ location: location.trim(), images: files })).unwrap()
    setLocation('')
    setFiles([])
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Breadcrumb />

        <div className="mt-3 mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">Admin · Travel Locations</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">Add Travel Location</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-500">
            Nayi travel location add kijiye. `location` required hai, aur images optional multipart upload se jayengi.
          </p>
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

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-xl shadow-stone-200/40"
        >
          <div className="border-b border-stone-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_60%,#f8fafc_100%)] px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">Location Setup</p>
                <h2 className="mt-2 text-2xl font-black text-stone-900">Create New Travel Location</h2>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Location Name</p>
                <input
                  required
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Goa"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50/70 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-stone-500 shadow-sm">
                    <UploadCloud size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-stone-900">Upload Location Images</p>
                    <p className="mt-1 text-sm font-medium text-stone-500">
                      Optional images multipart/form-data me `images` ke naam se upload hongi.
                    </p>
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800">
                      <ImagePlus size={16} />
                      Choose Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => setFiles(Array.from(event.target.files || []))}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-stone-50/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-stone-400">Preview</p>
                  <h3 className="mt-2 text-xl font-black text-stone-900">{location || 'Location Name'}</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-600">
                  {files.length} image{files.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {previews.length > 0 ? (
                  previews.map((preview) => (
                    <div key={preview.url} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                      <img src={preview.url} alt={preview.name} className="h-28 w-full object-cover" />
                      <div className="px-3 py-2 text-xs font-semibold text-stone-500">{preview.name}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-10 text-center text-sm font-semibold text-stone-400">
                    No image selected yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setLocation('')
                setFiles([])
                dispatch(clearLocationsStatus())
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            >
              <X size={16} />
              Reset
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddLocations
