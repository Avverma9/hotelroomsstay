import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// --- DUMMY DATA ---
// Assuming bannerImage is an array of image URLs
const bannerImage = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop'
];

// --- SVG ICON ---
const ArrowForwardIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);


const Banner = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();

    const animatedTexts = [
        { mainText: 'Hotel', subText: 'Luxury & Comfort' },
        { mainText: 'Travel', subText: 'Explore & Discover' },
        { mainText: 'Tour', subText: 'Tour & Memories' },
        { mainText: 'Stay', subText: 'Relax & Unwind' },
    ];

    const slides = bannerImage.map((src, idx) => ({
        src,
        mainText: animatedTexts[idx % animatedTexts.length].mainText,
        subText: animatedTexts[idx % animatedTexts.length].subText,
    }));

    useEffect(() => {
        Promise.all(
            slides.map(s => new Promise((res) => {
                const img = new Image();
                img.src = s.src;
                img.onload = res;
                img.onerror = res;
            }))
        ).then(() => setTimeout(() => setLoading(false), 300));
    }, [slides]);

    useEffect(() => {
        if (loading) return;
        const DURATION = 4000;
        let progressInterval;

        const startProgress = () => {
            const startTime = Date.now();
            progressInterval = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                const percentage = (elapsedTime / DURATION) * 100;
                if (percentage >= 100) {
                    clearInterval(progressInterval);
                } else {
                    setProgress(percentage);
                }
            }, 30);
        };

        const slideInterval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % slides.length);
            setProgress(0);
            clearInterval(progressInterval);
            startProgress();
        }, DURATION);

        startProgress();

        return () => {
            clearInterval(slideInterval);
            clearInterval(progressInterval);
        };
    }, [loading, slides.length]);

    const handleNavClick = (index) => {
        setCurrentImageIndex(index);
        setProgress(0);
    };

    if (location.pathname !== '/') return null;

    if (loading) {
        return (
            <div className="p-1 md:p-4">
                <div className="h-[200px] sm:h-[300px] md:h-[80vh] bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes kenburns {
                    0% { transform: scale(1) translate(0,0); }
                    100% { transform: scale(1.1) translate(-2%, 2%); }
                }
                .animate-kenburns {
                    animation: kenburns 20s ease-out both infinite;
                }
                @keyframes slideIn {
                    0% { transform: translateY(-50px) scale(0.8); opacity: 0; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                .animate-slideIn {
                    animation: slideIn 1s ease-out both;
                }
                @keyframes slideUp {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp {
                    animation: slideUp 0.8s ease-out both;
                }
            `}</style>
            <div className="p-1 md:p-4">
                <div className="relative h-[200px] sm:h-[300px] md:h-[80vh] w-full overflow-hidden rounded-2xl">
                    {slides.map((slide, idx) => (
                        <div
                            key={slide.src}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${currentImageIndex === idx ? 'opacity-100 animate-kenburns' : 'opacity-0'}`}
                            style={{ backgroundImage: `url(${slide.src})` }}
                        />
                    ))}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center w-[90%]">
                        <h1 key={currentImageIndex} className="text-2xl sm:text-4xl md:text-6xl font-extrabold animate-slideIn" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                            {slides[currentImageIndex].mainText}
                        </h1>
                        <p key={currentImageIndex + '-sub'} className="mt-1 text-xs sm:text-sm md:text-base uppercase tracking-widest font-light animate-slideIn" style={{ animationDelay: '0.2s' }}>
                            {slides[currentImageIndex].subText}
                        </p>
                    </div>

                    <div className="absolute bottom-[15%] sm:bottom-[20%] md:bottom-[15%] left-0 right-0 text-center text-white px-4">
                        <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
                            <p className="mb-2 max-w-xl mx-auto text-xs md:text-base text-gray-200" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
                                Discover and book unique places to stay and enjoy an unforgettable holiday experience.
                            </p>
                        </div>
                        <div className="animate-slideUp" style={{ animationDelay: '0.6s' }}>
                            <button
                                onClick={() => navigate('/holidays')}
                                className="inline-flex items-center gap-2 text-xs md:text-base font-semibold text-white bg-gradient-to-r from-pink-500 to-orange-400 rounded-full px-4 py-1.5 md:px-6 md:py-2.5 shadow-lg shadow-pink-500/30 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-pink-500/40"
                            >
                                <span>Book Your Stay</span>
                                <ArrowForwardIcon />
                            </button>
                        </div>
                    </div>

                    <div className="absolute bottom-0 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-1 bg-black/30 p-1 rounded-xl backdrop-blur-sm">
                        {slides.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleNavClick(idx)}
                                className="w-5 sm:w-8 md:w-10 h-1 rounded-full overflow-hidden bg-white/20 cursor-pointer"
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-white to-gray-200"
                                    style={{
                                        width: `${currentImageIndex === idx ? progress : (currentImageIndex > idx ? 100 : 0)}%`
                                    }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Banner;
