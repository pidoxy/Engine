// src/app/components/ConsultationDisplay.js
"use client";
import React from 'react';
import PotentialConditionsDisplay from './PotentialConditionsDisplay';
import SuggestedInvestigationsDisplay from './SuggestedInvestigationsDisplay';
import AlertsFlagsDisplay from './AlertsFlagsDisplay';
import SummaryDisplay from './SummaryDisplay'; // For the overall doctor summary

// New components to be created:
const QuestionsToAskDisplay = ({ questions }) => (
  <SectionCard title="Questions to Ask" isEmpty={!questions || questions.length === 0}>
    <ul>{questions && questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
  </SectionCard>
);
const SymptomSummaryDisplay = ({ summary }) => (
  <SectionCard title="Symptom Summary" isEmpty={!summary}> <p>{summary}</p> </SectionCard>
);
const NotesFromAISystemDisplay = ({ notes }) => (
  <SectionCard title="Notes from AI System" isEmpty={!notes}> <p>{notes}</p> </SectionCard>
);
// Assume SectionCard is imported

export default function ConsultationDisplay({ apiResult, currentView, onSetView }) {
  if (!apiResult || !apiResult.clinical_support_details) return <p>Awaiting consultation processing...</p>;

  const { extracted_clinical_info, clinical_support_details } = apiResult;

  // Placeholder: logic to generate narrative symptom summary from extracted_clinical_info
  const generateSymptomSummaryText = (info) => {
    if (!info || !info.presenting_symptoms || info.presenting_symptoms.length === 0) {
      return "No primary symptoms extracted from consultation.";
    }
    let summary = `Patient presents with: ${info.presenting_symptoms.join(', ')}.`;
    if (info.symptom_details) {
      summary += " Details: ";
      const detailsArray = [];
      for (const [symptom, detail] of Object.entries(info.symptom_details)) {
        detailsArray.push(`${symptom} - ${detail}`);
      }
      summary += detailsArray.join('; ');
    }
    return summary;
  };
  
  const symptomSummaryText = generateSymptomSummaryText(extracted_clinical_info);

  return (
    <div>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <button onClick={() => onSetView('suggestions')} disabled={currentView === 'suggestions'} style={currentView === 'suggestions' ? activeTabStyle : tabStyle}>Suggestions</button>
        <button onClick={() => onSetView('summary')} disabled={currentView === 'summary'} style={currentView === 'summary' ? activeTabStyle : tabStyle}>Summary</button>
      </div>

      {currentView === 'suggestions' && (
        <div>
          {/* This field would need to be added to your Gemini Phase 5 output */}
          <QuestionsToAskDisplay questions={clinical_support_details.suggested_clarifying_questions || ["When did symptoms start?", "Any medications?"]} />
          <SuggestedInvestigationsDisplay investigations={clinical_support_details.suggested_investigations} />
          <AlertsFlagsDisplay alerts={clinical_support_details.alerts_and_flags} />
          {/* MedicationConsiderationsDisplay could also go here if it fits the 'suggestions' flow */}
        </div>
      )}

      {currentView === 'summary' && (
        <div>
          <SymptomSummaryDisplay summary={symptomSummaryText} />
          <PotentialConditionsDisplay conditions={clinical_support_details.potential_conditions} />
          {/* This also might be differential_summary_for_doctor */}
          <NotesFromAISystemDisplay notes={clinical_support_details.differential_summary_for_doctor} /> 
        </div>
      )}
    </div>
  );
}
const tabStyle = { padding: '10px 20px', cursor: 'pointer', border: '1px solid #ccc', background: '#f0f0f0' };
const activeTabStyle = { ...tabStyle, background: '#007bff', color: 'white', borderBottom: '1px solid #007bff' };