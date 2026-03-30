import React, { useState } from 'react';
import styles from './ReportGenerator.module.css';

const ReportGenerator = ({ patientData, currentInference, consultationData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('comprehensive');

  // Detect mode from inference data
  const isClinicalMode = currentInference?.clinical_support_details;
  const isTriageMode = currentInference?.triage_recommendation;
  const mode = isClinicalMode ? 'Clinical Mode' : isTriageMode ? 'Triage Mode' : 'Unknown Mode';

  // Mock documents data - replace with actual patient documents when available
  const uploadedDocuments = [
    { name: 'radiology_report.png', date: '8/27/2025', status: 'completed' },
    { name: 'prescription.png', date: '8/27/2025', status: 'completed' },
    { name: 'lab_report.png', date: '8/27/2025', status: 'completed' },
    { name: 'clinic_note.png', date: '8/27/2025', status: 'completed' }
  ];

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Create report content
      const reportContent = createReportContent();
      
      // For now, we'll create a downloadable text file
      // Later you can integrate with jsPDF for PDF generation
      downloadReport(reportContent);
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const createReportContent = () => {
    const timestamp = new Date().toLocaleString();
    const patientName = patientData?.name || 'Unknown Patient';
    const patientId = patientData?.id || 'Unknown ID';
    
    let content = `AIDCARE - PATIENT REPORT
Generated: ${timestamp}
==========================================

PATIENT INFORMATION
------------------
Name: ${patientName}
Patient ID: ${patientId}
Age: ${patientData?.age || 'N/A'}
Gender: ${patientData?.gender || 'N/A'}
Contact: ${patientData?.phone || 'N/A'}
Email: ${patientData?.email || 'N/A'}

SYSTEM MODE: ${mode}
`;

    // Add consultation details if available
    if (consultationData) {
      content += `CONSULTATION DETAILS
---------------------
Consultation ID: ${consultationData.id || 'N/A'}
Date: ${consultationData.created_at ? new Date(consultationData.created_at).toLocaleDateString() : 'N/A'}
Status: ${consultationData.status || 'N/A'}

`;
    }

    // Add inference data if available
    if (currentInference) {
      content += `CLINICAL ASSESSMENT
====================

`;

      // Session Information
      if (currentInference.session_uuid || currentInference.mode) {
        content += `Session Information:
- Session UUID: ${currentInference.session_uuid || 'N/A'}
- Mode: ${currentInference.mode || 'N/A'}

`;
      }

      // Consultation Transcript
      if (currentInference.input_transcript) {
        content += `Consultation Transcript:
${currentInference.input_transcript}

`;
      }

      // Manually Entered Context
      if (currentInference.manual_context_provided && currentInference.manual_context_provided !== 'string') {
        content += `Manually Entered Context:
${currentInference.manual_context_provided}

`;
      }

      // Triage Information
      if (currentInference.triage_recommendation) {
        content += `TRIAGE RECOMMENDATIONS
------------------------
`;
        
        if (currentInference.triage_recommendation.urgency_level) {
          content += `Urgency Level: ${currentInference.triage_recommendation.urgency_level}
`;
        }
        
        if (currentInference.triage_recommendation.summary_of_findings) {
          content += `Summary of Findings: ${currentInference.triage_recommendation.summary_of_findings}
`;
        }
        
        if (currentInference.triage_recommendation.recommended_actions_for_chw?.length > 0) {
          content += `Recommended Actions:
${currentInference.triage_recommendation.recommended_actions_for_chw.map((action, idx) => `${idx + 1}. ${action}`).join('\n')}

`;
        }
        
        if (currentInference.triage_recommendation.important_notes_for_chw?.length > 0) {
          content += `Important Notes:
${currentInference.triage_recommendation.important_notes_for_chw.map((note, idx) => `${idx + 1}. ${note}`).join('\n')}

`;
        }
        
        if (currentInference.triage_recommendation.key_guideline_references?.length > 0) {
          content += `Key Guideline References:
${currentInference.triage_recommendation.key_guideline_references.map((ref, idx) => `${idx + 1}. ${ref}`).join('\n')}

`;
        }
      }

      // Clinical Support Details
      if (currentInference.clinical_support_details) {
        content += `CLINICAL SUPPORT DETAILS
============================

`;
        
        // Differential Summary
        if (currentInference.clinical_support_details.differential_summary_for_doctor) {
          content += `1. DIFFERENTIAL SUMMARY FOR DOCTOR
${currentInference.clinical_support_details.differential_summary_for_doctor}

`;
        }
        
        // Potential Conditions
        if (currentInference.clinical_support_details.potential_conditions?.length > 0) {
          content += `2. POTENTIAL CONDITIONS
${currentInference.clinical_support_details.potential_conditions.map((condition, idx) => {
  const name = condition.name || condition.condition;
  const reasoning = condition.reasoning || condition.reason;
  const sources = condition.sources || condition.source_ref;
  let conditionText = `${idx + 1}. ${name}`;
  if (reasoning) conditionText += `\n   Reasoning: ${reasoning}`;
  if (sources?.length > 0) conditionText += `\n   Sources: ${sources.join(', ')}`;
  return conditionText;
}).join('\n\n')}

`;
        }
        
        // Suggested Investigations
        if (currentInference.clinical_support_details.suggested_investigations?.length > 0) {
          content += `3. SUGGESTED INVESTIGATIONS
${currentInference.clinical_support_details.suggested_investigations.map((investigation, idx) => {
  const title = investigation.test || investigation.investigation || 'Investigation';
  const rationale = investigation.rationale || investigation.reason || investigation.description;
  const sources = investigation.sources || investigation.source_ref;
  let investigationText = `${idx + 1}. ${title}`;
  if (rationale) investigationText += `\n   Rationale: ${rationale}`;
  if (sources?.length > 0) investigationText += `\n   Sources: ${sources.join(', ')}`;
  return investigationText;
}).join('\n\n')}

`;
        }
        
        // Medication Considerations
        if (currentInference.clinical_support_details.medication_considerations_info?.length > 0 || 
            currentInference.clinical_support_details.medication_considerations?.length > 0) {
          content += `4. MEDICATION CONSIDERATIONS & INFO
${(currentInference.clinical_support_details.medication_considerations_info || currentInference.clinical_support_details.medication_considerations).map((item, idx) => {
  const name = item.medication_name || item.medication || 'Consideration';
  const details = item.details || item.description || item.info;
  const sources = item.sources || item.source_ref;
  let medicationText = `${idx + 1}. ${name}`;
  if (details) medicationText += `\n   Details: ${details}`;
  if (sources?.length > 0) medicationText += `\n   Sources: ${sources.join(', ')}`;
  return medicationText;
}).join('\n\n')}

`;
        }
        
        // Alerts and Flags
        if (currentInference.clinical_support_details.alerts_and_flags?.length > 0) {
          content += `5. ALERTS & FLAGS
${currentInference.clinical_support_details.alerts_and_flags.map((alert, idx) => `⚠️ ${idx + 1}. ${alert}`).join('\n')}

`;
        }
        
        // Historical Context
        if (currentInference.clinical_support_details.historical_context_summary?.length > 0) {
          content += `6. HISTORICAL CONTEXT SUMMARY
${currentInference.clinical_support_details.historical_context_summary.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

`;
        }
      }

      // Extracted Symptoms
      if (currentInference.extracted_symptoms?.length > 0) {
        content += `EXTRACTED SYMPTOMS
==================
${currentInference.extracted_symptoms.map((symptom, idx) => `${idx + 1}. ${symptom}`).join('\n')}

`;
      }

      // Retrieved Guidelines
      if (currentInference.retrieved_guidelines_summary?.length > 0) {
        content += `RETRIEVED GUIDELINES
======================
${currentInference.retrieved_guidelines_summary.map((guideline, idx) => {
  let guidelineText = `${idx + 1}. ${guideline.source} - ${guideline.code}`;
  if (guideline.case) guidelineText += `\n   Case: ${guideline.case}`;
  if (typeof guideline.score === 'number') guidelineText += `\n   Score: ${guideline.score.toFixed(3)}`;
  return guidelineText;
}).join('\n\n')}

`;
      }

      // Extracted Clinical Information
      if (currentInference.extracted_clinical_info) {
        const hasContent = Object.values(currentInference.extracted_clinical_info).some(value => 
          value && (Array.isArray(value) ? value.length > 0 : String(value).trim() !== '')
        );
        
        if (hasContent) {
          content += `EXTRACTED CLINICAL INFORMATION
==================================
`;
          
          Object.entries(currentInference.extracted_clinical_info).forEach(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return;
            
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            content += `${displayKey}:\n`;
            
            if (Array.isArray(value)) {
              value.forEach((item, idx) => {
                if (typeof item === 'object') {
                  Object.entries(item).forEach(([subKey, subValue]) => {
                    if (!subValue || (Array.isArray(subValue) && subValue.length === 0)) return;
                    const subDisplayKey = subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    content += `  ${subDisplayKey}: ${Array.isArray(subValue) ? subValue.join(', ') : String(subValue)}\n`;
                  });
                } else {
                  content += `  ${idx + 1}. ${String(item)}\n`;
                }
              });
            } else {
              content += `  ${String(value)}\n`;
            }
            content += '\n';
          });
        }
      }

      // Add uploaded documents
      if (uploadedDocuments.length > 0) {
        content += `UPLOADED DOCUMENTS
===================
${uploadedDocuments.map((doc, idx) => `${idx + 1}. ${doc.name} (${doc.date}) - Status: ${doc.status}`).join('\n')}

`;
      }

      content += `\n==========================================
Report generated by AIDCARE System
End of Report`;

      return content;
    }

    return content;
  };

  const downloadReport = (content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIDCARE_Report_${patientData?.name || 'Patient'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const refreshDocuments = () => {
    // TODO: Implement actual document refresh logic
    console.log('Refreshing documents...');
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 space-y-6">
      {/* Uploaded Documents Section */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border-l-4 border-l-purple-500 border border-purple-200 shadow-md hover:shadow-lg transition-shadow">
        <h4 className="font-bold text-purple-700 mb-3 text-lg">Uploaded Documents</h4>
        
        <div className="space-y-3">
          {uploadedDocuments.map((document, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 text-lg">📄</span>
                  <div>
                    <p className="text-purple-700 font-medium">{document.name}</p>
                    <p className="text-purple-500 text-sm">({document.date})</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  {document.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <button
            onClick={refreshDocuments}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Refresh Document List
          </button>
        </div>
      </div>

      {/* Generate Report Section */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border-l-4 border-l-green-500 border border-green-200 shadow-md hover:shadow-lg transition-shadow">
        <h4 className="font-bold text-green-700 mb-3 text-lg">Generate Report</h4>
        <p className="text-green-600 text-sm mb-4">Create a downloadable report with all patient and clinical data</p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex flex-col gap-2 min-w-[200px]">
            <label htmlFor="reportType" className="font-medium text-green-700 text-sm">Report Type:</label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="p-2 rounded-lg border border-green-200 focus:outline-none focus:border-green-500 text-sm"
            >
              <option value="comprehensive">Comprehensive Report</option>
              <option value="clinical">Clinical Summary Only</option>
              <option value="triage">Triage Summary Only</option>
            </select>
          </div>
          
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 h-[42px] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm mt-4">
          <p className="text-green-700 text-sm">
            <strong>Note:</strong> This will generate a comprehensive text report. 
            For PDF format, install jsPDF and html2canvas dependencies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
