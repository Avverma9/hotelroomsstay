import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { tableClasses } from "../../../components/admin-table";
import {
  filterUsers,
  getUserDetails,
  updateUser,
  clearUpdateStatus,
  clearSelectedUserDetail,
} from "../../../../redux/slices/user";
import {
  Search, Edit2, Save, X, ChevronLeft, Download,
  Calendar, Tag, AlertCircle, Eye, Shield,
  CheckCircle, Clock, ChevronRight, Car, Navigation,
  Building2, RefreshCw,
} from "lucide-react";

// Detect search type from input to route to the right API param
const buildSearchParams = (query, page, limit) => {
  const q = query.trim();
  if (!q) return { page, limit };
  // 24-char hex = ObjectId / userId
  if (/^[a-f0-9]{24}$/i.test(q)) return { userId: q, page, limit };
  // Mostly digits = mobile
  if (/^\d{5,}$/.test(q)) return { mobile: q, page, limit };
  // Otherwise treat as email (partial match supported on server)
  return { email: q, page, limit };
};

const PAGE_SIZE = 20;

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatCurrency = (val) => {
  if (val == null) return "—";
  return `₹${Number(val).toLocaleString("en-IN")}`;
};

const isCouponExpired = (c) => {
  if (c.expired) return true;
  if (c.validity && new Date(c.validity) < new Date()) return true;
  if (c.maxUsage && c.usedCount >= c.maxUsage) return true;
  return false;
};

export const AllUsers = () => {
  const dispatch = useDispatch();
  const {
    filteredData,
    selectedUserDetail,
    loading,
    detailLoading,
    updating,
    updateError,
    updateSuccess,
    error,
  } = useSelector((state) => state.user);

  const [viewState, setViewState] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const debounceRef = useRef(null);

  // Initial + page change load
  useEffect(() => {
    const params = buildSearchParams(searchQuery, currentPage, PAGE_SIZE);
    dispatch(filterUsers(params));
  }, [currentPage, dispatch]);

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setCurrentPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = buildSearchParams(val, 1, PAGE_SIZE);
      dispatch(filterUsers(params));
    }, 400);
  };

  // Show update success/error toast then clear
  useEffect(() => {
    if (updateSuccess) {
      setIsEditingProfile(false);
      const t = setTimeout(() => dispatch(clearUpdateStatus()), 3000);
      return () => clearTimeout(t);
    }
    if (updateError) {
      const t = setTimeout(() => dispatch(clearUpdateStatus()), 4000);
      return () => clearTimeout(t);
    }
  }, [updateSuccess, updateError, dispatch]);

  const usersList = filteredData?.data || [];
  const totalPages = filteredData?.totalPages || 0;
  const totalUsers = filteredData?.total || 0;

  const handleViewUser = (user) => {
    dispatch(getUserDetails(user.userId));
    setProfileForm({
      userName: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      address: user.address || "",
    });
    setViewState("detail");
    setActiveTab("bookings");
    setBookingTypeFilter("");
    setIsEditingProfile(false);
  };

  const handleBackToList = () => {
    setViewState("list");
    dispatch(clearSelectedUserDetail());
    dispatch(clearUpdateStatus());
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = () => {
    if (!selectedUserDetail?.userId) return;
    dispatch(updateUser({
      userId: selectedUserDetail.userId,
      userName: profileForm.userName,
      email: profileForm.email,
      mobile: profileForm.mobile,
      address: profileForm.address,
    }));
  };

  const handleRefresh = () => {
    const params = buildSearchParams(searchQuery, currentPage, PAGE_SIZE);
    dispatch(filterUsers(params));
  };

  const renderStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    const styles = {
      confirmed: "bg-green-100 text-green-700",
      completed: "bg-green-100 text-green-700",
      resolved: "bg-green-100 text-green-700",
      active: "bg-green-100 text-green-700",
      "checked-in": "bg-teal-100 text-teal-700",
      "checked-out": "bg-blue-100 text-blue-700",
      pending: "bg-yellow-100 text-yellow-700",
      held: "bg-yellow-100 text-yellow-700",
      working: "bg-blue-100 text-blue-700",
      closed: "bg-slate-100 text-slate-700",
      used: "bg-slate-100 text-slate-700",
      expired: "bg-slate-100 text-slate-500",
      cancelled: "bg-red-100 text-red-700",
      failed: "bg-red-100 text-red-700",
      "no-show": "bg-orange-100 text-orange-700",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${styles[s] || "bg-slate-100 text-slate-700"}`}>
        {status}
      </span>
    );
  };

  // ── Detail view ───────────────────────────────────────────────────────
  if (viewState === "detail") {
    const detail = selectedUserDetail;

    // All bookings combined for display
    const hotelBks = detail?.bookings?.hotel || [];
    const tourBks = detail?.bookings?.tour || [];
    const taxiBks = detail?.bookings?.taxi || [];

    const allBookings = [
      ...hotelBks.map((b) => ({
        id: b.bookingId,
        type: "Hotel",
        name: b.hotelDetails?.hotelName || "—",
        date: b.checkInDate,
        amount: b.price,
        status: b.bookingStatus,
      })),
      ...tourBks.map((b) => ({
        id: b.bookingCode,
        type: "Tour",
        name: b.travelAgencyName || "—",
        date: b.tourStartDate,
        amount: b.totalAmount,
        status: b.status,
      })),
      ...taxiBks.map((b) => ({
        id: b.bookingId,
        type: "Taxi",
        name: `${b.pickupP || "?"} → ${b.dropP || "?"}`,
        date: b.createdAt,
        amount: b.price,
        status: b.bookingStatus,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const filteredBookings = bookingTypeFilter
      ? allBookings.filter((b) => b.type.toLowerCase() === bookingTypeFilter)
      : allBookings;

    const coupons = detail?.coupons || [];
    const complaints = detail?.complaints || [];

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Toast notifications */}
        {updateSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2">
            <CheckCircle size={16} /> Profile updated successfully
          </div>
        )}
        {updateError && (
          <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2">
            <X size={16} /> {updateError}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToList}
            className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={18} className="mr-1" /> Back to Users
          </button>
          <div className="flex gap-3">
            <button className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
              <Shield size={16} className="mr-2" /> Block User
            </button>
          </div>
        </div>

        {detailLoading ? (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-3">
            <Clock size={28} className="animate-spin text-blue-600" />
            <p className="font-medium">Loading user details…</p>
          </div>
        ) : !detail ? (
          <div className="p-8 text-center text-red-500 bg-red-50 border border-red-100 rounded-2xl">
            <p className="font-bold">Could not load user details. Please try again.</p>
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">User Profile</h2>
                  <p className="text-xs text-slate-500 mt-1">User ID: {detail.userId}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Joined: {formatDate(detail.joinedAt)}</p>
                </div>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 size={14} className="mr-2" /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setIsEditingProfile(false); dispatch(clearUpdateStatus()); }}
                      disabled={updating}
                      className="flex items-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      <X size={14} className="mr-1" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={updating}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                      {updating ? <Clock size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                      {updating ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Full Name", name: "userName", type: "text" },
                  { label: "Email Address", name: "email", type: "email" },
                  { label: "Mobile Number", name: "mobile", type: "text" },
                  { label: "Address", name: "address", type: "text" },
                ].map(({ label, name, type }) => (
                  <div key={name} className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                    {isEditingProfile ? (
                      <input
                        type={type}
                        name={name}
                        value={profileForm[name]}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-transparent">
                        {profileForm[name] || <span className="text-slate-400 italic">Not provided</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs: Bookings / Coupons / Complaints */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-200">
                {[
                  { key: "bookings", icon: <Calendar size={16} />, label: `Bookings (${allBookings.length})` },
                  { key: "coupons", icon: <Tag size={16} />, label: `Coupons (${coupons.length})` },
                  { key: "complaints", icon: <AlertCircle size={16} />, label: `Complaints (${complaints.length})` },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === key ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* ── Bookings Tab ── */}
                {activeTab === "bookings" && (
                  <div className="space-y-4">
                    <div className="flex gap-3 mb-4">
                      <select
                        value={bookingTypeFilter}
                        onChange={(e) => setBookingTypeFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Types ({allBookings.length})</option>
                        <option value="hotel">Hotel ({hotelBks.length})</option>
                        <option value="tour">Tour ({tourBks.length})</option>
                        <option value="taxi">Taxi ({taxiBks.length})</option>
                      </select>
                    </div>
                    {filteredBookings.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Calendar size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-slate-500">No bookings found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className={tableClasses.th}>Booking ID</th>
                              <th className={tableClasses.th}>Type</th>
                              <th className={tableClasses.th}>Service / Route</th>
                              <th className={tableClasses.th}>Date</th>
                              <th className={tableClasses.th}>Amount</th>
                              <th className={tableClasses.th}>Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredBookings.map((bk, i) => (
                              <tr key={`${bk.id}-${i}`} className="hover:bg-slate-50">
                                <td className={`${tableClasses.td} font-semibold text-slate-900 font-mono text-xs`}>{bk.id || "—"}</td>
                                <td className={tableClasses.td}>
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${bk.type === "Hotel" ? "bg-blue-50 text-blue-700" : bk.type === "Tour" ? "bg-purple-50 text-purple-700" : "bg-orange-50 text-orange-700"}`}>
                                    {bk.type === "Hotel" ? <Building2 size={10} className="inline mr-1" /> : bk.type === "Tour" ? <Navigation size={10} className="inline mr-1" /> : <Car size={10} className="inline mr-1" />}
                                    {bk.type}
                                  </span>
                                </td>
                                <td className={`${tableClasses.td} max-w-[180px] truncate`}>{bk.name}</td>
                                <td className={`${tableClasses.td} text-slate-600`}>{formatDate(bk.date)}</td>
                                <td className={`${tableClasses.td} font-medium`}>{formatCurrency(bk.amount)}</td>
                                <td className={tableClasses.td}>{renderStatusBadge(bk.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Coupons Tab ── */}
                {activeTab === "coupons" && (
                  <div>
                    {coupons.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Tag size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-slate-500">No coupons assigned</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className={tableClasses.th}>Coupon Code</th>
                              <th className={tableClasses.th}>Name</th>
                              <th className={tableClasses.th}>Discount</th>
                              <th className={tableClasses.th}>Usage</th>
                              <th className={tableClasses.th}>Expiry</th>
                              <th className={tableClasses.th}>Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {coupons.map((cp, i) => {
                              const expired = isCouponExpired(cp);
                              return (
                                <tr key={`${cp.couponCode}-${i}`} className="hover:bg-slate-50">
                                  <td className={`${tableClasses.td} font-mono font-bold text-slate-900`}>{cp.couponCode}</td>
                                  <td className={tableClasses.td}>{cp.couponName || "—"}</td>
                                  <td className={`${tableClasses.td} font-medium text-green-600`}>₹{cp.discountPrice}</td>
                                  <td className={`${tableClasses.td} text-slate-500`}>{cp.usedCount || 0}/{cp.maxUsage || 1}</td>
                                  <td className={`${tableClasses.td} text-slate-600`}>{formatDate(cp.validity)}</td>
                                  <td className={tableClasses.td}>
                                    {renderStatusBadge(expired ? "Expired" : "Active")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Complaints Tab ── */}
                {activeTab === "complaints" && (
                  <div>
                    {complaints.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <AlertCircle size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-slate-500">No complaints filed</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className={tableClasses.th}>Complaint ID</th>
                              <th className={tableClasses.th}>Regarding</th>
                              <th className={tableClasses.th}>Hotel</th>
                              <th className={tableClasses.th}>Booking ID</th>
                              <th className={tableClasses.th}>Date</th>
                              <th className={tableClasses.th}>Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {complaints.map((cmp, i) => (
                              <tr key={`${cmp.complaintId}-${i}`} className="hover:bg-slate-50">
                                <td className={`${tableClasses.td} font-semibold text-slate-900 font-mono text-xs`}>{cmp.complaintId || "—"}</td>
                                <td className={`${tableClasses.td} max-w-[160px] truncate`}>{cmp.regarding || cmp.issue || "—"}</td>
                                <td className={tableClasses.td}>{cmp.hotelName || "—"}</td>
                                <td className={`${tableClasses.td} font-mono text-xs text-slate-500`}>{cmp.bookingId || "—"}</td>
                                <td className={`${tableClasses.td} text-slate-600`}>{formatDate(cmp.createdAt)}</td>
                                <td className={tableClasses.td}>{renderStatusBadge(cmp.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalUsers > 0 ? `${totalUsers} users total` : "Manage users, bookings, coupons and complaints."}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={`mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Email, Mobile or User ID…"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 pl-1">
          Search by email (partial), mobile number, or 24-char user ID
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
            <Clock size={24} className="animate-spin text-blue-600" />
            <p className="font-medium">Loading users…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 m-4 rounded-xl border border-red-100">
            <p className="font-bold">{error}</p>
            <button onClick={handleRefresh} className="mt-3 text-sm text-red-600 underline font-medium">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className={tableClasses.th}>User</th>
                  <th className={tableClasses.th}>Contact</th>
                  <th className={tableClasses.th}>Address</th>
                  <th className={tableClasses.th}>Joined</th>
                  <th className={tableClasses.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.length > 0 ? (
                  usersList.map((user) => (
                    <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                      <td className={tableClasses.td}>
                        <p className="font-bold text-slate-900">{user.name || "—"}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {String(user.userId || "").slice(-8).toUpperCase()}</p>
                      </td>
                      <td className={tableClasses.td}>
                        <p className="text-slate-900 font-medium">{user.email || "—"}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{user.mobile || "—"}</p>
                      </td>
                      <td className={`${tableClasses.td} truncate max-w-[200px]`}>
                        {user.address || <span className="text-slate-400 italic">Not provided</span>}
                      </td>
                      <td className={`${tableClasses.td} text-slate-500 text-xs`}>{formatDate(user.joinedAt)}</td>
                      <td className={`${tableClasses.td} flex justify-end gap-2`}>
                        <button
                          onClick={() => handleViewUser(user)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search size={32} className="text-slate-300 mb-3" />
                        <p className="text-base font-bold text-slate-700">No users found</p>
                        <p className="text-sm mt-1">Try adjusting your search query.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalUsers} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const page = start + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === currentPage ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};