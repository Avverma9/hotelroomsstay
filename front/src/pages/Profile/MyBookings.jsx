import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFilteredBooking } from "../../redux/slices/bookingSlice";
import { useLoader } from "../../utils/loader";
import NotFoundPage from "../../utils/Not-found";
import { Unauthorized } from "../../utils/Unauthorized";
import { useToast } from "../../utils/toast";
import { IoCloseSharp, IoPrintOutline, IoReceiptOutline } from "react-icons/io5";
import { FiFilter, FiMapPin } from "react-icons/fi";
import { useMediaQuery } from "@mui/material";

// --- 1. UTILITIES ---

const decodeHtmlEntities = (input = "") => {
  if (typeof document === "undefined") return input;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = input;
  return textarea.value;
};

const hasHtmlTag = (input = "") => /<[a-z][\s\S]*>/i.test(input);

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const calculateNightsBetween = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0;
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return `₹${amount.toLocaleString("en-IN")}`;
};

const replaceIsoDateTimesInHtml = (html = "") =>
  String(html).replace(
    /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z\b/g,
    (match) => formatDateTime(match)
  );

const buildPrintableBookingHtml = (booking = {}) => {
  const bookingRef = booking.bookingId || booking.bookingCode || booking._id || "N/A";
  const hotelName = booking.hotelDetails?.hotelName || booking.hotelName || "Hotel";
  const destination = booking.destination || booking.hotelDetails?.destination || "N/A";
  const guestName = booking.user?.name || booking.guestDetails?.fullName || "Guest";
  const roomType = booking.roomDetails?.[0]?.type || "Standard";
  const guests = booking.guests || booking.numberOfGuests || 0;
  const checkIn = formatDateTime(booking.checkInDate);
  const checkOut = formatDateTime(booking.checkOutDate);
  const nights = calculateNightsBetween(booking.checkInDate, booking.checkOutDate);
  const totalAmount = Number(booking.price) || 0;
  const gstAmount = Number(booking.gstAmount ?? booking.taxes ?? 0) || 0;
  const baseAmount = Math.max(totalAmount - gstAmount, 0);

  return `
    <div class="print-container" style="border-radius:12px; border:1px solid #dbe2ea; padding:16px; max-width:420px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px dashed #cbd5e1; padding-bottom:10px; margin-bottom:12px;">
        <div>
          <div style="font-size:20px; font-weight:800; color:#0f172a;">${escapeHtml(hotelName)}</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">${escapeHtml(destination)}</div>
        </div>
        <div style="font-size:11px; font-weight:700; color:#0f766e; border:1px solid #99f6e4; border-radius:999px; padding:4px 8px;">
          ${escapeHtml(booking.bookingStatus || "Confirmed")}
        </div>
      </div>
      <div style="font-size:12px; color:#334155; margin-bottom:6px;"><strong>Booking ID:</strong> ${escapeHtml(bookingRef)}</div>
      <div style="font-size:12px; color:#334155; margin-bottom:6px;"><strong>Guest:</strong> ${escapeHtml(guestName)}</div>
      <div style="font-size:12px; color:#334155; margin-bottom:6px;"><strong>Room:</strong> ${escapeHtml(roomType)} (${escapeHtml(guests)} Guests)</div>
      <div style="font-size:12px; color:#334155; margin-bottom:6px;"><strong>Check-in:</strong> ${escapeHtml(checkIn)}</div>
      <div style="font-size:12px; color:#334155; margin-bottom:6px;"><strong>Check-out:</strong> ${escapeHtml(checkOut)}</div>
      <div style="font-size:12px; color:#334155; margin-bottom:12px;"><strong>Nights:</strong> ${escapeHtml(nights || 0)}</div>
      <div style="border-top:1px solid #e2e8f0; padding-top:10px;">
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:4px;">
          <span>Base Amount</span>
          <span>${formatCurrency(baseAmount)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px;">
          <span>GST & Taxes</span>
          <span>${formatCurrency(gstAmount)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:800; color:#0f172a;">
          <span>Total Paid</span>
          <span>${formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  `;
};

const normalizePrintableHtml = (htmlContent) => {
  const raw = String(htmlContent || "").trim();
  if (!raw) return "";

  if (hasHtmlTag(raw)) return raw;

  const decoded = decodeHtmlEntities(raw).trim();
  if (hasHtmlTag(decoded)) return decoded;

  return `<div class="print-container">${decoded || raw}</div>`;
};

// Print Function (Opens a new window with Tailwind CDN for styling)
const printSpecificContent = (htmlContent) => {
  const printableHtml = normalizePrintableHtml(htmlContent);
  if (!printableHtml) return;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Ticket</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; background: #fff; padding: 20px; display: flex; justify-content: center; }
            .print-container { max-width: 400px; width: 100%; border: 2px solid #0f172a; padding: 20px; }
          </style>
        </head>
        <body>
          ${printableHtml}
          <script>
            setTimeout(() => { window.print(); window.close(); }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

// Modal Shell
const ModalShell = ({ open, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {children}
      </div>
    </div>
  );
};

// --- 2. MAIN COMPONENT ---

export default function MyBookings() {
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();
  const toast = useToast();
  const showLoaderRef = useRef(showLoader);
  const hideLoaderRef = useRef(hideLoader);
  const toastRef = useRef(toast);
  
  // State
  const [htmlContent, setHtmlContent] = useState("");
  const [bookings, setBookings] = useState([]);
  
  // Modal State
  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("Confirmed");
  
  // Redux & Globals
  const filteredBookings = useSelector((state) => state.booking.filteredBookings);
  const userIdLocal = localStorage.getItem("rsUserId");
  const isSmallScreen = useMediaQuery('(max-width:768px)');
  const bookingsPerPage = isSmallScreen ? 5 : 10;

  useEffect(() => {
    showLoaderRef.current = showLoader;
    hideLoaderRef.current = hideLoader;
    toastRef.current = toast;
  }, [showLoader, hideLoader, toast]);

  const findBookingByRef = useCallback((value) => {
    const normalizedRef = String(value || "").trim().toLowerCase();
    if (!normalizedRef) return null;
    return (
      bookings.find((booking) =>
        [
          booking?.bookingId,
          booking?._id,
          booking?.bookingCode,
          booking?.reference,
          booking?.referenceCode,
        ]
          .filter(Boolean)
          .some((candidate) => String(candidate).trim().toLowerCase() === normalizedRef)
      ) || null
    );
  }, [bookings]);

  // --- 3. WINDOW HANDLERS (Bridge Backend to Frontend) ---
  useEffect(() => {
    window.handlePageChange = (page) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.handleShowDetails = (id) => {
      const booking = findBookingByRef(id);
      if (booking) {
        setModalData(booking);
        setShowModal(true);
      }
    };

    window.handlePrintTicket = (contentHtml) => {
      const rawInput = String(contentHtml || "").trim();
      if (!rawInput) return;

      const decodedInput = decodeHtmlEntities(rawInput).trim();
      if (hasHtmlTag(rawInput) || hasHtmlTag(decodedInput)) {
        printSpecificContent(decodedInput || rawInput);
        return;
      }

      const booking = findBookingByRef(decodedInput || rawInput);
      if (booking) {
        printSpecificContent(buildPrintableBookingHtml(booking));
        return;
      }

      const hiddenElement = document.getElementById(`print-view-${decodedInput || rawInput}`);
      if (hiddenElement?.innerHTML) {
        printSpecificContent(hiddenElement.innerHTML);
        return;
      }

      toastRef.current?.error("Ticket details available nahi hain print ke liye.");
    };

    return () => {
      delete window.handlePageChange;
      delete window.handleShowDetails;
      delete window.handlePrintTicket;
    };
  }, [findBookingByRef]);

  // --- 4. DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      if (!userIdLocal) return;
      try {
        showLoaderRef.current?.();
        await dispatch(fetchFilteredBooking({ 
          selectedStatus, 
          userId: userIdLocal, 
          page: currentPage, 
          limit: bookingsPerPage 
        }));
      } catch {
        toastRef.current?.error("Failed to load bookings");
      } finally {
        hideLoaderRef.current?.();
      }
    };
    fetchData();
  }, [dispatch, selectedStatus, currentPage, userIdLocal, bookingsPerPage]);

  // Sync Redux Data
  useEffect(() => {
    if (filteredBookings) {
      setHtmlContent(replaceIsoDateTimesInHtml(filteredBookings.html || ""));
      setBookings(Array.isArray(filteredBookings.data) ? filteredBookings.data : []);
    }
  }, [filteredBookings]);

  // --- 5. SMART PRINT HANDLER ---
  const handlePrintFromModal = () => {
    // Try to find the pre-generated HTML from the hidden DOM list first (Best Quality)
    if (modalData) {
      const hiddenElement = document.getElementById(`print-view-${modalData.bookingId}`);
      if (hiddenElement) {
        printSpecificContent(hiddenElement.innerHTML);
      } else {
        const visibleReceipt = document.getElementById(
          `booking-receipt-${modalData.bookingId || "active"}`
        );
        if (visibleReceipt) {
          printSpecificContent(visibleReceipt.outerHTML);
        } else {
          // Final fallback: Print current screen
          window.print();
        }
      }
    }
  };

  // --- 6. RENDER HELPERS (Calculations) ---
  const calculateCosts = (data) => {
    if(!data) return { roomTotal: 0, foodTotal: 0, tax: 0, grandTotal: 0 };
    
    // Safety checks for numbers
    const finalPrice = Number(data.price) || 0;
    const foodTotal = (data.foodDetails || []).reduce((acc, f) => acc + ((Number(f.price)||0) * (Number(f.quantity)||1)), 0);
    
    // Reverse calculation assuming finalPrice includes 12% GST
    const baseAmount = Math.round(finalPrice / 1.12); 
    const tax = finalPrice - baseAmount;
    const roomTotal = baseAmount - foodTotal;

    return { roomTotal, foodTotal, tax, grandTotal: finalPrice };
  };

  if (!userIdLocal) return <Unauthorized />;

  const costs = calculateCosts(modalData);
  const stayNights = calculateNightsBetween(modalData?.checkInDate, modalData?.checkOutDate);

  return (
    <main className="p-2 md:p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <IoReceiptOutline className="text-slate-600" /> My Bookings
          </h1>
          <div className="relative w-full sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-slate-900 outline-none appearance-none"
            >
              {['Confirmed', 'Pending', 'Checked-in', 'Checked-out', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* --- BOOKING LIST (Backend HTML) --- */}
        <div className="min-h-[400px]">
          {htmlContent ? (
            <div className="animate-fadeIn" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : (
            <div className="text-center py-10"><NotFoundPage /></div>
          )}
        </div>
      </div>

      {/* --- TICKET MODAL (Receipt Style) --- */}
      <ModalShell open={showModal}>
        {modalData && (
          <div className="flex flex-col h-full bg-white">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Booking Details</h2>
              <button onClick={() => setShowModal(false)} className="bg-white p-1.5 rounded-full shadow-sm border hover:bg-red-50 hover:text-red-500 transition-all">
                <IoCloseSharp size={18} />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-white">
              <div
                id={`booking-receipt-${modalData.bookingId || "active"}`}
                className="border-2 border-slate-800 p-5 rounded-sm relative"
              >
                
                {/* 1. Ticket Header */}
                <div className="flex justify-between items-start mb-6 border-b border-dashed border-slate-300 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{modalData.hotelDetails?.hotelName}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                       <FiMapPin className="inline w-3 h-3" /> {modalData.destination}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${modalData.bookingStatus === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {modalData.bookingStatus}
                    </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        ID: #
                        {String(modalData.bookingId || modalData.bookingCode || modalData._id || "N/A")
                          .slice(-6)
                          .toUpperCase()}
                      </p>
                  </div>
                </div>

                {/* 2. Dates Timeline */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-100 mb-5">
                   <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Check-in</p>
                      <p className="text-sm font-bold text-slate-900">{formatDateTime(modalData.checkInDate)}</p>
                   </div>
                   <div className="flex-1 px-4 flex flex-col items-center">
                      <div className="w-full h-px bg-slate-300"></div>
                      <span className="text-[9px] bg-white px-2 -mt-2 text-slate-400 font-medium">
                        {stayNights} Night{stayNights > 1 ? "s" : ""}
                      </span>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Check-out</p>
                      <p className="text-sm font-bold text-slate-900">{formatDateTime(modalData.checkOutDate)}</p>
                   </div>
                </div>

                {/* 3. Room & Guests */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-5">
                   <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Guest Name</p>
                      <p className="font-semibold text-slate-800">{modalData.user?.name || "Guest"}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Room Type</p>
                      <p className="font-semibold text-slate-800">
                        {modalData.roomDetails?.[0]?.type || "Standard"}
                        <span className="text-slate-400 font-normal"> ({modalData.guests} Guests)</span>
                      </p>
                   </div>
                </div>

                {/* 4. Food Orders (Conditional) */}
                {modalData.foodDetails?.length > 0 && (
                   <div className="mb-5 pt-3 border-t border-dashed border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-orange-500 mb-2">Food Orders</p>
                      {modalData.foodDetails.map((f, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-600 mb-1">
                           <span>{f.name} <span className="text-slate-400">x{f.quantity}</span></span>
                           <span className="font-medium">₹{f.price * f.quantity}</span>
                        </div>
                      ))}
                   </div>
                )}

                {/* 5. Payment Breakdown */}
                <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-2">
                   <div className="flex justify-between text-xs text-slate-500">
                      <span>Room Base Price</span>
                      <span>₹{costs.roomTotal}</span>
                   </div>
                   {costs.foodTotal > 0 && (
                     <div className="flex justify-between text-xs text-slate-500">
                        <span>Food & Beverages</span>
                        <span>₹{costs.foodTotal}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-xs text-slate-500">
                      <span>GST & Taxes (12%)</span>
                      <span>₹{costs.tax}</span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                      <span className="text-sm font-bold text-slate-900">Total Paid</span>
                      <span className="text-lg font-black text-slate-900">₹{costs.grandTotal}</span>
                   </div>
                </div>

              </div>
            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <button 
                onClick={handlePrintFromModal}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold text-sm shadow-lg transition-all flex justify-center items-center gap-2 active:scale-95"
              >
                <IoPrintOutline size={18} /> Print Ticket
              </button>
            </div>

          </div>
        )}
      </ModalShell>

    </main>
  );
}
