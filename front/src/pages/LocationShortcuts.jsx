import React from 'react';
import { useLocation } from 'react-router-dom';
import Offered from './Offered';

// --- SVG ICON FOR THE BUTTON ---
const ArrowRightIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

// --- DUMMY DATA FOR LOCATIONS ---
const locationsData = [
    {
        id: 1,
        name: 'Goa',
        description: 'Famous for its pristine beaches, vibrant nightlife, and Portuguese heritage.',
        imageUrl: 'https://assets-news.housing.com/news/wp-content/uploads/2022/08/01072310/Goa-feature-compressed.jpg',
        link: '/search?search=Goa'
    },
    {
        id: 2,
        name: 'Jaipur',
        description: 'The "Pink City," known for its stunning forts and palaces.',
        imageUrl: 'https://static.toiimg.com/img/115224983/Master.jpg',
        link: '/search?search=Jaipur'
    },
    {
        id: 3,
        name: 'Mumbai',
        description: 'The bustling financial capital, famous for Bollywood.',
        imageUrl: 'https://s7ap1.scene7.com/is/image/incredibleindia/1-bandra-worli-sea-ink-mumbai-maharashtra-attr-hero?qlt=82&ts=1742195253156',
        link: '/search?search=Mumbai'
    },
    {
        id: 4,
        name: 'Delhi',
        description: 'A city of contrasts, where ancient history and modern life coexist.',
        imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop',
        link: '/search?search=Delhi'
    },
];

// --- MODERN LOCATION CARD COMPONENT ---
const LocationCard = ({ name, description, imageUrl, link, className = "" }) => (
    <div className={`group relative flex flex-col bg-white rounded-2xl shadow-lg hover:shadow-purple-200/50 transition-all duration-300 ease-in-out overflow-hidden transform hover:-translate-y-1 ${className}`}>
        <img
            src={imageUrl}
            alt={`View of ${name}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

        <div className="relative p-5 flex flex-col flex-grow justify-end h-full">
            <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{name}</h3>
                <p className="text-sm sm:text-base text-gray-200 mb-4">{description}</p>
                <a
                    href={link}
                    className="inline-flex self-start items-center gap-2 font-semibold text-purple-600 bg-white px-5 py-2.5 rounded-full transition-all duration-300 ease-in-out hover:bg-purple-600 hover:text-white hover:shadow-lg group-hover:scale-105 group-hover:shadow-purple-600/30 text-sm sm:text-base"
                >
                    <span>Explore Now</span>
                    <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-1" />
                </a>
            </div>
        </div>
    </div>
);

// --- MAIN LOCATIONS COMPONENT WITH BENTO GRID ---
export default function Locations() {
    const mainLocation = locationsData[0];
    const otherLocations = locationsData.slice(1);
    const location = useLocation()
    if (location.pathname !== '/') {
        return null
    }
    return (
        <section className="py-16 md:py-24">

            <div className="container mx-auto px-4">
                <Offered />
                <hr class="h-1 my-8 border-0 bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500" />
                <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                        {/* Har letter ko alag span mein daala hai */}
                        <span className="text-red-500">T</span>
                        <span className="text-orange-500">o</span>
                        <span className="text-amber-500">p</span>
                        {' '} {/* Space ke liye */}
                        <span className="text-blue-500">D</span>
                        <span className="text-cyan-500">e</span>
                        <span className="text-teal-500">s</span>
                        <span className="text-emerald-500">t</span>
                        <span className="text-green-500">i</span>
                        <span className="text-lime-500">n</span>
                        <span className="text-yellow-500">a</span>
                        <span className="text-red-500">t</span>
                        <span className="text-orange-500">i</span>
                        <span className="text-amber-500">o</span>
                        <span className="text-blue-500">n</span>
                        <span className="text-cyan-500">s</span>
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Discover some of the most popular and breathtaking destinations curated just for you. Your next adventure awaits!
                    </p>
                    <div className="mt-6 w-24 h-1 bg-purple-600 mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Main Card */}
                    <LocationCard
                        {...mainLocation}
                        className="md:col-span-2 lg:col-span-2 lg:row-span-2 h-80 md:h-auto"
                    />

                    {/* Other Cards */}
                    {otherLocations.map((location) => (
                        <LocationCard key={location.id} {...location} className="h-80 md:h-auto" />
                    ))}
                </div>
            </div>
        </section>
    );
};


