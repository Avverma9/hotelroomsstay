import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../utils/apiInterceptor";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    mobile: "",
    password: "",
    image: null,
  });

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
      return toast.warn("Please fill in all required fields.");
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
      const res = await apiClient.post(`/Signup`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data?.message || "Registration successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-linear-to-br from-blue-50 via-white to-cyan-50 font-sans">
      <div className="min-h-screen flex justify-center items-center p-4">
        <div
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-6"
          role="main"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">
              Create Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Get started by filling out the form below
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            noValidate
          >
            <div className="flex flex-col">
              <label
                htmlFor="userName"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="userName"
                name="userName"
                type="text"
                placeholder="Choose a unique username"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="email"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="mobile"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Mobile Number
              </label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                placeholder="123-456-7890"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="password"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col col-span-1 sm:col-span-2">
              <label
                htmlFor="image"
                className="mb-1 text-sm font-medium text-gray-700"
              >
                Profile Picture (Optional)
              </label>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                className="py-3 px-4 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 border-none rounded-lg text-base font-semibold bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed col-span-1 sm:col-span-2"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-700">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-600 font-medium no-underline hover:underline"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
