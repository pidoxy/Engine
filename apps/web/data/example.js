// An example of a triage response, which is sent when triage is set to "true"
let triageResponse = {
  "sender": "system",
  "consultationId": "6859d45b0eec13b92ac38132",
  "triageData": {
      "mode": "chw_triage_text",
      "input_transcript": "Stooling, blood in stool, high temperature",
      "extracted_symptoms": [
          "stooling",
          "blood in stool",
          "high temperature"
      ],
      "retrieved_guidelines_summary": [
          {
              "source": "CHO Guidelines",
              "code": "5.5",
              "case": "Frequent loose stools in adult",
              "score": 1.0944859981536865,
              "_id": "6859e21f0eec13b92ac382ba"
          },
          {
              "source": "CHO Guidelines",
              "code": "2.3",
              "case": "Child with elevated temperature",
              "score": 1.1327712535858154,
              "_id": "6859e21f0eec13b92ac382bb"
          },
          {
              "source": "CHO Guidelines",
              "code": "5.2",
              "case": "Fever without clear source",
              "score": 1.1655217409133911,
              "_id": "6859e21f0eec13b92ac382bc"
          }
      ],
      "triage_recommendation": {
          "summary_of_findings": "The patient presents with bloody stools and a high temperature. Guideline Entry 1 (DIARRHOEA) and Guideline Entry 3 (FEVER) are relevant.  The presence of blood in the stool necessitates referral, as per Guideline Entry 1.",
          "recommended_actions_for_chw": [
              "1. Give ORS",
              "2. Refer if severe or bloody stools"
          ],
          "urgency_level": "Refer to Clinic",
          "key_guideline_references": [
              "N/A - Code: 5.5, Case: Frequent loose stools in adult",
              "N/A - Code: 5.2, Case: Fever without clear source"
          ],
          "important_notes_for_chw": []
      }
  },
  "clinicalData": {
      "extracted_clinical_info": {
          "presenting_symptoms": [],
          "relevant_medical_history": [],
          "relevant_family_history": [],
          "social_history_highlights": [],
          "current_medications_mentioned": [],
          "key_examination_findings_verbalized": [],
          "allergies_mentioned": []
      },
      "clinical_support_details": {
          "alerts_and_flags": [],
          "potential_conditions": [],
          "suggested_investigations": [],
          "medication_considerations_info": []
      },
      "historical_context_summary": [],
      "retrieved_documents_summary": []
  },
  "_id": "6859e21f0eec13b92ac382b9",
  "createdAt": "2025-06-23T23:24:15.445Z",
  "updatedAt": "2025-06-23T23:24:15.445Z",
  "__v": 0
}

// An example of a clinical response, which is sent when triage is set to "false"
let clinicalResponse = {
  "sender": "system",
  "consultationId": "68537c5d0eec13b92ac37f90",
  "triageData": {
      "triage_recommendation": {
          "recommended_actions_for_chw": [],
          "key_guideline_references": [],
          "important_notes_for_chw": []
      },
      "extracted_symptoms": [],
      "retrieved_guidelines_summary": []
  },
  "clinicalData": {
      "session_uuid": "c77a2b05-03f3-4cf3-8b95-a25cfc64b7ba",
      "mode": "clinical_support",
      "transcript": "Reports persistent cough, with blood stained sputum",
      "extracted_clinical_info": {
          "presenting_symptoms": [
              "cough"
          ],
          "symptom_details": {
              "cough": "persistent, with blood-stained sputum"
          },
          "relevant_medical_history": [],
          "relevant_family_history": [],
          "social_history_highlights": [],
          "current_medications_mentioned": [],
          "key_examination_findings_verbalized": [],
          "allergies_mentioned": []
      },
      "manual_context_provided": null,
      "retrieved_documents_summary": [
          {
              "source_type": "Guideline",
              "source_name": "CHO Guidelines",
              "hint": "Persistent cough",
              "score": 0.7324786186218262,
              "_id": "6859dd7c0eec13b92ac38275"
          },
          {
              "source_type": "Guideline",
              "source_name": "CHEW Guidelines",
              "hint": "Adult with persistent cough",
              "score": 0.8205344080924988,
              "_id": "6859dd7c0eec13b92ac38276"
          },
          {
              "source_type": "Guideline",
              "source_name": "CHO Guidelines",
              "hint": "Persistent cough",
              "score": 0.8503856062889099,
              "_id": "6859dd7c0eec13b92ac38277"
          },
          {
              "source_type": "Textbook",
              "source_name": "Oxford Handbook of Clinical Medicine",
              "hint": "Lung Cancer",
              "score": 0.8649390935897827,
              "_id": "6859dd7c0eec13b92ac38278"
          },
          {
              "source_type": "Guideline",
              "source_name": "CHEW Guidelines",
              "hint": "Persistent cough",
              "score": 0.9437118172645569,
              "_id": "6859dd7c0eec13b92ac38279"
          }
      ],
      "clinical_support_details": {
          "potential_conditions": [
              {
                  "name": "Tuberculosis",
                  "reasoning": "Persistent cough with blood-stained sputum is a key symptom of TB, mentioned in CHO and CHEW guidelines for persistent cough.",
                  "source_ref": [
                      "Guideline: CHO Guidelines",
                      "Guideline: CHEW Guidelines"
                  ],
                  "_id": "6859dd7c0eec13b92ac3827a"
              },
              {
                  "name": "Pneumonia",
                  "reasoning": "Persistent cough is a symptom of pneumonia, mentioned in CHO and CHEW guidelines for persistent cough.",
                  "source_ref": [
                      "Guideline: CHO Guidelines",
                      "Guideline: CHEW Guidelines"
                  ],
                  "_id": "6859dd7c0eec13b92ac3827b"
              },
              {
                  "name": "Bronchitis",
                  "reasoning": "Persistent cough is a symptom of bronchitis, mentioned in CHO and CHEW guidelines for persistent cough.",
                  "source_ref": [
                      "Guideline: CHO Guidelines",
                      "Guideline: CHEW Guidelines"
                  ],
                  "_id": "6859dd7c0eec13b92ac3827c"
              },
              {
                  "name": "Asthma",
                  "reasoning": "Persistent cough is a symptom of asthma, mentioned in CHO guidelines for persistent cough.",
                  "source_ref": [
                      "Guideline: CHO Guidelines"
                  ],
                  "_id": "6859dd7c0eec13b92ac3827d"
              }
          ],
          "suggested_investigations": [
              {
                  "test": "Sputum test",
                  "rationale": "To identify the causative organism, especially considering the blood-stained sputum which raises concern for TB.  Recommended by CHO and CHEW guidelines for persistent cough.",
                  "source_ref": [
                      "Guideline: CHO Guidelines",
                      "Guideline: CHEW Guidelines"
                  ],
                  "_id": "6859dd7c0eec13b92ac3827e"
              },
              {
                  "test": "Chest X-ray",
                  "rationale": "To visualize the lungs and assess for any abnormalities such as pneumonia or TB. Recommended by CHO and CHEW guidelines for persistent cough.",
                  "source_ref": [
                      "Guideline: CHO Guidelines",
                      "Guideline: CHEW Guidelines"
                  ],
                  "_id": "6859dd7c0eec13b92ac3827f"
              }
          ],
          "medication_considerations_info": [],
          "alerts_and_flags": [
              "Blood-stained sputum is a serious finding and warrants urgent investigation.  Consider TB as a possibility."
          ],
          "differential_summary_for_doctor": "Patient presents with a persistent cough and blood-stained sputum.  CHO and CHEW guidelines suggest considering TB, pneumonia, bronchitis, and asthma.  Urgent investigations including sputum culture and chest X-ray are recommended to rule out serious conditions like TB."
      },
      "historical_context_summary": []
  },
  "_id": "6859dd7c0eec13b92ac38274",
  "createdAt": "2025-06-23T23:04:28.753Z",
  "updatedAt": "2025-06-23T23:04:28.753Z",
  "__v": 0
}