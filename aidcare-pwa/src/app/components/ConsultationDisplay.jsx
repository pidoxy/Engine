// src/app/components/ConsultationDisplay.js
"use client";
import React from 'react';
import SectionCard from './SectionCard'; // Assuming SectionCard is created

const QuestionsToAskDisplay = ({ questions }) => (
  <SectionCard title="Questions to Ask" isEmpty={!questions || questions.length === 0} titleIcon="❓">
    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {questions && questions.map((q, i) => 
            <li key={i} style={{padding: '8px 0', borderBottom: '1px solid #f0f0f0'}}>{q}</li>
        )}
    </ul>
  </SectionCard>
);

const TestsToConsiderDisplay = ({ tests }) => ( // Renamed from SuggestedInvestigationsDisplay for clarity with mockups
  <SectionCard title="Tests to Consider" isEmpty={!tests || tests.length === 0} titleIcon="🔬">
    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
      {tests && tests.map((test, i) => (
        <li key={i} style={{padding: '8px 0', borderBottom: '1px solid #f0f0f0'}}>
          <strong>{test.test}</strong>
          {test.rationale && <p style={{ margin: '2px 0 0', fontSize: '0.85em', color: '#555' }}>{test.rationale}</p>}
        </li>
      ))}
    </ul>
  </SectionCard>
);

const RedFlagsDisplay = ({ flags }) => ( // Renamed from AlertsFlagsDisplay
  <SectionCard title="Red Flags" isEmpty={!flags || flags.length === 0} titleIcon="🚩">
    <ul style={{ listStyle: 'none', paddingLeft: 0, color: '#c0392b' }}>
        {flags && flags.map((flag, i) => 
            <li key={i} style={{padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontWeight: 500}}>{flag}</li>
        )}
    </ul>
  </SectionCard>
);

// For Summary Tab
const SymptomSummaryCard = ({ summaryText }) => (
  <SectionCard title="Symptom Summary" isEmpty={!summaryText} titleIcon="📝">
    <p style={{whiteSpace: 'pre-line'}}>{summaryText}</p>
  </SectionCard>
);

const PossibleConditionsCard = ({ conditions }) => ( // Renamed from PotentialConditionsDisplay
  <SectionCard title="Possible Conditions" isEmpty={!conditions || conditions.length === 0} titleIcon="🎯">
    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
      {conditions && conditions.map((cond, i) => (
        <li key={i} style={{padding: '8px 0', borderBottom: '1px solid #f0f0f0'}}>
          <strong>{cond.name}</strong>
          {cond.reasoning && <p style={{ margin: '2px 0 0', fontSize: '0.85em', color: '#555' }}>{cond.reasoning}</p>}
        </li>
      ))}
    </ul>
  </SectionCard>
);

const NotesFromAISystemCard = ({ notes }) => ( // Renamed from SummaryDisplay
  <SectionCard title="Notes from AI System" isEmpty={!notes} titleIcon="💡">
    <p style={{whiteSpace: 'pre-line'}}>{notes}</p>
  </SectionCard>
);


// Main ConsultationDisplay Component
export default function ConsultationDisplay({ apiResult, currentView, onSetView }) {
  if (!apiResult) return null; // Or a placeholder if apiResult structure isn't ready

  const { extracted_clinical_info, clinical_support_details } = apiResult;

  // Helper to generate a narrative symptom summary from structured data
  const generateSymptomSummaryText = (info) => {
    if (!info || !info.presenting_symptoms || info.presenting_symptoms.length === 0) {
      return "No primary symptoms extracted from the consultation.";
    }
    let summary = `Patient complaints include: ${info.presenting_symptoms.join(', ')}.`;
    if (info.symptom_details && Object.keys(info.symptom_details).length > 0) {
      summary += "\nDetails provided:";
      for (const [symptom, detail] of Object.entries(info.symptom_details)) {
        summary += `\n- ${symptom}: ${detail}`;
      }
    }
    if (info.allergies_mentioned && info.allergies_mentioned.length > 0) {
        summary += `\nKnown allergies: ${info.allergies_mentioned.join(', ')}.`;
    }
    // Add more fields from extracted_clinical_info if needed
    return summary;
  };
  
  const symptomSummaryText = generateSymptomSummaryText(extracted_clinical_info);

  // Style for tabs
  const tabBaseStyle = { padding: '10px 20px', cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '1em', fontWeight: '500', color: '#888', borderBottom: '3px solid transparent' };
  const tabActiveStyle = { ...tabBaseStyle, color: '#007bff', borderBottom: '3px solid #007bff' };

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0px', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
        <button onClick={() => onSetView('suggestions')} style={currentView === 'suggestions' ? tabActiveStyle : tabBaseStyle}>Suggestions</button>
        <button onClick={() => onSetView('summary')} style={currentView === 'summary' ? tabActiveStyle : tabBaseStyle}>Summary</button>
      </div>

      {isLoading && <LoadingSpinner />}
      {errorMessage && <ErrorMessage message={errorMessage} />}

      {!isLoading && !errorMessage && clinical_support_details && (
        currentView === 'suggestions' ? (
          <div>
            <QuestionsToAskDisplay questions={clinical_support_details.suggested_clarifying_questions} />
            <TestsToConsiderDisplay tests={clinical_support_details.suggested_investigations} />
            <RedFlagsDisplay flags={clinical_support_details.alerts_and_flags} />
            {/* You can also include MedicationConsiderationsDisplay here if it fits */}
          </div>
        ) : ( // Summary View
          <div>
            <SymptomSummaryCard summaryText={symptomSummaryText} />
            <PossibleConditionsCard conditions={clinical_support_details.potential_conditions} />
            <NotesFromAISystemCard notes={clinical_support_details.differential_summary_for_doctor} />
            {/* You might also want to show MedicationConsiderationsDisplay in the summary view */}
          </div>
        )
      )}
    </div>
  );
}