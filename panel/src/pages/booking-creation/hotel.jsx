import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Building2, MapPin, RefreshCw, UserRound, Star, Tag, Search, X, ChevronDown,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../../components/breadcrumb'
import MasterFilter from '../../components/master-filter'
import { getAllHotels, getHotelsByFilters } from '../../../redux/slices/admin/hotel'
import { getSelectedGuest, saveSelectedHotel } from '../../utils/booking-storage'
import { formatCurrency } from '../../utils/format'
import { selectAuth } from '../../../redux/slices/authSlice'

// ─── BUG FIX ─────────────────────────────────────────────────────────────────
// API response: { success: true, data: [...] }
// Redux slice may store full response OR just the array.
// Original code: hotels.map(normalizeHotel) — if hotels = { data: [] } → crash!
function safeHotelArray(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw           // already array ✓
  if (Array.isArray(raw.data)) return raw.data // { data: [...] } ← actual API shape
  if (Array.isArray(raw.hotels)) return raw.hotels
  return []
}

// ─── Normalize amenities ──────────────────────────────────────────────────────
// BUG FIX: API sends amenities as [{ hotelId, amenities: [] }] OR flat string[]
// Original normalizeAmenityList handled arrays but missed the nested hotelId shape
const normalizeAmenityList = (amenities) => {
  if (!amenities) return []
  if (Array.isArray(amenities)) {
    return amenities
      .flatMap((item) => {
        if (typeof item === 'string' || typeof item === 'number') return [String(item)]
        if (Array.isArray(item)) return item.map(String).filter(Boolean)
        if (typeof item === 'object' && item !== null) {
          // ← BUG FIX: { hotelId, amenities: [] } shape from actual API
          if (Array.isArray(item.amenities)) return normalizeAmenityList(item.amenities)
          if (typeof item.name === 'string') return [item.name]
          if (typeof item.amenity === 'string') return [item.amenity]
          if (typeof item.label === 'string') return [item.label]
          return Object.values(item).filter(v => typeof v === 'string')
        }
        return []
      })
      .filter(Boolean)
  }
  if (typeof amenities === 'object') {
    if (Array.isArray(amenities.amenities)) return normalizeAmenityList(amenities.amenities)
    if (Array.isArray(amenities.list)) return normalizeAmenityList(amenities.list)
  }
  return []
}

// ─── Normalize hotel ──────────────────────────────────────────────────────────
// BUG FIX: pricing.startingFrom was checked but API has pricing.startingFrom directly
const normalizeHotel = (hotel) => {
  // Debug logging for hotel ID 48291034
  if (hotel?.hotelId === '48291034' || hotel?._id === '48291034') {
    console.log('🔍 DEBUG - Hotel 48291034 Pricing Data:', {
      hotelId: hotel?.hotelId,
      _id: hotel?._id,
      pricing: hotel?.pricing,
      rooms: hotel?.rooms?.[0],
      startingPrice: hotel?.startingPrice,
      basePrice: hotel?.basePrice,
      fullHotel: hotel
    })
  }
  
  // Enhanced pricing logic for hotel ID 48291034 and others
  const startingPrice =
    hotel?.pricing?.startingFrom ||
    hotel?.pricing?.startingFromWithGST ||
    hotel?.pricing?.lowestBasePrice ||
    hotel?.pricing?.basePrice ||
    hotel?.pricing?.startingPrice ||
    (Array.isArray(hotel?.rooms) && hotel.rooms[0]?.finalPrice) ||
    (Array.isArray(hotel?.rooms) && hotel.rooms[0]?.price) ||
    (Array.isArray(hotel?.rooms) && hotel.rooms[0]?.pricing?.basePrice) ||
    (Array.isArray(hotel?.rooms) && hotel.rooms[0]?.pricing?.startingFrom) ||
    hotel?.startingPrice ||
    hotel?.basePrice ||
    0

  // Log if starting price is zero for debugging
  if ((hotel?.hotelId === '48291034' || hotel?._id === '48291034') && startingPrice === 0) {
    console.warn('⚠️ Hotel 48291034 has zero starting price - showing "Price on request"')
  }

  // For zero-priced hotels, set a minimal price to prevent filtering issues
  const displayPrice = startingPrice > 0 ? startingPrice : 1

  return {
    id: hotel?._id || hotel?.hotelId || hotel?.id || '',
    hotelId: hotel?.hotelId || hotel?._id || 'N/A',
    hotelName: hotel?.hotelName || hotel?.name || 'Unnamed Hotel',
    city: hotel?.city || hotel?.hotelCity || hotel?.destination || 'Unknown',
    state: hotel?.state || '',
    address: hotel?.address || hotel?.hotelAddress || hotel?.landmark || '',
    email: hotel?.hotelEmail || hotel?.email || '',
    image: Array.isArray(hotel?.images) ? hotel.images[0] : hotel?.image || '',
    starRating: Number(hotel?.starRating || 0),
    rating: Number(hotel?.rating || 0),
    reviewCount: Number(hotel?.reviewCount || 0),
    category: hotel?.hotelCategory || hotel?.category || '',
    propertyType: Array.isArray(hotel?.propertyType)
      ? hotel.propertyType.join(', ')
      : hotel?.propertyType || '',
    startingPrice: Number(startingPrice), // Keep original for UI display
    displayPrice: Number(displayPrice), // Use for filtering
    startingPriceWithGst: Number(hotel?.pricing?.startingFromWithGST || 0),
    gstNote: hotel?.pricing?.gstNote || '',
    amenities: normalizeAmenityList(hotel?.amenities),
    isOffer: Array.isArray(hotel?.rooms) && hotel.rooms.some(r => r.isOffer),
    offerName: Array.isArray(hotel?.rooms)
      ? hotel.rooms.find(r => r.isOffer)?.offerName || ''
      : '',
    isAccepted: Boolean(hotel?.isAccepted),
    onFront: Boolean(hotel?.onFront),
    raw: hotel,
  }
}

const createEmptyFilters = () => ({
  search: '', city: '', state: '', hotelCategory: '', propertyType: '',
  starRating: '', minRating: '', maxRating: '', hasOffer: '',
  onlyAvailable: '', minPrice: '', maxPrice: '', sortBy: '', sortOrder: '',
})

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ count, total = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          size={10}
          style={{
            fill: i < count ? '#f59e0b' : 'none',
            color: i < count ? '#f59e0b' : '#d1d5db',
          }}
        />
      ))}
    </div>
  )
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────
function HotelCard({ hotel, isSelected, disabled, onSelect }) {
  return (
    <article className={`bch-card${isSelected ? ' bch-card-selected' : ''}`}>
      {/* Image */}
      <div className="bch-img-wrap">
        {hotel.image
          ? <img src={hotel.image} alt={hotel.hotelName} className="bch-img" onError={e => { e.target.style.display = 'none' }} />
          : <div className="bch-img-fallback"><Building2 size={24} color="#ccc" /></div>
        }
        <div className="bch-img-overlay" />

        {/* Badges */}
        <div className="bch-badges">
          {hotel.isOffer && (
            <span className="bch-badge bch-badge-red">
              <Tag size={8} /> {hotel.offerName || 'Offer'}
            </span>
          )}
          {hotel.category && (
            <span className="bch-badge bch-badge-glass">{hotel.category}</span>
          )}
          {hotel.isAccepted && (
            <span className="bch-badge bch-badge-green">✓ Verified</span>
          )}
        </div>

        {/* Star rating top-right */}
        {hotel.starRating > 0 && (
          <div className="bch-star-pill">
            <Star size={10} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
            <span>{hotel.starRating}</span>
          </div>
        )}

        {/* Name overlay at bottom */}
        <div className="bch-name-overlay">
          <p className="bch-hotel-id">{hotel.hotelId}</p>
          <h3 className="bch-hotel-name">{hotel.hotelName}</h3>
          <div className="bch-hotel-meta">
            <Stars count={hotel.starRating} />
            {hotel.city && (
              <span className="bch-hotel-city">
                <MapPin size={9} /> {[hotel.city, hotel.state].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bch-body">
        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="bch-amenities">
            {hotel.amenities.slice(0, 4).map((a, i) => (
              <span key={i} className="bch-amenity">{a}</span>
            ))}
            {hotel.amenities.length > 4 && (
              <span className="bch-amenity bch-amenity-more">+{hotel.amenities.length - 4}</span>
            )}
          </div>
        )}

        {/* Address */}
        {hotel.address && (
          <p className="bch-address">
            <MapPin size={10} color="#e65100" style={{ flexShrink: 0 }} />
            {hotel.address}
          </p>
        )}

        {/* Rating */}
        {(hotel.rating > 0 || hotel.reviewCount > 0) && (
          <div className="bch-rating">
            <span className="bch-rating-val">★ {hotel.rating.toFixed(1)}</span>
            <span className="bch-rating-count">({hotel.reviewCount} reviews)</span>
          </div>
        )}

        {/* Footer: price + CTA */}
        <div className="bch-footer">
          <div className="bch-price-wrap">
            {hotel.startingPrice > 0 ? (
              <>
                <span className="bch-price-label">From</span>
                <span className="bch-price">{formatCurrency(hotel.startingPrice)}</span>
                <span className="bch-price-night">/night</span>
                {hotel.startingPriceWithGst > 0 && (
                  <span className="bch-price-gst">
                    {formatCurrency(hotel.startingPriceWithGst)} incl. GST
                  </span>
                )}
              </>
            ) : (
              <span className="bch-price-on-request">Price on request</span>
            )}
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(hotel)}
            className={`bch-book-btn${isSelected ? ' bch-book-btn-selected' : ''}`}
          >
            {isSelected ? '✓ Selected' : 'Book'}
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Shimmer ─────────────────────────────────────────────────────────────────
function CardShimmer() {
  return (
    <div className="bch-card">
      <div className="bch-shimmer" style={{ height: 144 }} />
      <div className="bch-body">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[60, 80, 50].map((w, i) => <div key={i} className="bch-shimmer" style={{ width: w, height: 20, borderRadius: 999 }} />)}
        </div>
        <div className="bch-shimmer" style={{ height: 12, borderRadius: 4, marginBottom: 8 }} />
        <div className="bch-shimmer" style={{ height: 10, borderRadius: 4, width: '70%', marginBottom: 16 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="bch-shimmer" style={{ height: 20, width: 80, borderRadius: 4 }} />
          <div className="bch-shimmer" style={{ height: 34, width: 64, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BookingCreationHotels() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(selectAuth)
  const hotelState = useSelector(s => s.hotel)
  const { loading, error } = hotelState
  const rawHotels = hotelState.hotels ?? hotelState.data ?? hotelState
  const hotelsRaw = safeHotelArray(rawHotels)

  const [selectedHotelId, setSelectedHotelId] = useState('')
  const [selectedGuest] = useState(() => getSelectedGuest())
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [offerOnly, setOfferOnly] = useState(false)
  const [draftFilters, setDraftFilters] = useState(createEmptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(createEmptyFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (user?.email) {
      dispatch(getHotelsByFilters({ isAccepted: true }))
    } else {
      dispatch(getAllHotels())
    }
  }, [dispatch, user?.email])

  // Normalize once
  const hotels = useMemo(() => hotelsRaw.map(normalizeHotel), [hotelsRaw])

  // Derived filter options
  const cityOptions = useMemo(() =>
    [...new Set(hotels.map(h => h.city).filter(Boolean))].sort(), [hotels])
  const categoryOptions = useMemo(() =>
    [...new Set(hotels.map(h => h.category).filter(Boolean))].sort(), [hotels])

  // Quick filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return hotels.filter(h => {
      if (q && ![h.hotelName, h.hotelId, h.city, h.state, h.email, h.address, h.category]
        .some(v => v?.toLowerCase().includes(q))) return false
      if (cityFilter && h.city !== cityFilter) return false
      if (categoryFilter && h.category !== categoryFilter) return false
      if (offerOnly && !h.isOffer) return false

      // Advanced filters
      const af = appliedFilters
      if (af.minPrice && h.displayPrice < Number(af.minPrice)) return false
      if (af.maxPrice && h.displayPrice > Number(af.maxPrice)) return false
      if (af.starRating && h.starRating !== Number(af.starRating)) return false
      if (af.minRating && h.rating < Number(af.minRating)) return false
      if (af.hasOffer === 'true' && !h.isOffer) return false
      if (af.hasOffer === 'false' && h.isOffer) return false

      // Sort handled separately
      return true
    })
  }, [hotels, search, cityFilter, categoryFilter, offerOnly, appliedFilters])

  const sorted = useMemo(() => {
    const af = appliedFilters
    if (!af.sortBy) return filtered
    const list = [...filtered]
    list.sort((a, b) => {
      const getVal = h => {
        if (af.sortBy === 'price') return h.displayPrice
        if (af.sortBy === 'rating') return h.rating
        if (af.sortBy === 'reviewCount') return h.reviewCount
        return String(h[af.sortBy] || h.raw?.[af.sortBy] || '')
      }
      const av = getVal(a), bv = getVal(b)
      if (typeof av === 'number') return af.sortOrder === 'desc' ? bv - av : av - bv
      return af.sortOrder === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
    })
    return list
  }, [filtered, appliedFilters])

  const guestDisplayName = useMemo(() => {
    if (!selectedGuest) return null
    return selectedGuest.userName || selectedGuest.mobile || 'Guest selected'
  }, [selectedGuest])

  const handleSelect = (hotel) => {
    saveSelectedHotel(hotel)
    setSelectedHotelId(hotel.id || hotel.hotelId)
    navigate('/booking-creation/book-hotel')
  }

  const clearFilters = () => {
    setSearch(''); setCityFilter(''); setCategoryFilter(''); setOfferOnly(false)
    setDraftFilters(createEmptyFilters()); setAppliedFilters(createEmptyFilters())
  }

  const hasActiveFilters = search || cityFilter || categoryFilter || offerOnly ||
    Object.values(appliedFilters).some(v => v)

  // Advanced filter fields for MasterFilter
  const filterFields = useMemo(() => [
    { key: 'starRating', label: 'Star Rating', type: 'select', options: [1,2,3,4,5].map(n => ({ value: String(n), label: `${n} Star${n>1?'s':''}` })), emptyOptionLabel: 'Any' },
    { key: 'minRating', label: 'Min Rating', type: 'number', placeholder: 'e.g. 4' },
    { key: 'maxRating', label: 'Max Rating', type: 'number', placeholder: 'e.g. 5' },
    { key: 'minPrice', label: 'Min Price (₹)', type: 'number', placeholder: 'e.g. 1000' },
    { key: 'maxPrice', label: 'Max Price (₹)', type: 'number', placeholder: 'e.g. 10000' },
    { key: 'hasOffer', label: 'Has Offer', type: 'select', options: [{value:'true',label:'Yes'},{value:'false',label:'No'}], emptyOptionLabel: 'Any' },
    { key: 'sortBy', label: 'Sort By', type: 'select', options: ['hotelName','city','rating','price','reviewCount'].map(v=>({value:v,label:v})), emptyOptionLabel: 'Default' },
    { key: 'sortOrder', label: 'Sort Order', type: 'select', options: [{value:'asc',label:'Ascending'},{value:'desc',label:'Descending'}], emptyOptionLabel: 'Default' },
  ], [])

  return (
    <>
      <style>{CSS}</style>

      <div className="bch-page">
        <Breadcrumb />

        {/* ── Header ── */}
        <div className="bch-header">
          <div>
            <span className="bch-eyebrow">🏨 Booking Creation</span>
            <h1 className="bch-heading">Choose Hotel</h1>
            <p className="bch-sub">
              {hotels.length > 0
                ? `${sorted.length} of ${hotels.length} hotels`
                : loading ? 'Loading…' : 'No hotels found'}
            </p>
          </div>

          <div className="bch-header-right">
            {/* Guest pill */}
            {selectedGuest ? (
              <div className="bch-guest-pill">
                <div className="bch-guest-avatar"><UserRound size={12} /></div>
                <span className="bch-guest-name">{guestDisplayName}</span>
                <button type="button" onClick={() => navigate('/booking-creation')} className="bch-guest-change">
                  Change
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => navigate('/booking-creation')} className="bch-guest-add">
                + Select Guest
              </button>
            )}

            {/* Refresh */}
            <button
              type="button"
              onClick={() => dispatch(getAllHotels())}
              className="bch-refresh-btn"
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'bch-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Search + Quick Filters ── */}
        <div className="bch-filter-card">
          <div className="bch-filter-row">
            {/* Search */}
            <div className="bch-search-wrap">
              <Search size={14} className="bch-search-icon" />
              <input
                className="bch-search"
                placeholder="Search hotel name, city, ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="bch-search-clear" onClick={() => setSearch('')}><X size={12} /></button>
              )}
            </div>

            {/* City */}
            <div className="bch-select-wrap">
              <select className="bch-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                <option value="">All Cities</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="bch-select-icon" />
            </div>

            {/* Category */}
            <div className="bch-select-wrap">
              <select className="bch-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="bch-select-icon" />
            </div>

            {/* Offer toggle */}
            <button
              type="button"
              className={`bch-pill-btn${offerOnly ? ' bch-pill-active' : ''}`}
              onClick={() => setOfferOnly(o => !o)}
            >
              🏷 Offers only
            </button>

            {/* Advanced toggle */}
            <button
              type="button"
              className={`bch-pill-btn${showAdvanced ? ' bch-pill-active' : ''}`}
              onClick={() => setShowAdvanced(o => !o)}
            >
              ⚙ Advanced
            </button>

            {hasActiveFilters && (
              <button type="button" className="bch-clear-btn" onClick={clearFilters}>
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          {/* Advanced panel */}
          {showAdvanced && (
            <div className="bch-advanced">
              <MasterFilter
                fields={filterFields}
                values={draftFilters}
                loading={loading}
                enableFieldPicker
                initialActiveFieldKeys={['starRating', 'minPrice', 'maxPrice', 'hasOffer', 'sortBy']}
                applyLabel="Apply Filters"
                onChange={(k, v) => setDraftFilters(p => ({ ...p, [k]: v }))}
                onApply={() => setAppliedFilters(draftFilters)}
                onReset={() => { setDraftFilters(createEmptyFilters()); setAppliedFilters(createEmptyFilters()) }}
              />
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bch-error">⚠ {String(error)}</div>
        )}

        {/* ── Guest missing warning ── */}
        {!selectedGuest && (
          <div className="bch-warn">
            ⚠ Koi guest select nahi hai. Booking ke liye pehle guest select karein.
            <button type="button" onClick={() => navigate('/booking-creation')} className="bch-warn-btn">
              Select Guest →
            </button>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="bch-grid">
          {loading && sorted.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <CardShimmer key={i} />)
            : sorted.length === 0
            ? (
              <div className="bch-empty">
                <Building2 size={36} color="#ddd" />
                <p className="bch-empty-title">No hotels match this filter</p>
                <p className="bch-empty-sub">Search ya filter change karein</p>
                {hasActiveFilters && (
                  <button type="button" className="bch-empty-clear" onClick={clearFilters}>Clear filters</button>
                )}
              </div>
            )
            : sorted.map(hotel => (
              <HotelCard
                key={hotel.id || hotel.hotelId}
                hotel={hotel}
                isSelected={selectedHotelId === (hotel.id || hotel.hotelId)}
                disabled={!selectedGuest}
                onSelect={handleSelect}
              />
            ))
          }
        </div>
      </div>
    </>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .bch-page {
    min-height: 100vh;
    background: #ffffff;
    font-family: 'Inter', sans-serif;
    padding: 24px 24px 60px;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* ── Header ── */
  .bch-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; margin: 16px 0 20px; flex-wrap: wrap;
  }
  .bch-eyebrow {
    display: block; font-size: .68rem; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    color: #e65100; margin-bottom: 4px;
  }
  .bch-heading {
    font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800;
    letter-spacing: -.03em; color: #1a1a1a; margin: 0 0 4px;
  }
  .bch-sub { font-size: .8rem; color: #999; margin: 0; }

  .bch-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  /* Guest pill */
  .bch-guest-pill {
    display: flex; align-items: center; gap: 8px;
    background: #ffffff; border: 1.5px solid #ffffff;
    border-radius: 999px; padding: 6px 12px 6px 6px;
  }
  .bch-guest-avatar {
    width: 26px; height: 26px; background: #1a1a1a; border-radius: 999px;
    display: flex; align-items: center; justify-content: center; color: #fff;
    flex-shrink: 0;
  }
  .bch-guest-name { font-size: .8rem; font-weight: 600; color: #1a1a1a; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bch-guest-change { font-size: .72rem; font-weight: 700; color: #e65100; background: none; border: none; cursor: pointer; padding: 0; }
  .bch-guest-change:hover { text-decoration: underline; }
  .bch-guest-add {
    padding: 8px 16px; border: 1.5px solid #e65100; background: #fff5eb;
    color: #e65100; border-radius: 999px; font-size: .8rem; font-weight: 700;
    cursor: pointer; transition: all .18s;
  }
  .bch-guest-add:hover { background: #e65100; color: #fff; }

  .bch-refresh-btn {
    width: 38px; height: 38px; background: #fff; border: 1.5px solid #e8e4df;
    border-radius: 10px; cursor: pointer; display: flex; align-items: center;
    justify-content: center; color: #888; transition: all .18s;
  }
  .bch-refresh-btn:hover:not(:disabled) { border-color: #e65100; color: #e65100; }
  .bch-refresh-btn:disabled { opacity: .5; cursor: not-allowed; }
  .bch-spin { animation: bch-rotate .8s linear infinite; }
  @keyframes bch-rotate { to { transform: rotate(360deg); } }

  /* ── Filter card ── */
  .bch-filter-card {
    background: #fff; border: 1.5px solid rgba(0,0,0,.07);
    border-radius: 14px; padding: 16px; margin-bottom: 20px;
  }
  .bch-filter-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  .bch-search-wrap { position: relative; flex: 1; min-width: 220px; }
  .bch-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #bbb; pointer-events: none; }
  .bch-search {
    width: 100%; padding: 9px 32px 9px 34px; background: #faf9f7;
    border: 1.5px solid #e8e4df; border-radius: 10px;
    font-family: 'Inter', sans-serif; font-size: .84rem; color: #1a1a1a;
    outline: none; box-sizing: border-box; transition: border-color .2s;
  }
  .bch-search::placeholder { color: #bbb; }
  .bch-search:focus { border-color: #e65100; background: #fff; box-shadow: 0 0 0 3px rgba(230,81,0,.08); }
  .bch-search-clear {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: #f5f3f0; border: none; border-radius: 999px;
    width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #999;
  }

  .bch-select-wrap { position: relative; }
  .bch-select {
    padding: 9px 30px 9px 12px; background: #faf9f7;
    border: 1.5px solid #e8e4df; border-radius: 10px;
    font-family: 'Inter', sans-serif; font-size: .82rem; color: #555;
    appearance: none; outline: none; cursor: pointer; transition: border-color .2s;
  }
  .bch-select:focus { border-color: #e65100; }
  .bch-select-icon { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); color: #bbb; pointer-events: none; }

  .bch-pill-btn {
    padding: 9px 14px; background: #faf9f7; border: 1.5px solid #e8e4df;
    border-radius: 10px; font-family: 'Inter', sans-serif; font-size: .8rem;
    font-weight: 600; color: #666; cursor: pointer; white-space: nowrap; transition: all .18s;
  }
  .bch-pill-btn:hover { border-color: #e65100; color: #e65100; background: #fff5eb; }
  .bch-pill-active { background: #1a1a1a !important; color: #fff !important; border-color: #1a1a1a !important; }

  .bch-clear-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 9px 13px; background: #fff1f2; border: 1.5px solid #fecdd3;
    border-radius: 10px; font-size: .78rem; font-weight: 700; color: #e11d48;
    cursor: pointer; white-space: nowrap; transition: all .18s;
  }
  .bch-clear-btn:hover { background: #ffe4e6; }

  .bch-advanced { margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0ede8; }

  /* ── Error / Warn ── */
  .bch-error {
    background: #fef2f2; border: 1.5px solid #fecaca;
    border-radius: 10px; padding: 12px 16px;
    font-size: .84rem; font-weight: 600; color: #dc2626; margin-bottom: 16px;
  }
  .bch-warn {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: #fffbeb; border: 1.5px solid #fde68a;
    border-radius: 10px; padding: 12px 16px;
    font-size: .82rem; font-weight: 600; color: #92400e; margin-bottom: 16px;
  }
  .bch-warn-btn {
    padding: 6px 14px; background: #f59e0b; color: #fff; border: none;
    border-radius: 8px; font-size: .78rem; font-weight: 700; cursor: pointer;
    transition: background .18s; white-space: nowrap;
  }
  .bch-warn-btn:hover { background: #d97706; }

  /* ── Grid ── */
  .bch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 18px;
  }

  /* ── Card ── */
  .bch-card {
    background: #fff; border: 1.5px solid rgba(0,0,0,.07);
    border-radius: 16px; overflow: hidden;
    display: flex; flex-direction: column;
    transition: transform .18s, box-shadow .18s, border-color .18s;
    box-shadow: 0 2px 10px rgba(0,0,0,.05);
  }
  .bch-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.1); }
  .bch-card-selected { border-color: #e65100 !important; box-shadow: 0 0 0 3px rgba(230,81,0,.15), 0 8px 28px rgba(0,0,0,.1) !important; }

  /* Image */
  .bch-img-wrap { position: relative; height: 148px; background: linear-gradient(135deg,#f0ede8,#e8e4df); overflow: hidden; flex-shrink: 0; }
  .bch-img { width: 100%; height: 100%; object-fit: cover; }
  .bch-img-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .bch-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.7) 0%, rgba(0,0,0,.15) 50%, transparent 100%); }

  .bch-badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; flex-wrap: wrap; z-index: 2; }
  .bch-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; font-size: .62rem; font-weight: 700; }
  .bch-badge-red { background: #ef4444; color: #fff; }
  .bch-badge-glass { background: rgba(255,255,255,.2); color: #fff; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,.3); }
  .bch-badge-green { background: #22c55e; color: #fff; }

  .bch-star-pill {
    position: absolute; top: 10px; right: 10px; z-index: 2;
    display: flex; align-items: center; gap: 4px;
    background: rgba(0,0,0,.45); backdrop-filter: blur(4px);
    border-radius: 999px; padding: 3px 8px;
    font-size: .72rem; font-weight: 700; color: #fff;
  }

  .bch-name-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 12px; z-index: 2; }
  .bch-hotel-id { font-size: .6rem; font-weight: 700; letter-spacing: .1em; color: rgba(255,255,255,.55); margin: 0 0 2px; }
  .bch-hotel-name { font-size: .95rem; font-weight: 700; color: #fff; margin: 0 0 4px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
  .bch-hotel-meta { display: flex; align-items: center; gap: 10px; }
  .bch-hotel-city { display: flex; align-items: center; gap: 3px; font-size: .7rem; color: rgba(255,255,255,.75); }

  /* Body */
  .bch-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }

  .bch-amenities { display: flex; flex-wrap: wrap; gap: 5px; }
  .bch-amenity { font-size: .65rem; font-weight: 600; background: #f5f3f0; color: #666; padding: 3px 8px; border-radius: 999px; }
  .bch-amenity-more { color: #aaa; }

  .bch-address { display: flex; align-items: flex-start; gap: 4px; font-size: .75rem; color: #999; margin: 0; line-height: 1.4; }

  .bch-rating { display: flex; align-items: center; gap: 6px; }
  .bch-rating-val { font-size: .8rem; font-weight: 700; color: #f59e0b; }
  .bch-rating-count { font-size: .72rem; color: #bbb; }

  /* Footer */
  .bch-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: auto; padding-top: 10px; border-top: 1px solid #f5f3f0; }
  .bch-price-wrap { display: flex; flex-direction: column; }
  .bch-price-label { font-size: .6rem; font-weight: 600; color: #bbb; text-transform: uppercase; letter-spacing: .06em; }
  .bch-price { font-size: 1.05rem; font-weight: 800; color: #1a1a1a; line-height: 1.1; }
  .bch-price-night { font-size: .68rem; color: #bbb; }
  .bch-price-gst { font-size: .65rem; color: #aaa; }
  .bch-price-on-request { font-size: .78rem; color: #bbb; font-weight: 500; }

  .bch-book-btn {
    padding: 9px 18px; border: none; border-radius: 10px;
    font-family: 'Inter', sans-serif; font-size: .8rem; font-weight: 700;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    background: #1a1a1a; color: #fff;
    transition: background .18s, transform .15s;
  }
  .bch-book-btn:hover:not(:disabled) { background: #e65100; transform: translateY(-1px); }
  .bch-book-btn:disabled { opacity: .5; cursor: not-allowed; }
  .bch-book-btn-selected { background: #16a34a !important; }
  .bch-book-btn-selected:hover:not(:disabled) { background: #15803d !important; }

  /* ── Shimmer ── */
  .bch-shimmer {
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: bch-wave 1.4s ease-in-out infinite;
    border-radius: 6px;
  }
  @keyframes bch-wave { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── Empty ── */
  .bch-empty {
    grid-column: 1 / -1;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    background: #fff; border: 1.5px dashed #e8e4df;
    border-radius: 16px; padding: 60px 24px; text-align: center;
  }
  .bch-empty-title { font-size: 1rem; font-weight: 700; color: #333; margin: 0; }
  .bch-empty-sub { font-size: .82rem; color: #bbb; margin: 0; }
  .bch-empty-clear {
    margin-top: 8px; padding: 8px 20px; background: #1a1a1a; color: #fff;
    border: none; border-radius: 8px; font-size: .8rem; font-weight: 700;
    cursor: pointer; transition: background .18s;
  }
  .bch-empty-clear:hover { background: #e65100; }

  /* Responsive */
  @media (max-width: 640px) {
    .bch-page { padding: 16px 14px 48px; }
    .bch-grid { grid-template-columns: 1fr; }
    .bch-filter-row { flex-direction: column; align-items: stretch; }
    .bch-search-wrap { min-width: unset; }
  }
`