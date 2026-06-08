# Backend Contracts

This document defines the backend contracts we should build against while consolidating AidCare.

It is intentionally practical:

- frontends need stable request and response shapes
- `services/api` needs stable ways to call `services/engine`
- `services/engine` needs a clear boundary around inference vs persistence

## Contract Principles

1. Shared app data lives in PostgreSQL and is defined in `packages/database/prisma/schema.prisma`
2. `services/api` is the source of truth for app-facing auth, users, organizations, patients, consultations, and chats
3. `services/engine` is the source of truth for inference and processing results
4. The Engine should return structured outputs; the API should persist them in the shared app schema
5. The frontend should not depend on multiple competing data shapes for the same concept

## Ownership Summary

| Concern | Canonical owner |
| --- | --- |
| Auth and session | `services/api` |
| Organizations and users | `services/api` |
| Patients | `services/api` |
| App consultations and chats | `services/api` |
| Live doctor/CHW collaboration sessions | `services/api` |
| Triage inference | `services/engine` |
| Clinical support inference | `services/engine` |
| Multilingual follow-up and TTS | `services/engine` |
| OCR and file processing | `services/engine` |
| Doctor copilot | `services/engine` for now |
| Shared app schema | `packages/database` |

## Shared Domain Shapes

These are the shapes all services should converge on.

### User

The database stores `role` as a Prisma enum, but the API serializes every user
through `services/api/src/utils/contractTransforms.ts#serializeUser` before it
leaves the boundary. That serializer is the **single source of the user wire
shape** — do not hand-build user payloads elsewhere.

```ts
// Wire shape returned by the API (output of serializeUser)
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  // Legacy lowercase form for backward-compatible frontend consumption
  role: "consultant" | "organization" | "chw";
  // Canonical Prisma enum — prefer this for new logic
  roleKey: "CONSULTANT" | "ORGANIZATION" | "COMMUNITY_HEALTH_WORKER";
  organizationId?: string | null;
  // Mirror of organizationId kept for legacy callers; same value
  organization: string | null;
  active: boolean;
  passwordChangedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

`passwordHash` is never serialized. Inbound role/gender strings are normalized
back to the Prisma enum via `normalizeUserRoleInput` / `normalizeGenderInput`.

### Patient

```ts
type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  organizationId?: string | null;
  createdById?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Consultation

```ts
type Consultation = {
  id: string;
  title: string;
  consultantId?: string | null;
  patientId: string;
  mode: "CHW_TRIAGE" | "CLINICAL_SUPPORT";
  // Active language context for the consultation (PRD §12.1). Defaults to "EN".
  language: "EN" | "HA" | "YO" | "IG" | "PCM";
  isActive: boolean;
  audioFilePath?: string | null;
  transcriptText?: string | null;
  manualContextInput?: string | null;
  extractedInfoJson?: unknown;
  retrievedDocsSummaryJson?: unknown;
  finalRecommendationJson?: unknown;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### Chat message

```ts
type ChatMessage = {
  id: string;
  consultationId: string;
  sender: "USER" | "SYSTEM";
  // Per-turn language (PRD §12). Optional; null inherits the consultation language.
  language?: "EN" | "HA" | "YO" | "IG" | "PCM" | null;
  userMessage?: string | null;
  triageData?: unknown;
  clinicalData?: unknown;
  createdAt: string;
  updatedAt: string;
};
```

Frontend consumers normalize these shapes through
`apps/web/utils/contracts.js` (`normalizePatient` / `normalizeConsultation` /
`normalizeChatMessage`), which is the **single frontend normalization layer** —
it reconciles `id`/`_id`, `messages`/`chats`, and `organizationId`/`organization`.
No component should re-implement that mapping.

## API-to-Engine Contracts

These are the contracts `services/api` should use when talking to `services/engine`.

### 1. Patient sync

Used when the API creates a patient and the Engine needs a compatible mirror row for document processing or patient-scoped inference.

Endpoint:

- `POST /patients/`

Request:

```json
{
  "patient_uuid": "uuid",
  "first_name": "Amara",
  "last_name": "Okeke",
  "full_name": "Amara Okeke",
  "date_of_birth": "2020-01-10T00:00:00.000Z",
  "gender": "FEMALE",
  "organization_id": "uuid"
}
```

Response:

```json
{
  "id": "uuid",
  "first_name": "Amara",
  "last_name": "Okeke"
}
```

### 2. CHW triage from text

Endpoint:

- `POST /triage/process_text/`

Request:

```json
{
  "transcript_text": "Patient has fever and cough for two days."
}
```

Response:

```json
{
  "mode": "chw_triage_text_input",
  "input_transcript": "Patient has fever and cough for two days.",
  "extracted_symptoms": ["fever", "cough"],
  "retrieved_guidelines_summary": [
    {
      "source": "CHEW Standing Orders",
      "code": "2.3",
      "case": "Child with fever",
      "score": 0.45
    }
  ],
  "knowledge_sources": {
    "local_guidelines": 3
  },
  "triage_recommendation": {
    "summary_of_findings": "string",
    "recommended_actions_for_chw": ["string"],
    "urgency_level": "string",
    "key_guideline_references": ["string"],
    "important_notes_for_chw": ["string"],
    "evidence_based_notes": "string"
  }
}
```

### 3. CHW triage conversation continue

Endpoint:

- `POST /triage/continue_conversation/`

Request:

```json
{
  "conversation_history": "PATIENT: ...\nYOU: ...",
  "latest_message": "The fever started yesterday."
}
```

Response:

```json
{
  "response": "Are they also having difficulty breathing?",
  "conversation_complete": false,
  "should_auto_complete": false
}
```

### 4. Multilingual conversation continue

Endpoint:

- `POST /naija/continue_conversation/`

Request:

```json
{
  "conversation_history": "PATIENT: ...\nYOU: ...",
  "latest_message": "Ina da zazzabi.",
  "language": "ha"
}
```

Response:

```json
{
  "response": "Tambaya a harshen da aka nema",
  "language": "ha",
  "conversation_complete": false,
  "should_auto_complete": false
}
```

### 5. Multilingual triage result

Endpoints:

- `POST /naija/process_text/`
- `POST /naija/process_audio/`

Response:

Same triage structure as CHW triage, but values may be localized based on `language`.

### 6. Clinical support

This is the first contract we need to normalize.

Current Engine routes are audio-first:

- `POST /clinical_support/process_consultation/`
- `POST /clinical_support/process_consultation/{patient_uuid}/`

Recommended stable contract:

- `POST /clinical_support/process_text/`
- `POST /clinical_support/process_audio/`

Recommended request shape for text:

```json
{
  "patient_uuid": "uuid-or-null",
  "transcript_text": "Consultation text",
  "manual_context": "Doctor notes",
  "patient_document_texts": ["optional extracted text"]
}
```

Recommended response shape:

```json
{
  "mode": "clinical_support",
  "transcript": "Consultation text",
  "extracted_clinical_info": {},
  "manual_context_provided": "Doctor notes",
  "retrieved_documents_summary": [],
  "clinical_support_details": {
    "potential_conditions": [],
    "suggested_investigations": [],
    "medication_considerations_info": [],
    "alerts_and_flags": [],
    "differential_summary_for_doctor": "string"
  }
}
```

Until those routes exist, `services/api` should not assume text-based clinical endpoints that are not implemented.

### 7. Document upload and OCR

Current Engine route:

- `POST /patients/{patient_uuid}/upload_document/`

Recommended response:

```json
{
  "message": "File uploaded successfully and is queued for processing.",
  "patient_id": "uuid",
  "document_id": "uuid",
  "original_filename": "lab_report.pdf",
  "content_type": "application/pdf",
  "processing_status": "queued"
}
```

Important: the current implementation should be adjusted to return the created document ID and to wire the background task with the correct arguments.

## Frontend-Facing API Contracts

These are the contracts `apps/web` should rely on from `services/api`.

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/logout`
- `PATCH /api/v1/auth/update-password`

Response shape:

```json
{
  "success": true,
  "message": "string",
  "data": {
    "user": {},
    "token": "jwt"
  },
  "statusCode": 200
}
```

### Patients

- `GET /api/v1/patients/organization`
- `GET /api/v1/patients/:id`
- `GET /api/v1/patients/:patientId/consultation/:consultationId`
- `POST /api/v1/patients`

Requirements:

- use UUID-safe validation, not ObjectId validation
- expose `organizationId`, not `organization`
- return consultation IDs as `id`, not `_id`

### Consultations

- `GET /api/v1/consultations/:id/messages`

Requirements:

- always return `messages` sorted oldest to newest
- include both `triageData` and `clinicalData`

## WebSocket Contract

Used by `apps/web`.

Important: the current implementation is realtime for a single connected user session, but it is not yet true doctor/CHW shared collaboration. It does not currently use consultation rooms, shared participant membership, presence, or room-wide broadcasts.

### Connection query

```ts
{
  token: string;
  patientId: string;
  consultationId?: string;
}
```

### Client -> server events

#### `startConsultation`

```json
{
  "transcript_text": "string",
  "manual_context": "string",
  "triage": true
}
```

#### `message`

```json
{
  "transcript_text": "string",
  "manual_context": "string",
  "triage": false
}
```

### Server -> client events

- `consultationId`
- `message`
- `response`
- `recentMessages`
- `info`

### Required change

The server must call real Engine routes that exist. The current route assumptions in `services/api/src/service/chat.service.ts` must be replaced or the Engine must add matching endpoints.

## Live Collaboration Contract

This is the missing realtime piece for doctor + CHW live triage on the same case.

Recommended model:

- one consultation acts as the shared case record
- multiple authenticated participants can join the same consultation room
- all room members receive new user messages, AI outputs, doctor notes, escalation events, and status changes in realtime

Recommended backend requirements:

- Socket.IO room per consultation ID
- participant authorization for room join
- explicit consultation participants or assignment model
- room-wide broadcasts using `io.to(consultationId).emit(...)`
- presence, typing, and escalation events

Recommended events:

- `consultation:join`
- `consultation:leave`
- `consultation:message`
- `consultation:ai_response`
- `consultation:presence`
- `consultation:typing`
- `consultation:escalated`
- `consultation:status_changed`

Current gap:

- `services/api/src/service/chat.service.ts` emits back to the same socket, but does not yet implement shared room membership for multiple clinicians on one live case.

## Doctor Copilot Contracts

For now, `aidcare-copilot` can continue talking directly to `services/engine`.

Stable routes already present:

- `GET /doctor/list/`
- `GET /doctor/profile/{doctor_uuid}`
- `POST /doctor/shifts/start/`
- `POST /doctor/shifts/end/`
- `POST /doctor/scribe/`
- `POST /doctor/consultations/`
- `GET /doctor/consultations/{doctor_uuid}`
- `POST /doctor/handover/`
- `GET /doctor/burnout/{doctor_uuid}`
- `GET /admin/dashboard/`
- `GET /admin/doctor/{doctor_uuid}/detail`

These are good enough to preserve during the main consolidation.

## Contract Decisions We Should Lock Next

1. Will `services/api` proxy all inference calls, or can some frontend apps hit `services/engine` directly during the transition?
2. Should the Engine continue mirroring shared patient/consultation rows, or should it become stateless for main app inference?
3. Should copilot tables remain Engine-owned, or eventually move into `packages/database`?
4. Should document upload remain an Engine endpoint, or move behind the API as a proxy/orchestration layer?

## Immediate Implementation Targets

1. Make `services/api` call the real Engine routes that already exist
2. Add or normalize a text-based clinical support contract
3. Fix UUID validation in patient and consultation routes
4. Fix document upload background task wiring and response shape
5. Update env/docs so provider requirements match the real runtime
