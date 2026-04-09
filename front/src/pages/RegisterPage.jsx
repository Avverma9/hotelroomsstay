import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Upload,
  ChevronRight,
  Loader2,
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
import apiClient from "../utils/apiInterceptor";

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

export default function RegisterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    mobile: "",
    password: "",
    image: null,
  });

  const showToast = (message, type = "success") => setToast({ message, type });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { userName, email, mobile, password } = formData;

    if (!userName || !email || !mobile || !password) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("userName", userName);
    data.append("email", email);
    data.append("mobile", mobile);
    data.append("password", password);
    if (formData.image) {
      data.append("images", formData.image);
    }

    try {
      const res = await apiClient.post("/Signup", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast(res.data?.message || "Registration successful!");
      navigate("/login", { replace: true });
    } catch (err) {
      showToast(getErrorMessage(err, "Registration failed."), "error");
    } finally {
      setLoading(false);
    }
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

        <div className="flex min-h-[620px] flex-col rounded-[28px] border border-slate-100 bg-white/96 p-7 shadow-[0_18px_50px_-14px_rgba(0,0,0,0.16)] backdrop-blur-md sm:min-h-[660px] sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-[30px] font-black tracking-tight text-slate-900">
              Create Account
            </h2>
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Join The Stay Circle
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="ml-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  name="userName"
                  type="text"
                  value={formData.userName}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50/60 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:border-slate-900 focus:bg-white"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50/60 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:border-slate-900 focus:bg-white"
                  placeholder="mail@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Mobile
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50/60 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:border-slate-900 focus:bg-white"
                  placeholder="Enter mobile number"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50/60 pl-11 pr-12 text-sm font-semibold outline-none transition-all focus:border-slate-900 focus:bg-white"
                  placeholder="••••••••"
                  required
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

            <div className="space-y-1.5">
              <label className="ml-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Profile Picture
              </label>
              <input
                ref={fileInputRef}
                name="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-white"
              >
                <span className="truncate">
                  {formData.image ? formData.image.name : "Upload profile picture (optional)"}
                </span>
                <Upload className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-md shadow-slate-900/10 transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Sign Up</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-auto pt-8">
            <div className="relative flex items-center">
              <div className="h-[1px] flex-1 bg-slate-100"></div>
              <div className="mx-3 text-[8px] font-black uppercase tracking-[0.25em] text-slate-200">
                Quick Start
              </div>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:bg-slate-50"
              >
                <Hotel className="h-4 w-4 text-slate-500" />
                Sign In
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:bg-slate-50"
              >
                <MapPin className="h-4 w-4 text-emerald-500" />
                Explore
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-black text-slate-900 hover:underline"
            >
              Login
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
