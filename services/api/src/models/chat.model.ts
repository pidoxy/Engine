import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
  sender: "user" | "system";
  consultationId: mongoose.Types.ObjectId;
  userMessage?: string;
  triageData?: {
    mode?: string;
    input_transcript?: string;
    extracted_symptoms?: string[];
    retrieved_guidelines_summary?: Array<{
      source: string;
      code: string;
      case: string;
      score: number;
    }>;
    triage_recommendation?: {
      summary_of_findings?: string;
      recommended_actions_for_chw?: string[];
      urgency_level?: string;
      key_guideline_references?: string[];
      important_notes_for_chw?: string[];
    };
  };
  clinicalData?: {
    session_uuid?: string;
    mode?: string;
    transcript?: string;
    extracted_clinical_info?: {
      presenting_symptoms?: string[];
      symptom_details?: Record<string, string>;
      relevant_medical_history?: string[];
      relevant_family_history?: string[];
      social_history_highlights?: string[];
      current_medications_mentioned?: string[];
      key_examination_findings_verbalized?: string[];
      allergies_mentioned?: string[];
    };
    manual_context_provided?: string;
    retrieved_documents_summary?: Array<{
      source_type: string;
      source_name: string;
      hint: string;
      score: number;
    }>;
    clinical_support_details?: {
      potential_conditions?: Array<{
        name: string;
        reasoning: string;
        source_ref: string[];
      }>;
      suggested_investigations?: Array<{
        test: string;
        rationale: string;
        source_ref: string[];
      }>;
      medication_considerations_info?: Array<{
        drug_class_or_info: string;
        details: string;
        source_ref: string[];
      }>;
      alerts_and_flags?: string[];
      differential_summary_for_doctor?: string;
    };
    historical_context_summary?: any[];
  };
}

const chatSchema = new Schema<IChat>(
  {
    sender: {
      type: String,
      enum: ["user", "system"],
      required: [true, "Sender is required"],
    },
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: "Consultation",
      required: [true, "Consultation ID is required"],
    },
    userMessage: {
      type: String,
      required: false,
    },
    triageData: {
      mode: String,
      input_transcript: String,
      extracted_symptoms: [String],
      retrieved_guidelines_summary: [
        {
          source: String,
          code: String,
          case: String,
          score: Number,
        },
      ],
      triage_recommendation: {
        summary_of_findings: String,
        recommended_actions_for_chw: [String],
        urgency_level: String,
        key_guideline_references: [String],
        important_notes_for_chw: [String],
      },
    },
    clinicalData: {
      session_uuid: String,
      mode: String,
      transcript: String,
      extracted_clinical_info: {
        presenting_symptoms: [String],
        symptom_details: Schema.Types.Mixed,
        relevant_medical_history: [String],
        relevant_family_history: [String],
        social_history_highlights: [String],
        current_medications_mentioned: [String],
        key_examination_findings_verbalized: [String],
        allergies_mentioned: [String],
      },
      manual_context_provided: String,
      retrieved_documents_summary: [
        {
          source_type: String,
          source_name: String,
          hint: String,
          score: Number,
        },
      ],
      clinical_support_details: {
        potential_conditions: [
          {
            name: String,
            reasoning: String,
            source_ref: [String],
          },
        ],
        suggested_investigations: [
          {
            test: String,
            rationale: String,
            source_ref: [String],
          },
        ],
        medication_considerations_info: [
          {
            drug_class_or_info: String,
            details: String,
            source_ref: [String],
          },
        ],
        alerts_and_flags: [String],
        differential_summary_for_doctor: String,
      },
      historical_context_summary: [Schema.Types.Mixed],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
chatSchema.index({ consultationId: 1, timestamp: 1 });

const Chat = mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
