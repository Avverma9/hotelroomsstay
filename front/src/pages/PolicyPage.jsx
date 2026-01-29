import React, { useState } from 'react';

const BuildingIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>);
const UsersIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const PhoneIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>);
const MailIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>);
const MapPinIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>);
const FileTextIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>);
const LockIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const GavelIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="m14 13-8.5 8.5a2.12 2.12 0 1 1-3-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>);
const ShieldCheckIcon = ({ style }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>);

const HrsPolicy = () => {
  const [activeTab, setActiveTab] = useState('customers');

  const tabContent = {
    customers: [
      {title: "Booking", text: "All bookings must be made via our official website/app."},
      {title: "Payments", text: "Customers agree to pay the full/advance amount as per partner policy."},
      {title: "Cancellations", text: "Refunds depend on the partner’s cancellation policy. HRS service/transaction charges are non-refundable."},
      {title: "Liability", text: "HRS is a facilitator. Responsibility for service quality lies with the partner."},
    ],
    hotels: [
      {title: "Accuracy", text: "Must provide accurate tariffs, amenities, photos & availability."},
      {title: "Standards", text: "Maintain cleanliness, safety & hygiene standards."},
      {title: "Commitment", text: "Honor all confirmed bookings received via HRS."},
    ],
    cabs: [
      {title: "Safety", text: "Provide licensed drivers, insured vehicles, and safe travel."},
      {title: "Professionalism", text: "Maintain proper behavior and punctuality."},
      {title: "Fairness", text: "No overcharging beyond agreed tariffs."},
    ],
    tours: [
      {title: "Clarity", text: "Provide clear itinerary, inclusions/exclusions, and pricing."},
      {title: "Compliance", text: "Ensure legal compliance (permits, insurance, safety measures)."},
      {title: "Reliability", text: "Honor all bookings without sudden changes."},
    ]
  };

  const privacySections = [
    {
      title: "1. Information We Collect",
      content: [
        { label: "Personal Data", text: "Personally identifiable information, such as your name, email address, mobile number, and password, that you voluntarily give to us when you register for an account or make a booking." },
        { label: "Partner Data", text: "If you register as a Partner (e.g., hotel, travel agent), we collect extensive information, including but not limited to business name, address, contact person details, business registration documents, and bank account information." },
        { label: "Booking Information", text: "Details related to your bookings, such as travel dates, accommodation details, cab bookings, tour packages, and payment information." },
        { label: "Derivative Data", text: "Information our servers automatically collect when you access the Platform, such as your IP address, browser type, operating system, and access times." }
      ]
    },
    {
      title: "2. How We Use Your Information",
      content: [
        { label: "Management", text: "Create and manage your account, process bookings and payments." },
        <li>Facilitate communication between you and our Partners.</li>,
        <li>Respond to your inquiries, complaints, and provide customer support.</li>,
        <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
      ]
    }
  ];

  const styles = {
    pageWrapper: { background: '#0a0a0a', color: '#f0f0f0', paddingBottom: '6rem', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' },
    header: { padding: '8rem 2rem 6rem', textAlign: 'center', background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)' },
    headerTitle: { fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: '800', lineHeight: 1.1, color: 'white', marginBottom: '1.5rem' },
    headerSubtitle: { fontSize: 'clamp(1rem, 3vw, 1.25rem)', maxWidth: '700px', margin: '0 auto', color: '#a7a7a7', lineHeight: 1.6 },
    mainContent: { maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' },
    section: { marginBottom: '5rem' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' },
    sectionTitle: { fontSize: '2.25rem', fontWeight: '800', color: 'white' },
    tabContainer: { display: 'flex', gap: '1rem', borderBottom: '1px solid #333', marginBottom: '3rem', overflowX: 'auto' },
    tabButton: { padding: '1rem 1.5rem', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', borderBottom: '3px solid transparent', transition: 'all 0.3s ease', whiteSpace: 'nowrap' },
    tabButtonActive: { color: '#2dd4bf', borderBottomColor: '#2dd4bf' },
    contentBox: { background: '#141414', padding: '2.5rem', borderRadius: '1rem', border: '1px solid #222', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' },
    footer: { borderTop: '1px solid #222', paddingTop: '4rem', marginTop: '6rem' },
    contactCard: { background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #333' }
  };

  return (
    <div style={styles.pageWrapper}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Policies & Privacy</h1>
        <p style={styles.headerSubtitle}>
          At Happy Hotel Stay Service, transparency is our priority. These guidelines ensure a safe and reliable experience for all our users and partners.
        </p>
      </header>

      <main style={styles.mainContent}>
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <FileTextIcon style={{width: '2.5rem', height: '2.5rem', color: '#2dd4bf'}}/>
            <h2 style={styles.sectionTitle}>Terms & Conditions</h2>
          </div>
          <div style={styles.tabContainer}>
            {['customers', 'hotels', 'cabs', 'tours'].map(tab => (
              <button 
                key={tab}
                style={activeTab === tab ? {...styles.tabButton, ...styles.tabButtonActive} : styles.tabButton} 
                onClick={() => setActiveTab(tab)}
              >
                For {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.contentBox}>
            <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              {tabContent[activeTab].map(item => (
                <li key={item.title} style={{lineHeight: 1.6}}>
                  <strong style={{color: '#2dd4bf', display: 'block', marginBottom: '0.25rem', fontSize: '1.1rem'}}>{item.title}</strong>
                  <span style={{color: '#d1d1d1'}}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <LockIcon style={{width: '2.5rem', height: '2.5rem', color: '#2dd4bf'}}/>
            <h2 style={styles.sectionTitle}>Privacy Policy</h2>
          </div>
          <div style={{...styles.contentBox, background: '#0f0f0f'}}>
            <div style={{marginBottom: '2rem', padding: '1rem', background: '#1a1a1a', borderRadius: '0.5rem', borderLeft: '4px solid #2dd4bf'}}>
              <p style={{margin: 0, fontSize: '0.9rem', color: '#888'}}>Last Updated: December 16, 2025</p>
              <p style={{marginTop: '0.5rem', color: '#fff'}}>Happy Hotel Stay Service ("we," "us," or "our") is committed to protecting your privacy.</p>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '3rem'}}>
              <div>
                <h3 style={{color: '#2dd4bf', fontSize: '1.4rem', marginBottom: '1.5rem'}}>1. Information We Collect</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                  <p style={{lineHeight: 1.6, color: '#d1d1d1'}}><strong style={{color: '#fff'}}>Personal Data:</strong> Name, email, mobile number, and password provided voluntarily during registration.</p>
                  <p style={{lineHeight: 1.6, color: '#d1d1d1'}}><strong style={{color: '#fff'}}>Partner Data:</strong> Business name, address, contact person details, business registration, and bank information for vendors.</p>
                  <p style={{lineHeight: 1.6, color: '#d1d1d1'}}><strong style={{color: '#fff'}}>Booking Information:</strong> Travel dates, accommodation details, cab bookings, and payment status.</p>
                </div>
              </div>

              <div>
                <h3 style={{color: '#2dd4bf', fontSize: '1.4rem', marginBottom: '1.5rem'}}>2. How We Use Your Information</h3>
                <ul style={{color: '#d1d1d1', lineHeight: '2', paddingLeft: '1.5rem'}}>
                  <li>Process and manage your bookings and payments efficiently.</li>
                  <li>Facilitate communication between you and our service Partners.</li>
                  <li>Prevent fraudulent transactions and protect against unauthorized activity.</li>
                  <li>Comply with legal, regulatory, and tax requirements.</li>
                </ul>
              </div>

              <div style={styles.grid}>
                <div style={{background: '#1a1a1a', padding: '1.5rem', borderRadius: '0.75rem'}}>
                  <h4 style={{color: '#fff', marginBottom: '1rem'}}>3. Data Sharing</h4>
                  <p style={{fontSize: '0.95rem', lineHeight: 1.6, color: '#a7a7a7'}}>We share data with Partners to fulfill bookings and with third-party providers for payments and hosting.</p>
                </div>
                <div style={{background: '#1a1a1a', padding: '1.5rem', borderRadius: '0.75rem'}}>
                  <h4 style={{color: '#fff', marginBottom: '1rem'}}>4. Security</h4>
                  <p style={{fontSize: '0.95rem', lineHeight: 1.6, color: '#a7a7a7'}}>We use administrative and technical measures to protect data, though no digital transmission is 100% secure.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <GavelIcon style={{width: '2.5rem', height: '2.5rem', color: '#2dd4bf'}}/>
            <h2 style={styles.sectionTitle}>General Policies</h2>
          </div>
          <div style={styles.grid}>
            {[
              {title: 'Fair Usage', text: 'Partners must not misrepresent services or overcharge beyond agreed tariffs.'},
              {title: 'Non-Discrimination', text: 'Service cannot be refused based on caste, religion, gender, or nationality.'},
              {title: 'Jurisdiction', text: 'All terms are governed under Indian law, with jurisdiction in Aligarh, UP courts.'},
            ].map(item => (
              <div key={item.title} style={{...styles.contentBox, padding: '2rem'}}>
                <h4 style={{color: '#2dd4bf', marginBottom: '1rem', fontSize: '1.2rem'}}>{item.title}</h4>
                <p style={{color: '#d1d1d1', lineHeight: 1.6}}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer style={styles.footer}>
          <div style={styles.contactCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
              <ShieldCheckIcon style={{width: '2rem', height: '2rem', color: '#2dd4bf'}}/>
              <h3 style={{fontSize: '1.5rem', fontWeight: '700', color: 'white', margin: 0}}>Contact Information</h3>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem'}}>
              <div style={{display: 'flex', gap: '1rem'}}>
                <BuildingIcon style={{color: '#888', flexShrink: 0}}/>
                <div>
                  <p style={{margin: '0 0 0.25rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase'}}>Company</p>
                  <p style={{margin: 0, color: '#fff'}}>Happy Hotel Stay Service</p>
                </div>
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <MailIcon style={{color: '#888', flexShrink: 0}}/>
                <div>
                  <p style={{margin: '0 0 0.25rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase'}}>Email</p>
                  <p style={{margin: 0, color: '#fff'}}>info@hotelroomsstay.com</p>
                </div>
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <MapPinIcon style={{color: '#888', flexShrink: 0}}/>
                <div>
                  <p style={{margin: '0 0 0.25rem', color: '#888', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase'}}>Address</p>
                  <p style={{margin: 0, color: '#fff', fontSize: '0.9rem'}}>Agra Rd, ADA Bank Colony, Aligarh, UP 202001</p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default HrsPolicy;