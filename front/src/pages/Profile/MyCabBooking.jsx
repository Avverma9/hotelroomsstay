import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getBookings } from "../../redux/slices/car";

export default function CabBooking() {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await dispatch(getBookings());
        if (!mounted) return;
        if (response.payload && Array.isArray(response.payload)) {
          setBookings(response.payload);
        } else if (response.error) {
          const errMsg = String(response.error || "").toLowerCase();
          if (errMsg.includes("404") || errMsg.includes("no booking") || errMsg.includes("not found")) {
            setBookings([]);
          } else {
            setError("Unable to load bookings. Please try again.");
          }
        } else {
          setBookings([]);
        }
      } catch (e) {
        if (mounted) setError("Unable to load bookings. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBookings();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  if (loading) return <div className="py-16 text-center">Loading your bookings…</div>;
  if (error) return <div className="py-16 text-center text-red-600">{error}</div>;
  if (!bookings || !bookings.length) return <div className="py-16 text-center">No cab bookings yet.</div>;

  return (
    <div className="py-8">
      <p className="mb-4">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</p>
      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b._id || b.bookingId} className="p-3 bg-white rounded border">
            <div className="text-sm font-medium">{b.bookingId || b._id}</div>
            <div className="text-xs text-slate-500">{b.pickupP || "-"} → {b.dropP || "-"}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
