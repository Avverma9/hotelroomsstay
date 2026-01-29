import React, { useState } from 'react';

// --- SVG ICON COMPONENTS ---
const PhoneIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);
const MailIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);
const MapPinIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const SendIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);
const UserIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
    </svg>
);
const BuildingIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="4" x2="9" y2="20"></line><line x1="15" y1="4" x2="15" y2="20"></line><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line>
    </svg>
);
const TwitterIcon = (props) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}><title>Twitter</title><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.223.085a4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
);
const LinkedinIcon = (props) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
);


// --- MAIN COMPONENT ---
export default function ContactPage  () {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', message: '' });
    const [formStatus, setFormStatus] = useState({ submitting: false, message: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormStatus({ submitting: true, message: '', type: '' });
        const formspreeUrl = 'https://formspree.io/f/mpwjgyqq';
        try {
            const response = await fetch(formspreeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                setFormStatus({ submitting: false, message: 'Thank you! Your message has been sent.', type: 'success' });
                setFormData({ firstName: '', lastName: '', email: '', message: '' });
            } else { throw new Error('Failed to send message.'); }
        } catch (error) {
            console.error('Form submission error:', error);
            setFormStatus({ submitting: false, message: 'Oops! Something went wrong. Please try again.', type: 'error' });
        }
    };
    
    return (
        <>
            <style>{`
                .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div className="bg-gray-50 font-sans antialiased text-gray-800 fade-in-up">
                <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 md:py-20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="container mx-auto px-4 max-w-4xl relative">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            Contact Our Team
                        </h1>
                        <p className="text-base md:text-lg text-blue-100/90 max-w-2xl mx-auto">
                            We're here to help and answer any question you might have. We look forward to hearing from you.
                        </p>
                    </div>
                </header>
                
                <main className="py-12 md:py-20">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                            
                            {/* --- Left Column: Contact Form --- */}
                            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                    Send a Message
                                </h2>
                                <p className="text-gray-600 mb-6">Fill out the form and our team will get back to you within 24 hours.</p>
                                
                                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <UserIcon />
                                            </div>
                                            <input type="text" placeholder="First Name" name="firstName" value={formData.firstName} onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                        </div>
                                        <div className="relative">
                                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <UserIcon />
                                            </div>
                                            <input type="text" placeholder="Last Name" name="lastName" value={formData.lastName} onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <MailIcon className="w-5 h-5"/>
                                        </div>
                                        <input type="email" placeholder="Email Address" name="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                                    </div>
                                    <div>
                                        <textarea placeholder="Your Message..." name="message" rows="5" value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"></textarea>
                                    </div>
                                    <div>
                                        <button type="submit" disabled={formStatus.submitting} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-full hover:bg-blue-700 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-600/30 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
                                            {formStatus.submitting ? 'Sending...' : 'Send Message'}
                                            {!formStatus.submitting && <SendIcon />}
                                        </button>
                                    </div>
                                    {formStatus.message && (
                                        <p className={`text-center font-medium ${formStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formStatus.message}
                                        </p>
                                    )}
                                </form>
                            </div>

                            {/* --- Right Column: Contact Details --- */}
                            <div className="space-y-8">
                                <div className="bg-white p-6 rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <BuildingIcon className="w-6 h-6 text-blue-600"/>
                                        Contact Information
                                    </h3>
                                    <div className="space-y-4 text-gray-600">
                                        <a href="mailto:info@hotelroomsstay.com" className="flex items-center gap-3 group">
                                            <MailIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition"/>
                                            <span className="group-hover:text-blue-600 transition">info@hotelroomsstay.com</span>
                                        </a>
                                        <a href="tel:9917991758" className="flex items-center gap-3 group">
                                            <PhoneIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition"/>
                                            <span className="group-hover:text-blue-600 transition">9917991758</span>
                                        </a>
                                        <div className="flex items-start gap-3">
                                            <MapPinIcon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0"/>
                                            <span>Surya Vihar Colony, Aligarh, UP, 202001</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h3>
                                    <div className="flex gap-4">
                                        <a href="#" className="text-gray-500 hover:text-blue-700 transition-colors"><TwitterIcon className="w-6 h-6 fill-current"/></a>
                                        <a href="#" className="text-gray-500 hover:text-blue-800 transition-colors"><LinkedinIcon className="w-6 h-6 fill-current"/></a>
                                    </div>
                                </div>
                                <div className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3539.815252878145!2d78.09338681501438!3d27.88371298276024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3974a5a5e3e2c36b%3A0x3f5c5b8d2d6c35c!2sSurya%20Vihar%20Colony%2C%20Aligarh%2C%20Uttar%20Pradesh%20202001!5e0!3m2!1sen!2sin!4v1663772418991!5m2!1sen!2sin"
                                        width="100%"
                                        height="250"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Office Location on Google Maps"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};



