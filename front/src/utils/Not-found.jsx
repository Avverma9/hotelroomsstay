import React from 'react';
// useNavigate is removed as it's the source of the error when not inside a Router.
// import { useNavigate } from 'react-router-dom';

// A modern SVG icon component for the 404 graphic.
// Using an inline SVG is faster and more scalable than an external image/gif.
const NotFoundIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-40 h-40 text-gray-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
        <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="bold"
            fill="currentColor"
            className="text-gray-400"
        >
            404
        </text>
    </svg>
);


const NotFoundPage = () => {
    // The useNavigate hook is removed to resolve the error.
    // const navigate = useNavigate();

    // This function now uses the browser's built-in history API.
    // This achieves the same result without the need for React Router context.
    const goBack = () => {
        window.history.back();
    };

    // Reloads the page to "retry" loading the content.
    const retryPage = () => {
        window.location.reload();
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4 transition-colors duration-300">
            <div className="max-w-md w-full">
                <div className="flex justify-center mb-6">
                    <NotFoundIcon />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-3">
                    Page Not Found
                </h1>
                <p className="text-md md:text-lg text-gray-500 mb-8">
                    Sorry, we couldn't find the page you were looking for. It might have been moved or deleted.
                </p>
                <div className="flex items-center justify-center space-x-4">
                    <button
                        onClick={goBack}
                        className="px-6 py-2.5 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={retryPage}
                        className="px-6 py-2.5 font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                        Retry
                    </button>
                </div>
            </div>
        </main>
    );
};

export default NotFoundPage;

