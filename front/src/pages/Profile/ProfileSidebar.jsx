import React, { useState, useEffect, useMemo } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";
import { PiTicketThin } from "react-icons/pi";
import { CgProfile } from "react-icons/cg";
import { MdOutlineRateReview, MdOutlineAccountCircle } from "react-icons/md";
import { IoWarningOutline } from "react-icons/io5";
import { RiCarLine } from "react-icons/ri";

// Import all profile page components
import ProfilePage from "./Profile";
import ProfileUpdatePage from "./UpdateProfile";
import ConfirmBooking from "./MyBookings";
import TourBooking from "./TourBooking";
import CabBooking from "./MyCabBooking";
import ComplaintsPage from "./complaints";
import Reviews from "./MyReviews";

// --- Sidebar NavLink ---
const SidenavLink = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `group flex items-center rounded-lg px-4 py-3 transition-all duration-300 ease-in-out no-underline
       ${
         isActive
           ? "bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md"
           : "hover:bg-white/30 text-slate-800"
       }`
    }
    style={{ textDecoration: "none" }}
  >
    {({ isActive }) => (
      <>
        <div
          className={`text-xl h-6 w-6 flex items-center justify-center transition-colors duration-300
          ${
            isActive
              ? "text-white"
              : "text-slate-500 group-hover:text-indigo-600"
          }`}
        >
          {icon}
        </div>
        <span
          className={`ml-4 text-sm font-medium ${
            isActive ? "text-white" : "text-slate-800"
          }`}
        >
          {label}
        </span>
      </>
    )}
  </NavLink>
);

export default function ProfileSideBar() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Render correct component based on current path
  const renderContent = () => {
    switch (location.pathname) {
      case "/profile":
        return <ProfilePage />;
      case "/profile-update/user-data/page":
        return <ProfileUpdatePage />;
      case "/bookings":
        return <ConfirmBooking />;
      case "/tour-bookings":
        return <TourBooking />;
      case "/cab-bookings":
        return <CabBooking />;
      case "/complaints":
        return <ComplaintsPage />;
      case "/reviews":
        return <Reviews />;
      default:
        return <ProfilePage />;
    }
  };

  const pageTitle = useMemo(() => {
    const titles = {
      "/profile": "My Profile",
      "/bookings": "Hotel Bookings",
      "/tour-bookings": "Tour Bookings",
      "/cab-bookings": "Cab Bookings",
      "/complaints": "Complaints",
      "/reviews": "Reviews",
      "/home": "Home",
      "/holidays": "Holidays",
      "/cabs": "Cabs",
    };
    return titles[location.pathname] || "Dashboard";
  }, [location.pathname]);

  useEffect(() => {
    if (window.innerWidth <= 768) setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleResize = () => setMenuOpen(window.innerWidth > 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMobileMenu = () => {
    if (window.innerWidth <= 768) setMenuOpen(false);
  };

  const paths = [
    "/bookings",
    "/reviews",
    "/tour-bookings",
    "/cab-bookings",
    "/complaints",
    "/profile",
    "/profile-update/user-data/page",
  ];
  if (!paths.some((path) => location.pathname.startsWith(path))) return null;

  return (
    <div className="relative min-h-screen md:flex bg-white">
      {/* Sidebar */}
      <aside
        className={`fixed top-[80px] bottom-[150px] left-4 z-40 w-72 transform transition-all duration-500 ease-in-out
        rounded-2xl border border-white/30 shadow-xl
         h-[570px]   
        bg-white/40 backdrop-blur-xl
        md:relative md:translate-x-0
        ${
          isMenuOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 md:opacity-100"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/30">
            <a
              href="/"
              className="text-2xl font-extrabold text-indigo-700 no-underline"
              style={{ textDecoration: "none" }}
            >
              HRS
            </a>
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-full text-slate-600 hover:bg-white/30 transition"
            >
              <AiOutlineClose className="h-6 w-6" />
            </button>
          </div>

          {/* Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            <SidenavLink
              to="/profile"
              icon={<CgProfile />}
              label="Profile"
              onClick={closeMobileMenu}
            />
            <SidenavLink
              to="/bookings"
              icon={<PiTicketThin />}
              label="Hotel Bookings"
              onClick={closeMobileMenu}
            />
            <SidenavLink
              to="/tour-bookings"
              icon={<PiTicketThin />}
              label="Tour Bookings"
              onClick={closeMobileMenu}
            />
            <SidenavLink
              to="/cab-bookings"
              icon={<RiCarLine />}
              label="Cab Bookings"
              onClick={closeMobileMenu}
            />
            <SidenavLink
              to="/complaints"
              icon={<IoWarningOutline />}
              label="Complaint"
              onClick={closeMobileMenu}
            />
            <SidenavLink
              to="/reviews"
              icon={<MdOutlineRateReview />}
              label="Reviews"
              onClick={closeMobileMenu}
            />
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between p-4 md:hidden bg-white/40 backdrop-blur-xl border-b border-white/30">
          <button
            onClick={toggleMenu}
            className="p-2 -ml-2 rounded-full text-slate-700 hover:bg-white/30 transition"
          >
            <HiOutlineMenuAlt2 size={24} />
          </button>
          <span className="text-lg font-semibold text-slate-900">
            {pageTitle}
          </span>
          <NavLink
            to="/profile"
            className="p-2 -mr-2 rounded-full hover:bg-white/30 transition no-underline"
            style={{ textDecoration: "none" }}
          >
            <MdOutlineAccountCircle size={24} className="text-slate-700" />
          </NavLink>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
