// @aidcare/types — Shared TypeScript types
// Used by: apps/web (Next.js frontend) and services/api (TypeScript backend)
// Keep in sync with packages/database/prisma/schema.prisma

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export enum UserRole {
  CONSULTANT = "CONSULTANT",
  ORGANIZATION = "ORGANIZATION",
  COMMUNITY_HEALTH_WORKER = "COMMUNITY_HEALTH_WORKER",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export enum ConsultationMode {
  CHW_TRIAGE = "CHW_TRIAGE",
  CLINICAL_SUPPORT = "CLINICAL_SUPPORT",
}

export enum ChatSender {
  USER = "USER",
  SYSTEM = "SYSTEM",
}

// ─────────────────────────────────────────────
// CORE ENTITIES
// ─────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  active: boolean;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string; // virtual: firstName + lastName
  phoneNumber: string | null;
  dateOfBirth: string | null;
  gender: Gender;
  isActive: boolean;
  organizationId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  title: string;
  consultantId: string | null;
  patientId: string;
  mode: ConsultationMode;
  isActive: boolean;
  audioFilePath: string | null;
  transcriptText: string | null;
  manualContextInput: string | null;
  extractedInfoJson: TriageResult | ClinicalInfo | null;
  finalRecommendationJson: TriageRecommendation | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  consultationId: string;
  sender: ChatSender;
  userMessage: string | null;
  triageData: TriageChatData | null;
  clinicalData: ClinicalChatData | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDocument {
  id: string;
  patientId: string;
  consultationId: string | null;
  originalFilename: string;
  storagePath: string;
  fileType: string | null;
  extractedText: string | null;
  processingStatus: "queued" | "processing" | "completed" | "failed";
  uploadedAt: string;
  processedAt: string | null;
  errorMessage: string | null;
}

// ─────────────────────────────────────────────
// AI PIPELINE TYPES  (Engine responses)
// ─────────────────────────────────────────────

export interface TriageRecommendation {
  urgency_level: string;
  summary_of_findings: string;
  recommended_actions_for_chw: string[];
  key_guideline_references?: string[];
  important_notes_for_chw?: string[];
  evidence_based_notes?: string;
  risk_level?: "high" | "moderate" | "low";
}

export interface TriageResult {
  mode: string;
  input_transcript: string;
  extracted_symptoms: string[];
  triage_recommendation: TriageRecommendation;
}

export interface ClinicalInfo {
  symptoms: string[];
  medical_history: string[];
  current_medications: string[];
  allergies: string[];
  examination_findings: string[];
}

export interface TriageChatData {
  mode: string;
  input_transcript: string;
  extracted_symptoms: string[];
  retrieved_guidelines_summary: GuidelineReference[];
  triage_recommendation: TriageRecommendation;
}

export interface ClinicalChatData {
  session_uuid: string;
  mode: string;
  transcript: string;
  extracted_clinical_info: ClinicalInfo;
  retrieved_documents_summary: DocumentReference[];
  clinical_support_details: ClinicalSupportDetails;
  historical_context_summary: string[];
}

export interface GuidelineReference {
  content: string;
  score: number;
  source?: string;
}

export interface DocumentReference {
  content: string;
  score: number;
  filename?: string;
}

export interface ClinicalSupportDetails {
  potential_conditions: string[];
  suggested_investigations: string[];
  medication_info: string[];
  alerts: string[];
}

// ─────────────────────────────────────────────
// API REQUEST / RESPONSE SHAPES
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
}

export interface CreateConsultationRequest {
  patientId: string;
  mode?: ConsultationMode;
  title?: string;
}

// ─────────────────────────────────────────────
// SOCKET.IO EVENT TYPES
// ─────────────────────────────────────────────

export interface SocketMessagePayload {
  transcript_text: string;
  manual_context?: string;
  triage: boolean;
}

export interface SocketStartConsultationPayload extends SocketMessagePayload {
  consultationId?: string;
  patientId: string;
}

export type ServerToClientEvents = {
  info: (message: string) => void;
  consultationId: (id: string) => void;
  message: (chat: Chat) => void;
  response: (chat: Chat) => void;
  recentMessages: (messages: Chat[]) => void;
};

export type ClientToServerEvents = {
  message: (payload: SocketMessagePayload) => void;
  startConsultation: (payload: SocketStartConsultationPayload) => void;
};
