import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Map,
  MessageSquareText,
  ShieldAlert,
} from "lucide-react";
import heroImage from "../assets/hero.png";
import {
  clearAuthMessage,
  loginWithPassword,
  selectAuth,
  sendOtp,
  verifyOtp,
} from "../../redux/slices/authSlice";

const highlights = [
  {
    title: "Realtime Chat",
    description: "Connect with guests and staff instantly, resolve queries faster.",
    icon: MessageSquareText,
    accent: "text-sky-300",
  },
  {
    title: "Complaint Feature",
    description: "Track, manage, and resolve guest complaints with clarity.",
    icon: ShieldAlert,
    accent: "text-rose-300",
  },
  {
    title: "Tour & Travel",
    description: "Organize itineraries, bookings, and partner plans in one place.",
    icon: Map,
    accent: "text-emerald-300",
  },
  {
    title: "Hotel Operations",
    description: "Manage rooms, reservations, billing, and team workflows.",
    icon: Building2,
    accent: "text-violet-300",
  },
];

export default function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector(selectAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setFeedback({ message: "Please enter your email address first.", type: "error" });
      return;
    }
    try {
      const res = await dispatch(sendOtp(email)).unwrap();
      setOtpSent(true);
      setResendTimer(30);
      setFeedback({ message: res?.message || "OTP sent to your email.", type: "success" });
    } catch (err) {
      setFeedback({ message: err || "Failed to send OTP. Try again.", type: "error" });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setFeedback({ message: "Please enter the OTP.", type: "error" });
      return;
    }
    try {
      const res = await dispatch(verifyOtp({ email, otp })).unwrap();
      setFeedback({ message: res?.message || "OTP verified! Logging in...", type: "success" });
    } catch (err) {
      setFeedback({ message: err || "Invalid OTP. Try again.", type: "error" });
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFeedback({ message: "Please enter both email and password.", type: "error" });
      return;
    }
    try {
      const res = await dispatch(loginWithPassword({ email, password })).unwrap();
      setFeedback({ message: res?.message || "Logged in successfully!", type: "success" });
    } catch (err) {
      setFeedback({ message: err || "Invalid email or password.", type: "error" });
    }
  };

  const switchMethod = (method) => {
    setLoginMethod(method);
    dispatch(clearAuthMessage());
    setFeedback({ message: "", type: "" });
    setOtpSent(false);
    setOtp("");
    setPassword("");
  };

  const inputClass = "h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-slate-700";

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-slate-900 selection:bg-indigo-100">

      {/* ── Left: Elegant Login Panel ─────────────────────────────────────── */}
      <section className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[45%] xl:w-[40%] xl:px-24 relative z-10">
        
        <div className="mx-auto w-full max-w-[400px]">
          {/* Logo / Brand */}
          <div className="mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 border border-slate-200">
              HR Admin Portal
            </div>
            <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2.5 text-sm text-slate-500 font-medium">
              Securely sign in to your workspace to continue.
            </p>
          </div>

          {/* iOS Style Segmented Control */}
          <div className="mb-8 flex rounded-lg bg-slate-100 p-1 border border-slate-200/60">
            {["password", "otp"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => switchMethod(method)}
                className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${
                  loginMethod === method
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {method === "password" ? "Password" : "Email OTP"}
              </button>
            ))}
          </div>

          {/* Feedback Alert */}
          {feedback.message && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                feedback.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="space-y-5">
            {/* Email Input */}
            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMethod === "otp" && otpSent}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && loginMethod === "password") {
                      handlePasswordLogin(e);
                    }
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password Login Flow */}
            {loginMethod === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-slate-700">Password</label>
                    <a href="#" className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign In to Workspace"}
                </button>
              </form>
            )}

            {/* OTP Login Flow */}
            {loginMethod === "otp" && (
              <div className="space-y-6">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || !email}
                    className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Send Magic Code"}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div>
                      <label className={labelClass}>Authentication Code</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          placeholder="0 0 0 0 0 0"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-center text-lg font-bold tracking-[0.75em] text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.length < 4}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>Verify & Continue <ArrowRight size={16} /></>
                      )}
                    </button>

                    <p className="text-center text-[13px] font-medium text-slate-500">
                      Didn&apos;t receive it?{" "}
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={resendTimer > 0 || loading}
                        className="font-bold text-indigo-600 transition hover:text-indigo-700 disabled:text-slate-400"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                      </button>
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>

          <p className="mt-10 text-center text-[13px] font-medium text-slate-500 sm:text-left">
            Don&apos;t have an account?{" "}
            <a href="#" className="font-bold text-slate-900 hover:underline">
              Request access
            </a>
          </p>
        </div>
      </section>

      {/* ── Right: Luxurious Editorial Panel ──────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-[55%] xl:w-[60%] lg:flex-col">
        
        {/* Background Image & Moody Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-slate-900/40" />

        {/* Subtle Ambient Glows */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-500/10 blur-[100px]" />

        {/* Content Wrapper */}
        <div className="relative z-10 flex h-full flex-col justify-between px-12 py-16 xl:p-24">
          
          {/* Header Typography */}
          <div className="max-w-xl">
            <h2 className="text-4xl font-light leading-tight tracking-tight text-slate-200 xl:text-5xl">
              Elevate your <br />
              <span className="font-extrabold text-white">Hospitality Operations.</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400">
              The premium command center designed for modern hoteliers and travel professionals. Seamlessly sync bookings, teams, and guest experiences.
            </p>
          </div>

          {/* Frosted Glass Feature List */}
          <div className="mt-12 grid gap-4 xl:grid-cols-2">
            {highlights.map(({ title, description, icon: Icon, accent }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 shrink-0 ${accent}`}>
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Elements */}
          <div className="mt-auto flex flex-col xl:flex-row xl:items-center gap-4 pt-12 border-t border-white/10">
            <div className="flex -space-x-3">
              {[
                { letter: "A", color: "bg-indigo-500" },
                { letter: "R", color: "bg-sky-500" },
                { letter: "K", color: "bg-emerald-500" },
              ].map(({ letter, color }) => (
                <div
                  key={letter}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-bold text-white ${color} shadow-sm`}
                >
                  {letter}
                </div>
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-white/10 backdrop-blur-sm text-xs font-bold text-white">
                +2k
              </div>
            </div>
            <p className="text-[13px] font-medium text-slate-400">
              Trusted by <span className="text-white">2,000+</span> top-tier hospitality businesses worldwide.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}