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
      id: 'information',
      title: '1. Information We Collect',
      content: [
        { label: 'Personal Data', text: 'Name, email, mobile number and password you provide when creating an account or making a booking.' },
        { label: 'Partner Data', text: 'Business name, address, contact person details, registration documents and bank details for partners and vendors.' },
        { label: 'Booking Information', text: 'Travel dates, accommodation details, cab bookings, payment status and any special requests.' },
        { label: 'Automatic Data', text: 'IP address, device and browser information, access times and crash/log data collected automatically.' }
      ]
    },
    {
      id: 'use',
      title: '2. How We Use Your Information',
      bullets: [
        'Create and manage your account, process bookings and related payments.',
        'Facilitate communication between customers and Partners to complete bookings.',
        'Provide customer support and respond to inquiries or complaints.',
        'Detect and prevent fraud, abuse, and other illegal activity.',
        'Comply with legal, regulatory and tax obligations.'
      ]
    },
    {
      id: 'sharing',
      title: '3. Data Sharing',
      content: [
        { text: 'We share the minimum required information with Partners to fulfil bookings (for example, guest name and booking details). We also share data with payment processors, hosting providers and other service vendors under contract.' }
      ]
    },
    {
      id: 'cookies',
      title: '4. Cookies & Tracking',
      content: [
        { text: 'We use cookies and similar technologies to provide, protect and improve our services. You can control cookie settings via your browser; disabling some cookies may affect functionality.' }
      ]
    },
    {
      id: 'security',
      title: '5. Security',
      content: [
        { text: 'We implement reasonable administrative, technical and physical safeguards to protect personal data. However, no system is completely secure and we cannot guarantee absolute security of data in transit or at rest.' }
      ]
    },
    {
      id: 'retention',
      title: '6. Data Retention',
      content: [
        { text: 'We retain personal data for as long as necessary to provide services, comply with legal obligations, resolve disputes and enforce our agreements.' }
      ]
    },
    {
      id: 'rights',
      title: '7. Your Rights & Choices',
      bullets: [
        'Access and obtain a copy of your personal data.',
        'Correct inaccurate or incomplete information.',
        'Request deletion of personal data where applicable.',
        'Opt-out of marketing communications.'
      ]
    },
    {
      id: 'children',
      title: '8. Children',
      content: [
        { text: 'Our services are not intended for children under 13. We do not knowingly collect personal data from children under 13. If you believe we have collected such data, contact us to request removal.' }
      ]
    },
    {
      id: 'changes',
      title: '9. Changes to This Policy',
      content: [
        { text: 'We may update this policy from time to time. Material changes will be notified via the website or email and the "Last Updated" date will be revised.' }
      ]
    },
    {
      id: 'contact',
      title: '10. Contact Us',
      content: [
        { text: 'For privacy-related questions or requests, email us at info@hotelroomsstay.com or write to our registered address.' }
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
            <div style={{marginBottom: '1.5rem', padding: '1rem', background: '#1a1a1a', borderRadius: '0.5rem', borderLeft: '4px solid #2dd4bf'}}>
              <p style={{margin: 0, fontSize: '0.95rem', color: '#888'}}>Last Updated: August 10, 2026</p>
              <p style={{marginTop: '0.5rem', color: '#fff'}}>Happy Hotel Stay Service ("we," "us," or "our") is committed to protecting your privacy and being transparent about how we use your information.</p>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
              <nav style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem'}}>
                {privacySections.map(s => (
                  <a key={s.id} href={`#${s.id}`} style={{color: '#9ae6b4', textDecoration: 'none', fontSize: '0.9rem'}}>{s.title.replace(/^\d+\.\s*/, '')}</a>
                ))}
              </nav>

              {privacySections.map(section => (
                <div key={section.id} id={section.id} style={{padding: '1rem 0', borderTop: '1px solid #111'}}>
                  <h3 style={{color: '#2dd4bf', fontSize: '1.25rem', margin: '0 0 0.75rem'}}>{section.title}</h3>

                  {section.content && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#d1d1d1'}}>
                      {section.content.map((c, idx) => (
                        <p key={idx} style={{lineHeight: 1.7, margin: 0}}>
                          {c.label ? <strong style={{color: '#fff'}}>{c.label + ': '}</strong> : null}
                          {c.text || c}
                        </p>
                      ))}
                    </div>
                  )}

                  {section.bullets && (
                    <ul style={{color: '#d1d1d1', paddingLeft: '1.25rem', lineHeight: '1.9', marginTop: '0.5rem'}}>
                      {section.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                    </ul>
                  )}
                </div>
              ))}
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