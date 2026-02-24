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

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_REGEX =
  /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?\b/g;
const DATE_TEXT_REGEX = /\b\d{4}-\d{2}-\d{2}\b/g;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDateTime = (value, { includeTime = true } = {}) => {
  if (!value) return "N/A";
  const raw = String(value).trim();

  if (DATE_ONLY_REGEX.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  if (includeTime && raw.includes("T")) {
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
  const amount = toNumber(value, 0);
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const deriveBookingFinancials = (booking = {}) => {
  const totalAmount = toNumber(booking?.price, 0);
  const roomSubtotal = (booking?.roomDetails || []).reduce(
    (sum, room) => sum + toNumber(room?.price, 0),
    0
  );
  const foodSubtotal = (booking?.foodDetails || []).reduce((sum, food) => {
    const quantity = Math.max(toNumber(food?.quantity, 1), 1);
    return sum + toNumber(food?.price, 0) * quantity;
  }, 0);
  const discount = Math.max(toNumber(booking?.discountPrice, 0), 0);

  const explicitGstAmount =
    toNumberOrNull(booking?.gstAmount) ??
    toNumberOrNull(booking?.taxes) ??
    toNumberOrNull(booking?.tax) ??
    toNumberOrNull(booking?.gstValue);

  const gstRateCandidate =
    toNumberOrNull(booking?.gstPercent) ??
    toNumberOrNull(booking?.gstPercentage) ??
    toNumberOrNull(booking?.gstPrice) ??
    toNumberOrNull(booking?.gst);
  const gstRate =
    gstRateCandidate !== null && gstRateCandidate > 0 && gstRateCandidate <= 30
      ? gstRateCandidate
      : null;

  let gstAmount = 0;
  if (explicitGstAmount !== null && explicitGstAmount >= 0) {
    gstAmount = explicitGstAmount;
  } else if (gstRate !== null) {
    gstAmount = Number(
      Math.max((totalAmount * gstRate) / (100 + gstRate), 0).toFixed(2)
    );
  } else if (gstRateCandidate !== null && gstRateCandidate > 30) {
    gstAmount = gstRateCandidate;
  } else {
    const inferredWithoutTax = Math.max(roomSubtotal + foodSubtotal - discount, 0);
    gstAmount = Math.max(totalAmount - inferredWithoutTax, 0);
  }

  const billedSubtotal = Math.max(totalAmount - gstAmount, 0);
  const itemsSubtotal = Math.max(roomSubtotal + foodSubtotal - discount, 0);

  return {
    totalAmount,
    roomSubtotal,
    foodSubtotal,
    discount,
    gstRate,
    gstAmount,
    billedSubtotal,
    itemsSubtotal,
  };
};

const replaceIsoDateTimesInHtml = (html = "") => {
  const withDateTimeFormatted = String(html || "").replace(
    DATE_TIME_REGEX,
    (match) => formatDateTime(match, { includeTime: true })
  );
  return withDateTimeFormatted.replace(
    DATE_TEXT_REGEX,
    (match) => formatDateTime(match, { includeTime: false })
  );
};

const buildPrintableBookingHtml = (booking = {}) => {
  const bookingRef = booking.bookingId || booking.bookingCode || booking._id || "N/A";
  const hotelName = booking.hotelDetails?.hotelName || booking.hotelName || "Hotel";
  const hotelContactInfo = "info@hotelroomsstay.com"
  const destination = booking.destination || booking.hotelDetails?.destination || "N/A";
  const guestName = booking.guestDetails?.fullName || booking.user?.name || "Guest";
  const guestEmail = booking.guestDetails?.email || booking.user?.email || "N/A";
  const guestMobile = booking.guestDetails?.mobile || booking.user?.mobile || "N/A";
  const guests = toNumber(booking.guests ?? booking.numberOfGuests, 0);
  const roomsCount = toNumber(booking.numRooms, (booking.roomDetails || []).length || 1);
  const checkIn = formatDateTime(booking.checkInDate, { includeTime: true });
  const checkOut = formatDateTime(booking.checkOutDate, { includeTime: true });
  const nights = calculateNightsBetween(booking.checkInDate, booking.checkOutDate);
  const paymentMode = booking.pm || "N/A";
  const bookingSource = booking.bookingSource || "N/A";
  const bookedOn = formatDateTime(booking.createdAt, { includeTime: true });
  const status = booking.bookingStatus || "Confirmed";
  const rooms = Array.isArray(booking.roomDetails) ? booking.roomDetails : [];
  const foods = Array.isArray(booking.foodDetails) ? booking.foodDetails : [];

  const {
    totalAmount,
    roomSubtotal,
    foodSubtotal,
    discount,
    gstRate,
    gstAmount,
    billedSubtotal,
    itemsSubtotal,
  } = deriveBookingFinancials(booking);

  const roomRowsHtml = rooms.length
    ? rooms
        .map(
          (room, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(room?.roomId || room?._id || "N/A")}</td>
              <td>${escapeHtml(room?.type || "Standard")}</td>
              <td>${escapeHtml(room?.bedTypes || "N/A")}</td>
              <td class="text-right">${formatCurrency(room?.price || 0)}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5" class="empty-cell">No room details available</td></tr>`;

  const foodRowsHtml = foods.length
    ? foods
        .map((food, index) => {
          const quantity = Math.max(toNumber(food?.quantity, 1), 1);
          const unitPrice = toNumber(food?.price, 0);
          const lineTotal = unitPrice * quantity;
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(food?.name || "Item")}</td>
              <td class="text-center">${quantity}</td>
              <td class="text-right">${formatCurrency(unitPrice)}</td>
              <td class="text-right">${formatCurrency(lineTotal)}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="5" class="empty-cell">No food items selected</td></tr>`;

  return `
    <div class="print-sheet">
      <div class="print-header">
        <div>
          <h1>Hotel Booking Receipt</h1>
          <p>${escapeHtml(hotelName)} · ${escapeHtml(destination)}</p>
        </div>
        <div class="status-chip">${escapeHtml(status)}</div>
      </div>

      <div class="meta-grid">
        <div class="meta-card">
          <h3>Booking Details</h3>
          <div class="kv-row"><span>Booking ID</span><strong>${escapeHtml(bookingRef)}</strong></div>
          <div class="kv-row"><span>Booked On</span><strong>${escapeHtml(bookedOn)}</strong></div>
          <div class="kv-row"><span>Source</span><strong>${escapeHtml(bookingSource)}</strong></div>
          <div class="kv-row"><span>Payment</span><strong>${escapeHtml(paymentMode)}</strong></div>
        </div>
        <div class="meta-card">
          <h3>Guest & Stay</h3>
          <div class="kv-row"><span>Guest</span><strong>${escapeHtml(guestName)}</strong></div>
          <div class="kv-row"><span>Mobile</span><strong>${escapeHtml(guestMobile)}</strong></div>
          <div class="kv-row"><span>Email</span><strong>${escapeHtml(guestEmail)}</strong></div>
          <div class="kv-row"><span>Stay</span><strong>${escapeHtml(checkIn)} to ${escapeHtml(checkOut)}</strong></div>
          <div class="kv-row"><span>Rooms / Guests</span><strong>${roomsCount} / ${guests}</strong></div>
          <div class="kv-row"><span>Nights</span><strong>${nights}</strong></div>
        </div>
      </div>

      <div class="section">
        <h3>Room Breakdown</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Room ID</th>
              <th>Type</th>
              <th>Bed</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>${roomRowsHtml}</tbody>
        </table>
      </div>

      <div class="section">
        <h3>Food Breakdown</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Unit</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>${foodRowsHtml}</tbody>
        </table>
      </div>

      <div class="section">
        <h3>Payment Summary</h3>
        <table class="summary-table">
          <tbody>
            <tr><td>Room Charges</td><td>${formatCurrency(roomSubtotal)}</td></tr>
            <tr><td>Food Charges</td><td>${formatCurrency(foodSubtotal)}</td></tr>
            <tr><td>Discount</td><td>- ${formatCurrency(discount)}</td></tr>
            <tr><td>Items Subtotal (after discount)</td><td>${formatCurrency(itemsSubtotal)}</td></tr>
            <tr><td>Taxable/Base (billed)</td><td>${formatCurrency(billedSubtotal)}</td></tr>
            <tr><td>GST Rate</td><td>${gstRate !== null ? `${gstRate}%` : "N/A"}</td></tr>
            <tr><td>GST Amount</td><td>${formatCurrency(gstAmount)}</td></tr>
            <tr class="grand-total"><td>Grand Total</td><td>${formatCurrency(totalAmount)}</td></tr>
          </tbody>
        </table>
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

// Print Function (Opens a dedicated print window for booking receipt)
const printSpecificContent = (htmlContent) => {
  const printableHtml = normalizePrintableHtml(htmlContent);
  if (!printableHtml) return;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <h4>For help and support contact or mail at info@hotelroomsstay.com</h4>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 24px;
              font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #f8fafc;
            }
            .print-sheet {
              width: 100%;
              max-width: 860px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #dbe3ee;
              border-radius: 14px;
              padding: 20px;
              box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
            }
            .print-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 12px;
              margin-bottom: 14px;
              gap: 16px;
            }
            .print-header h1 {
              margin: 0;
              font-size: 22px;
              line-height: 1.2;
              font-weight: 800;
            }
            .print-header p {
              margin: 4px 0 0;
              color: #64748b;
              font-size: 13px;
            }
            .status-chip {
              padding: 6px 10px;
              border-radius: 999px;
              border: 1px solid #b8f2dc;
              background: #ecfdf5;
              color: #047857;
              font-size: 12px;
              font-weight: 700;
              white-space: nowrap;
              text-transform: uppercase;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 14px;
            }
            .meta-card {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 10px 12px;
              background: #f8fafc;
            }
            .meta-card h3 {
              margin: 0 0 8px;
              font-size: 12px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #475569;
            }
            .kv-row {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              padding: 2px 0;
              font-size: 12px;
            }
            .kv-row span { color: #64748b; }
            .kv-row strong {
              font-weight: 600;
              text-align: right;
            }
            .section {
              margin-top: 12px;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              overflow: hidden;
            }
            .section h3 {
              margin: 0;
              font-size: 12px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              padding: 10px 12px;
              background: #f1f5f9;
              color: #475569;
              border-bottom: 1px solid #e2e8f0;
            }
            .data-table, .summary-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            .data-table th {
              background: #f8fafc;
              color: #64748b;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              font-size: 11px;
            }
            .data-table th, .data-table td, .summary-table td {
              border-bottom: 1px solid #e2e8f0;
              padding: 8px 10px;
            }
            .data-table tbody tr:last-child td,
            .summary-table tbody tr:last-child td {
              border-bottom: none;
            }
            .empty-cell {
              text-align: center;
              color: #94a3b8;
              font-style: italic;
            }
            .summary-table td:first-child {
              color: #475569;
            }
            .summary-table td:last-child {
              text-align: right;
              font-weight: 600;
            }
            .summary-table .grand-total td {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              background: #f8fafc;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            @media (max-width: 700px) {
              body { padding: 10px; }
              .meta-grid { grid-template-columns: 1fr; }
            }
            @media print {
              body { background: #fff; padding: 0; }
              .print-sheet {
                box-shadow: none;
                border-radius: 0;
                border: none;
                max-width: 100%;
                padding: 0;
              }
              @page {
                size: A4;
                margin: 12mm;
              }
            }
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
        printSpecificContent(buildPrintableBookingHtml(modalData));
      }
    }
  };

  // --- 6. RENDER HELPERS (Calculations) ---
  const calculateCosts = (data) => {
    if (!data) {
      return { roomTotal: 0, foodTotal: 0, tax: 0, grandTotal: 0, gstRate: null };
    }

    const derived = deriveBookingFinancials(data);
    const roomTotal =
      derived.roomSubtotal > 0
        ? derived.roomSubtotal
        : Math.max(derived.billedSubtotal - derived.foodSubtotal, 0);

    return {
      roomTotal,
      foodTotal: derived.foodSubtotal,
      tax: derived.gstAmount,
      grandTotal: derived.totalAmount,
      gstRate: derived.gstRate,
    };
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
                      <span>{formatCurrency(costs.roomTotal)}</span>
                   </div>
                   {costs.foodTotal > 0 && (
                     <div className="flex justify-between text-xs text-slate-500">
                        <span>Food & Beverages</span>
                        <span>{formatCurrency(costs.foodTotal)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        GST & Taxes {costs.gstRate !== null ? `(${costs.gstRate}%)` : ""}
                      </span>
                      <span>{formatCurrency(costs.tax)}</span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                      <span className="text-sm font-bold text-slate-900">Total Paid</span>
                      <span className="text-lg font-black text-slate-900">
                        {formatCurrency(costs.grandTotal)}
                      </span>
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
