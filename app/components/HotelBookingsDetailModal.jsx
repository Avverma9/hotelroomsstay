import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { sendCancellationOTP, verifyCancellationOTP, resetCancellationOtpState } from "../store/slices/bookingSlice";

// --- Helpers ---
const toList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const toNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
};

const formatLongDate = (dateValue) => {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrencyINR = (value) => {
  const n = toNumber(value);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${n.toLocaleString("en-IN")}`;
  }
};

const getStatusColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("confirm")) return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" };
  if (s.includes("pending")) return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" };
  if (s.includes("cancel")) return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
  return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
};

const calculateBookingCosts = (booking) => {
  const totalPaid = toNumber(booking?.price);

  // Use server-provided fields first; fall back to back-calculation only if absent
  const baseRoomPrice = toNumber(booking?.baseRoomPrice);
  const discountedRoomPrice = toNumber(booking?.discountedRoomPrice) || baseRoomPrice;
  const gstPct = toNumber(booking?.gstPrice) || 12;
  const gst = toNumber(booking?.gstAmount) ||
    (totalPaid > 0 ? Math.round(totalPaid * gstPct / (100 + gstPct)) : 0);
  const discountAmount = toNumber(booking?.discountPrice);

  // foodPrice from server, or derive from foodDetails array
  const foodTotal = toNumber(booking?.foodPrice) ||
    toList(booking?.foodDetails).reduce(
      (sum, item) => sum + toNumber(item?.price) * toNumber(item?.quantity || 1),
      0
    );

  // roomBase: use discountedRoomPrice if server sent it, else back-calculate
  const roomBase = discountedRoomPrice || Math.max(0, (totalPaid > 0 ? Math.round(totalPaid / 1.12) : 0) - foodTotal);

  return { roomBase, discountedRoomPrice, baseRoomPrice, foodTotal, gst, totalPaid, discountAmount };
};

// --- Sub-Components ---
const SectionHeader = ({ iconName, title }) => (
  <View className="flex-row items-center mb-3">
    <Ionicons name={iconName} size={16} color="#737373" />
    <Text className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-2">{title}</Text>
  </View>
);

const InfoRow = ({ label, value, isLast, valueColor = "text-neutral-800" }) => (
  <View className={`flex-row justify-between py-2 ${!isLast ? "border-b border-neutral-100" : ""}`}>
    <Text className="text-sm text-neutral-500">{label}</Text>
    <Text className={`text-sm font-semibold text-right flex-1 ml-4 ${valueColor}`}>{value}</Text>
  </View>
);

export default function HotelBookingsDetailModal({ visible, onClose, booking }) {
  const dispatch = useDispatch();
  const sendOtpStatus = useSelector((state) => state.booking.sendOtpStatus);
  const sendOtpError = useSelector((state) => state.booking.sendOtpError);
  const verifyOtpStatus = useSelector((state) => state.booking.verifyOtpStatus);
  const verifyOtpError = useSelector((state) => state.booking.verifyOtpError);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  const canCancel = booking?.bookingStatus?.toLowerCase() !== "cancelled" && booking?.bookingStatus?.toLowerCase() !== "completed";

  const handleSendOtp = () => {
    if (!booking?.bookingId) return;
    dispatch(sendCancellationOTP(booking.bookingId));
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (!booking?.bookingId || !otp) return;
    dispatch(verifyCancellationOTP({ bookingId: booking.bookingId, otp, cancellationReason }));
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setOtpSent(false);
    setOtp("");
    setCancellationReason("");
    dispatch(resetCancellationOtpState());
  };

  React.useEffect(() => {
    if (verifyOtpStatus === "succeeded") {
      handleCloseCancelModal();
      onClose();
    }
  }, [verifyOtpStatus]);

  if (!visible) return null;

  const statusStyle = getStatusColor(booking?.bookingStatus);
  const costs = calculateBookingCosts(booking);
  const foodList = toList(booking?.foodDetails);
  const isPaid = booking?.isPaid ?? false;
  const paymentMode = booking?.paymentMode || booking?.pm || "online";

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        
        {/* Modal Content */}
        <View className="bg-neutral-50 h-[92%] rounded-t-3xl overflow-hidden shadow-2xl">
          
          {/* Header */}
          <View className="bg-white px-5 py-4 border-b border-neutral-200 flex-row items-start justify-between z-10">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View className={`self-start px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.border}`}>
                  <Text className={`text-[10px] font-bold uppercase ${statusStyle.text}`}>
                    {booking?.bookingStatus || "Pending"}
                  </Text>
                </View>
                <View className={`self-start px-2.5 py-1 rounded-full border ${ isPaid ? "bg-emerald-100 border-emerald-200" : "bg-amber-100 border-amber-200"}`}>
                  <Text className={`text-[10px] font-bold uppercase ${ isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                    {isPaid ? "Paid" : "Unpaid"}
                  </Text>
                </View>
              </View>
              <Text className="text-xl font-black text-neutral-900 leading-tight">
                {booking?.hotelDetails?.hotelName || "Hotel Details"}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="location-outline" size={12} color="#737373" />
                <Text className="text-xs text-neutral-500 ml-1">
                  {booking?.destination || booking?.hotelDetails?.destination || "Location N/A"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-neutral-100 p-2 rounded-full">
              <Ionicons name="close" size={20} color="#171717" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            
            {/* 1. Key Stats Grid */}
            <View className="flex-row flex-wrap bg-white p-4 mb-3 border-b border-neutral-200">
              {/* Check In */}
              <View className="w-1/2 p-2 border-r border-b border-neutral-100">
                <Text className="text-xs text-neutral-400 mb-1">Check-In</Text>
                <View className="flex-row items-center">
                  <Ionicons name="log-in-outline" size={14} color="#059669" />
                  <Text className="text-sm font-bold text-neutral-800 ml-1.5">
                    {formatLongDate(booking?.checkInDate)}
                  </Text>
                </View>
              </View>
              {/* Check Out */}
              <View className="w-1/2 p-2 border-b border-neutral-100 pl-4">
                 <Text className="text-xs text-neutral-400 mb-1">Check-Out</Text>
                 <View className="flex-row items-center">
                  <Ionicons name="log-out-outline" size={14} color="#dc2626" />
                  <Text className="text-sm font-bold text-neutral-800 ml-1.5">
                    {formatLongDate(booking?.checkOutDate)}
                  </Text>
                </View>
              </View>
              {/* Guests */}
              <View className="w-1/2 p-2 border-r border-neutral-100 pt-3">
                 <Text className="text-xs text-neutral-400 mb-1">Guests</Text>
                 <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={14} color="#404040" />
                  <Text className="text-sm font-bold text-neutral-800 ml-1.5">
                    {toNumber(booking?.guests)} Person(s)
                  </Text>
                </View>
              </View>
              {/* Room Type */}
              <View className="w-1/2 p-2 pl-4 pt-3">
                 <Text className="text-xs text-neutral-400 mb-1">Room Type</Text>
                 <View className="flex-row items-center">
                  <Ionicons name="bed-outline" size={14} color="#404040" />
                  <Text className="text-sm font-bold text-neutral-800 ml-1.5" numberOfLines={1}>
                    {booking?.roomDetails?.[0]?.type || "Standard"}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. Guest Info */}
            <View className="mx-4 mt-2 bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
              <SectionHeader iconName="person-circle-outline" title="Primary Guest" />
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-neutral-900">
                  {booking?.guestDetails?.fullName || booking?.user?.name || "Guest"}
                </Text>
                <Text className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2 py-1 rounded">
                  ID: #{String(booking?.bookingId || "").slice(-6)}
                </Text>
              </View>
            </View>

            {/* 3. Food Orders (Conditional) */}
            {foodList.length > 0 && (
              <View className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
                <SectionHeader iconName="restaurant-outline" title="Food Orders" />
                {foodList.map((food, index) => (
                  <View key={index} className="flex-row justify-between py-2 border-b border-dashed border-neutral-100 last:border-0">
                    <View className="flex-row items-center flex-1">
                      <View className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2" />
                      <Text className="text-sm text-neutral-700 flex-1">
                        {food?.name} 
                        {food?.quantity > 1 && <Text className="text-neutral-400 font-bold"> x{food.quantity}</Text>}
                      </Text>
                    </View>
                    <Text className="text-sm font-semibold text-neutral-800">
                      {formatCurrencyINR(toNumber(food?.price) * toNumber(food?.quantity || 1))}
                    </Text>
                  </View>
                ))}
                <View className="flex-row justify-between mt-3 pt-2 border-t border-neutral-100">
                  <Text className="text-xs font-bold text-neutral-500">Food Total</Text>
                  <Text className="text-xs font-bold text-neutral-900">{formatCurrencyINR(costs.foodTotal)}</Text>
                </View>
              </View>
            )}

            {/* 4. Price Breakdown (Receipt Style) */}
            <View className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
              <SectionHeader iconName="card-outline" title="Bill Summary" />

              {/* Base room price — show original if discount applied */}
              {costs.baseRoomPrice > 0 && costs.discountedRoomPrice !== costs.baseRoomPrice ? (
                <InfoRow label="Room Price (original)" value={formatCurrencyINR(costs.baseRoomPrice)} />
              ) : null}
              <InfoRow label={costs.baseRoomPrice > 0 && costs.discountedRoomPrice !== costs.baseRoomPrice ? "Room Price (after discount)" : "Room Price"} value={formatCurrencyINR(costs.roomBase)} />

              {costs.foodTotal > 0 && (
                <InfoRow label="Food & Beverages" value={formatCurrencyINR(costs.foodTotal)} />
              )}

              {costs.discountAmount > 0 && (
                <InfoRow
                  label={`Coupon Discount${booking?.couponCode ? ` (${booking.couponCode})` : ""}`}
                  value={`-${formatCurrencyINR(costs.discountAmount)}`}
                  valueColor="text-emerald-600"
                />
              )}

              <InfoRow label={`GST & Taxes (${toNumber(booking?.gstPrice) || 12}%)`} value={formatCurrencyINR(costs.gst)} />

              <View className="my-3 border-t border-dashed border-neutral-300" />

              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs text-neutral-400">
                  {paymentMode === "offline" ? "Pay at Hotel" : "Online Payment"}
                </Text>
                <View className={`px-2 py-0.5 rounded-full ${ isPaid ? "bg-emerald-100" : "bg-amber-100"}`}>
                  <Text className={`text-[10px] font-bold ${ isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                    {isPaid ? "Payment Done" : "Payment Pending"}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-end">
                <Text className="text-base font-bold text-neutral-900">Total Amount</Text>
                <Text className="text-xl font-black text-emerald-600">
                  {formatCurrencyINR(costs.totalPaid)}
                </Text>
              </View>
            </View>

            {/* Footer Space */}
            <View className="h-6" />
          </ScrollView>

          {/* Sticky Footer Button */}
          <View className="p-4 bg-white border-t border-neutral-200">
            {canCancel ? (
              <TouchableOpacity
                onPress={() => setShowCancelModal(true)}
                activeOpacity={0.9}
                className="bg-red-500 rounded-xl h-12 flex-row items-center justify-center shadow-lg shadow-red-300"
              >
                <Ionicons name="close-circle-outline" size={18} color="white" />
                <Text className="text-white font-bold text-base ml-2">Cancel Booking</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.9}
                className="bg-neutral-900 rounded-xl h-12 flex-row items-center justify-center shadow-lg shadow-neutral-300"
              >
                <Text className="text-white font-bold text-base">Close Receipt</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>

      {/* Cancellation OTP Modal */}
      <Modal animationType="slide" transparent visible={showCancelModal} onRequestClose={handleCloseCancelModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-3xl p-5 pb-8">
              <View className="w-12 h-1.5 bg-neutral-300 rounded-full self-center mb-4" />
              <Text className="text-xl font-bold text-neutral-900 mb-2">Cancel Booking</Text>
              <Text className="text-sm text-neutral-500 mb-6">
                {otpSent
                  ? "Enter the OTP sent to your email to confirm cancellation."
                  : "Please provide a reason and we'll send an OTP to your email for verification."}
              </Text>

              {/* Reason Input */}
              {!otpSent && (
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-neutral-600 mb-2">Cancellation Reason</Text>
                  <TextInput
                    value={cancellationReason}
                    onChangeText={setCancellationReason}
                    placeholder="e.g., Change in travel plans"
                    placeholderTextColor="#9ca3af"
                    className="bg-neutral-100 rounded-xl px-4 py-3 text-neutral-900 text-sm"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* OTP Input */}
              {otpSent && (
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-neutral-600 mb-2">Enter OTP</Text>
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="123456"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    maxLength={6}
                    className="bg-neutral-100 rounded-xl px-4 py-3 text-neutral-900 text-sm text-center tracking-widest text-lg font-bold"
                  />
                </View>
              )}

              {/* Error Messages */}
              {sendOtpError && (
                <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <Text className="text-xs text-red-600">{sendOtpError?.message || "Failed to send OTP"}</Text>
                </View>
              )}
              {verifyOtpError && (
                <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <Text className="text-xs text-red-600">{verifyOtpError?.message || "Invalid OTP"}</Text>
                </View>
              )}

              {/* Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleCloseCancelModal}
                  disabled={sendOtpStatus === "loading" || verifyOtpStatus === "loading"}
                  className="flex-1 bg-neutral-200 rounded-xl h-12 flex-row items-center justify-center"
                >
                  <Text className="text-neutral-700 font-semibold text-sm">Cancel</Text>
                </TouchableOpacity>
                {!otpSent ? (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={!cancellationReason.trim() || sendOtpStatus === "loading"}
                    className={`flex-1 rounded-xl h-12 flex-row items-center justify-center ${!cancellationReason.trim() || sendOtpStatus === "loading" ? "bg-neutral-300" : "bg-blue-600"}`}
                  >
                    {sendOtpStatus === "loading" ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold text-sm">Send OTP</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    disabled={!otp.trim() || verifyOtpStatus === "loading"}
                    className={`flex-1 rounded-xl h-12 flex-row items-center justify-center ${!otp.trim() || verifyOtpStatus === "loading" ? "bg-neutral-300" : "bg-red-500"}`}
                  >
                    {verifyOtpStatus === "loading" ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold text-sm">Verify & Cancel</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </Modal>
  );
}
