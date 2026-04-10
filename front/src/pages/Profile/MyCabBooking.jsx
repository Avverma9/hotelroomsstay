import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getBookings } from "../../redux/slices/car";

// Status colour maps
const BOOKING_STATUS_CFG = {
  Confirmed:  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  Pending:    { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500" },
  Failed:     { bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-500" },
  Cancelled:  { bg: "bg-rose-100",    text: "text-rose-800",    dot: "bg-rose-500" },
  Completed:  { bg: "bg-indigo-100",  text: "text-indigo-800",  dot: "bg-indigo-500" },
};
const RIDE_STATUS_CFG = {
  "AwaitingConfirmation": { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Awaiting Confirm" },
  "Available":            { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500",    label: "Available" },
  "Ride in Progress":     { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    label: "Ride in Progress" },
  "Ride Completed":       { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Ride Completed" },
  Cancelled:              { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    label: "Cancelled" },
  Failed:                 { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     label: "Failed" },
};

const bsCfg  = (s) => BOOKING_STATUS_CFG[s]  || BOOKING_STATUS_CFG.Pending;
const rsCfg  = (s) => RIDE_STATUS_CFG[s]     || { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: s || "---" };

const StatusBadge = ({ label, cfg }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
    {label}
  </span>
);

export default function CabBooking() {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await dispatch(getBookings());
        if (response.payload && Array.isArray(response.payload)) {
          setBookings(response.payload);
        } else if (!response.error?.message?.includes("404")) {
          setError("Unable to load bookings. Please try again.");
        }
      } catch {
        /* swallow */
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [dispatch]);

  const fmt = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "---";

  const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }) : "---";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32" role="status">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-600 font-medium">Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
        <p className="text-red-800 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 w-full bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
          Try Again
        </button>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m6.75 4.5v-3a3 3 0 00-3-3H3.75" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">No cab bookings yet</h3>
        <p className="text-slate-500 text-sm">When you book a cab, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-slate-700"><span className="font-semibold text-lg">{bookings.length}</span> booking{bookings.length !== 1 ? "s" : ""}</p>
        <p className="text-sm text-slate-500">Latest first</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {bookings.map((b, i) => {
          const bookingStatus = b?.bookingStatus || "Pending";
          const rideStatus    = b?.rideStatus    || "AwaitingConfirmation";
          const bCfg = bsCfg(bookingStatus);
          const rCfg = rsCfg(rideStatus);
          const bookedSeats   = b?.carDetails?.bookedSeats || [];
          const totalAmount   = b?.price || bookedSeats.reduce((s, seat) => s + (seat?.seatPrice || 0), 0);
          const showCodes     = bookingStatus === "Confirmed" && (b?.pickupCode || b?.dropCode);

          return (
            <article
              key={b._id || i}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">Booking ID</p>
                    <p className="font-mono font-bold text-sm mt-0.5">{b?.bookingId || b?._id?.slice(-8)?.toUpperCase() || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide opacity-70">Total</p>
                    <p className="font-bold text-lg">{fmt(totalAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Both status badges */}
                <div className="flex flex-wrap gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Booking</p>
                    <StatusBadge label={bookingStatus} cfg={bCfg} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ride</p>
                    <StatusBadge label={rCfg.label} cfg={rCfg} />
                  </div>
                </div>

                {/* Route */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Pickup</p>
                      <p className="font-medium text-slate-900">{b?.pickupP || "---"}</p>
                    </div>
                  </div>
                  <div className="ml-1 w-px h-4 bg-slate-200" />
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Drop</p>
                      <p className="font-medium text-slate-900">{b?.dropP || "---"}</p>
                    </div>
                  </div>
                </div>

                {/* Trip dates */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Pickup Date</p>
                    <p className="font-medium text-slate-900 mt-0.5">{fmtDateTime(b?.pickupD)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Vehicle</p>
                    <p className="font-medium text-slate-900 mt-0.5">{[b?.make, b?.model].filter(Boolean).join(" ") || b?.vehicleType || "---"}</p>
                  </div>
                </div>

                {/* Passenger */}
                <div className="text-sm">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Passenger</p>
                  <p className="font-medium text-slate-900 mt-0.5">{b?.passengerName || b?.bookedBy || "---"}</p>
                  <p className="text-slate-500 text-xs">{b?.customerMobile || ""}</p>
                </div>

                {/* Verification Codes - only visible when booking is Confirmed */}
                {showCodes && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Verification Codes</p>
                    <div className="flex gap-4">
                      {b?.pickupCode && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Pickup Code</p>
                          <p className="font-mono text-lg font-bold text-emerald-700 tracking-widest">{b.pickupCode}</p>
                        </div>
                      )}
                      {b?.dropCode && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Drop Code</p>
                          <p className="font-mono text-lg font-bold text-indigo-700 tracking-widest">{b.dropCode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <footer className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between">
                <span>{b?.sharingType || "Private"} . {b?.vehicleNumber || "---"}</span>
                <span>Booked {fmtDate(b?.bookingDate || b?.createdAt)}</span>
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
