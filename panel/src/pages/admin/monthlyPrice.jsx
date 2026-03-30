import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BadgeDollarSign,
  CalendarDays,
  Edit3,
  Hash,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  BedDouble,
  Building2,
  Search,
  MapPin,
  Hotel,
} from 'lucide-react';
import MasterFilter from '../../components/master-filter';
import {
  setMonthlyPrice,
  getMonthlyPricesByHotel,
  updateMonthlyPrice,
  deleteMonthlyPrice,
  deleteAllMonthlyPricesByHotel,
  clearMonthlyError,
  clearMonthlySuccess,
} from '../../../redux/slices/admin/monthly';
import { getAllHotels } from '../../../redux/slices/admin/hotel';

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const today = () => new Date().toISOString().split('T')[0];
const nextMonthEnd = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.toISOString().split('T')[0];
};

const normalizeHotel = (hotel) => {
  const startingPrice =
    hotel?.pricing?.startingFrom ||
    hotel?.pricing?.lowestBasePrice ||
    hotel?.pricingOverview?.lowestBasePrice ||
    (Array.isArray(hotel?.rooms) && (hotel.rooms[0]?.price || hotel.rooms[0]?.pricing?.basePrice)) ||
    0;

  return {
    id: hotel?._id || hotel?.hotelId || hotel?.id || '',
    hotelId: hotel?.hotelId || hotel?._id || hotel?.id || hotel?.basicInfo?.hotelId || 'N/A',
    hotelName: hotel?.hotelName || hotel?.name || hotel?.basicInfo?.name || 'Unnamed Hotel',
    city: hotel?.city || hotel?.hotelCity || hotel?.destination || hotel?.basicInfo?.location?.city || 'Unknown',
    state: hotel?.state || hotel?.basicInfo?.location?.state || '',
    address: hotel?.address || hotel?.hotelAddress || hotel?.location || hotel?.basicInfo?.location?.address || '',
    email: hotel?.hotelEmail || hotel?.email || hotel?.basicInfo?.contacts?.email || '',
    starRating: Number(hotel?.starRating || hotel?.basicInfo?.starRating || 0),
    category: hotel?.hotelCategory || hotel?.category || hotel?.basicInfo?.category || '',
    propertyType: Array.isArray(hotel?.propertyType) ? hotel.propertyType.join(', ') : hotel?.propertyType || '',
    startingPrice: Number(startingPrice),
    totalRooms: Array.isArray(hotel?.rooms) ? hotel.rooms.length : Number(hotel?.countRooms || 0),
    rooms: (hotel?.rooms || hotel?.roomDetails || hotel?.roomTypes || hotel?.roomsDetails || []).map((room, index) => ({
      roomId: room?._id || room?.id || room?.roomId || `room-${index + 1}`,
      roomName: room?.type || room?.name || `Room ${index + 1}`,
      bedType: room?.bedTypes || room?.bedType || room?.beds || '',
    })),
    raw: hotel,
  };
};

const createEmptyFilters = () => ({
  search: '', hotelId: '', hotelName: '', hotelOwnerName: '', hotelEmail: '', destination: '', city: '', state: '', landmark: '', pinCode: '', hotelCategory: '', propertyType: '', localId: '', onFront: '', isAccepted: '', starRating: '', minStarRating: '', maxStarRating: '', rating: '', minRating: '', maxRating: '', minReviewCount: '', maxReviewCount: '', latitude: '', longitude: '', roomId: '', type: '', roomType: '', bedTypes: '', amenities: '', unmarriedCouplesAllowed: '', contact: '', generalManagerContact: '', salesManagerContact: '', customerWelcomeNote: '', hasOffer: '', roomSoldOut: '', onlyAvailable: '', countRooms: '', requestedRooms: '', guests: '', minPrice: '', maxPrice: '', minRoomPrice: '', maxRoomPrice: '', checkInDate: '', checkOutDate: '', sortBy: '', sortOrder: '', page: '', limit: '',
});

const Skeleton = () => (
  <tr className="animate-pulse border-b border-gray-100 bg-white">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="px-6 py-5">
        <div className={`h-4 rounded-md bg-gray-100 ${i === 2 ? 'w-2/3' : 'w-full'}`} />
      </td>
    ))}
  </tr>
);

function PriceModal({ mode, entry, hotelId, rooms = [], onClose, onSave, saving }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    roomId: entry?.roomId || rooms[0]?.roomId || '',
    startDate: entry?.startDate ? entry.startDate.split('T')[0] : today(),
    endDate: entry?.endDate ? entry.endDate.split('T')[0] : nextMonthEnd(),
    monthPrice: entry?.monthPrice || '',
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (isEdit) return;
    if (!rooms.length) return;
    setForm((prev) => ({ ...prev, roomId: prev.roomId || rooms[0].roomId }));
  }, [isEdit, rooms]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...(isEdit ? {} : { roomId: form.roomId }),
      startDate: form.startDate,
      endDate: form.endDate,
      monthPrice: Number(form.monthPrice),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl shadow-gray-900/20 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-5">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{isEdit ? 'Edit Entry' : 'New Entry'}</p>
            <h2 className="text-lg font-black text-gray-900">{isEdit ? 'Update Monthly Price' : 'Set Monthly Price'}</h2>
            <span className="text-xs font-semibold text-gray-400">Hotel: {hotelId}</span>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {!isEdit && (
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Room</label>
              <div className="relative">
                <BedDouble size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  required
                  value={form.roomId}
                  onChange={set('roomId')}
                  disabled={!rooms.length}
                  className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-10 text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  <option value="">{rooms.length ? 'Select room' : 'No rooms found for this hotel'}</option>
                  {rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.roomName}{room.bedType ? ` - ${room.bedType}` : ''} ({room.roomId})
                    </option>
                  ))}
                </select>
                <Search size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Start Date</label>
              <input required type="date" value={form.startDate} onChange={set('startDate')} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">End Date</label>
              <input required type="date" value={form.endDate} min={form.startDate} onChange={set('endDate')} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400">Monthly Price (INR)</label>
            <div className="relative">
              <BadgeDollarSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required type="number" min="0" value={form.monthPrice} onChange={set('monthPrice')} placeholder="e.g. 25000" className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:text-gray-400" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={16} /> {isEdit ? 'Update Price' : 'Set Price'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function DeleteAllConfirm({ hotelId, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl shadow-gray-900/20 animate-in zoom-in-95 duration-200">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50"><Trash2 size={28} className="text-red-500" /></div>
        <h2 className="text-xl font-black text-gray-900">Delete All Prices?</h2>
        <p className="mb-8 mt-2 text-sm font-medium text-gray-500">All monthly price entries for hotel <span className="font-bold text-gray-800">{hotelId}</span> will be permanently deleted.</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none">{loading ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : <><Trash2 size={16} /> Yes, Delete All</>}</button>
          <button onClick={onClose} disabled={loading} className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function MonthlyPrice() {
  const dispatch = useDispatch();
  const { prices, loading, saving, error, success } = useSelector((s) => s.monthly);
  const { allHotels, loading: hotelsLoading, error: hotelError } = useSelector((s) => s.hotel);

  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [filterValues, setFilterValues] = useState(createEmptyFilters);
  const [addModal, setAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  useEffect(() => {
    if (!allHotels?.length) dispatch(getAllHotels());
  }, [allHotels?.length, dispatch]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => dispatch(clearMonthlySuccess()), 3000);
    return () => clearTimeout(t);
  }, [success, dispatch]);

  const normalizedHotels = useMemo(() => (allHotels || []).map(normalizeHotel), [allHotels]);
  const cityOptions = useMemo(() => Array.from(new Set(normalizedHotels.map((h) => h.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((city) => ({ value: city, label: city })), [normalizedHotels]);
  const stateOptions = useMemo(() => Array.from(new Set(normalizedHotels.map((h) => h.state).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((state) => ({ value: state, label: state })), [normalizedHotels]);
  const categoryOptions = useMemo(() => Array.from(new Set(normalizedHotels.map((h) => h.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((category) => ({ value: category, label: category })), [normalizedHotels]);
  const propertyTypeOptions = useMemo(() => Array.from(new Set(normalizedHotels.map((h) => h.propertyType).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map((propertyType) => ({ value: propertyType, label: propertyType })), [normalizedHotels]);
  const yesNoOptions = useMemo(() => [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], []);

  const filterFields = useMemo(() => [
    { key: 'search', label: 'Search', type: 'text', placeholder: 'Search hotels' },
    { key: 'hotelId', label: 'Hotel ID', type: 'text', placeholder: 'Filter by Hotel ID' },
    { key: 'hotelName', label: 'Hotel Name', type: 'text', placeholder: 'Filter by Hotel Name' },
    { key: 'hotelOwnerName', label: 'Hotel Owner Name', type: 'text', placeholder: 'Filter by Hotel Owner Name' },
    { key: 'hotelEmail', label: 'Hotel Email', type: 'text', placeholder: 'Filter by Hotel Email' },
    { key: 'destination', label: 'Destination', type: 'text', placeholder: 'Filter by Destination' },
    { key: 'city', label: 'City', type: 'select', options: cityOptions, emptyOptionLabel: 'All Cities' },
    { key: 'state', label: 'State', type: 'select', options: stateOptions, emptyOptionLabel: 'All States' },
    { key: 'landmark', label: 'Landmark', type: 'text', placeholder: 'Filter by Landmark' },
    { key: 'pinCode', label: 'Pin Code', type: 'text', placeholder: 'Filter by Pin Code' },
    { key: 'hotelCategory', label: 'Category', type: 'select', options: categoryOptions, emptyOptionLabel: 'All Categories' },
    { key: 'propertyType', label: 'Property Type', type: 'select', options: propertyTypeOptions, emptyOptionLabel: 'All Property Types' },
    { key: 'localId', label: 'Local ID', type: 'text', placeholder: 'Filter by Local ID' },
    { key: 'onFront', label: 'On Front', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
    { key: 'isAccepted', label: 'Is Accepted', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
    { key: 'starRating', label: 'Star Rating', type: 'select', options: [1, 2, 3, 4, 5].map((rating) => ({ value: String(rating), label: `${rating} Star${rating > 1 ? 's' : ''}` })), emptyOptionLabel: 'Any Rating' },
    { key: 'minStarRating', label: 'Min Star Rating', type: 'number', placeholder: 'Minimum stars' },
    { key: 'maxStarRating', label: 'Max Star Rating', type: 'number', placeholder: 'Maximum stars' },
    { key: 'rating', label: 'Rating', type: 'number', placeholder: 'Exact rating' },
    { key: 'minRating', label: 'Min Rating', type: 'number', placeholder: 'Minimum rating' },
    { key: 'maxRating', label: 'Max Rating', type: 'number', placeholder: 'Maximum rating' },
    { key: 'minReviewCount', label: 'Min Review Count', type: 'number', placeholder: 'Minimum reviews' },
    { key: 'maxReviewCount', label: 'Max Review Count', type: 'number', placeholder: 'Maximum reviews' },
    { key: 'latitude', label: 'Latitude', type: 'text', placeholder: 'Filter by Latitude' },
    { key: 'longitude', label: 'Longitude', type: 'text', placeholder: 'Filter by Longitude' },
    { key: 'roomId', label: 'Room ID', type: 'text', placeholder: 'Filter by Room ID' },
    { key: 'type', label: 'Type', type: 'text', placeholder: 'Filter by Type' },
    { key: 'roomType', label: 'Room Type', type: 'text', placeholder: 'Filter by Room Type' },
    { key: 'bedTypes', label: 'Bed Types', type: 'text', placeholder: 'Filter by Bed Types' },
    { key: 'amenities', label: 'Amenities', type: 'text', placeholder: 'Filter by Amenities' },
    { key: 'unmarriedCouplesAllowed', label: 'Unmarried Couples Allowed', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
    { key: 'contact', label: 'Contact', type: 'text', placeholder: 'Filter by Contact' },
    { key: 'generalManagerContact', label: 'GM Contact', type: 'text', placeholder: 'Filter by GM Contact' },
    { key: 'salesManagerContact', label: 'Sales Contact', type: 'text', placeholder: 'Filter by Sales Contact' },
    { key: 'customerWelcomeNote', label: 'Customer Welcome Note', type: 'text', placeholder: 'Filter by Welcome Note' },
    { key: 'hasOffer', label: 'Has Offer', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
    { key: 'roomSoldOut', label: 'Room Sold Out', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
    { key: 'onlyAvailable', label: 'Only Available', type: 'select', options: yesNoOptions, emptyOptionLabel: 'Any' },
    { key: 'countRooms', label: 'Count Rooms', type: 'number', placeholder: 'Count rooms' },
    { key: 'requestedRooms', label: 'Requested Rooms', type: 'number', placeholder: 'Requested rooms' },
    { key: 'guests', label: 'Guests', type: 'number', placeholder: 'Guest count' },
    { key: 'minPrice', label: 'Min Price', type: 'number', placeholder: 'Minimum price' },
    { key: 'maxPrice', label: 'Max Price', type: 'number', placeholder: 'Maximum price' },
    { key: 'minRoomPrice', label: 'Min Room Price', type: 'number', placeholder: 'Minimum room price' },
    { key: 'maxRoomPrice', label: 'Max Room Price', type: 'number', placeholder: 'Maximum room price' },
    { key: 'checkInDate', label: 'Check In Date', type: 'date' },
    { key: 'checkOutDate', label: 'Check Out Date', type: 'date' },
    { key: 'sortBy', label: 'Sort By', type: 'select', options: ['hotelName', 'hotelId', 'city', 'state', 'starRating', 'rating', 'reviewCount', 'price'], emptyOptionLabel: 'Default Sort' },
    { key: 'sortOrder', label: 'Sort Order', type: 'select', options: [{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }], emptyOptionLabel: 'Default Order' },
    { key: 'page', label: 'Page', type: 'number', placeholder: 'Page number' },
    { key: 'limit', label: 'Limit', type: 'number', placeholder: 'Items per page' },
  ], [categoryOptions, cityOptions, propertyTypeOptions, stateOptions, yesNoOptions]);

  const filteredHotels = useMemo(() => {
    const query = String(filterValues.search || '').trim().toLowerCase();
    const includesValue = (source, value) => !String(value || '').trim() || String(source || '').toLowerCase().includes(String(value).trim().toLowerCase());
    return normalizedHotels.filter((hotel) => {
      const matchesSearch = !query || [hotel.hotelName, hotel.hotelId, hotel.city, hotel.state, hotel.email, hotel.address].filter(Boolean).join(' ').toLowerCase().includes(query);
      const matchesText = includesValue(hotel.hotelId, filterValues.hotelId) && includesValue(hotel.hotelName, filterValues.hotelName) && includesValue(hotel.email, filterValues.hotelEmail) && includesValue(hotel.city, filterValues.city) && includesValue(hotel.state, filterValues.state) && includesValue(hotel.category, filterValues.hotelCategory) && includesValue(hotel.propertyType, filterValues.propertyType) && includesValue(hotel.address, filterValues.destination);
      return matchesSearch && matchesText;
    });
  }, [filterValues, normalizedHotels]);

  const selectedHotel = useMemo(() => normalizedHotels.find((hotel) => hotel.hotelId === selectedHotelId) || null, [normalizedHotels, selectedHotelId]);
  const stats = useMemo(() => {
    if (!prices.length) return null;
    const total = prices.length;
    const avgPrice = Math.round(prices.reduce((a, p) => a + (p.monthPrice || 0), 0) / total);
    return { total, avgPrice, maxPrice: Math.max(...prices.map((p) => p.monthPrice || 0)), minPrice: Math.min(...prices.map((p) => p.monthPrice || 0)) };
  }, [prices]);

  const handleAdd = (data) => {
    dispatch(setMonthlyPrice({ hotelId: selectedHotelId, roomId: data.roomId, data: { startDate: data.startDate, endDate: data.endDate, monthPrice: data.monthPrice } })).unwrap().then(() => setAddModal(false)).catch(() => {});
  };
  const handleEdit = (data) => { dispatch(updateMonthlyPrice({ id: editTarget._id, data })).unwrap().then(() => setEditTarget(null)).catch(() => {}); };
  const handleDelete = (id) => { dispatch(deleteMonthlyPrice(id)); };
  const handleDeleteAll = () => { dispatch(deleteAllMonthlyPricesByHotel(selectedHotelId)).unwrap().then(() => setDeleteAllOpen(false)).catch(() => {}); };
  const handleSelectHotel = (hotel) => { setSelectedHotelId(hotel.hotelId); dispatch(getMonthlyPricesByHotel(hotel.hotelId)); };

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><BadgeDollarSign size={18} /></div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Admin Panel</p>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">Monthly Pricing</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">Manage monthly pricing for selected hotels.</p>
            </div>
            {selectedHotelId && (
                <div className="flex items-center gap-3">
                    <button onClick={() => dispatch(getMonthlyPricesByHotel(selectedHotelId))} disabled={loading} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50" title="Refresh">
                        <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
                    </button>
                    {prices.length > 0 && (
                        <button onClick={() => setDeleteAllOpen(true)} className="flex h-12 items-center gap-2 rounded-2xl bg-red-50 px-5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100">
                            <Trash2 size={16} /> Delete All
                        </button>
                    )}
                </div>
            )}
        </div>

        {selectedHotelId ? (
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/40">
                {selectedHotel && (
                    <div className="border-b border-gray-100 bg-gray-50/40 px-6 py-4 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-500">
                            <span className="rounded-full bg-white px-3 py-1.5 text-gray-700">{selectedHotel.hotelName}</span>
                            <span className="rounded-full bg-white px-3 py-1.5 text-gray-700">Hotel ID: {selectedHotel.hotelId}</span>
                            <span className="rounded-full bg-white px-3 py-1.5 text-gray-700">{[selectedHotel.city, selectedHotel.state].filter(Boolean).join(', ')}</span>
                        </div>
                         <button onClick={() => setAddModal(true)} className="flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800">
                            <Plus size={16} /> Add Price Entry
                        </button>
                    </div>
                )}
                
                {stats && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 p-6 bg-gray-50/30 border-b border-gray-100">
                        {[
                            ['Total Entries', stats.total, 'text-gray-900', 'bg-white', 'border-gray-200'], 
                            ['Avg Price', fmtCurrency(stats.avgPrice), 'text-blue-700', 'bg-blue-50', 'border-blue-100'], 
                            ['Highest', fmtCurrency(stats.maxPrice), 'text-emerald-700', 'bg-emerald-50', 'border-emerald-100'], 
                            ['Lowest', fmtCurrency(stats.minPrice), 'text-amber-700', 'bg-amber-50', 'border-amber-100']
                        ].map(([label, val, text, bg, border]) => (
                            <div key={label} className={`rounded-2xl border ${border} ${bg} p-4 shadow-sm`}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                                <p className={`text-xl font-black ${text}`}>{val}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="overflow-x-auto custom-scrollbar pb-2">
                    <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                {['#', 'Room ID', 'Room Type', 'Start Date', 'End Date', 'Monthly Price', 'Actions'].map((h) => <th key={h} className="whitespace-nowrap px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)
                            ) : prices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 ring-8 ring-gray-50/50">
                                                <BadgeDollarSign size={32} className="text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-black text-gray-900">No Price Entries</h3>
                                            <p className="mt-1 text-sm font-medium text-gray-500 max-w-sm">No monthly prices found for hotel <span className="font-bold text-gray-800">{selectedHotelId}</span>.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                prices.map((p, idx) => (
                                    <tr key={p._id || idx} className="group transition-colors hover:bg-gray-50/80">
                                        <td className="px-6 py-5"><span className="text-xs font-black text-gray-300">{String(idx + 1).padStart(2, '0')}</span></td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 w-max">
                                                <Hash size={12} className="text-gray-400" />
                                                <span className="font-mono text-[11px] font-bold text-gray-700">{p.roomId || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-gray-800">{p.roomType || <span className="text-gray-400 font-medium">-</span>}</p>
                                                {p.roomBedType && <p className="text-xs font-medium text-gray-400">{p.roomBedType}</p>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                <CalendarDays size={13} className="text-gray-400" />{fmt(p.startDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                <CalendarDays size={13} className="text-gray-400" />{fmt(p.endDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><span className="text-base font-black text-emerald-700">{fmtCurrency(p.monthPrice)}</span></td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => setEditTarget(p)} title="Edit" className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20 active:scale-95"><Edit3 size={15} /></button>
                                                <button onClick={() => handleDelete(p._id)} title="Delete" className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-600/20 active:scale-95"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white mb-5 ring-8 ring-white/50 shadow-sm">
                    <Building2 size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-900">Select a Hotel First</h3>
                <p className="mt-1 text-sm font-medium text-gray-400 max-w-sm mx-auto">Use the directory below to select a hotel before managing monthly prices.</p>
            </div>
        )}

        <MasterFilter fields={filterFields} values={filterValues} loading={hotelsLoading} enableFieldPicker fieldPickerLabel="Select hotel filter key" initialActiveFieldKeys={['search', 'city', 'state', 'hotelCategory']} applyLabel="Apply Filters" onChange={(key, value) => setFilterValues((current) => ({ ...current, [key]: value }))} onApply={() => {}} onReset={() => setFilterValues(createEmptyFilters())} />

        {success && <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 animate-in fade-in"><CheckCircle2 size={18} className="shrink-0" /> {success}</div>}
        {(error || hotelError) && <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 animate-in fade-in"><div className="flex items-center gap-3"><AlertCircle size={18} className="shrink-0" />{typeof (error || hotelError) === 'string' ? (error || hotelError) : error?.error || hotelError?.error || 'Something went wrong.'}</div><button onClick={() => dispatch(clearMonthlyError())}><X size={16} /></button></div>}

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/30">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Hotel Directory</p>
                    <h2 className="mt-1 text-xl font-black text-gray-900">Available Hotels</h2>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">{filteredHotels.length} shown</span>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar pb-2">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            {['#', 'Hotel', 'Hotel ID', 'Location', 'Rooms', 'Action'].map((h) => <th key={h} className="whitespace-nowrap px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {hotelsLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)
                        ) : filteredHotels.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 ring-8 ring-gray-50/50">
                                            <Hotel size={28} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-base font-black text-gray-900">No hotels found</h3>
                                        <p className="mt-1 text-sm font-medium text-gray-400">Try adjusting your filter criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredHotels.map((hotel, idx) => { 
                                const isSelected = selectedHotelId === hotel.hotelId; 
                                return (
                                    <tr key={hotel.hotelId} onClick={() => { handleSelectHotel(hotel); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`cursor-pointer transition-colors hover:bg-gray-50/80 ${isSelected ? 'bg-blue-50/70' : ''}`}>
                                        <td className="px-6 py-5"><span className="text-xs font-black text-gray-300">{String(idx + 1).padStart(2, '0')}</span></td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`rounded-xl p-2 ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}><Building2 size={15} /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{hotel.hotelName}</p>
                                                    <p className="text-xs font-medium text-gray-400">{hotel.startingPrice > 0 ? `From ${fmtCurrency(hotel.startingPrice)}` : 'Price on request'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-[11px] font-bold text-gray-700">{hotel.hotelId}</span></td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                <MapPin size={13} className="text-gray-400" />{[hotel.city, hotel.state].filter(Boolean).join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-gray-700">{hotel.totalRooms || '-'}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleSelectHotel(hotel); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                                    {isSelected ? 'Managing' : 'Manage Pricing'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ); 
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      {addModal && <PriceModal mode="add" hotelId={selectedHotelId} rooms={selectedHotel?.rooms || []} onClose={() => setAddModal(false)} onSave={handleAdd} saving={saving} />}
      {editTarget && <PriceModal mode="edit" entry={editTarget} hotelId={selectedHotelId} onClose={() => setEditTarget(null)} onSave={handleEdit} saving={saving} />}
      {deleteAllOpen && <DeleteAllConfirm hotelId={selectedHotelId} onClose={() => setDeleteAllOpen(false)} onConfirm={handleDeleteAll} loading={loading} />}
    </div>
  );
}