import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { ToastProvider } from './utils/toast';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HotelSearch from './pages/hotel/HotelSearch';

import TourPackages from './pages/tour/tour-package';
import TourBookingPage from './pages/tour/tour-booking';
import PartnerPage from './pages/tour/partnerPage';

// Partner Pages
import HotelPartnerForm from './pages/partner/hotel-partner';
import PolicyForm from './pages/partner/hotel-policy';
import AmenitiesPage from './pages/partner/hotel-amenities';
import PartnerFoods from './pages/partner/hotel-foods';
import PartnerRooms from './pages/partner/hotel-rooms';

// Cab Pages
import CabsPage from './pages/cabs/Cabs';
import CabBooking from './pages/cabs/CabBooking';

// Profile - ProfileSidebar handles all profile routes with nested <Routes>
import ProfileSideBar from './pages/Profile/ProfileSidebar';

// Other Pages
import AboutPage from './pages/about';
import ContactPage from './pages/Contact';
import PoliciesPage from './pages/PolicyPage';
import TermsPage from './pages/TermsPage';
import Careers from './pages/Careers';
import Offered from './pages/Offered';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import BottomBar from './components/BottomBar';
import BookNowPage from './pages/booking/Booknow';
import CouponPage from './pages/Profile/coupons';

// Styles

// Layout wrapper component to conditionally show Header/Footer/BottomBar
function Layout({ children }) {
  const location = useLocation();
  const pathname = location.pathname || "";
  const hideLayout = pathname === "/login" || pathname === "/register";

  // Hide bottom bar on specific pages: Book Now and Tour Booking pages
  // Hide bottom bar on book-now, tour booking pages and holidays (and their subroutes)
  const hideBottomBar = hideLayout || pathname === "/book-now" || pathname.startsWith("/travellers/booking") || pathname.startsWith("/holidays") || pathname.startsWith("/cabs") || pathname.startsWith("/hotel-search");


  return (
    <>
      {!hideLayout && <Header />}
      <main className={!hideLayout ? "min-h-screen" : ""}>
        {children}
      </main>
      {!hideLayout && <Footer />}
      {!hideBottomBar && <BottomBar />}
    </>
  );
}

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }} 
      />

  <ToastProvider>
  <Layout>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
            } 
          />

          {/* Main routes */}
          <Route path="/" element={<HomePage />} />

          {/* Hotel Search Route */}
          <Route path="/hotel-search" element={<HotelSearch />} />
          <Route path="/search" element={<HotelSearch />} />
          <Route path="/book-now" element={<BookNowPage />} />

          {/* Tour/Holiday Routes */}
          <Route path="/holidays" element={<TourPackages />} />
          <Route path="/travellers/booking/:id" element={<TourBookingPage />} />
          <Route path="/travel-partner" element={<PartnerPage />} />

          {/* Partner Routes */}
          <Route path="/partner" element={<HotelPartnerForm />} />
          <Route path="/partner/second-step" element={<PolicyForm />} />
          <Route path="/partner/third-step" element={<AmenitiesPage />} />
          <Route path="/partner/fourth-step" element={<PartnerFoods />} />
          <Route path="/partner/last-step" element={<PartnerRooms />} />

          {/* Cab Routes */}
          <Route path="/cabs" element={<CabsPage />} />
          <Route path="/cab-booking/:id" element={<CabBooking />} />

          {/* Profile Routes - ProfileSidebar renders on these paths and handles nested routes internally */}
          <Route path="/profile" element={<ProfileSideBar />} />
          <Route path="/profile-update/user-data/page" element={<ProfileSideBar />} />
          <Route path="/bookings" element={<ProfileSideBar />} />
          <Route path="/tour-bookings" element={<ProfileSideBar />} />
          <Route path="/cab-bookings" element={<ProfileSideBar />} />
          <Route path="/complaints" element={<ProfileSideBar />} />
          <Route path="/reviews" element={<ProfileSideBar />} />
          <Route path="/coupons" element={<CouponPage />} />

          {/* Static Pages */}
          <Route path="/offered" element={<Offered />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/policy" element={<PoliciesPage />} />
          <Route path="/privacy" element={<PoliciesPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/careers" element={<Careers />} />

          {/* Catch all - redirect to home or login */}
          <Route 
            path="*" 
            element={
              <Navigate to={isAuthenticated ? "/" : "/login"} replace />
            } 
          />
        </Routes>
  </Layout>
  </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
