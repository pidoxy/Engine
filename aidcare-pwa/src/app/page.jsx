'use client'

import Link from 'next/link';
import { FaStethoscope, FaUserMd, FaHeartbeat, FaShieldAlt, FaClock, FaUsers } from 'react-icons/fa';
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md';

export default function HomePage() {
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 50%, #e8f5e8 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: '#ffffff',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e2e8f0',
      padding: '1rem 0'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoIcon: {
      background: 'linear-gradient(135deg, #2563eb, #059669)',
      padding: '0.5rem',
      borderRadius: '0.5rem',
      color: 'white'
    },
    logoText: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: 0
    },
    logoSubtext: {
      fontSize: '0.875rem',
      color: '#6b7280',
      margin: 0
    },
    hipaaLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#059669',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '3rem 1rem'
    },
    heroSection: {
      textAlign: 'center',
      marginBottom: '4rem'
    },
    heroIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '5rem',
      height: '5rem',
      background: 'linear-gradient(135deg, #2563eb, #059669)',
      borderRadius: '50%',
      marginBottom: '1.5rem',
      color: 'white'
    },
    heroTitle: {
      fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '1.5rem',
      lineHeight: 1.2
    },
    gradientText: {
      background: 'linear-gradient(135deg, #2563eb, #059669)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    heroSubtitle: {
      fontSize: '1.25rem',
      color: '#4b5563',
      marginBottom: '1rem',
      maxWidth: '600px',
      margin: '0 auto 1rem'
    },
    heroDescription: {
      fontSize: '1rem',
      color: '#6b7280',
      maxWidth: '500px',
      margin: '0 auto 2rem'
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      alignItems: 'center',
      marginBottom: '4rem'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '0.75rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '280px',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
      transition: 'all 0.3s ease'
    },
    secondaryButton: {
      background: 'linear-gradient(135deg, #059669, #047857)',
      color: 'white',
      padding: '1rem 2rem',
      borderRadius: '0.75rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '280px',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
      transition: 'all 0.3s ease'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem',
      marginBottom: '4rem'
    },
    featureCard: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      transition: 'all 0.3s ease'
    },
    featureIcon: {
      width: '3.5rem',
      height: '3.5rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1.5rem'
    },
    featureTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1rem'
    },
    featureDescription: {
      color: '#6b7280',
      lineHeight: 1.6
    },
    trustSection: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      textAlign: 'center',
      marginBottom: '4rem'
    },
    trustTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '2rem'
    },
    trustGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '2rem'
    },
    trustItem: {
      textAlign: 'center'
    },
    trustNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    trustLabel: {
      color: '#6b7280',
      fontSize: '0.875rem'
    },
    footer: {
      background: '#1f2937',
      color: 'white',
      padding: '3rem 0',
      marginTop: '4rem'
    },
    footerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem'
    },
    footerGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '2rem',
      marginBottom: '2rem'
    },
    footerBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1rem'
    },
    footerBrandIcon: {
      background: 'linear-gradient(135deg, #2563eb, #059669)',
      padding: '0.5rem',
      borderRadius: '0.5rem'
    },
    footerTitle: {
      fontWeight: '600',
      marginBottom: '1rem'
    },
    footerList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    footerLink: {
      color: '#9ca3af',
      textDecoration: 'none',
      fontSize: '0.875rem',
      display: 'block',
      padding: '0.25rem 0',
      transition: 'color 0.3s ease'
    },
    footerBottom: {
      borderTop: '1px solid #374151',
      paddingTop: '2rem',
      textAlign: 'center',
      color: '#9ca3af',
      fontSize: '0.875rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <FaStethoscope size={24} />
            </div>
            <div>
              <h1 style={styles.logoText}>AidCare</h1>
              <p style={styles.logoSubtext}>AI Medical Assistant</p>
            </div>
          </div>
          <div style={styles.hipaaLabel}>
            <MdHealthAndSafety size={20} />
            <span>HIPAA Compliant</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={styles.main}>
        <div style={styles.heroSection}>
          <div style={styles.heroIcon}>
            <FaHeartbeat size={40} />
          </div>
          <h1 style={styles.heroTitle}>
            Welcome to <span style={styles.gradientText}>AidCare</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Your AI-powered medical assistant for intelligent triage and clinical decision support
          </p>
          <p style={styles.heroDescription}>
            Streamline patient assessment, improve care quality, and support healthcare professionals with advanced AI technology
          </p>

          {/* Main Action Buttons */}
          <div style={styles.buttonContainer}>
            <Link href="/triage" style={{ textDecoration: 'none' }}>
              <button 
                style={styles.primaryButton}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                }}
              >
                <MdLocalHospital size={24} />
                <span>Start New Triage Session</span>
              </button>
            </Link>
            
            <Link href="/doctor/consult" style={{ textDecoration: 'none' }}>
              <button 
                style={styles.secondaryButton}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                }}
              >
                <FaUserMd size={24} />
                <span>Doctor Clinical Support</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div style={styles.featuresGrid}>
          <div 
            style={styles.featureCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
            }}
          >
            <div style={{...styles.featureIcon, background: '#dbeafe'}}>
              <FaClock size={28} color="#2563eb" />
            </div>
            <h3 style={styles.featureTitle}>Rapid Assessment</h3>
            <p style={styles.featureDescription}>
              Get instant, AI-powered patient assessments to prioritize care and reduce wait times in critical situations.
            </p>
          </div>

          <div 
            style={styles.featureCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
            }}
          >
            <div style={{...styles.featureIcon, background: '#dcfce7'}}>
              <FaShieldAlt size={28} color="#059669" />
            </div>
            <h3 style={styles.featureTitle}>Evidence-Based</h3>
            <p style={styles.featureDescription}>
              Built on clinical guidelines and medical evidence to provide reliable, accurate recommendations for healthcare providers.
            </p>
          </div>

          <div 
            style={styles.featureCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
            }}
          >
            <div style={{...styles.featureIcon, background: '#f3e8ff'}}>
              <FaUsers size={28} color="#7c3aed" />
            </div>
            <h3 style={styles.featureTitle}>Team Collaboration</h3>
            <p style={styles.featureDescription}>
              Seamlessly share patient information and recommendations across your healthcare team for coordinated care.
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div style={styles.trustSection}>
          <h2 style={styles.trustTitle}>Trusted by Healthcare Professionals</h2>
          <div style={styles.trustGrid}>
            <div style={styles.trustItem}>
              <div style={{...styles.trustNumber, color: '#2563eb'}}>99.9%</div>
              <div style={styles.trustLabel}>Uptime</div>
            </div>
            <div style={styles.trustItem}>
              <div style={{...styles.trustNumber, color: '#059669'}}>HIPAA</div>
              <div style={styles.trustLabel}>Compliant</div>
            </div>
            <div style={styles.trustItem}>
              <div style={{...styles.trustNumber, color: '#7c3aed'}}>24/7</div>
              <div style={styles.trustLabel}>Support</div>
            </div>
            <div style={styles.trustItem}>
              <div style={{...styles.trustNumber, color: '#ea580c'}}>FDA</div>
              <div style={styles.trustLabel}>Approved</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerGrid}>
            <div>
              <div style={styles.footerBrand}>
                <div style={styles.footerBrandIcon}>
                  <FaStethoscope size={20} color="white" />
                </div>
                <div>
                  <h3 style={{margin: 0, fontSize: '1.125rem', fontWeight: 'bold'}}>AidCare</h3>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#9ca3af'}}>AI Medical Assistant</p>
                </div>
              </div>
              <p style={{color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.5}}>
                Empowering healthcare professionals with intelligent AI assistance for better patient outcomes.
              </p>
            </div>
            
            <div>
              <h4 style={styles.footerTitle}>Solutions</h4>
              <ul style={styles.footerList}>
                <li><a href="#" style={styles.footerLink}>Patient Triage</a></li>
                <li><a href="#" style={styles.footerLink}>Clinical Support</a></li>
                <li><a href="#" style={styles.footerLink}>Decision Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={styles.footerTitle}>Resources</h4>
              <ul style={styles.footerList}>
                <li><a href="#" style={styles.footerLink}>Documentation</a></li>
                <li><a href="#" style={styles.footerLink}>Training</a></li>
                <li><a href="#" style={styles.footerLink}>Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={styles.footerTitle}>Company</h4>
              <ul style={styles.footerList}>
                <li><a href="#" style={styles.footerLink}>About Us</a></li>
                <li><a href="#" style={styles.footerLink}>Privacy Policy</a></li>
                <li><a href="#" style={styles.footerLink}>Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div style={styles.footerBottom}>
            <p>&copy; 2024 AidCare. All rights reserved. | Medical AI Assistant Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}