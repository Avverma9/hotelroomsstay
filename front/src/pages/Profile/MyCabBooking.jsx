import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getBookings } from "../../redux/slices/car";

export default function CabBooking() {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await dispatch(getBookings());
        if (response.payload && Array.isArray(response.payload)) {
          setBookings(response.payload);
        } else {
          if (response.error?.message?.includes("404")) {
            // It's a 404, so no bookings exist. Don't set an error.
          } else {
            setError("Unable to load bookings. Please try again.");
          }
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotalAmount = (seats) => {
    if (!seats || seats.length === 0) return 0;
    return seats.reduce((total, seat) => total + (seat.seatPrice || 0), 0);
  };

  return (
    <div className="min-h-screen bg-white-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32" role="status" aria-live="polite">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-pulse"></div>
            </div>
            <p className="mt-6 text-slate-600 font-medium">Loading your bookings...</p>
            <p className="mt-1 text-sm text-slate-500">Please wait a moment</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error.status === 404 && (
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-800 font-semibold">Error Loading Bookings</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Bookings Grid */}
        {!loading && !error && bookings.length > 0 ? (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-slate-700">
                <span className="text-lg font-semibold">{bookings.length}</span>
                <span className="ml-1">booking{bookings.length !== 1 ? 's' : ''} found</span>
              </div>
              <div className="text-sm text-slate-500">
                Sorted by most recent
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {bookings.map((booking, index) => {
                const totalAmount = calculateTotalAmount(booking?.carDetails?.bookedSeats);
                const seatCount = booking?.carDetails?.bookedSeats?.length || 0;

                return (
                  <article
                    key={booking._id || index}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden group"
                  >
                    {/* Card Header */}
                    <header className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                      <div className="flex items-center justify-between">

                          <div className="text-sm opacity-90">Total</div>
                          <div className="font-bold text-lg">
                            {formatCurrency(totalAmount)}
                          </div>
                        </div>
            
                    </header>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      {/* Customer Info */}
                      <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1">
                          Customer Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Name:</span>
                            <span className="font-medium text-slate-900">
                              {booking?.bookedBy || 'Not provided'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Mobile:</span>
                            <span className="font-medium text-slate-900">
                              {booking?.customerMobile || 'Not provided'}
                            </span>
                          </div>
                        </div>
                      </section>

                      {/* Trip Info */}
                      <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1">
                          Trip Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Vehicle:</span>
                            <span className="font-medium text-slate-900">
                              {booking?.vehicleType || 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <span className="text-slate-600 text-xs">Pickup:</span>
                                <p className="font-medium text-slate-900 break-words">
                                  {booking?.pickupP || 'Not specified'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <span className="text-slate-600 text-xs">Drop-off:</span>
                                <p className="font-medium text-slate-900 break-words">
                                  {booking?.dropP || 'Not specified'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Seats Info */}
                      <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-1">
                          Seat Reservations ({seatCount})
                        </h3>
                        {booking?.carDetails?.bookedSeats?.length > 0 ? (
                          <div className="space-y-2">
                            {booking.carDetails.bookedSeats.map((seat, seatIndex) => (
                              <div
                                key={seat._id || seatIndex}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold">
                                    {seat.seatNumber}
                                  </div>
                                  <div>
                                    <div className="font-medium text-slate-900 text-sm">
                                      {seat.seatType || 'Standard'}
                                    </div>
                                    <div className="text-xs text-slate-600">
                                      Seat #{seat.seatNumber}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-slate-900">
                                    {formatCurrency(seat.seatPrice || 0)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-slate-500">
                            <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm">No seat information available</p>
                          </div>
                        )}
                      </section>
                    </div>

                    {/* Card Footer */}
                    <footer className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex justify-between items-center">
                        <span>
                          Booking ID: {booking?._id?.slice(-8)?.toUpperCase() || 'N/A'}
                        </span>
                        <span>
                          {formatDate(booking?.bookingDate) || 'Date not available'}
                        </span>
                      </div>
                    </footer>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          !loading && !error && (
            <div className="text-center py-16 sm:py-24">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m6.75 4.5v-3a3 3 0 00-3-3H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125v-9c0-.621.504-1.125 1.125-1.125H15.75m-12.375 0h9v1.5H3.375" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No bookings found
                </h3>
                <p className="text-slate-600 mb-6">
                  You haven't made any cab bookings yet. When you do, they'll appear here.
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Book Your First Ride
                </button>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
