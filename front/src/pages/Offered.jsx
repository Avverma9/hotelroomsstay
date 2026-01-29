import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOfferedHotels } from '../redux/slices/hotelSlice';
import { ArrowRight } from 'lucide-react';

export default function Offered() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { offeredHotels: hotels, loading } = useSelector((state) => state.hotel);

    useEffect(() => {
        // Fetch offered hotels on component mount
        dispatch(fetchOfferedHotels());
    }, [dispatch]);

    // Only show on home page
    if (location.pathname !== '/') return null;

    const shortcuts = [
        { id: 1, name: 'Goa', img: 'https://assets-news.housing.com/news/wp-content/uploads/2022/08/01072310/Goa-feature-compressed.jpg' },
        { id: 2, name: 'Jaipur', img: 'https://static.toiimg.com/img/115224983/Master.jpg' },
        { id: 3, name: 'Mumbai', img: 'https://s7ap1.scene7.com/is/image/incredibleindia/1-bandra-worli-sea-ink-mumbai-maharashtra-attr-hero?qlt=82&ts=1742195253156' },
        { id: 4, name: 'Delhi', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop' },
    ];

    const handleBookNow = (hotel) => {
        navigate('/book-now', {
            state: {
                hotelId: hotel.hotelId || hotel._id || hotel.id,
                hotel: hotel
            },
        });
    };

    return (
        <section className="py-10">
            <div className="container mx-auto px-4">
                {/* Shortcut locations */}
                <div className="mb-8">
                    <h3 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Quick shortcuts</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {shortcuts.map((s) => (
                            <Link
                                key={s.id}
                                to={`/search?search=${encodeURIComponent(s.name)}`}
                                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 block h-28"
                                aria-label={`Search ${s.name}`}
                            >
                                <img src={s.img} alt={s.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/30"></div>
                                <div className="relative h-full flex items-end p-3">
                                    <div>
                                        <div className="text-white font-bold text-sm">{s.name}</div>
                                        <div className="text-xs text-white/80">Popular</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Offered hotels */}
                <div>
                    <div className="relative">
                        <h5 className="text-2xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Our Offers</h5>
                        <Link to="/search/hotels" className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 px-4 py-0.5 text-sm font-bold text-blue-600 shadow-sm hover:shadow-md hover:bg-blue-50 transition-all duration-300 group">
                            View all
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="relative rounded-2xl shadow-lg overflow-hidden animate-pulse h-64 bg-gray-200" />
                            ))}
                        </div>
                    ) : hotels.length === 0 ? (
                        <div className="py-8 text-center text-gray-600">No offers available right now.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {hotels.map((h) => {
                                const minPrice = h.rooms?.[0]?.price || 0;
                                const roomCount = h.rooms?.length || 0;
                                const amenitiesCount = h.amenities?.[0]?.amenities?.length || 0;
                                
                                return (
                                    <div
                                        key={h.hotelId || h._id || h.id}
                                        onClick={() => handleBookNow(h)}
                                        className="group relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden block h-64 transform hover:-translate-y-1 cursor-pointer"
                                    >
                                        {/* Full background image */}
                                        {h.images && h.images[0] ? (
                                            <img 
                                                src={h.images[0]} 
                                                alt={h.hotelName} 
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400"></div>
                                        )}
                                        
                                        {/* Dark gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                        
                                        {/* Top badges */}
                                        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
                                            <div className="flex flex-col gap-1">
                                                {h.starRating && (
                                                    <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                                                        ⭐ {h.starRating} Star
                                                    </span>
                                                )}
                                                {h.propertyType?.[0] && (
                                                    <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-lg">
                                                        {h.propertyType[0]}
                                                    </span>
                                                )}
                                            </div>
                                            {roomCount > 0 && (
                                                <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                                                    {roomCount} Room Type{roomCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>

                                        {/* Bottom content overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-base text-white line-clamp-1" title={h.hotelName}>
                                                    {h.hotelName || 'Hotel'}
                                                </h4>
                                                
                                                <div className="flex items-center gap-1 text-white/90 text-xs">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                        <circle cx="12" cy="10" r="3"></circle>
                                                    </svg>
                                                    <span className="line-clamp-1">
                                                        {h.landmark ? `${h.landmark}, ` : ''}{h.city || ''}{h.state ? `, ${h.state}` : ''}
                                                    </span>
                                                </div>

                                                {amenitiesCount > 0 && (
                                                    <div className="flex items-center gap-1 text-white/80 text-xs">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                        <span>{amenitiesCount} Amenities</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                                                    <div>
                                                        <div className="text-xs text-white/70">Starting from</div>
                                                        <div className="text-2xl font-bold text-white">
                                                            ₹{minPrice ? Math.round(minPrice).toLocaleString('en-IN') : '—'}
                                                            <span className="text-xs font-normal text-white/80">/night</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg group-hover:from-blue-700 group-hover:to-blue-800 transition-all">
                                                        Book Now
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
