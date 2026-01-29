import { hotelList } from '@/utils/extrasList';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, X } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const navigateTo = (path) => {
    navigate(path);
    setOpen(false);
  };

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const onHotelClick = (name) => {
    const last = encodeURIComponent(name.trim().split(' ').pop());
    navigate(`/search?search=${last}`);
    closeModal();
  };

  const company = [
    ['About Us', '/about'], ['Contact', '/contact'], ['Careers', '/careers'], ['Partner', '/partner'],
  ];
  const legal = [
    ['Privacy Policy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies'],
  ];
  const social = [
    { icon: <Facebook className="w-5 h-5" />, href: '#' }, 
    { icon: <Instagram className="w-5 h-5" />, href: '#' }, 
    { icon: <Twitter className="w-5 h-5" />, href: '#' }, 
    { icon: <Youtube className="w-5 h-5" />, href: '#' },
  ];

  if (location.pathname === "/login" || location.pathname.includes('/register') || location.pathname === "/hotel-search") return null;

  return (
    <footer className="bg-gray-900 text-gray-400 pt-8 md:pt-12 pb-4 md:pb-8 rounded-t-2xl">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-12 gap-8">
          {/* Brand & Social */}
          <div className="col-span-12 md:col-span-4 flex flex-col h-full">
            <div className="mb-4">
              <img src="/logo.png" alt="Logo" className="h-10 invert" />
            </div>
            <a
              href="https://avverma.s3.ap-south-1.amazonaws.com/hrs.hotelroomsstay.apk"
              className="mb-4 mt-2 w-max"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-xs hover:bg-green-700 transition"
                type="button"
              >
                Download APK
              </button>
            </a>
            <p className="text-sm mb-6 max-w-xs">
              Your one-stop site to find and book perfect stays worldwide.
            </p>
            <h3 className="text-gray-200 font-semibold mb-2">Follow Us</h3>
            <div className="flex items-center gap-2">
              {social.map((item, i) => (
                <a key={i} href={item.href} className="text-gray-400 p-2 rounded-full hover:text-white hover:bg-white/10 transition-colors">
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="col-span-12 md:col-span-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Company Links */}
              <div className="flex flex-col items-start">
                <h3 className="text-white text-lg font-semibold mb-2">Company</h3>
                <div className="flex flex-col items-start gap-1">
                  {company.map(([name, path], i) => (
                    <a key={i} href={path} onClick={(e) => { e.preventDefault(); navigateTo(path); }} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Destinations Links */}
              <div className="flex flex-col items-start">
                <h3 className="text-white text-lg font-semibold mb-2">Destinations</h3>
                <div className="flex flex-col items-start gap-1">
                  {hotelList.slice(0, 4).map((h, i) => (
                    <a key={i} href="#" onClick={(e) => { e.preventDefault(); onHotelClick(h.hotel); }} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {h.hotel}
                    </a>
                  ))}
                </div>
                <div className="mt-3 w-full flex">
                  <button type="button" onClick={openModal} className="text-sm font-bold text-pink-500 hover:underline">
                    More Locations
                  </button>
                </div>
              </div>

              {/* Legal Links */}
              <div className="flex flex-col items-start">
                <h3 className="text-white text-lg font-semibold mb-2">Legal</h3>
                <div className="flex flex-col items-start gap-1">
                  {legal.map(([name, path], i) => (
                    <a key={i} href={path} onClick={(e) => { e.preventDefault(); navigateTo(path); }} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-6 border-gray-700" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-gray-500 text-center">
            © {new Date().getFullYear()} RoomsStay Pvt Ltd. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-2">
            <a href="#" className="inline-block">
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-8" />
            </a>
            <a href="#" className="inline-block">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-8" />
            </a>
          </div>
        </div>
      </div>

      {/* Modal for All Destinations */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div onClick={closeModal} className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-in-out ${open ? 'opacity-100' : 'opacity-0'}`}></div>

          {/* Modal Content */}
          <div className={`relative bg-white rounded-lg shadow-xl w-11/12 sm:w-3/4 md:w-auto md:max-w-2xl max-h-[85vh] transition-all duration-300 ease-in-out ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 id="modal-title" className="text-lg font-semibold text-gray-800">All Destinations</h2>
                <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hotelList.map((h, i) => (
                  <button key={i} onClick={() => onHotelClick(h.hotel)} className="w-full text-center text-sm font-medium text-gray-700 p-2 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors">
                    {h.hotel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
