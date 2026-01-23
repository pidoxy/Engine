"use client";

import { useState } from 'react';
import { FaSearch, FaChevronRight } from 'react-icons/fa';
import { MdDashboard, MdAssessment, MdPeople, MdSettings, MdWifi } from 'react-icons/md';

export default function TriageHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeNav, setActiveNav] = useState('patients');

  // Mock data - replace with actual API data
  const assessments = [
    {
      id: '8947-AC',
      date: 'Oct 26, 2025',
      reflection: 'Urgent: IMCI guideline cough, shortness...',
      symptoms: 'Mild localized rash on forearms, no fever',
      urgency: 'high',
      urgencyLabel: 'High Risk'
    },
    {
      id: '8949-AB',
      date: 'Oct 25, 2025',
      reflection: 'Persistent headache, nausea, light sensitivity',
      symptoms: 'Severe abdominal pain, vomiting',
      urgency: 'medium',
      urgencyLabel: 'Medium Risk'
    },
    {
      id: '8901-DA',
      date: 'Oct 22, 2025',
      reflection: 'Mild localized rash on forearms, no fever',
      symptoms: 'Minor laceration, properly cleaned',
      urgency: 'low',
      urgencyLabel: 'Low Risk'
    },
    {
      id: '8940-BC',
      date: 'Oct 20, 2025',
      reflection: 'Minor cold symptoms persisting 3 days',
      symptoms: 'Runny nose, mild cough, no fever',
      urgency: 'low',
      urgencyLabel: 'Low Risk'
    },
    {
      id: '8932-BD',
      date: 'Oct 15, 2025',
      reflection: 'Asthma flare-up, muscle spasms, dry cough',
      symptoms: 'Shortness of breath, wheezing',
      urgency: 'medium',
      urgencyLabel: 'Medium Risk'
    },
    {
      id: '8930-AA',
      date: 'Oct 10, 2025',
      reflection: 'Severe abdominal pain, vomiting',
      symptoms: 'Acute onset, high fever',
      urgency: 'high',
      urgencyLabel: 'High Risk'
    }
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return { bg: '#dc2626', text: '#fff' };
      case 'medium':
        return { bg: '#f59e0b', text: '#fff' };
      case 'low':
        return { bg: '#10b981', text: '#fff' };
      default:
        return { bg: '#6b7280', text: '#fff' };
    }
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      background: '#0a0f1a',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    sidebar: {
      width: '200px',
      background: '#0f1419',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0'
    },
    logo: {
      padding: '0 1.5rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoIcon: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #3b9eff 0%, #2d7fd3 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem'
    },
    logoText: {
      fontSize: '1.125rem',
      fontWeight: '700',
      color: '#fff'
    },
    logoSubtext: {
      fontSize: '0.625rem',
      color: '#6b7280',
      display: 'block',
      marginTop: '0.125rem'
    },
    nav: {
      flex: 1,
      padding: '0 0.75rem'
    },
    navItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      marginBottom: '0.25rem',
      borderRadius: '8px',
      background: active ? 'rgba(59, 158, 255, 0.15)' : 'transparent',
      color: active ? '#3b9eff' : '#6b7280',
      fontSize: '0.875rem',
      fontWeight: active ? '600' : '500',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      textAlign: 'left',
      transition: 'all 0.2s'
    }),
    userSection: {
      padding: '1.5rem',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b9eff 0%, #2d7fd3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    userName: {
      fontSize: '0.8125rem',
      fontWeight: '600',
      color: '#fff',
      lineHeight: 1.2
    },
    userRole: {
      fontSize: '0.6875rem',
      color: '#6b7280'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      padding: '1.5rem 2rem',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    headerLeft: {
      flex: 1
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '0.25rem'
    },
    subtitle: {
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    newAssessmentButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #3b9eff 0%, #2d7fd3 100%)',
      border: 'none',
      color: '#fff',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s',
      boxShadow: '0 4px 14px rgba(59, 158, 255, 0.3)'
    },
    content: {
      flex: 1,
      padding: '2rem'
    },
    searchFilterSection: {
      marginBottom: '2rem',
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    searchBar: {
      flex: 1,
      minWidth: '300px',
      position: 'relative'
    },
    searchIcon: {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      pointerEvents: 'none'
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 2.75rem',
      borderRadius: '8px',
      background: '#141b26',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff',
      fontSize: '0.875rem',
      outline: 'none',
      transition: 'all 0.2s'
    },
    filterTabs: {
      display: 'flex',
      gap: '0.5rem'
    },
    filterTab: (active) => ({
      padding: '0.625rem 1.25rem',
      borderRadius: '8px',
      background: active ? 'rgba(59, 158, 255, 0.15)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${active ? '#3b9eff' : 'rgba(255,255,255,0.1)'}`,
      color: active ? '#3b9eff' : '#6b7280',
      fontSize: '0.8125rem',
      fontWeight: active ? '600' : '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    tableContainer: {
      background: '#141b26',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      background: '#0f1419',
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
    th: {
      padding: '1rem 1.5rem',
      textAlign: 'left',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    tr: {
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      transition: 'all 0.2s'
    },
    td: {
      padding: '1.25rem 1.5rem',
      fontSize: '0.875rem',
      color: '#d1d5db'
    },
    patientId: {
      fontWeight: '600',
      color: '#fff'
    },
    urgencyBadge: (urgency) => {
      const colors = getUrgencyColor(urgency);
      return {
        display: 'inline-block',
        padding: '0.375rem 0.75rem',
        borderRadius: '6px',
        background: colors.bg,
        color: colors.text,
        fontSize: '0.6875rem',
        fontWeight: '700',
        letterSpacing: '0.05em'
      };
    },
    viewReportLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem',
      color: '#3b9eff',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 0.2s'
    },
    pagination: {
      padding: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid rgba(255,255,255,0.05)'
    },
    paginationInfo: {
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    paginationButtons: {
      display: 'flex',
      gap: '0.5rem'
    },
    paginationButton: {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚕️</div>
          <div>
            <div style={styles.logoText}>AidCare Pro</div>
            <span style={styles.logoSubtext}>Medical Triage</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={styles.navItem(activeNav === 'dashboard')} onClick={() => setActiveNav('dashboard')}>
            <MdDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button style={styles.navItem(activeNav === 'assessments')} onClick={() => setActiveNav('assessments')}>
            <MdAssessment size={18} />
            <span>Assessments</span>
          </button>
          <button style={styles.navItem(activeNav === 'patients')} onClick={() => setActiveNav('patients')}>
            <MdPeople size={18} />
            <span>Patients</span>
          </button>
          <button style={styles.navItem(activeNav === 'offline')} onClick={() => setActiveNav('offline')}>
            <MdWifi size={18} />
            <span>Offline Records</span>
          </button>
          <button style={styles.navItem(activeNav === 'settings')} onClick={() => setActiveNav('settings')}>
            <MdSettings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div style={styles.userSection}>
          <div style={styles.userAvatar}>SC</div>
          <div>
            <div style={styles.userName}>Dr Sarah C.</div>
            <div style={styles.userRole}>Health Worker</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>Patient Assessment History</h1>
            <p style={styles.subtitle}>Review past triage assessments and track progress</p>
          </div>
          <button
            style={styles.newAssessmentButton}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            + New Assessment
          </button>
        </header>

        <div style={styles.content}>
          {/* Search and Filters */}
          <div style={styles.searchFilterSection}>
            <div style={styles.searchBar}>
              <FaSearch style={styles.searchIcon} size={14} />
              <input
                type="text"
                placeholder="Search by patient ID or symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
                onFocus={(e) => e.target.style.borderColor = '#3b9eff'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={styles.filterTabs}>
              <button
                style={styles.filterTab(activeFilter === 'all')}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button
                style={styles.filterTab(activeFilter === 'high')}
                onClick={() => setActiveFilter('high')}
              >
                High Risk
              </button>
              <button
                style={styles.filterTab(activeFilter === 'medium')}
                onClick={() => setActiveFilter('medium')}
              >
                Medium Risk
              </button>
              <button
                style={styles.filterTab(activeFilter === 'low')}
                onClick={() => setActiveFilter('low')}
              >
                Low Risk
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Reflection</th>
                  <th style={styles.th}>Symptoms Summary</th>
                  <th style={styles.th}>Urgency</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment, index) => (
                  <tr
                    key={index}
                    style={styles.tr}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={styles.td}>
                      <div style={styles.patientId}>{assessment.id}</div>
                      <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>
                        {assessment.date}
                      </div>
                    </td>
                    <td style={styles.td}>{assessment.reflection}</td>
                    <td style={styles.td}>{assessment.symptoms}</td>
                    <td style={styles.td}>
                      <span style={styles.urgencyBadge(assessment.urgency)}>
                        {assessment.urgencyLabel}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <a
                        href="#"
                        style={styles.viewReportLink}
                        onMouseOver={(e) => e.currentTarget.style.color = '#60b4ff'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#3b9eff'}
                      >
                        View Report
                        <FaChevronRight size={10} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={styles.pagination}>
              <div style={styles.paginationInfo}>
                Showing 1-6 of 124 assessments
              </div>
              <div style={styles.paginationButtons}>
                <button
                  style={styles.paginationButton}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Previous
                </button>
                <button
                  style={styles.paginationButton}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
