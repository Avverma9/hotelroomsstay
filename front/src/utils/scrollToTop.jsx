import React, { useState, useEffect } from 'react';

const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    const buttonStyle = {
        position: 'fixed',
        bottom: '77px',
        right: '40px',
        zIndex: 1050,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Modern gradient
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '55px',
        height: '55px',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isVisible ? 1 : 0, // Control opacity for fade effect
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)', // Control position for slide effect
        transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.3s ease',
        pointerEvents: isVisible ? 'auto' : 'none', // Disable clicks when hidden
    };
    
    const hoverStyle = {
        transform: 'scale(1.1) translateY(-5px)',
        boxShadow: '0 10px 25px rgba(118, 75, 162, 0.4)',
    };
    
    const combinedStyle = { ...buttonStyle, ...(isHovered && isVisible ? hoverStyle : {}) };

    return (
        <button 
            onClick={scrollToTop} 
            style={combinedStyle}
            title="Go to top"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="Scroll to top"
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            >
                <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
        </button>
    );
};

export default ScrollToTopButton;