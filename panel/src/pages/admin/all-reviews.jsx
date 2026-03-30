import { useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { deleteHotelReview, getAllHotelReviews, updateHotelReview } from "../../../redux/slices/admin/hotel"
import { 
  Search, 
  RefreshCw, 
  MessageSquare, 
  Star, 
  Building2, 
  User, 
  ShieldCheck, 
  Calendar, 
  X, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react"

const formatDate = (dateStr) => {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

const StarRating = ({ rating, size = 14 }) => {
  const safeRating = Number(rating) || 0
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= safeRating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}
        />
      ))}
    </div>
  )
}

const ShimmerList = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex gap-6 p-6 border border-gray-100 rounded-3xl bg-white animate-pulse">
        <div className="w-14 h-14 bg-gray-100 rounded-full shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="flex justify-between">
            <div className="w-32 h-4 bg-gray-100 rounded-md" />
            <div className="w-24 h-4 bg-gray-100 rounded-md" />
          </div>
          <div className="w-48 h-3 bg-gray-100 rounded-md" />
          <div className="w-full h-16 bg-gray-50 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
)

const TopManageForm = ({ review, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    comment: review?.comment || "",
    rating: review?.rating || 0,
    cleanliness: review?.cleanliness || 0,
    service: review?.service || 0,
    valueForMoney: review?.valueForMoney || 0,
    location: review?.location || 0,
  })

  useEffect(() => {
    setFormData({
      comment: review?.comment || "",
      rating: review?.rating || 0,
      cleanliness: review?.cleanliness || 0,
      service: review?.service || 0,
      valueForMoney: review?.valueForMoney || 0,
      location: review?.location || 0,
    })
  }, [review])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (typeof onSave === 'function') {
      await onSave({ reviewId: review._id, reviewData: formData })
    }
    onClose()
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review? This action cannot be undone."
    )
    if (!confirmed) return
    if (typeof onDelete === 'function') {
      await onDelete(review._id)
    }
    onClose()
  }

  return (
    <div className="mb-8 p-6 bg-white border-2 border-blue-500 rounded-3xl shadow-xl shadow-blue-500/10 relative animate-in slide-in-from-top-4 fade-in duration-300 z-10">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <X size={18} />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Edit3Icon size={18} />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900">Manage Review</h2>
          <p className="text-xs font-semibold text-gray-500">
            Editing review by {review.userName} for {review.hotelName}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Overall Rating", name: "rating" },
            { label: "Cleanliness", name: "cleanliness" },
            { label: "Service", name: "service" },
            { label: "Value", name: "valueForMoney" },
            { label: "Location", name: "location" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                {field.label}
              </label>
              <input
                type="number"
                min="0"
                max="5"
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Review Comment
          </label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <CheckCircle2 size={16} /> Save Changes
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-100 active:scale-95 transition-all"
          >
            <Trash2 size={16} /> Delete Review
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

const Edit3Icon = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path>
  </svg>
)

export default function AllReviews() {
  const dispatch = useDispatch()
  const { hotelReviews, loading, error } = useSelector(state => state.hotel)
  
  const [query, setQuery] = useState("")
  const [selectedReview, setSelectedReview] = useState(null)

  useEffect(() => {
    dispatch(getAllHotelReviews())
  }, [dispatch])

  const rawReviews = hotelReviews?.reviews || []
  const pagination = hotelReviews?.pagination || {}

  const stats = useMemo(() => {
    if (!rawReviews.length) return { total: 0, avg: 0, verified: 0 }
    const total = rawReviews.length
    const avg = rawReviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / total
    const verified = rawReviews.filter(r => r.isVerifiedBooking).length
    return { total, avg: avg.toFixed(1), verified }
  }, [rawReviews])

  const filteredReviews = useMemo(() => {
    if (!query.trim()) return rawReviews
    const lowerQuery = query.toLowerCase()
    return rawReviews.filter(r => 
      (r.userName || "").toLowerCase().includes(lowerQuery) ||
      (r.hotelName || "").toLowerCase().includes(lowerQuery) ||
      (r.comment || "").toLowerCase().includes(lowerQuery)
    )
  }, [query, rawReviews])

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900 pb-16">
      
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-5 mb-8">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-0.5">Admin Panel</p>
              <h1 className="text-2xl font-black text-gray-900 leading-none">Hotel Reviews</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-[280px] bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => dispatch(getAllHotelReviews())}
              disabled={loading}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6">
        
        {selectedReview && (
          <TopManageForm 
            review={selectedReview} 
            onClose={() => setSelectedReview(null)} 
            onSave={(data) => dispatch(updateHotelReview(data))}
            onDelete={(id) => dispatch(deleteHotelReview(id))}
          />
        )}

        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 pr-8">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
              <MessageSquare size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Reviews</p>
              <p className="text-xl font-black text-gray-900 leading-none mt-1">{stats.total}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 pr-8">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-sm">
              <Star size={16} className="fill-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70">Avg Rating</p>
              <p className="text-xl font-black text-amber-600 leading-none mt-1">{stats.avg}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 pr-8">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Verified</p>
              <p className="text-xl font-black text-emerald-600 leading-none mt-1">{stats.verified}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600">
            <AlertCircle size={18} />
            {String(error?.error || error || "Failed to load reviews.")}
          </div>
        )}

        {loading && !rawReviews.length ? (
          <ShimmerList />
        ) : filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
            <MessageSquare size={40} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-black text-gray-900">No Reviews Found</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">
              {query ? `No results match "${query}"` : "There are no reviews submitted yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredReviews.map((review) => (
              <div 
                key={review._id} 
                className={`flex flex-col md:flex-row gap-6 p-6 bg-white border rounded-3xl transition-all duration-200 ${
                  selectedReview?._id === review._id 
                    ? "border-blue-400 shadow-md shadow-blue-500/10 ring-4 ring-blue-50" 
                    : "border-gray-100 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50"
                }`}
              >
                
                <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    {review.userImage && !review.userImage.includes("googleusercontent.com/profile/picture/0") ? (
                      <img src={review.userImage} alt={review.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{review.userName || "Anonymous"}</h4>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 line-clamp-1">ID: {review.userId || "-"}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2 pr-4 border border-gray-100 w-fit">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0">
                        {review.hotelImage ? (
                          <img src={review.hotelImage} alt={review.hotelName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Building2 size={14} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{review.hotelName || "Unknown Hotel"}</p>
                        <p className="text-[10px] font-semibold text-gray-500 truncate">ID: {review.hotelId || "-"}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedReview(review)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                      className="shrink-0 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors active:scale-95"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                      <span className="text-xs font-black text-amber-600">{Number(review.rating || 0).toFixed(1)}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.isVerifiedBooking && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg">
                        <ShieldCheck size={14} /> Verified Booking
                      </span>
                    )}
                  </div>

                  {review.comment ? (
                    <p className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl">
                      "{review.comment}"
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-gray-400 italic bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200">
                      No text comment provided.
                    </p>
                  )}
                  
                  {(review.cleanliness || review.service || review.valueForMoney || review.location) ? (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      {[
                        { label: "Clean", val: review.cleanliness },
                        { label: "Service", val: review.service },
                        { label: "Value", val: review.valueForMoney },
                        { label: "Loc", val: review.location }
                      ].map(metric => metric.val > 0 && (
                        <div key={metric.label} className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-md">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{metric.label}:</span>
                          <span className="text-xs font-black text-gray-700">{metric.val}/5</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}