// components/RecommendationDisplay.js
import React from 'react';

export default function RecommendationDisplay({ result }) {
  if (!result || !result.triage_recommendation) {
    return null;
  }

  const { transcript, extracted_symptoms, triage_recommendation, manual_context_provided } = result;

  const getUrgencyColor = (urgencyLevel) => {
    if (!urgencyLevel) return '#6c757d';
    const level = urgencyLevel.toLowerCase();
    if (level.includes('emergency') || level.includes('immediate')) return '#dc3545';
    if (level.includes('urgent')) return '#fd7e14';
    if (level.includes('refer')) return '#ffc107';
    return '#28a745';
  };

  const getUrgencyIcon = (urgencyLevel) => {
    if (!urgencyLevel) return '❓';
    const level = urgencyLevel.toLowerCase();
    if (level.includes('emergency') || level.includes('immediate')) return '🚨';
    if (level.includes('urgent')) return '⚠️';
    if (level.includes('refer')) return '🏥';
    return '✅';
  };

    return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px', 
      marginTop: '20px',
      background: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1rem 1.5rem', 
        borderBottom: '1px solid #e0e0e0',
        borderRadius: '8px 8px 0 0'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>Triage Results</h2>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Urgency Level - Most Important */}
        <div style={{ 
          background: getUrgencyColor(triage_recommendation.urgency_level) + '15',
          border: `2px solid ${getUrgencyColor(triage_recommendation.urgency_level)}`,
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {getUrgencyIcon(triage_recommendation.urgency_level)}
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            color: getUrgencyColor(triage_recommendation.urgency_level),
            marginBottom: '0.25rem'
          }}>
            {triage_recommendation.urgency_level || 'N/A'}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Urgency Level
          </div>
        </div>

        {/* Summary of Findings */}
        {triage_recommendation.summary_of_findings && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Summary of Findings</h3>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px',
              borderLeft: '4px solid #007bff'
            }}>
              {triage_recommendation.summary_of_findings}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {triage_recommendation.recommended_actions_for_chw && triage_recommendation.recommended_actions_for_chw.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Recommended Actions for CHW</h3>
            <div style={{ 
              background: '#e8f5e8', 
              padding: '1rem', 
              borderRadius: '6px',
              border: '1px solid #c3e6c3'
            }}>
              <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {triage_recommendation.recommended_actions_for_chw.map((action, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Important Notes */}
        {triage_recommendation.important_notes_for_chw && triage_recommendation.important_notes_for_chw.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Important Notes</h3>
            <div style={{ 
              background: '#fff3cd', 
              padding: '1rem', 
              borderRadius: '6px',
              border: '1px solid #ffeaa7'
            }}>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {triage_recommendation.important_notes_for_chw.map((note, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Guideline References */}
        {triage_recommendation.key_guideline_references && triage_recommendation.key_guideline_references.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Guideline References</h3>
            <div style={{ 
              background: '#f0f8ff', 
              padding: '1rem', 
              borderRadius: '6px',
              border: '1px solid #b3d9ff'
            }}>
              {triage_recommendation.key_guideline_references.map((ref, index) => (
                <div key={index} style={{ 
                  marginBottom: index < triage_recommendation.key_guideline_references.length - 1 ? '0.5rem' : 0,
                  fontSize: '0.9rem'
                }}>
                  📋 {ref}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Symptoms */}
        {extracted_symptoms && extracted_symptoms.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Extracted Symptoms</h3>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {extracted_symptoms.map((symptom, index) => (
                  <span key={index} style={{
                    background: '#e9ecef',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '15px',
                    fontSize: '0.9rem',
                    border: '1px solid #ced4da'
                  }}>
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manual Context */}
        {manual_context_provided && manual_context_provided.trim() && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Additional Context Provided</h3>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '6px',
              fontStyle: 'italic',
              borderLeft: '4px solid #6c757d'
            }}>
              "{manual_context_provided}"
            </div>
          </div>
        )}

        {/* Transcript (Collapsible) */}
        {transcript && (
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              color: '#666',
              padding: '0.5rem',
              background: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              📝 View Full Transcript (Click to expand)
            </summary>
            <div style={{ 
              marginTop: '0.5rem',
              maxHeight: '200px', 
              overflowY: 'auto', 
              background: '#f8f9fa', 
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              fontSize: '0.9rem',
              lineHeight: '1.4'
            }}>
              {transcript}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}