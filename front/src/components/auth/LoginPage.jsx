import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Hotel,
  Coffee,
  UtensilsCrossed,
  Bed,
  Luggage,
  Key,
  Pizza,
  Wine,
  Bus,
  Car,
  Route,
  Plane,
  Soup,
  ChefHat,
  Milestone,
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

const DOODLE_ICONS = [
  Hotel,
  Coffee,
  UtensilsCrossed,
  Bed,
  Luggage,
  Key,
  Pizza,
  Wine,
  MapPin,
  Bus,
  Car,
  Route,
  Plane,
  Soup,
  ChefHat,
  Milestone,
];

const saveUserSession = (data, dispatch) => {
  const token = data?.rsToken || data?.token || "";
  const userId = data?.userId || data?._id || "";

  localStorage.setItem("authToken", token);
  localStorage.setItem("isSignedIn", "true");
  localStorage.setItem("rsUserId", userId);
  localStorage.setItem("rsToken", token);
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
    }),
  );
};

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const DoodleBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-white opacity-[0.18] pointer-events-none select-none">
    <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-8 p-2 -rotate-12 scale-150">
      {Array.from({ length: 120 }).map((_, i) => {
        const Icon = DOODLE_ICONS[i % DOODLE_ICONS.length];
        return (
          <div key={i} className="p-2">
            <Icon size={28} strokeWidth={2.5} className="text-slate-900" />
          </div>
        );
      })}
    </div>
  </div>
);

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-2 shadow-xl transition-all ${
        type === "error"
          ? "bg-slate-900 text-white"
          : "border border-slate-100 bg-white text-slate-900"
      }`}
    >
      {type === "error" ? (
        <AlertCircle className="h-4 w-4 text-red-400" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      )}
      <span className="text-[11px] font-bold tracking-tight">{message}</span>
      <button onClick={onClose} className="ml-1 opacity-40 hover:opacity-100">
        <X className="h-3 w-3" />
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
        className="flex h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-50"
      >
        <span>{selectedCountry?.flag}</span>
        <span>{selectedCountry?.code}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-2 w-40 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
          {countryCodes.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onSelect(c.code);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[10px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span>{c.flag}</span>
              <span className="flex-1">{c.name}</span>
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
    <div className="flex justify-center gap-2">
      {vals.map((val, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-11 w-9 rounded-xl border border-slate-200 bg-slate-50 text-center text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-900 focus:bg-white"
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [mode, setMode] = useState("password");
  const [authMethod, setAuthMethod] = useState("email");
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
      const res = await apiClient.post("/signIn", {
        email,
        password,
        loginType: "user",
      });

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
          ? await apiClient.post("/mail/send-otp", {
              email,
              loginType: "user",
            })
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
          ? await apiClient.post("/mail/verify-otp", {
              email,
              otp,
              loginType: "user",
            })
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
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-white p-4 font-sans text-slate-900 antialiased">
      <DoodleBackground />

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="relative z-10 w-full max-w-[430px] sm:max-w-[470px]">
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-md">
            <Hotel className="h-5 w-5 text-slate-900" strokeWidth={2} />
          </div>
          <h1 className="text-[14px] font-black uppercase leading-none tracking-[0.18em] text-slate-900">
            HotelRoomsStay
          </h1>
          <div className="mt-2 h-[2px] w-4 rounded-full bg-slate-900"></div>
        </div>

        <div className="flex min-h-[560px] flex-col rounded-[28px] border border-slate-100 bg-white/96 p-7 shadow-[0_18px_50px_-14px_rgba(0,0,0,0.16)] backdrop-blur-md sm:min-h-[600px] sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-[30px] font-black tracking-tight text-slate-900">Sign In</h2>
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Stay Managed
            </p>
          </div>

          <div className="mb-6 flex rounded-xl border border-slate-100 bg-slate-50 p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                resetOtpFlow();
              }}
              className={`flex-1 rounded-lg py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${
                mode === "password"
                  ? "border border-slate-100 bg-white text-slate-900 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setPassword("");
              }}
              className={`flex-1 rounded-lg py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${
                mode === "otp"
                  ? "border border-slate-100 bg-white text-slate-900 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              OTP
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "otp" && !otpSent && (
              <div className="mb-1 flex justify-center gap-5">
                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  className={`pb-1 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                    authMethod === "email"
                      ? "border-b-2 border-slate-900 text-slate-900"
                      : "text-slate-300"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("mobile")}
                  className={`pb-1 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                    authMethod === "mobile"
                      ? "border-b-2 border-slate-900 text-slate-900"
                      : "text-slate-300"
                  }`}
                >
                  Mobile
                </button>
              </div>
            )}

            {(mode === "password" || authMethod === "email") && !otpSent && (
              <div className="space-y-1.5">
                <label className="ml-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50/60 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:border-slate-900 focus:bg-white"
                    placeholder="mail@example.com"
                  />
                </div>
              </div>
            )}

            {mode === "otp" && authMethod === "mobile" && !otpSent && (
              <div className="space-y-1.5">
                <label className="ml-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Mobile
                </label>
                <div className="flex gap-2">
                  <CountryCodeDropdown
                    selectedCode={countryCode}
                    onSelect={setCountryCode}
                    disabled={loading}
                  />
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50/60 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:border-slate-900 focus:bg-white"
                      placeholder="Number"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === "password" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-900"
                  >
                    Reset?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50/60 pl-11 pr-12 text-sm font-semibold outline-none transition-all focus:border-slate-900 focus:bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "otp" && otpSent && (
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-5">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] leading-tight text-slate-400">
                    OTP for{" "}
                    <span className="text-slate-900">
                      {authMethod === "email" ? email : `${countryCode} ${phone}`}
                    </span>
                  </p>
                </div>
                <OtpInput onComplete={setOtp} disabled={loading} value={otp} />
                <div className="text-center">
                  {timer > 0 ? (
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">
                      {timer}s left
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={requestOtp}
                      className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-900 hover:underline"
                    >
                      Resend
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === "otp" && otpSent && otp.length !== 6)}
              className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-md shadow-slate-900/10 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === "password" ? "Login" : otpSent ? "Login" : "Continue"}</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-auto pt-8">
            <div className="relative flex items-center">
              <div className="h-[1px] flex-1 bg-slate-100"></div>
              <div className="mx-3 text-[8px] font-black uppercase tracking-[0.25em] text-slate-200">
                Direct Access
              </div>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:bg-slate-50"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="h-4 w-4"
                  alt="G"
                />
                Google
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:bg-slate-50"
              >
                <MapPin className="h-4 w-4 text-emerald-500" />
                Guest
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            No account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-black text-slate-900 hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      </div>

      <footer className="fixed bottom-4 flex gap-4 text-[7px] font-black uppercase tracking-[0.2em] text-slate-200">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Security</a>
      </footer>
    </div>
  );
}
