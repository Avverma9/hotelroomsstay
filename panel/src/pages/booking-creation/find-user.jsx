import { useDispatch, useSelector } from "react-redux"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Breadcrumb from "../../components/breadcrumb"
import { findUserByMobile } from "../../../redux/slices/user"
import { clearSelectedHotel, saveSelectedGuest } from "../../utils/booking-storage"

export default function FindUser() {
  const [mobile, setMobile] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const { user, loading, error } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSearch = async (mobileNumber) => {
    if (!mobileNumber) return
    setIsSearching(true)
    try {
      await dispatch(findUserByMobile(mobileNumber))
    } finally {
      setIsSearching(false)
    }
  }

  const userRecord = useMemo(() => user?.data?.[0] ?? null, [user])

  // Treat "User not found" as a normal empty state, not an error
  const isNotFound = error === "User not found"
  const isSystemError = error && !isNotFound

  const handleGuestSelection = (guest) => {
    if (!guest?.mobile) {
      return
    }

    clearSelectedHotel()
    saveSelectedGuest({
      id: guest._id || guest.userId || guest.id || "",
      userId: guest.userId || "",
      userName: guest.userName || guest.name || "New Guest",
      email: guest.email || "",
      mobile: guest.mobile,
      address: guest.address || "",
      isExistingUser: Boolean(guest._id || guest.userId || guest.id),
    })
    navigate("/booking-creation/hotels")
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white/90 p-6 md:p-8">
      <Breadcrumb />

      <div className="mx-auto w-full max-w-2xl space-y-6">
              {/* Page title */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                  Find User
                </h1>
                <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
                  Search a user by mobile number and quickly create bookings.
                </p>
              </div>

              {/* Search card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSearch(mobile)}
                    disabled={!mobile || loading || isSearching}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading || isSearching ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          ></path>
                        </svg>
                        <span>Searching...</span>
                      </span>
                    ) : (
                      "Search User"
                    )}
                  </button>
                </div>
              </div>

              {/* System error (server/network etc.) */}
              {isSystemError && (
                <div className="mt-2 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="mt-0.5 text-rose-400">!</span>
                    <div>
                      <p className="font-semibold text-rose-800">
                        Something went wrong
                      </p>
                      <p className="text-rose-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User found */}
              {userRecord && (
                <>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                          <svg
                            className="h-6 w-6 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">
                            {userRecord.userName || "N/A"}
                          </h2>
                          <p className="text-sm text-slate-500">
                            Verified User
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-3">
                          <span className="text-indigo-500">👤</span>
                          <span className="font-medium text-slate-700">
                            Name:
                          </span>
                          <span className="ml-1 text-slate-900">
                            {userRecord.userName || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-indigo-500">📱</span>
                          <span className="font-medium text-slate-700">
                            Mobile:
                          </span>
                          <span className="ml-1 text-slate-900">
                            {userRecord.mobile || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-indigo-500">✉️</span>
                          <span className="font-medium text-slate-700">
                            Email:
                          </span>
                          <span className="ml-1 text-slate-900">
                            {userRecord.email || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGuestSelection(userRecord)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center space-x-3"
                  >
                    <span>＋</span>
                    <span>Select this guest and view hotels</span>
                  </button>
                </>
              )}

              {/* Empty / Not-found state (clean, no red error) */}
              {!userRecord && !loading && (
                <div className="text-center py-10">
                  <svg
                    className="h-12 w-12 text-slate-300 mx-auto mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                  <p className="text-lg font-semibold text-slate-800">
                    {isNotFound
                      ? "No user found"
                      : "Search a user by mobile number."}
                  </p>

                  <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                    {isNotFound
                      ? "This user is not in our system. You can create a new user profile for them."
                      : "Enter a valid mobile number above to find an existing user."}
                  </p>

                  {isNotFound && (
                    <button
                      onClick={() => navigate('/booking-creation/create-user', { state: { mobile } })}
                      className="mt-6 w-full max-w-xs mx-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      Create New User
                    </button>
                  )}
                </div>
              )}
      </div>
    </div>
  )
}
