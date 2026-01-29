import React, { useState } from 'react';

// A simple SVG icon for the close button
const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className={className}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const Disclaimer = () => {
    const [open, setOpen] = useState(true);
    const [accepted, setAccepted] = useState(false);

    const handleClose = () => setOpen(false);

    const handleMarkAsRead = () => {
        setAccepted(true);
        setOpen(false);
    };
    
    if (!open) {
        return null;
    }

    return (
        // Modal Backdrop -- THIS LINE IS CHANGED
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-400 bg-opacity-75 backdrop-blur-sm"
            aria-labelledby="disclaimer-title"
            aria-modal="true"
            role="dialog"
        >
            {/* Modal Panel/Card */}
            <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] p-6 mx-auto bg-white rounded-2xl shadow-2xl sm:p-8">
                
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <h2 id="disclaimer-title" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                        <span>👉</span>
                        Partners Terms & Conditions
                    </h2>
                    <button 
                        onClick={handleClose} 
                        aria-label="close"
                        className="p-1 text-gray-500 transition-colors rounded-full hover:bg-gray-200"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <p className="mb-4 text-center text-gray-600">
                    Welcome to the Partner Portal of Roomstay!
                </p>

                <hr className="mb-4 border-gray-200" />
                
                {/* Scrollable Content Area */}
                <div 
                    id="disclaimer-description"
                    className="flex-1 pr-4 -mr-4 overflow-y-auto space-y-4
                               [&::-webkit-scrollbar]:w-2
                               [&::-webkit-scrollbar-track]:bg-gray-100
                               [&::-webkit-scrollbar-thumb]:bg-gray-400
                               [&::-webkit-scrollbar-thumb]:rounded-full"
                >
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">🏨 Hotel Partner</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            If you own or manage a hotel, guesthouse, homestay, or any form of accommodation, Roomstay provides you with a powerful platform to increase visibility, attract more bookings, and streamline guest management.
                        </p>
                        <ul className="mt-2 ml-5 text-sm list-disc text-gray-600 space-y-1">
                            <li>📈 Reach thousands of daily travelers</li>
                            <li>💼 List your property in just a few steps</li>
                            <li>⚙️ Manage bookings easily via our dashboard</li>
                            <li>📞 Get dedicated partner support</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-800">🌍 Travel Partner</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Are you a travel agent, local guide, or organizer of holiday experiences? As a Roomstay Travel Partner, you can showcase your packages, connect with a wider audience, and earn more while helping customers create unforgettable trips.
                        </p>
                        <ul className="mt-2 ml-5 text-sm list-disc text-gray-600 space-y-1">
                            <li>🧭 Publish your travel packages</li>
                            <li>🚗 Offer transportation, tours, and more</li>
                            <li>📊 Track customer leads and engagement</li>
                            <li>🤝 Collaborate with hotels and agencies</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-xl font-bold text-gray-800">📜 Terms & Conditions</h4>
                        <ol className="mt-2 ml-5 text-sm list-decimal text-gray-600 space-y-1">
                            <li>All listings are subject to verification and approval by the Roomstay team.</li>
                            <li>Partners must provide accurate and up-to-date information about their services.</li>
                            <li>Roomstay reserves the right to delist partners who do not comply with service standards or legal requirements.</li>
                            <li>Any disputes related to bookings must be handled professionally; our team may assist in mediation if needed.</li>
                            <li>Commission structures or listing fees (if any) will be communicated transparently before onboarding.</li>
                            <li>Data shared with Roomstay will be handled per our <a href="/privacy-policy" className="font-medium text-indigo-600 hover:underline">Privacy Policy</a>.</li>
                        </ol>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-6 mt-4 text-center border-t border-gray-200">
                    <button
                        onClick={handleMarkAsRead}
                        className="px-8 py-3 font-semibold text-white transition-all duration-300 transform bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40 hover:bg-indigo-700 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Yes, I Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Disclaimer;