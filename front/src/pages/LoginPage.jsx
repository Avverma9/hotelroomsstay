import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  UserCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import apiClient from "../utils/apiInterceptor";
import { loginSuccess } from "../redux/slices/authSlice";

const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
];

function CountryCodeDropdown({ selectedCode, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const selectedCountry = countryCodes.find((c) => c.code === selectedCode);

  const filtered = countryCodes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.includes(searchTerm)
  );

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 0);
  }, [isOpen]);

  return (
    <div className="relative w-24 sm:w-28" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={[
          "flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-slate-50",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="text-base leading-none">{selectedCountry?.flag}</span>
          <span className="text-slate-800">{selectedCountry?.code}</span>
        </span>

        <svg
          className={[
            "h-3 w-3 text-slate-500 transition-transform",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-20 mt-2 w-72 overflow-hidden rounded-xl border bg-white shadow-xl"
          role="listbox"
        >
          <div className="p-2">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country or code…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length ? (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onSelect(c.code);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                    "hover:bg-slate-50",
                    c.code === selectedCode ? "bg-slate-100 font-medium" : "",
                  ].join(" ")}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 truncate text-slate-800">{c.name}</span>
                  <span className="text-slate-500">{c.code}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">No matches.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SixDigitOTP({ disabled, onComplete, value = "" }) {
  const [vals, setVals] = useState(Array(6).fill(""));
  const inputsRef = useRef([]);

  useEffect(() => {
    if (value.length === 6) setVals(value.split(""));
    else if (value === "") setVals(Array(6).fill(""));
  }, [value]);

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;

    const next = [...vals];
    next[i] = v;
    setVals(next);

    if (v && i < 5) inputsRef.current[i + 1]?.focus();
    onComplete(next.every((d) => d) ? next.join("") : "");
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !vals[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  return (
    <div className="flex gap-2">
      {vals.map((val, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={[
            "h-11 w-10 rounded-xl border text-center text-lg shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
            disabled ? "cursor-not-allowed bg-slate-50 opacity-70" : "bg-white",
          ].join(" ")}
          value={val}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          ref={(el) => (inputsRef.current[i] = el)}
          disabled={disabled}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [authMethod, setAuthMethod] = useState("email"); // "email" | "mobile"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const toggleMode = () => {
    setOtp("");
    setPassword("");
    setOtpSent(false);
    setResendTimer(0);
    setMode((m) => (m === "password" ? "otp" : "password"));
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required.");

    setLoading(true);
    try {
      const res = await toast.promise(
        apiClient.post(`/signIn`, { email, password }),
        {
          loading: "Signing in...",
          success: "Signed in successfully.",
          error: (err) => err.response?.data?.message || "Login failed.",
        }
      );

      // Save to localStorage
      const token = res.data.rsToken || res.data.token;
      const userId = res.data.userId || res.data._id;
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("isSignedIn", "true");
      localStorage.setItem("rsUserId", userId);
      localStorage.setItem("rsToken", token);
      localStorage.setItem("roomsstayUserEmail", res.data.email);
      localStorage.setItem("rsUserMobile", res.data.mobile);
      localStorage.setItem("rsUserName", res.data.name);

      // Update Redux store
      dispatch(loginSuccess({
        user: {
          id: userId,
          email: res.data.email,
          name: res.data.name,
          mobile: res.data.mobile,
        },
        token: token,
      }));

      // Navigate to home
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (authMethod === "email" && !email) return toast.error("Please enter your email.");
    if (authMethod === "mobile" && !phone) return toast.error("Please enter your mobile number.");

    setLoading(true);
    try {
      const promise =
        authMethod === "email"
          ? apiClient.post(`/mail/send-otp`, { email })
          : apiClient.post(`/send-otp`, {
              phoneNumber: countryCode + phone,
              mobile: countryCode + phone,
            });

      const res = await toast.promise(promise, {
        loading: "Sending OTP...",
        success: (r) => r.data.message || "OTP sent successfully.",
        error: (err) => err.response?.data?.message || "Could not send OTP.",
      });

      setOtpSent(true);
      setResendTimer(30);
      return res;
    } catch (error) {
      console.error("OTP request error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error("Please enter the 6-digit OTP.");

    setLoading(true);
    try {
      const promise =
        authMethod === "email"
          ? apiClient.post(`/mail/verify-otp/site`, { email, otp })
          : apiClient.post(`/verify-otp`, {
              phoneNumber: countryCode + phone,
              mobile: countryCode + phone,
              code: otp,
            });

      const res = await toast.promise(promise, {
        loading: "Verifying OTP...",
        success: "Verified. Signing in...",
        error: (err) => err.response?.data?.message || "Invalid OTP.",
      });

      // Save to localStorage
      const token = res.data.rsToken || res.data.token;
      const userId = res.data.userId || res.data._id;
      
      localStorage.setItem("authToken", token);
      localStorage.setItem("isSignedIn", "true");
      localStorage.setItem("rsUserId", userId);
      localStorage.setItem("rsToken", token);
      localStorage.setItem("roomsstayUserEmail", res.data.email);
      localStorage.setItem("rsUserMobile", res.data.mobile);
      localStorage.setItem("rsUserName", res.data.name);

      // Update Redux store
      dispatch(loginSuccess({
        user: {
          id: userId,
          email: res.data.email,
          name: res.data.name,
          mobile: res.data.mobile,
        },
        token: token,
      }));

      // Navigate to home
      navigate("/");
    } catch (error) {
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit =
    mode === "password"
      ? handlePasswordLogin
      : otpSent
      ? handleOtpSubmit
      : (e) => {
          e.preventDefault();
          requestOtp();
        };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 px-3 py-6 sm:px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl bg-white p-5 shadow-xl ring-1 ring-black/5 sm:p-8">
          <div className="text-center">
            <UserCircleIcon className="mx-auto h-14 w-14 text-blue-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-800">Welcome Back!</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
          </div>

          {mode === "otp" && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setAuthMethod("email")}
                className={[
                  "rounded-full border px-3 py-1 text-sm transition",
                  authMethod === "email"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod("mobile")}
                className={[
                  "rounded-full border px-3 py-1 text-sm transition",
                  authMethod === "mobile"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                Mobile
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Email or Mobile */}
            {mode === "password" || authMethod === "email" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={mode === "otp" && otpSent}
                    className={[
                      "w-full rounded-xl border bg-white py-2 pl-10 pr-3 text-sm shadow-sm",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                      mode === "otp" && otpSent ? "cursor-not-allowed bg-slate-50 opacity-70" : "",
                    ].join(" ")}
                    autoComplete="email"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mobile</label>
                <div className="flex gap-2">
                  <CountryCodeDropdown selectedCode={countryCode} onSelect={setCountryCode} disabled={otpSent} />
                  <div className="relative flex-1">
                    <PhoneIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="Mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                      disabled={otpSent}
                      className={[
                        "w-full rounded-xl border bg-white py-2 pl-10 pr-3 text-sm shadow-sm",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                        otpSent ? "cursor-not-allowed bg-slate-50 opacity-70" : "",
                      ].join(" ")}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            {mode === "password" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <LockClosedIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            )}

            {/* OTP */}
            {mode === "otp" && otpSent && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Enter verification code
                </label>
                <SixDigitOTP disabled={loading} onComplete={setOtp} value={otp} />
                <p className="mt-2 text-xs text-slate-500">Enter the 6-digit code sent to you.</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (mode === "otp" && otpSent && otp.length !== 6)}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition",
                "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {loading && <ArrowPathIcon className="h-5 w-5 animate-spin" />}
              <span>
                {loading
                  ? "Processing..."
                  : mode === "password"
                  ? "Sign In"
                  : otpSent
                  ? "Verify & Sign In"
                  : "Send OTP"}
              </span>
            </button>
          </form>

          {/* Resend */}
          {mode === "otp" && otpSent && (
            <div className="mt-4 text-center text-sm">
              {resendTimer > 0 ? (
                <p className="text-slate-500">
                  Resend code in <span className="font-semibold">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={loading}
                  className="font-medium text-blue-600 hover:underline disabled:opacity-60"
                >
                  Resend code
                </button>
              )}
            </div>
          )}

          {/* Toggle mode */}
          <div className="mt-5 text-center">
            <button onClick={toggleMode} className="text-sm font-medium text-blue-600 hover:underline">
              {mode === "password" ? "Use verification code instead" : "Use password instead"}
            </button>
          </div>

          {/* Register */}
          <div className="mt-6 text-center text-sm text-slate-600">
            Don’t have an account?{" "}
            <a href="/register" className="font-medium text-blue-600 hover:underline">
              Create one
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
