import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  checkSingleHotelAvailability,
  checkMultipleHotelsAvailability,
  clearSingleHotelAvailability,
  clearMultipleHotelsAvailability,
} from '../../../redux/slices/availability';
import { getAllHotels } from '../../../redux/slices/admin/hotel';
import {
  Search, Building2, MapPin, CalendarDays, Loader2, AlertCircle,
  CheckCircle2, XCircle, BedDouble, Hash,
  ChevronDown, ChevronRight,
  X, Hotel, List,
} from 'lucide-react';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

const today = () => new Date().toISOString().split('T')[0];
const nextWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

const normalizeHotelDirectoryItem = (hotel) => ({
  hotelId: hotel?.hotelId || hotel?._id || hotel?.id || hotel?.basicInfo?.hotelId || '',
  hotelName: hotel?.hotelName || hotel?.name || hotel?.basicInfo?.name || 'Unnamed Hotel',
  city: hotel?.city || hotel?.hotelCity || hotel?.destination || hotel?.basicInfo?.location?.city || '',
});

const BOOKING_STATUS_CFG = {
  Confirmed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Checked-in': { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'Checked-out': { cls: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
  Pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'No-Show': { cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  Cancelled: { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  Failed: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = BOOKING_STATUS_CFG[status] || BOOKING_STATUS_CFG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

const AvailBadge = ({ isAvailable }) =>
  isAvailable ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
      <CheckCircle2 size={13} /> Available
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
      <XCircle size={13} /> Unavailable
    </span>
  );

const SummaryPills = ({ summary }) => {
  const entries = Object.entries(summary || {}).filter(([, v]) => v > 0);
  if (!entries.length) return <span className="text-xs text-zinc-400">No bookings</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, val]) => {
        const cfg = BOOKING_STATUS_CFG[key] || BOOKING_STATUS_CFG.Pending;
        return (
          <span key={key} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${cfg.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {key}: {val}
          </span>
        );
      })}
    </div>
  );
};

const RoomBar = ({ total, available, blocked }) => {
  const booked = total - available - blocked;
  const pctBooked = total ? Math.round((booked / total) * 100) : 0;
  const pctBlocked = total ? Math.round((blocked / total) * 100) : 0;
  const pctFree = 100 - pctBooked - pctBlocked;

  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className="bg-rose-400 transition-all" style={{ width: `${pctBooked}%` }} />
        <div className="bg-amber-400 transition-all" style={{ width: `${pctBlocked}%` }} />
        <div className="bg-emerald-400 transition-all" style={{ width: `${pctFree}%` }} />
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-zinc-500">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />Booked ({pctBooked}%)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />Blocked ({pctBlocked}%)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />Free ({pctFree}%)</span>
      </div>
    </div>
  );
};

function SingleResult({ data }) {
  return (
    <div className="animate-in slide-in-from-bottom-3 rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/40 duration-500 fade-in overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 bg-zinc-50/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Hotel size={20} />
          </div>
          <div>
            <p className="text-lg font-black text-zinc-900">{data.hotelName}</p>
            <p className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
              <MapPin size={12} />{data.city}
            </p>
          </div>
        </div>
        <AvailBadge isAvailable={data.isAvailable} />
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 p-6 sm:grid-cols-4">
        {[
          ['Total Rooms', data.totalRooms, 'text-zinc-900', 'bg-zinc-50'],
          ['Listed Available', data.listedAvailableRooms, 'text-blue-700', 'bg-blue-50'],
          ['Blocked Rooms', data.activelyBlockedRooms, 'text-amber-700', 'bg-amber-50'],
          ['Actual Available', data.actualAvailableRooms, 'text-emerald-700', 'bg-emerald-50'],
        ].map(([label, val, text, bg]) => (
          <div key={label} className={`rounded-2xl ${bg} p-4`}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
            <p className={`text-3xl font-black ${text}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="space-y-5 p-6">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Room Utilization</p>
          <RoomBar total={data.totalRooms} available={data.actualAvailableRooms} blocked={data.activelyBlockedRooms} />
        </div>
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Booking Breakdown</p>
          <SummaryPills summary={data.bookingSummary} />
        </div>
        <div className="flex flex-wrap gap-4 border-t border-zinc-100 pt-2 text-xs font-semibold text-zinc-500">
          <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-zinc-400" />Check-in: {fmt(data.fromDate)}</span>
          <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-zinc-400" />Check-out: {fmt(data.toDate)}</span>
          <span className="flex items-center gap-1.5"><Hash size={13} className="text-zinc-400" />ID: {data.hotelId}</span>
        </div>
      </div>
    </div>
  );
}

function MultiRow({ hotel, idx }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="group cursor-pointer transition-colors hover:bg-zinc-50/80" onClick={() => setExpanded((p) => !p)}>
        <td className="px-5 py-4">
          <span className="text-xs font-black text-zinc-300">{String(idx + 1).padStart(2, '0')}</span>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-50 p-1.5"><Building2 size={14} className="text-blue-500" /></div>
            <div>
              <p className="text-sm font-bold text-zinc-900">{hotel.hotelName}</p>
              <p className="flex items-center gap-1 text-xs font-medium text-zinc-400"><MapPin size={10} />{hotel.city}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4 text-sm font-bold text-zinc-700">{hotel.totalRooms}</td>
        <td className="px-5 py-4 text-sm font-bold text-blue-700">{hotel.listedAvailableRooms}</td>
        <td className="px-5 py-4 text-sm font-bold text-amber-700">{hotel.activelyBlockedRooms}</td>
        <td className="px-5 py-4 text-sm font-bold text-emerald-700">{hotel.actualAvailableRooms}</td>
        <td className="px-5 py-4"><AvailBadge isAvailable={hotel.isAvailable} /></td>
        <td className="px-5 py-4">
          <SummaryPills summary={hotel.bookingSummary} />
        </td>
        <td className="px-5 py-4">
          <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-all hover:bg-zinc-200">
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </td>
      </tr>

      {expanded && hotel.bookings?.length > 0 && (
        <tr>
          <td colSpan={9} className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-4">
            <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-zinc-400">Active Bookings</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    {['Booking ID', 'Guest', 'Check-In', 'Check-Out', 'Rooms', 'Status'].map((h) => (
                      <th key={h} className="py-2 pr-6 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {hotel.bookings.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-white">
                      <td className="py-2.5 pr-6">
                        <span className="rounded-lg bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-700">{b.bookingId}</span>
                      </td>
                      <td className="py-2.5 pr-6 font-semibold text-zinc-800">{b.customerName}</td>
                      <td className="py-2.5 pr-6 text-zinc-500">{fmt(b.checkInDate)}</td>
                      <td className="py-2.5 pr-6 text-zinc-500">{fmt(b.checkOutDate)}</td>
                      <td className="py-2.5 pr-6 font-bold text-zinc-700">{b.numRooms}</td>
                      <td className="py-2.5"><StatusBadge status={b.bookingStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}

      {expanded && !hotel.bookings?.length && (
        <tr>
          <td colSpan={9} className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-3 text-xs font-semibold text-zinc-400">
            No active bookings for this hotel in the selected period.
          </td>
        </tr>
      )}
    </>
  );
}

export default function Availability() {
  const dispatch = useDispatch();
  const { singleHotel, multipleHotels } = useSelector((s) => s.availability);
  const { allHotels, loading: hotelsLoading } = useSelector((s) => s.hotel);

  const [mode, setMode] = useState('single');
  const [singleForm, setSingleForm] = useState({ city: '', hotelId: '', fromDate: today(), toDate: nextWeek() });
  const [multiForm, setMultiForm] = useState({ city: '', fromDate: today(), toDate: nextWeek() });

  useEffect(() => {
    if (!allHotels?.length) {
      dispatch(getAllHotels());
    }
  }, [allHotels?.length, dispatch]);

  const hotelDirectory = useMemo(
    () =>
      (allHotels || [])
        .map(normalizeHotelDirectoryItem)
        .filter((hotel) => hotel.hotelId && hotel.hotelName && hotel.city),
    [allHotels],
  );

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(hotelDirectory.map((hotel) => hotel.city.trim()).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [hotelDirectory],
  );

  const selectedSingleCity = useMemo(
    () => cityOptions.find((city) => city.toLowerCase() === singleForm.city.trim().toLowerCase()) || '',
    [cityOptions, singleForm.city],
  );

  const selectedMultiCity = useMemo(
    () => cityOptions.find((city) => city.toLowerCase() === multiForm.city.trim().toLowerCase()) || '',
    [cityOptions, multiForm.city],
  );

  const hotelsForSelectedCity = useMemo(
    () =>
      hotelDirectory
        .filter((hotel) => hotel.city.toLowerCase() === selectedSingleCity.toLowerCase())
        .sort((a, b) => a.hotelName.localeCompare(b.hotelName)),
    [hotelDirectory, selectedSingleCity],
  );

  const multiCityMatches = useMemo(() => {
    const query = multiForm.city.trim().toLowerCase();
    if (!query) return cityOptions.slice(0, 8);
    return cityOptions.filter((city) => city.toLowerCase().includes(query)).slice(0, 8);
  }, [cityOptions, multiForm.city]);

  const handleSingleCheck = (e) => {
    e.preventDefault();
    dispatch(checkSingleHotelAvailability(singleForm));
  };

  const handleMultiCheck = (e) => {
    e.preventDefault();
    dispatch(checkMultipleHotelsAvailability({ ...multiForm, city: selectedMultiCity || multiForm.city }));
  };

  useEffect(() => {
    if (!selectedMultiCity || !multiForm.fromDate || !multiForm.toDate) return;
    dispatch(checkMultipleHotelsAvailability({ ...multiForm, city: selectedMultiCity }));
  }, [dispatch, multiForm.fromDate, multiForm.toDate, selectedMultiCity]);

  const handleClearSingle = () => {
    setSingleForm({ city: '', hotelId: '', fromDate: today(), toDate: nextWeek() });
    dispatch(clearSingleHotelAvailability());
  };

  const handleClearMulti = () => {
    setMultiForm({ city: '', fromDate: today(), toDate: nextWeek() });
    dispatch(clearMultipleHotelsAvailability());
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 px-4 py-8 font-sans selection:bg-blue-100 selection:text-blue-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <BedDouble size={18} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Admin Panel</p>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Room Availability</h1>
            <p className="mt-2 text-sm font-medium text-zinc-500">Check live room availability for single or multiple hotels.</p>
          </div>

          <div className="flex rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${mode === 'single' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <Hotel size={15} /> Single Hotel
            </button>
            <button
              onClick={() => setMode('multiple')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${mode === 'multiple' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <List size={15} /> By City
            </button>
          </div>
        </div>

        {mode === 'single' && (
          <>
            <form onSubmit={handleSingleCheck} className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">City</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      list="availability-single-city-list"
                      required
                      value={singleForm.city}
                      onChange={(e) => {
                        const nextCity = e.target.value;
                        setSingleForm((p) => ({ ...p, city: nextCity, hotelId: '' }));
                        dispatch(clearSingleHotelAvailability());
                      }}
                      placeholder="Enter city name"
                      className="w-full rounded-2xl border-none bg-zinc-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-800 outline-none focus:bg-zinc-100 placeholder:text-zinc-400"
                    />
                    <datalist id="availability-single-city-list">
                      {cityOptions.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="flex-1 min-w-[220px]">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Hotel</label>
                  <div className="relative">
                    <Hotel size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <select
                      required
                      value={singleForm.hotelId}
                      onChange={(e) => setSingleForm((p) => ({ ...p, hotelId: e.target.value }))}
                      disabled={!selectedSingleCity || hotelsLoading}
                      className="w-full appearance-none rounded-2xl border-none bg-zinc-50 py-3.5 pl-11 pr-10 text-sm font-semibold text-zinc-800 outline-none focus:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      <option value="">
                        {!selectedSingleCity ? 'Select city first' : hotelsLoading ? 'Loading hotels...' : 'Select hotel'}
                      </option>
                      {hotelsForSelectedCity.map((hotel) => (
                        <option key={hotel.hotelId} value={hotel.hotelId}>
                          {hotel.hotelName} ({hotel.hotelId})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  </div>
                  {!!selectedSingleCity && (
                    <p className="mt-1.5 text-xs font-medium text-zinc-400">
                      {hotelsForSelectedCity.length} hotel{hotelsForSelectedCity.length !== 1 ? 's' : ''} found in {selectedSingleCity}
                    </p>
                  )}
                </div>

                <div className="flex-1 min-w-[160px]">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">From Date</label>
                  <input
                    required
                    type="date"
                    value={singleForm.fromDate}
                    onChange={(e) => setSingleForm((p) => ({ ...p, fromDate: e.target.value }))}
                    className="w-full rounded-2xl border-none bg-zinc-50 px-4 py-3.5 text-sm font-semibold text-zinc-800 outline-none focus:bg-zinc-100"
                  />
                </div>

                <div className="flex-1 min-w-[160px]">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">To Date</label>
                  <input
                    required
                    type="date"
                    value={singleForm.toDate}
                    onChange={(e) => setSingleForm((p) => ({ ...p, toDate: e.target.value }))}
                    className="w-full rounded-2xl border-none bg-zinc-50 px-4 py-3.5 text-sm font-semibold text-zinc-800 outline-none focus:bg-zinc-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={singleHotel.loading || !singleForm.hotelId}
                  className="flex h-[52px] items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                >
                  {singleHotel.loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Check
                </button>

                {singleHotel.data && (
                  <button
                    type="button"
                    onClick={handleClearSingle}
                    className="flex h-[52px] items-center gap-2 rounded-2xl bg-rose-50 px-5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
                  >
                    <X size={16} /> Clear
                  </button>
                )}
              </div>
            </form>

            {singleHotel.error && (
              <div className="animate-in flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 fade-in">
                <AlertCircle size={18} className="shrink-0" />
                {typeof singleHotel.error === 'string' ? singleHotel.error : 'Failed to fetch availability.'}
              </div>
            )}

            {singleHotel.data && <SingleResult data={singleHotel.data} />}

            {!singleHotel.loading && !singleHotel.data && !singleHotel.error && (
              <div className="rounded-3xl border border-dashed border-zinc-200 bg-white py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 ring-8 ring-zinc-50/50">
                  <BedDouble size={28} className="text-zinc-300" />
                </div>
                <h3 className="text-base font-black text-zinc-900">No Data Yet</h3>
                <p className="mt-1 text-sm font-medium text-zinc-400">Select city, hotel, and date range above to check availability.</p>
              </div>
            )}
          </>
        )}

        {mode === 'multiple' && (
          <>
            <form onSubmit={handleMultiCheck} className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">City</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      list="availability-city-list"
                      required
                      value={multiForm.city}
                      onChange={(e) => {
                        setMultiForm((p) => ({ ...p, city: e.target.value }));
                        dispatch(clearMultipleHotelsAvailability());
                      }}
                      placeholder="Enter city name"
                      className="w-full rounded-2xl border-none bg-zinc-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-800 outline-none focus:bg-zinc-100 placeholder:text-zinc-400"
                    />
                    <datalist id="availability-city-list">
                      {cityOptions.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {multiCityMatches.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setMultiForm((p) => ({ ...p, city }))}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          selectedMultiCity === city
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-w-[160px]">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">From Date</label>
                  <input
                    required
                    type="date"
                    value={multiForm.fromDate}
                    onChange={(e) => setMultiForm((p) => ({ ...p, fromDate: e.target.value }))}
                    className="w-full rounded-2xl border-none bg-zinc-50 px-4 py-3.5 text-sm font-semibold text-zinc-800 outline-none focus:bg-zinc-100"
                  />
                </div>

                <div className="flex-1 min-w-[160px]">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">To Date</label>
                  <input
                    required
                    type="date"
                    value={multiForm.toDate}
                    onChange={(e) => setMultiForm((p) => ({ ...p, toDate: e.target.value }))}
                    className="w-full rounded-2xl border-none bg-zinc-50 px-4 py-3.5 text-sm font-semibold text-zinc-800 outline-none focus:bg-zinc-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={multipleHotels.loading || !selectedMultiCity}
                  className="flex h-[52px] items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                >
                  {multipleHotels.loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search
                </button>

                {multipleHotels.data?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearMulti}
                    className="flex h-[52px] items-center gap-2 rounded-2xl bg-rose-50 px-5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
                  >
                    <X size={16} /> Clear
                  </button>
                )}
              </div>
            </form>

            {multipleHotels.error && (
              <div className="animate-in flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 fade-in">
                <AlertCircle size={18} className="shrink-0" />
                {typeof multipleHotels.error === 'string' ? multipleHotels.error : 'Failed to fetch availability.'}
              </div>
            )}

            {multipleHotels.data?.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    ['Total Hotels', multipleHotels.data.length, 'text-zinc-900', 'bg-white'],
                    ['Available', multipleHotels.data.filter((h) => h.isAvailable).length, 'text-emerald-700', 'bg-emerald-50'],
                    ['Unavailable', multipleHotels.data.filter((h) => !h.isAvailable).length, 'text-rose-700', 'bg-rose-50'],
                    ['Total Avail Rooms', multipleHotels.data.reduce((a, h) => a + h.actualAvailableRooms, 0), 'text-blue-700', 'bg-blue-50'],
                  ].map(([label, val, text, bg]) => (
                    <div key={label} className={`rounded-3xl border border-zinc-100 ${bg} p-5 shadow-sm`}>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
                      <p className={`text-3xl font-black ${text}`}>{val}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/40">
                  <div className="overflow-x-auto custom-scrollbar pb-2">
                    <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          {['#', 'Hotel', 'Total', 'Listed', 'Blocked', 'Available', 'Status', 'Booking Summary', ''].map((h) => (
                            <th key={h} className="whitespace-nowrap px-5 py-4 text-[11px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {multipleHotels.loading ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className="animate-pulse border-b border-zinc-100">
                              {Array.from({ length: 9 }).map((__, j) => (
                                <td key={j} className="px-5 py-4"><div className="h-4 w-full rounded bg-zinc-100" /></td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          multipleHotels.data.map((hotel, idx) => (
                            <MultiRow key={hotel.hotelId} hotel={hotel} idx={idx} />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Showing {multipleHotels.data.length} hotel{multipleHotels.data.length !== 1 ? 's' : ''} - {selectedMultiCity || multiForm.city} · {fmt(multiForm.fromDate)} to {fmt(multiForm.toDate)}
                    </p>
                  </div>
                </div>
              </>
            )}

            {!multipleHotels.loading && !multipleHotels.data?.length && !multipleHotels.error && (
              <div className="rounded-3xl border border-dashed border-zinc-200 bg-white py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 ring-8 ring-zinc-50/50">
                  <Building2 size={28} className="text-zinc-300" />
                </div>
                <h3 className="text-base font-black text-zinc-900">No Data Yet</h3>
                <p className="mt-1 text-sm font-medium text-zinc-400">Enter or select a city and date range to see all hotel availability.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
