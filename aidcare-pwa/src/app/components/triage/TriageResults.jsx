"use client";

import { useState } from 'react';
import { FaPrint, FaPlus, FaCheck, FaPhone, FaDirections, FaMapMarkerAlt } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';

export default function TriageResults({ result, onStartNew }) {
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Extract data from API response
  const recommendation = result?.triage_recommendation || {};
  const summary = recommendation?.summary_of_findings || "No summary available.";

  // Map urgency level from API to component format
  const apiUrgency = recommendation?.urgency_level || '';
  let urgencyLevel = 'medium';
  if (apiUrgency.toLowerCase().includes('urgent') || apiUrgency.toLowerCase().includes('emergency') || apiUrgency.toLowerCase().includes('immediate')) {
    urgencyLevel = 'high';
  } else if (apiUrgency.toLowerCase().includes('routine') || apiUrgency.toLowerCase().includes('monitor at home')) {
    urgencyLevel = 'low';
  }

  // Mock vitals data matching the screenshot (replace with actual data when available)
  const vitals = result?.vitals || [
    { label: 'Fever', value: '110', unit: '°F', status: 'warning' },
    { label: 'Heart Rate', value: '95', unit: 'BPM', status: 'normal' },
    { label: 'BP', value: '140/90', unit: '', status: 'warning' },
    { label: 'O₂', value: '94', unit: '%', status: 'normal' }
  ];

  // Get actions from API
  const actions = recommendation?.recommended_actions_for_chw || [];

  // Get guidelines from API
  const guidelines = recommendation?.key_guideline_references || [];

  // Get extracted symptoms
  const extractedSymptoms = result?.extracted_symptoms || [];

  const getUrgencyConfig = () => {
    switch (urgencyLevel) {
      case 'high':
        return {
          gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
          badge: '#dc2626',
          badgeText: 'HIGH RISK',
          icon: <MdWarning size={28} />,
          title: 'Urgent Referral Required',
          desc: 'Immediate medical attention is advised.',
        };
      case 'medium':
        return {
          gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
          badge: '#f59e0b',
          badgeText: 'MEDIUM RISK',
          icon: <MdWarning size={28} />,
          title: 'Monitor Closely',
          desc: 'Conditions require observation. Follow-up advised.',
        };
      default:
        return {
          gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          badge: '#10b981',
          badgeText: 'LOW RISK',
          icon: <FaCheck size={24} />,
          title: 'Routine Care',
          desc: 'Standard home treatment appropriate. No danger signs.',
        };
    }
  };

  const urgency = getUrgencyConfig();

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      color: '#fff'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1.5rem'
    },
    headerLeft: {
      flex: 1
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    headerActions: {
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center'
    },
    printButton: {
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
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: '2rem'
    },
    leftColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    urgencyBanner: {
      background: urgency.gradient,
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    urgencyIcon: {
      width: '56px',
      height: '56px',
      borderRadius: '8px',
      background: 'rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      flexShrink: 0
    },
    urgencyContent: {
      flex: 1
    },
    urgencyTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '0.25rem'
    },
    urgencyDesc: {
      fontSize: '0.875rem',
      color: 'rgba(255,255,255,0.9)'
    },
    urgencyBadge: {
      padding: '0.375rem 0.75rem',
      borderRadius: '6px',
      background: urgency.badge,
      color: '#fff',
      fontSize: '0.6875rem',
      fontWeight: '700',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap'
    },
    sectionCard: {
      background: '#141b26',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid rgba(255,255,255,0.05)'
    },
    sectionTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#fff',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    symptomsGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem'
    },
    symptomPill: {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      background: 'rgba(59, 158, 255, 0.1)',
      border: '1px solid rgba(59, 158, 255, 0.2)',
      color: '#3b9eff',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    vitalsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem'
    },
    vitalCard: (status) => ({
      background: '#0f1419',
      borderRadius: '8px',
      padding: '1rem',
      border: `1px solid ${status === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)'}`,
      textAlign: 'center'
    }),
    vitalLabel: {
      fontSize: '0.75rem',
      color: '#6b7280',
      marginBottom: '0.5rem'
    },
    vitalValue: (status) => ({
      fontSize: '1.75rem',
      fontWeight: '700',
      color: status === 'warning' ? '#f59e0b' : '#fff',
      marginBottom: '0.25rem'
    }),
    vitalUnit: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    summaryText: {
      fontSize: '0.9375rem',
      color: '#d1d5db',
      lineHeight: 1.7
    },
    aiBadge: {
      padding: '0.25rem 0.625rem',
      borderRadius: '6px',
      background: 'linear-gradient(135deg, #3b9eff 0%, #2d7fd3 100%)',
      color: '#fff',
      fontSize: '0.6875rem',
      fontWeight: '700',
      letterSpacing: '0.05em'
    },
    rightColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    actionsCard: {
      background: '#141b26',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid rgba(255,255,255,0.05)'
    },
    actionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    },
    actionItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.875rem',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      border: '2px solid #6b7280',
      flexShrink: 0,
      marginTop: '0.125rem',
      cursor: 'pointer'
    },
    actionText: {
      fontSize: '0.875rem',
      color: '#d1d5db',
      lineHeight: 1.5,
      flex: 1
    },
    facilityCard: {
      background: '#141b26',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid rgba(255,255,255,0.05)'
    },
    mapPlaceholder: {
      width: '100%',
      height: '180px',
      borderRadius: '8px',
      background: '#0f1419',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    mapIcon: {
      fontSize: '3rem',
      color: '#374151'
    },
    facilityName: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#fff',
      marginBottom: '0.25rem'
    },
    facilityStatus: {
      fontSize: '0.75rem',
      color: '#10b981',
      marginBottom: '1rem'
    },
    facilityActions: {
      display: 'flex',
      gap: '0.5rem'
    },
    facilityButton: {
      flex: 1,
      padding: '0.625rem',
      borderRadius: '6px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff',
      fontSize: '0.75rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.375rem',
      transition: 'all 0.2s'
    },
    disclaimer: {
      fontSize: '0.6875rem',
      color: '#6b7280',
      textAlign: 'center',
      lineHeight: 1.5,
      marginTop: '1rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Assessment Report</h1>
          <p style={styles.subtitle}>
            Patient ID: #{Math.floor(Math.random() * 10000)} • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.printButton}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
          >
            <FaPrint size={14} />
            Print
          </button>
          <button
            style={styles.newAssessmentButton}
            onClick={onStartNew}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <FaPlus size={14} />
            New Assessment
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.mainGrid}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Urgency Banner */}
          <div style={styles.urgencyBanner}>
            <div style={styles.urgencyIcon}>
              {urgency.icon}
            </div>
            <div style={styles.urgencyContent}>
              <h2 style={styles.urgencyTitle}>{urgency.title}</h2>
              <p style={styles.urgencyDesc}>{urgency.desc}</p>
            </div>
            <div style={styles.urgencyBadge}>{urgency.badgeText}</div>
          </div>

          {/* Reported Symptoms */}
          {extractedSymptoms.length > 0 && (
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>
                🩺 Reported Symptoms
              </h3>
              <div style={styles.symptomsGrid}>
                {extractedSymptoms.map((symptom, i) => (
                  <div key={i} style={styles.symptomPill}>
                    {symptom}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vital Signs */}
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              ❤️ Vital Signs
            </h3>
            <div style={styles.vitalsGrid}>
              {vitals.map((vital, i) => (
                <div key={i} style={styles.vitalCard(vital.status)}>
                  <div style={styles.vitalLabel}>{vital.label}</div>
                  <div style={styles.vitalValue(vital.status)}>{vital.value}</div>
                  <div style={styles.vitalUnit}>{vital.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Summary */}
          <div style={styles.sectionCard}>
            <div style={{...styles.sectionTitle, justifyContent: 'space-between'}}>
              <span>📋 Clinical Summary</span>
              <span style={styles.aiBadge}>AI ANALYSIS</span>
            </div>
            <p style={styles.summaryText}>{summary}</p>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Recommended Actions */}
          <div style={styles.actionsCard}>
            <h3 style={styles.sectionTitle}>
              ✓ Recommended
            </h3>
            <div style={styles.actionsList}>
              {actions.length > 0 ? (
                actions.map((action, i) => (
                  <div
                    key={i}
                    style={styles.actionItem}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <input type="checkbox" style={styles.checkbox} />
                    <span style={styles.actionText}>{action}</span>
                  </div>
                ))
              ) : (
                <p style={{...styles.actionText, textAlign: 'center', padding: '1rem 0', color: '#6b7280'}}>
                  No specific actions recommended
                </p>
              )}
            </div>
          </div>

          {/* Nearest Facility */}
          <div style={styles.facilityCard}>
            <h3 style={styles.sectionTitle}>
              📍 Nearest Facility
            </h3>
            <div style={styles.mapPlaceholder}>
              <FaMapMarkerAlt style={styles.mapIcon} />
            </div>
            <div style={styles.facilityName}>St. Mary's Clinic</div>
            <div style={styles.facilityStatus}>● 2.4km away</div>
            <div style={styles.facilityActions}>
              <button
                style={styles.facilityButton}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >
                <FaPhone size={12} />
                Call
              </button>
              <button
                style={styles.facilityButton}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >
                <FaDirections size={12} />
                Directions
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={styles.disclaimer}>
            This AI-assisted assessment is for support only. Always use professional clinical judgment.
          </div>
        </div>
      </div>
    </div>
  );
}
