import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { deleteCarById, getAllCars } from "../../../redux/slices/tms/travel/car"
import { Eye, Pencil, Trash2, Car, MapPin, Search, RefreshCw } from "lucide-react"
import AdminTable, { tableClasses } from '../../components/admin-table'

function formatCurrency(val) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val)
}

function Shimmer() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-gray-50 border-b-[1.5px] border-gray-200">
            {["Cab", "Owner", "Location", "Seats", "Price", "Status", "Actions"].map(h => (
              <th key={h} className="py-2.5 px-4 text-left text-[0.67rem] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3 px-4 align-middle">
                <div className="flex items-center gap-3">
                  <div className="animate-pulse bg-gray-200 w-16 h-12 rounded-lg shrink-0" />
                  <div>
                    <div className="animate-pulse bg-gray-200 w-36 h-3.5 rounded mb-1.5" />
                    <div className="animate-pulse bg-gray-200 w-20 h-2.5 rounded" />
                  </div>
                </div>
              </td>
              {[100, 90, 40, 70, 60].map((w, j) => (
                <td key={j} className="py-3 px-4 align-middle">
                  <div className="animate-pulse bg-gray-200 h-3 rounded" style={{ width: w }} />
                </td>
              ))}
              <td className="py-3 px-4 align-middle">
                <div className="flex gap-1.5">
                  <div className="animate-pulse bg-gray-200 w-8 h-8 rounded-lg" />
                  <div className="animate-pulse bg-gray-200 w-8 h-8 rounded-lg" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ car }) {
  if (car.isAvailable)
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.67rem] font-bold tracking-wide whitespace-nowrap bg-green-50 text-green-600 border border-green-200">● Available</span>
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.67rem] font-bold tracking-wide whitespace-nowrap bg-gray-100 text-gray-500 border border-gray-200">{car.runningStatus || "Unavailable"}</span>
}

export default function AllCabs() {
  const dispatch = useDispatch()
  const { cars = [], loading, error } = useSelector(s => s.car)
  const [query, setQuery] = useState("")
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { dispatch(getAllCars()) }, [dispatch])

  const filtered = query.trim()
    ? cars.filter(c =>
        [c.make, c.model, c.vehicleNumber, c.pickupP, c.dropP, c.ownerName, c.ownerEmail]
          .some(v => v?.toLowerCase().includes(query.toLowerCase()))
      )
    : cars

  const handleView = car => {
    const from = window.location.pathname + window.location.search
    window.open(`${window.location.origin}/your-cars/${car._id}?from=${encodeURIComponent(from)}`, "_blank")
  }
  const handleEdit = car => {
    const from = window.location.pathname + window.location.search
    window.open(`${window.location.origin}/your-cars/${car._id}/edit?from=${encodeURIComponent(from)}`, "_blank")
  }
  const handleDelete = async car => {
    if (!window.confirm(`Delete "${[car.make, car.model].filter(Boolean).join(" ") || car.vehicleNumber}"?`)) return
    setDeleting(car._id)
    await dispatch(deleteCarById(car._id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-white font-sans px-6 py-7 pb-12 sm:px-4 sm:py-5">
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-zinc-900 rounded-[11px] flex items-center justify-center shrink-0 relative overflow-hidden after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-orange-600">
            <Car size={18} color="#fff" />
          </div>
          <div>
            <p className="text-[0.65rem] font-bold tracking-[0.12em] uppercase text-orange-600 mb-0.5">Admin Panel</p>
            <h1 className="text-[1.35rem] font-black tracking-tight text-zinc-900 m-0">All Cabs</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="py-2 pr-3.5 pl-8 bg-white border-[1.5px] border-gray-200 rounded-lg text-sm text-zinc-900 outline-none w-[230px] transition-all focus:border-orange-600 focus:ring-[3px] focus:ring-orange-600/10 placeholder-gray-400 sm:w-[180px]"
              placeholder="Search cab, location…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button
            className="w-9 h-9 bg-white border-[1.5px] border-gray-200 rounded-lg cursor-pointer flex items-center justify-center text-gray-500 transition-all hover:border-orange-600 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => dispatch(getAllCars())}
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-5 bg-white border-[1.5px] border-black/5 rounded-xl py-3.5 px-5 mb-4 flex-wrap sm:gap-3.5 sm:p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-black text-zinc-900 leading-none tracking-tight">{cars.length}</span>
          <span className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider">Total Cabs</span>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-black text-green-600 leading-none tracking-tight">
            {cars.filter(c => c.isAvailable).length}
          </span>
          <span className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider">Available</span>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-black text-red-600 leading-none tracking-tight">
            {cars.filter(c => !c.isAvailable).length}
          </span>
          <span className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider">Unavailable</span>
        </div>
        {query && (
          <>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-black text-orange-600 leading-none tracking-tight">{filtered.length}</span>
              <span className="text-[0.68rem] font-semibold text-gray-400 uppercase tracking-wider">Filtered</span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-[1.5px] border-red-200 rounded-lg py-3 px-4 text-sm font-semibold text-red-600 mb-4">
          ⚠ {String(error)}
        </div>
      )}

      <div className="bg-white border-[1.5px] border-black/5 rounded-xl overflow-hidden relative">
        {loading && !cars.length ? (
          <Shimmer />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-14 px-6 text-gray-400 text-center">
            <Car size={32} color="#ddd" />
            <p className="m-0 text-[0.88rem]">{query ? `No cabs matched "${query}"` : "No cabs found."}</p>
            {query && (
              <button className="mt-1.5 py-1.5 px-4 bg-zinc-900 text-white border-0 rounded-lg cursor-pointer font-sans text-xs font-bold transition-colors hover:bg-orange-600" onClick={() => setQuery("")}>Clear search</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 border-b-[1.5px] border-gray-200">
                    <th className={tableClasses.th}>Cab</th>
                    <th className={tableClasses.th}>Owner</th>
                    <th className={tableClasses.th}>Location</th>
                    <th className={tableClasses.th} style={{ textAlign: 'center' }}>Seats</th>
                    <th className={tableClasses.th}>Price</th>
                    <th className={tableClasses.th}>Status</th>
                    <th className={tableClasses.th}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {filtered.map((car, idx) => (
                  <tr
                    key={car._id || idx}
                    className={`border-b border-gray-100 transition-colors hover:bg-orange-50/50 last:border-0 ${deleting === car._id ? "opacity-45 pointer-events-none" : ""}`}
                  >
                    <td className={tableClasses.td}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                          {car.images?.[0]
                            ? <img src={car.images[0]} alt={car.make || "Cab"} className="w-full h-full object-cover" />
                            : <Car size={16} color="#ccc" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.85rem] font-bold text-zinc-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                            {[car.make, car.model].filter(Boolean).join(" ") || car.vehicleNumber || "Unnamed Cab"}
                          </p>
                          {(car.vehicleType || car.vehicleNumber) && (
                            <p className="text-[0.7rem] text-gray-400 mt-0.5 font-medium">{car.vehicleType} {car.vehicleType && car.vehicleNumber ? '•' : ''} {car.vehicleNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <p className="text-[0.84rem] font-semibold text-gray-800">{car.ownerName || car.ownerId || "—"}</p>
                      {car.ownerEmail && (
                        <p className="text-[0.71rem] text-gray-400 mt-0.5">{car.ownerEmail}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-start gap-1.5">
                        <MapPin size={11} color="#e65100" className="shrink-0 mt-[3px]" />
                        <div>
                          <p className="text-[0.84rem] font-semibold text-gray-800">{car.pickupP || "—"}</p>
                          {car.dropP && (
                            <p className="text-[0.71rem] text-gray-400 mt-0.5">to {car.dropP}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className={tableClasses.td} style={{ textAlign: 'center' }}>
                      <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-2 bg-gray-100 border border-gray-200 rounded-md text-[0.78rem] font-bold text-gray-600">
                        {car.seater ?? "—"}
                      </span>
                    </td>

                    <td className={tableClasses.td}>
                      <span className="text-[0.88rem] font-bold text-green-600">
                        {car.price ? formatCurrency(car.price) : "—"}
                      </span>
                    </td>

                    <td className={tableClasses.td}>
                      <StatusBadge car={car} />
                    </td>

                    <td className={tableClasses.td}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleView(car)} className={tableClasses.actionBtn} title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleEdit(car)} className={tableClasses.actionBtnPrimary} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(car)}
                          className={`${tableClasses.actionBtn} bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700`}
                          title="Delete"
                          disabled={deleting === car._id}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && cars.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-600 animate-pulse" />
        )}
      </div>
    </div>
  )
}