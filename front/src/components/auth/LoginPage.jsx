import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Hotel,
  ArrowRight
} from "lucide-react";
import apiClient from "../../utils/apiInterceptor";
import { loginSuccess } from "../../redux/slices/authSlice";

const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "USA" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "UK" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "UAE" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
];

const saveUserSession = (data, dispatch) => {
  const token = data?.rsToken || data?.token || "";
  const refreshToken = data?.refreshToken || "";
  const userId = data?.userId || data?._id || "";

  localStorage.setItem("authToken", token);
  localStorage.setItem("isSignedIn", "true");
  localStorage.setItem("rsUserId", userId);
  localStorage.setItem("rsRefreshToken", refreshToken);
  localStorage.setItem("roomsstayUserEmail", data?.email || "");
  localStorage.setItem("rsUserMobile", data?.mobile || "");
  localStorage.setItem("rsUserName", data?.name || "");

  dispatch(
    loginSuccess({
      user: {
        id: userId,
        email: data?.email || "",
        name: data?.name || "",
        mobile: data?.mobile || "",
      },
      token,
      refreshToken,
    })
  );
};

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all border ${
        type === "error"
          ? "border-red-100 bg-red-50 text-red-800"
          : "border-green-100 bg-green-50 text-green-800"
      }`}
    >
      {type === "error" ? (
        <AlertCircle className="h-5 w-5 text-red-500" />
      ) : (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function CountryCodeDropdown({ selectedCode, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedCountry = countryCodes.find((c) => c.code === selectedCode);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
      >
        <span>{selectedCountry?.flag}</span>
        <span>{selectedCountry?.code}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {countryCodes.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onSelect(c.code);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>{c.flag}</span>
              <span className="flex-1 font-medium">{c.name}</span>
              <span className="text-gray-400">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OtpInput({ disabled, onComplete, value }) {
  const [vals, setVals] = useState(Array(6).fill(""));
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!value) {
      setVals(Array(6).fill(""));
      return;
    }
    if (value.length <= 6) {
      const next = Array(6).fill("");
      value.split("").forEach((digit, index) => {
        next[index] = digit;
      });
      setVals(next);
    }
  }, [value]);

  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...vals];
    next[i] = v;
    setVals(next);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
    onComplete(next.join(""));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !vals[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {vals.map((val, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-12 rounded-lg border border-gray-300 bg-white text-center text-lg font-semibold text-gray-900 outline-none transition-colors focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 sm:h-14 sm:w-14"
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [mode, setMode] = useState("password"); // 'password' | 'otp'
  const [authMethod, setAuthMethod] = useState("email"); // 'email' | 'mobile'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const showToast = (message, type = "success") => setToast({ message, type });

  const resetOtpFlow = () => {
    setOtp("");
    setOtpSent(false);
    setTimer(0);
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Email and password required.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/signIn", { email, password, loginType: "user" });
      saveUserSession(res.data, dispatch);
      showToast("Logged in successfully!");
      navigate("/", { replace: true });
    } catch (error) {
      showToast(getErrorMessage(error, "Login failed."), "error");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (authMethod === "email" && !email) {
      showToast("Please enter your email.", "error");
      return;
    }
    if (authMethod === "mobile" && !phone) {
      showToast("Please enter your mobile number.", "error");
      return;
    }
    setLoading(true);
    try {
      const res =
        authMethod === "email"
          ? await apiClient.post("/mail/send-otp", { email, loginType: "user" })
          : await apiClient.post("/send-otp", {
              phoneNumber: `${countryCode}${phone}`,
              mobile: `${countryCode}${phone}`,
              loginType: "user",
            });
      setOtpSent(true);
      setTimer(30);
      showToast(res.data?.message || "Verification code has been sent.");
    } catch (error) {
      showToast(getErrorMessage(error, "Could not send OTP."), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      showToast("Please enter the 6-digit OTP.", "error");
      return;
    }
    setLoading(true);
    try {
      const res =
        authMethod === "email"
          ? await apiClient.post("/mail/verify-otp", { email, otp, loginType: "user" })
          : await apiClient.post("/verify-otp", {
              phoneNumber: `${countryCode}${phone}`,
              mobile: `${countryCode}${phone}`,
              code: otp,
              loginType: "user",
            });
      saveUserSession(res.data, dispatch);
      showToast("Logged in successfully!");
      navigate("/", { replace: true });
    } catch (error) {
      showToast(getErrorMessage(error, "Invalid OTP."), "error");
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
    <div className="flex min-h-screen bg-white font-sans text-gray-900 antialiased">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Left Column - Hero Image */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full object-cover"
          src="/login.jpg"
          alt="Login hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 p-12 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
            <Hotel className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Experience Luxury.</h2>
          <p className="mt-2 max-w-md text-lg text-gray-200">
            Discover and book the finest hotel rooms and suites around the globe with HotelRoomsStay.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-[400px]">
          {/* Mobile Logo */}
          <div className="mb-8 flex flex-col lg:hidden">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
              <Hotel className="h-5 w-5" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sign in</h2>
            <p className="mt-2 text-sm text-gray-500">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="font-semibold text-gray-900 hover:underline"
              >
                Register now
              </button>
            </p>
          </div>

          <div className="mt-8">
            {/* Elegant Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => {
                    setMode("password");
                    resetOtpFlow();
                  }}
                  className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                    mode === "password"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  Password Login
                </button>
                <button
                  onClick={() => {
                    setMode("otp");
                    setPassword("");
                  }}
                  className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                    mode === "otp"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  One-Time Password
                </button>
              </nav>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "otp" && !otpSent && (
                <div className="mb-2 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      className="text-gray-900 focus:ring-gray-900"
                      checked={authMethod === "email"}
                      onChange={() => setAuthMethod("email")}
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      className="text-gray-900 focus:ring-gray-900"
                      checked={authMethod === "mobile"}
                      onChange={() => setAuthMethod("mobile")}
                    />
                    Mobile
                  </label>
                </div>
              )}

              {(mode === "password" || (mode === "otp" && authMethod === "email")) && !otpSent && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block h-11 w-full rounded-lg border border-gray-300 pl-10 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              )}

              {mode === "otp" && authMethod === "mobile" && !otpSent && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Mobile number
                  </label>
                  <div className="mt-1 flex gap-2">
                    <CountryCodeDropdown
                      selectedCode={countryCode}
                      onSelect={setCountryCode}
                      disabled={loading}
                    />
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="block h-11 w-full rounded-lg border border-gray-300 pl-10 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="000 000 0000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === "password" && (
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block h-11 w-full rounded-lg border border-gray-300 pl-10 pr-10 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "otp" && otpSent && (
                <div className="space-y-5">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">
                      We've sent a 6-digit verification code to <br />
                      <span className="font-semibold text-gray-900">
                        {authMethod === "email" ? email : `${countryCode} ${phone}`}
                      </span>
                    </p>
                  </div>
                  <OtpInput onComplete={setOtp} disabled={loading} value={otp} />
                  <div className="flex items-center justify-between text-sm">
                    {timer > 0 ? (
                      <span className="text-gray-500">Resend code in {timer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={requestOtp}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetOtpFlow}
                      className="text-gray-500 hover:text-gray-900 hover:underline"
                    >
                      Change {authMethod}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === "otp" && otpSent && otp.length !== 6)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === "password" ? "Sign in" : otpSent ? "Verify & Sign in" : "Continue"}
                    </span>
                    {!otpSent && <ArrowRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    className="h-5 w-5"
                    alt="Google"
                  />
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/", { replace: true })}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                >
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>Guest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}