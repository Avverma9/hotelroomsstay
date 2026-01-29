import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLocation } from '../redux/slices/locationSlice';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLoader } from '../utils/loader.jsx';

export default function HeaderTravel() {
    const location = useLocation();
    const dispatch = useDispatch();
    const { data: locations, loading, error } = useSelector((state) => state.location);
    const scrollContainerRef = useRef(null);
    const [showNav, setShowNav] = useState({ left: false, right: false });
    const { showLoader, hideLoader } = useLoader();

    useEffect(() => {
        const fetchData = async () => {
            showLoader();
            try {
                await dispatch(fetchLocation()).unwrap();
            } catch (err) {
                // Handle error if needed
            } finally {
                hideLoader();
            }
        };

        if (!locations || locations.length === 0) {
            fetchData();
        }
    }, [dispatch, locations, showLoader, hideLoader]);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 1;
            const isAtStart = scrollLeft === 0;
            const canScroll = scrollWidth > clientWidth;

            setShowNav({
                left: !isAtStart && canScroll,
                right: !isAtEnd && canScroll
            });
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const resizeObserver = new ResizeObserver(handleScroll);
            resizeObserver.observe(container);
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => {
                resizeObserver.unobserve(container);
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, [locations]);

    const scroll = (direction) => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = direction === 'left' ? -container.clientWidth * 0.8 : container.clientWidth * 0.8;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const allowedPaths = ['/search/hotels', '/search', '/', '/travellers'];
    if (!allowedPaths.includes(location.pathname)) {
        return null;
    }

    if (error) {
        return (
            <div className="py-4 text-center">
                <p className="text-red-600 text-sm">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="compact-card relative py-3 sm:py-4 my-2 px-4 sm:px-6 mx-auto max-w-6xl">
            {/* Left Navigation Arrow */}
            {showNav.left && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white/90 rounded-full shadow-md transition-all duration-200 hover:scale-110"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </button>
            )}

            {/* Scrollable Location List */}
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div className="flex gap-6 sm:gap-8 px-2 sm:px-4">
                    {loading
                        ? Array.from({ length: 12 }).map((_, index) => (
                              <div key={index} className="flex flex-col items-center gap-2 animate-pulse">
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200" />
                                  <div className="w-12 sm:w-16 h-3 bg-gray-200 rounded" />
                              </div>
                          ))
                        : locations?.map((loc) => (
                              <Link
                                  to={`/search?search=${loc.location}`}
                                  key={loc.location}
                                  className="flex flex-col items-center gap-2 min-w-16.25 sm:min-w-20 group transition-all duration-200"
                              >
                                  <div className="relative">
                                      <img
                                          src={loc.images[0]}
                                          alt={loc.location}
                                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-200 group-hover:border-indigo-500 group-hover:scale-110 transition-all duration-200 shadow-sm group-hover:shadow-md"
                                      />
                                  </div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors duration-200 text-center truncate w-full">
                                      {loc?.location === 'Uttar Pradesh' ? 'UP' : loc?.location}
                                  </p>
                              </Link>
                          ))}
                </div>
            </div>

            {/* Right Navigation Arrow */}
            {showNav.right && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white/90 rounded-full shadow-md transition-all duration-200 hover:scale-110"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </button>
            )}
        </div>
    );
}
