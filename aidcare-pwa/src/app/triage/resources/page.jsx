"use client";

import { useState } from 'react';
import { FaSync, FaList, FaCheck, FaTimes, FaClock, FaEllipsisV } from 'react-icons/fa';
import { MdDashboard, MdAssessment, MdPeople, MdSettings, MdWifi } from 'react-icons/md';

export default function OfflineRecordsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeNav, setActiveNav] = useState('offline');

  // Mock data
  const records = [
    {
      patientName: 'John Doe',
      recordType: 'Medical Screen',
      date: 'Oct 24, 2025 - 09:12 AM',
      size: '2.4 MB',
      syncStatus: 'synced',
      syncLabel: 'Synced'
    },
    {
      patientName: 'Sarah K.',
      recordType: 'Prenatal Checkup',
      date: 'Oct 24, 2025 - 09:12 AM',
      size: '1.8 MB',
      syncStatus: 'synced',
      syncLabel: 'Synced'
    },
    {
      patientName: 'David R.',
      recordType: 'Vaccination (Polio)',
      date: 'Oct 24, 2025 - 04:43 PM',
      size: '890 KB',
      syncStatus: 'synced',
      syncLabel: 'Synced'
    },
    {
      patientName: 'Robert A.',
      recordType: 'General Triage',
      date: 'Oct 22, 2025 - 01:05 PM',
      size: '1.2 MB',
      syncStatus: 'synced',
      syncLabel: 'Synced'
    },
    {
      patientName: 'Maria L.',
      recordType: 'Emergency Referral',
      date: 'Oct 21, 2025 - 11:22 AM',
      size: '3.1 MB',
      syncStatus: 'failed',
      syncLabel: 'Failed'
    }
  ];

  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'synced':
        return { bg: '#10b981', text: '#fff' };
      case 'pending':
        return { bg: '#f59e0b', text: '#fff' };
      case 'failed':
        return { bg: '#dc2626', text: '#fff' };
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
      borderBottom: '1px solid rgba(255,255,255,0.05)'
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
    content: {
      flex: 1,
      padding: '2rem'
    },
    statusCard: {
      background: '#141b26',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1.5rem'
    },
    syncStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    syncIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'rgba(16, 185, 129, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#10b981'
    },
    syncText: {
      flex: 1
    },
    syncTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#fff',
      marginBottom: '0.25rem'
    },
    syncSubtitle: {
      fontSize: '0.8125rem',
      color: '#6b7280'
    },
    storageSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem'
    },
    storageInfo: {
      minWidth: '200px'
    },
    storageLabel: {
      fontSize: '0.75rem',
      color: '#6b7280',
      marginBottom: '0.5rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    storageBar: {
      height: '8px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '0.375rem'
    },
    storageFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #3b9eff 0%, #2d7fd3 100%)',
      width: '15%',
      borderRadius: '4px'
    },
    storageText: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    actionButtons: {
      display: 'flex',
      gap: '0.75rem'
    },
    primaryButton: {
      padding: '0.75rem 1.25rem',
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
      boxShadow: '0 2px 8px rgba(59, 158, 255, 0.3)'
    },
    secondaryButton: {
      padding: '0.75rem 1.25rem',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s'
    },
    filterSection: {
      marginBottom: '2rem',
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
    patientName: {
      fontWeight: '600',
      color: '#fff',
      marginBottom: '0.25rem'
    },
    recordType: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    syncBadge: (status) => {
      const colors = getSyncStatusColor(status);
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '6px',
        background: colors.bg,
        color: colors.text,
        fontSize: '0.6875rem',
        fontWeight: '700',
        letterSpacing: '0.05em'
      };
    },
    actionButton: {
      padding: '0.5rem',
      borderRadius: '6px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#6b7280',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
          <div style={styles.userAvatar}>RK</div>
          <div>
            <div style={styles.userName}>Dr Ruth K.</div>
            <div style={styles.userRole}>Health Worker</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <h1 style={styles.title}>Offline Records Manager</h1>
          <p style={styles.subtitle}>Manage local storage and sync patient records</p>
        </header>

        <div style={styles.content}>
          {/* Sync Status Card */}
          <div style={styles.statusCard}>
            <div style={styles.syncStatus}>
              <div style={styles.syncIcon}>
                <FaCheck size={20} />
              </div>
              <div style={styles.syncText}>
                <div style={styles.syncTitle}>All Records Synced</div>
                <div style={styles.syncSubtitle}>Last synchronized 2 minutes ago</div>
              </div>
            </div>

            <div style={styles.storageSection}>
              <div style={styles.storageInfo}>
                <div style={styles.storageLabel}>Local Storage</div>
                <div style={styles.storageBar}>
                  <div style={styles.storageFill} />
                </div>
                <div style={styles.storageText}>15% (45MB of 300MB used)</div>
              </div>

              <div style={styles.actionButtons}>
                <button
                  style={styles.primaryButton}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <FaSync size={14} />
                  Sync Now
                </button>
                <button
                  style={styles.secondaryButton}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <FaList size={14} />
                  View Logs
                </button>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={styles.filterSection}>
            <button
              style={styles.filterTab(activeFilter === 'all')}
              onClick={() => setActiveFilter('all')}
            >
              All Records
            </button>
            <button
              style={styles.filterTab(activeFilter === 'pending')}
              onClick={() => setActiveFilter('pending')}
            >
              Pending (2)
            </button>
            <button
              style={styles.filterTab(activeFilter === 'synced')}
              onClick={() => setActiveFilter('synced')}
            >
              Synced
            </button>
            <button
              style={styles.filterTab(activeFilter === 'failed')}
              onClick={() => setActiveFilter('failed')}
            >
              Failed
            </button>
          </div>

          {/* Records Table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.th}>Record Type</th>
                  <th style={styles.th}>Size Created</th>
                  <th style={styles.th}>Sync Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={index}
                    style={styles.tr}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={styles.td}>
                      <div style={styles.patientName}>{record.patientName}</div>
                      <div style={styles.recordType}>{record.recordType}</div>
                    </td>
                    <td style={styles.td}>
                      <div>{record.size}</div>
                      <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>
                        {record.date}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.syncBadge(record.syncStatus)}>
                        {record.syncStatus === 'synced' && <FaCheck size={10} />}
                        {record.syncStatus === 'pending' && <FaClock size={10} />}
                        {record.syncStatus === 'failed' && <FaTimes size={10} />}
                        {record.syncLabel}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.actionButton}
                        onMouseOver={(e) => {
                          e.target.style.background = 'rgba(255,255,255,0.1)';
                          e.target.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'rgba(255,255,255,0.05)';
                          e.target.style.color = '#6b7280';
                        }}
                      >
                        <FaEllipsisV size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={styles.pagination}>
              <div style={styles.paginationInfo}>
                Showing 1-5 of 42 records
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
