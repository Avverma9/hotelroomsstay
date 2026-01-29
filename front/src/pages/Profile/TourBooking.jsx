import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBookings } from "../../redux/slices/travelSlice";
import { formatDate } from "../../utils/convertDate";
import {
  IoClose,
  IoPricetagOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import {
  FaRegCalendarAlt,
  FaMapMarkerAlt,
  FaMoon,
  FaSun,
} from "react-icons/fa";

const Modal = ({ open, onClose, children, title }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden animate-fadeIn max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <IoClose className="text-xl text-gray-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-xl shadow-sm p-5 space-y-3">
    <div className="h-5 bg-gray-200 rounded w-2/3"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    <div className="h-9 bg-gray-200 rounded w-24 mt-3"></div>
  </div>
);

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-blue-600 mt-1">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

const ListSection = ({ title, items, icon, itemClassName }) => {
  if (!items || items.length === 0) return null;
  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
        {icon} {title}
      </h3>
      <ul className="space-y-2 pl-2">
        {items.map((item, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 text-sm ${itemClassName}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
};

const BookingModal = ({ booking, onClose }) => {
  if (!booking) return null;
  const isCustomizable = !!booking?.isCustomizable;
  const dateRows = isCustomizable
    ? [
        { label: "Travel From", value: formatDate(booking.from) },
        { label: "Travel To", value: formatDate(booking.to) },
      ]
    : [
        {
          label: "Tour Start Date",
          value: formatDate(booking.tourStartDate || booking.from),
        },
        booking.to
          ? { label: "Ends", value: formatDate(booking.to) }
          : null,
      ].filter(Boolean);
  const travellerSummary = {
    adults: booking.numberOfAdults ?? 1,
    children: booking.numberOfChildren ?? 0,
    childDOBs: booking.childDateOfBirth || [],
  };

  return (
    <Modal open={!!booking} onClose={onClose} title="Booking Details">
      <div className="space-y-6">
        {/* Trip Details */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                {booking.themes}
              </p>
              <h3 className="text-2xl font-semibold text-gray-900">
                {booking.travelAgencyName}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                <FaMapMarkerAlt className="text-blue-500" /> {booking.city}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isCustomizable
                  ? "bg-amber-50 text-amber-700"
                  : "bg-indigo-50 text-indigo-700"
              }`}
            >
              {isCustomizable ? "Customizable" : "Fixed Package"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {dateRows.map((row) => (
              <DetailItem
                key={row.label}
                icon={<FaRegCalendarAlt />}
                label={row.label}
                value={row.value}
              />
            ))}
            <div className="flex items-center gap-4 col-span-full">
              <DetailItem icon={<FaSun />} label="Days" value={booking.days} />
              <DetailItem icon={<FaMoon />} label="Nights" value={booking.nights} />
            </div>
          </div>
        </section>

        {/* Travellers */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-gray-200 p-4">
          <div>
            <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
              Travellers
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-500">Adults</p>
                <p className="text-xl font-bold text-gray-800">
                  {travellerSummary.adults}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Children</p>
                <p className="text-xl font-bold text-gray-800">
                  {travellerSummary.children}
                </p>
              </div>
            </div>
            {travellerSummary.childDOBs.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                Child DOBs: {travellerSummary.childDOBs.map((dob) => formatDate(dob)).join(", ")}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs uppercase text-blue-700 font-semibold tracking-wide">
              Package Amount
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-800">
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(booking.price || booking.totalAmount || booking.basePrice || 0)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Booking ID: <span className="font-mono">{booking.bookingId}</span>
            </p>
          </div>
        </section>

      {/* Day-wise Itinerary */}
      {booking.dayWise && booking.dayWise.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
            Itinerary
          </h3>
          <div className="space-y-4">
            {booking.dayWise
              .filter((d) => d.description)
              .map((day) => (
                <div key={day._id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 bg-blue-100 text-blue-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">
                    {day.day}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {day.description}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Package Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ListSection
          title="Amenities"
          items={booking.amenities}
          icon={<IoSparklesOutline />}
          itemClassName="text-gray-700"
        />
        <ListSection
          title="Inclusions"
          items={booking.inclusion}
          icon={<IoCheckmarkCircleOutline className="text-green-500" />}
          itemClassName="text-green-800 font-medium"
        />
        <ListSection
          title="Exclusions"
          items={booking.exclusion}
          icon={<IoCloseCircleOutline className="text-red-500" />}
          itemClassName="text-red-700"
        />
      </div>

        {/* Pricing */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
            <IoPricetagOutline /> Pricing
          </h3>
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg text-lg font-bold text-blue-800">
            <span>Total Amount Paid:</span>
            <span>
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(booking.price || booking.totalAmount || booking.basePrice || 0)}
            </span>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default function TourBooking() {
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.travel.bookings);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    dispatch(getBookings())
      .unwrap()
      .catch((err) => {
        // Only set an error if it's not a 404
        if (err.status !== 404) {
          setError("Failed to load tour bookings. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const openModal = (booking) => setSelectedBooking(booking);
  const closeModal = () => setSelectedBooking(null);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
          <p className="text-lg font-medium">{error}</p>
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg">No tour bookings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const isCustomizable = !!booking?.isCustomizable;
            const dateRows = isCustomizable
              ? [
                  { label: "From", value: formatDate(booking.from) },
                  { label: "To", value: formatDate(booking.to) },
                ]
              : [
                  {
                    label: "Tour Start Date",
                    value: formatDate(booking.tourStartDate || booking.from),
                  },
                ];
            const travellerSummary = {
              adults: booking.numberOfAdults ?? 1,
              children: booking.numberOfChildren ?? 0,
            };
            const childDOBs = booking.childDateOfBirth || [];

            return (
              <div
                key={booking._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                <header className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-800 hover:text-blue-600 transition-colors">
                        {booking.travelAgencyName}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-500" /> {booking.city}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isCustomizable
                            ? "bg-amber-50 text-amber-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {isCustomizable ? "Customizable" : "Fixed Package"}
                      </span>
                      <div className="text-lg font-bold text-blue-600 whitespace-nowrap">
                        ₹{(booking.price || booking.totalAmount || booking.basePrice || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </header>

                <div className="p-5 flex-1 space-y-4 text-sm">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {isCustomizable ? "Selected Travel Range" : "Departure"}
                    </p>
                    <div className="mt-3 space-y-2">
                      {dateRows.map((row) => (
                        <div key={row.label} className="flex justify-between">
                          <span className="text-slate-500">{row.label}</span>
                          <span className="font-medium text-slate-800">{row.value}</span>
                        </div>
                      ))}
                      {!isCustomizable && booking.to && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ends</span>
                          <span className="font-medium text-slate-800">
                            {formatDate(booking.to)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Travellers
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Adults</span>
                        <span className="text-lg font-semibold text-slate-900">
                          {travellerSummary.adults}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Children</span>
                        <span className="text-lg font-semibold text-slate-900">
                          {travellerSummary.children}
                        </span>
                      </div>
                    </div>
                    {childDOBs.length > 0 && (
                      <p className="mt-3 text-xs text-slate-500">
                        Child DOBs: {childDOBs.map((dob) => formatDate(dob)).join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-semibold text-slate-900">
                        {booking.nights}N / {booking.days}D
                      </span>
                    </div>
                    {booking.visitngPlaces && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                        {booking.visitngPlaces.replace(/\|/g, " · ")}
                      </p>
                    )}
                  </div>
                </div>

                <footer className="p-4 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => openModal(booking)}
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm shadow-sm"
                  >
                    View Details
                  </button>
                  <div className="text-center text-xs text-slate-400 mt-2">
                    Booking ID:{" "}
                    <span className="font-mono">{booking.bookingId}</span>
                  </div>
                </footer>
              </div>
            );
          })}
        </div>
      )}

      {selectedBooking && (
        <BookingModal booking={selectedBooking} onClose={closeModal} />
      )}
    </div>
  );
}
