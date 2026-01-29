import React, { useEffect } from 'react';
import {
  CheckCircle2,
  X,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Home,
  Printer,
} from 'lucide-react';

export default function BookingSuccessModal({ isOpen, onClose, bookingData }) {
  useEffect(() => {
    if (isOpen && bookingData) {
      sessionStorage.setItem('bookingSuccessData', JSON.stringify(bookingData));
    }
  }, [isOpen, bookingData]);

  const data = bookingData || JSON.parse(sessionStorage.getItem('bookingSuccessData') || '{}');
  if (!isOpen || !data || Object.keys(data).length === 0) return null;

  const {
    bookingId,
    bookingStatus,
    price,
    gstPrice,
    checkInDate,
    checkOutDate,
    numRooms,
    guests,
    hotelDetails,
    guestDetails,
    roomDetails,
    pm,
  } = data;

  const handleClose = () => {
    sessionStorage.removeItem('bookingSuccessData');
    onClose();
  };

  const handlePrint = () => {
    window.print();
    sessionStorage.removeItem('bookingSuccessData');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Invalid';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const nights = (() => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    return diff || 0;
  })();

  const baseAmount = (price || 0) - (gstPrice || 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm mx-2 bg-white rounded-2xl shadow-2xl overflow-hidden text-xs">
        {/* Ticket header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 relative">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/15 hover:bg-white/25"
          >
            <X size={14} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-green-50">Booking Confirmed</p>
              <p className="text-sm font-semibold text-white truncate">
                {hotelDetails?.hotelName || 'Hotel'}
              </p>
            </div>
          </div>
        </div>

        {/* Ticket main */}
        <div className="px-3 py-2 bg-slate-50">
          {/* Top row: dates + counts */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="bg-white rounded-lg border border-slate-200 px-2 py-1.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Calendar size={10} />
                  In
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-900 truncate">
                {formatDate(checkInDate)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 px-2 py-1.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Calendar size={10} />
                  Out
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-900 truncate">
                {formatDate(checkOutDate)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 px-2 py-1.5">
              <div className="flex items-center justify-between mb-0.5 text-[10px] text-slate-500">
                <span>Nights</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-900">
                {nights} night{nights > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Counts row */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="bg-white rounded-lg border border-slate-200 px-2 py-1.5 text-center">
              <p className="text-base font-semibold text-slate-900">{numRooms || 0}</p>
              <p className="text-[10px] text-slate-500">Room</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 px-2 py-1.5 text-center">
              <p className="text-base font-semibold text-slate-900">{guests || 0}</p>
              <p className="text-[10px] text-slate-500">Guest</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 px-2 py-1.5 text-center">
              <p className="text-[11px] font-semibold text-emerald-600">
                {bookingStatus || 'CONFIRMED'}
              </p>
              <p className="text-[10px] text-slate-500">Status</p>
            </div>
          </div>

          {/* Divider (ticket perforation) */}
          <div className="relative my-1.5">
            <div className="absolute -left-3 top-1 w-6 h-6 bg-slate-50 rounded-full shadow-inner" />
            <div className="absolute -right-3 top-1 w-6 h-6 bg-slate-50 rounded-full shadow-inner" />
            <div className="border-t border-dashed border-slate-300 mx-2" />
          </div>

          {/* Guest + hotel line */}
          <div className="flex items-start gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
              <Home size={16} className="text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {hotelDetails?.hotelName || 'Hotel Name'}
              </p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                <MapPin size={10} />
                {hotelDetails?.destination || 'Location'}
              </p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 truncate">
                <User size={10} />
                {guestDetails?.fullName || 'Guest Name'}
              </p>
            </div>
          </div>

          {/* Payment block */}
          <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-2 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                <CreditCard size={11} />
                Payment Summary
              </span>
              <span className="text-[10px] text-slate-500">
                Mode: <span className="font-semibold">{pm || 'N/A'}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Base Amount</span>
                <span className="text-[11px] font-medium text-slate-900">
                  {formatCurrency(baseAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">GST & Taxes</span>
                <span className="text-[11px] font-medium text-slate-900">
                  {formatCurrency(gstPrice || 0)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-900">Total Paid</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCurrency(price || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact row */}
          <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-2 mb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 mb-0.5">Phone</p>
                <p className="text-[11px] text-slate-900 truncate">
                  {guestDetails?.mobile || 'N/A'}
                </p>
              </div>
              <div className="flex-[1.5] min-w-0">
                <p className="text-[10px] text-slate-500 mb-0.5">Email</p>
                <p className="text-[11px] text-slate-900 truncate">
                  {guestDetails?.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1 bg-white border border-slate-300 rounded-lg py-2 text-[11px] text-slate-700 font-medium"
            >
              <Printer size={13} />
              Print
            </button>
            <button
              onClick={handleClose}
              className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 rounded-lg py-2 text-[11px] text-white font-semibold"
            >
              <CheckCircle2 size={13} />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
