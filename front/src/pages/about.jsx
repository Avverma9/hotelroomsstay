import React from 'react';

// --- SVG ICON COMPONENTS ---
const UsersIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}> <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/> </svg> );
const HeartHandshakeIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}> <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.82 2.94 0l.06-.06L12 11l2.96-2.96a2.17 2.17 0 0 0 0-3.08v0c-.82-.82-2.13-.82-2.94 0l-.06.06L12 5Z"/> </svg> );
const FormatQuoteIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" {...props}> <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z"></path> </svg> );
// --- NEW ICONS FOR CORE VALUES ---
const ShieldCheckIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg> );
const LightbulbIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 18h6v-2.3c0-2.4-1.6-4.5-3.8-5.2C9.8 9.9 8 8.7 8 7c0-1.7 1.3-3 3-3s3 1.3 3 3c0 1.4-.8 2.5-2 3"></path><line x1="12" y1="18" x2="12" y2="22"></line></svg> );
const TargetIcon = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg> );

const TeamMember = ({ imgSrc, name, title }) => (
    <div className="text-center">
        <img 
            src={imgSrc} 
            alt={`Portrait of ${name}`} 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md"
        />
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className="text-teal-600 font-semibold">{title}</p>
    </div>
);

export default function AboutPage  ()  {
    return (
        <>
            <style>{`
                .fade-in-down { animation: fadeInDown 0.8s ease-out forwards; }
                .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            
            <div className="bg-white font-sans antialiased text-gray-800">
                <header className="relative flex items-center justify-center h-[50vh] md:h-[60vh] text-center text-white">
                    <div className="absolute inset-0 bg-black/60 z-10"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop" 
                        alt="Serene travel destination with a pool and palm trees" 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="relative z-20 p-4 max-w-4xl">
                        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-3 tracking-tight fade-in-down" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                            Your Journey, Our Platform.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Welcome to Hotel Room Stay (HRS), your trusted Online Travel Agency (OTA).
                        </p>
                    </div>
                </header>

                <main>
                    <section className="py-16 md:py-24 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Mission & Vision</h2>
                                    <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                        We are not a hotel or tour operator. HRS is a bridge of trust between you and our verified partners in the hospitality and travel industry.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full mt-1">
                                                <TargetIcon className="w-5 h-5"/>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-800">Mission</h3>
                                                <p className="text-gray-600">To simplify travel planning by providing a seamless, reliable, and transparent booking experience for everyone.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 rounded-full mt-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-800">Vision</h3>
                                                <p className="text-gray-600">To be the most trusted and customer-centric online travel agency, empowering both travelers and partners to achieve their goals.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-white rounded-2xl shadow-lg">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="text-center">
                                            <div className="inline-flex p-4 rounded-full bg-teal-100 text-teal-700 mb-4">
                                                <UsersIcon className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">For Customers</h3>
                                            <p className="text-gray-600">Reliable bookings, transparent pricing, and hassle-free travel.</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="inline-flex p-4 rounded-full bg-amber-100 text-amber-600 mb-4">
                                                <HeartHandshakeIcon className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">For Partners</h3>
                                            <p className="text-gray-600">A powerful platform to showcase services and grow business with fair commission.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section className="py-16 md:py-24 bg-white">
                        <div className="container mx-auto px-4">
                             <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">The principles that guide our every decision.</p>
                                <div className="mt-6 w-24 h-1 bg-teal-600 mx-auto rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                                <div className="text-center p-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-700 mb-4">
                                        <ShieldCheckIcon className="w-8 h-8"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Integrity & Trust</h3>
                                    <p className="text-gray-600">We operate with honesty and transparency, building lasting trust with our users and partners.</p>
                                </div>
                                <div className="text-center p-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-700 mb-4">
                                        <LightbulbIcon className="w-8 h-8"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Innovation</h3>
                                    <p className="text-gray-600">We constantly seek better ways to serve our customers through technology and creativity.</p>
                                </div>
                                <div className="text-center p-6">
                                     <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-700 mb-4">
                                        <UsersIcon className="w-8 h-8"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Customer-Centric</h3>
                                    <p className="text-gray-600">Our customers are at the heart of everything we do. Their satisfaction is our ultimate goal.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="py-16 md:py-24 bg-gray-50">
                        <div className="container mx-auto px-4">
                            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
                                <div className="mt-6 w-24 h-1 bg-teal-600 mx-auto rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                <TeamMember imgSrc="https://placehold.co/400x400/007A7A/FFFFFF?text=Naveen+K" name="Naveen Kumar" title="Co-Founder & CEO" />
                                <TeamMember imgSrc="https://placehold.co/400x400/212529/FFFFFF?text=Team+Member" name="Jane Doe" title="Head of Operations" />
                                <TeamMember imgSrc="https://placehold.co/400x400/212529/FFFFFF?text=Team+Member" name="Ankit Verma" title="Lead Developer" />
                            </div>
                            <div className="mt-12 bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
                                <div className="p-8">
                                    <FormatQuoteIcon className="text-teal-500 transform rotate-180 w-16 h-16 -mt-4 -ml-4 opacity-30" />
                                    <p className="text-lg md:text-xl text-gray-700 italic leading-relaxed my-4">
                                        "As a traveler myself, I know how much trust matters. That's why we built HRS—it's not just a platform, but a promise. A promise of a great experience, whether you are our guest or our partner."
                                    </p>
                                    <div className="text-right">
                                        <h3 className="text-xl font-bold text-gray-900">Naveen Kumar</h3>
                                        <p className="text-teal-600 font-semibold">Co-Founder, HRS</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
};



