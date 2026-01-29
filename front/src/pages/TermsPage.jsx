import React from 'react';
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";

const ScaleIcon = ({ style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="m16 16 6-6" />
    <path d="m8 8 6-6" />
    <path d="m9 7 8 8" />
    <path d="m21 11-8-8" />
    <path d="M3 21h18" />
    <path d="M12 3v18" />
  </svg>
);

const ShieldIcon = ({ style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const FileTextIcon = ({ style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default function TermsContent() {
  const styles = {
    pageWrapper: { background: '#0a0a0a', color: '#f0f0f0', paddingBottom: '6rem', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' },
    header: { padding: '8rem 2rem 4rem', textAlign: 'center', background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)' },
    headerTitle: { fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: '800', lineHeight: 1.1, color: 'white', marginBottom: '1rem' },
    headerSubtitle: { fontSize: '1rem', color: '#2dd4bf', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' },
    mainContent: { maxWidth: '900px', margin: '0 auto', padding: '0 2rem' },
    metaBox: { background: '#141414', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #222', marginBottom: '4rem', textAlign: 'center' },
    section: { marginBottom: '4rem' },
    sectionTitle: { fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
    sectionText: { fontSize: '1.05rem', lineHeight: '1.8', color: '#a7a7a7', marginBottom: '1.5rem' },
    subSectionTitle: { fontSize: '1.2rem', fontWeight: '600', color: '#2dd4bf', marginBottom: '0.75rem' },
    list: { paddingLeft: '1.5rem', marginBottom: '1.5rem' },
    listItem: { color: '#a7a7a7', marginBottom: '0.75rem', lineHeight: '1.6' },
    footer: { borderTop: '1px solid #222', paddingTop: '4rem', marginTop: '6rem', textAlign: 'center' },
    highlight: { color: '#fff', fontWeight: '600' }
  };

  return (
    <div style={styles.pageWrapper}>
      <header style={styles.header}>
        <p style={styles.headerSubtitle}>Legal Agreement</p>
        <h1 style={styles.headerTitle}>Terms and Conditions</h1>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.metaBox}>
          <p style={{ margin: 0, color: '#888' }}>Last Updated: <span style={{ color: '#fff' }}>December 16, 2025</span></p>
        </div>

        <section style={styles.section}>
          <p style={styles.sectionText}>
            Welcome to <span style={styles.highlight}>Happy Hotel Stay Service</span>! These Terms and Conditions ("Terms") govern your use of our website, mobile application, and services (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms and our Privacy Policy.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Introduction</h2>
          <p style={styles.sectionText}>
            Our Platform is a service that acts as a facilitator, connecting users with various travel-related services, including but not limited to hotel accommodations, cab bookings, and tour packages ("Services"). These services are provided by third-party suppliers, such as hotels, cab operators, and travel agencies ("Partners").
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. User Accounts</h2>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={styles.subSectionTitle}>Registration</h3>
            <p style={styles.sectionText}>To use certain features of the Platform, such as booking, you must register for an account. You agree to provide accurate, current, and complete information during the registration process.</p>
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={styles.subSectionTitle}>Account Responsibility</h3>
            <p style={styles.sectionText}>You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
          </div>
          <div>
            <h3 style={styles.subSectionTitle}>Termination</h3>
            <p style={styles.sectionText}>We reserve the right to suspend or terminate your account at our discretion, without liability, if you violate these Terms or for any other reason.</p>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Services and Bookings</h2>
          <p style={styles.sectionText}>
            <span style={styles.highlight}>Facilitator Role:</span> We are not a travel provider. We are an intermediary that facilitates bookings between you and our Partners. When you make a booking, you are entering into a contract directly with the Partner, not with Happy Hotel Stay Service.
          </p>
          <p style={styles.sectionText}>
            <span style={styles.highlight}>Service Information:</span> All information about the Services is provided by our Partners. We do not guarantee the accuracy of this information and are not responsible for any inaccuracies.
          </p>
          <p style={styles.sectionText}>
            <span style={styles.highlight}>Booking Confirmation:</span> A booking is confirmed only when you receive a booking confirmation from the Platform. We reserve the right to cancel a booking within a reasonable time in case of errors.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Payments and Refunds</h2>
          <p style={styles.sectionText}>
            You agree to pay for all bookings you make through the Platform. Each Partner has its own policies regarding cancellations and refunds. While we facilitate the process, the final decision rests with the Partner. Our service fees are generally non-refundable.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Partner Services</h2>
          <p style={styles.sectionText}>
            We are not responsible for the quality, safety, or legality of the services provided by our Partners. Any disputes or issues with the service provided should be resolved directly with the Partner. You agree to abide by the rules and regulations of the Partner, including house rules.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. User Conduct</h2>
          <p style={styles.sectionText}>
            You agree not to use the Platform for any unlawful purpose. Fraudulent bookings, posting false information, or attempting to interfere with the Platform's security is strictly prohibited.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Intellectual Property</h2>
          <p style={styles.sectionText}>
            All content on the Platform, including text, graphics, logos, and software, is the property of Happy Hotel Stay Service or its licensors and is protected by copyright laws.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Limitation of Liability</h2>
          <p style={styles.sectionText}>
            The Platform is provided "as is". Happy Hotel Stay Service shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the Platform or your booking with a Partner.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Governing Law</h2>
          <p style={styles.sectionText}>
            These Terms shall be governed by and construed in accordance with the laws of India. Any dispute arising out of these Terms shall be subject to the exclusive jurisdiction of the courts of Aligarh, Uttar Pradesh.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Contact Us</h2>
          <div style={{ background: '#141414', padding: '2rem', borderRadius: '1rem', border: '1px dashed #333' }}>
            <p style={{ margin: '0 0 1rem', color: '#fff' }}>For any questions regarding these Terms, please reach out to us:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#2dd4bf', fontWeight: '600' }}>
              <span>Email: info@hotelroomsstay.com</span>
              <span>Address: Agra Rd, ADA Bank Colony, Aligarh, UP 202001</span>
            </div>
          </div>
        </section>

        <footer style={styles.footer}>
          <p style={{ color: '#555', fontSize: '0.9rem' }}>&copy; 2025 Happy Hotel Stay Service. All Rights Reserved.</p>
        </footer>
      </main>
    </div>
  );
};


