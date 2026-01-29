import React from 'react';
import { useNavigate } from 'react-router-dom';

// --- SVG ICON COMPONENTS ---
const WorkHistoryIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <path d="M12 7v5l3 1.5" />
    </svg>
);
const ArrowBackIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

export default function Careers () {
    const navigate = useNavigate();

    return (
        <>
            <style>{`
                .fade-in-up { animation: fadeInUp 0.8s ease-in-out forwards; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div className="flex items-center justify-center min-h-[80vh]  p-6">
                <div className="w-full max-w-xl p-6 md:p-10 flex flex-col items-center gap-4 text-center bg-white/80 backdrop-blur-lg border border-black/5 rounded-3xl shadow-lg fade-in-up">
                    <div className="w-20 h-20 mb-4 flex items-center justify-center rounded-full text-white bg-gradient-to-br from-pink-500 to-orange-400 shadow-lg shadow-pink-500/30">
                        <WorkHistoryIcon />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900">
                        Careers at Roomsstay
                    </h1>
                    
                    <h2 className="text-xl text-gray-600 my-1">
                        No Opportunities Available Yet
                    </h2>
                    
                    <p className="max-w-md text-base text-gray-600">
                        We're always looking for talented people to join our team. Please check back in the future for openings.
                    </p>
                    
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 flex items-center gap-2 px-6 py-3 font-bold text-white text-base bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-md shadow-cyan-500/30 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/40"
                    >
                        <ArrowBackIcon />
                        <span>Go Back Home</span>
                    </button>
                </div>
            </div>
        </>
    );
};


