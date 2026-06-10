# AidCare Unified Product & Technical PRD

Version: 4.0
Date: 2026-06-08
Status: Detailed draft
Primary direction: consolidate into one core frontend (`apps/web`) and one full backend by merging current `services/api` and `services/engine` responsibilities

## 1. Executive Summary

AidCare will be rebuilt as a single integrated product centered on:

- one core user-facing application: `apps/web`
- one unified backend platform: a merged successor to `services/api` and `services/engine`
- one shared domain model for users, organizations, patients, consultations, messages, documents, and AI outputs
- one multilingual care workflow built directly into the main product rather than maintained as a separate product surface

In the target state, the current role of `apps/lang` is not preserved as a separate long-term app. Its capabilities become embedded inside `apps/web` as:

- multilingual symptom capture
- multilingual consultation support
- multilingual text/audio interaction
- optional text-to-speech playback

Similarly, the split between:

- `services/api` as the operations backend, and
- `services/engine` as the AI backend

will be removed at the product boundary. The merged backend will expose one set of APIs, one authentication model, one persistence layer, and one orchestration layer for both standard application flows and AI-native flows.

## 2. Product Vision

AidCare should become a unified AI-assisted healthcare operations platform for frontline care delivery in low-resource environments.

The platform should let organizations, CHWs, and clinicians:

- sign in once
- manage patients in one place
- start and continue consultations
- use English or major Nigerian languages during symptom intake and care support
- capture text or audio
- receive triage or clinical-support output
- upload patient documents
- preserve a full patient-linked care history

The user experience should feel continuous from onboarding to consultation to follow-up. There should be no conceptual separation between “main app behavior” and “language app behavior.”

## 3. Product Direction

This PRD assumes four strategic decisions.

### 3.1 `apps/web` becomes the core product

`apps/web` will own the full core AidCare experience:

- landing and conversion
- authentication and onboarding
- patient management
- consultation workflows
- multilingual flows
- audio workflows
- document workflows
- reporting and historical views

### 3.2 `apps/lang` is a feature source, not a long-term product boundary

`apps/lang` is valuable for its interaction model and multilingual logic, but not as a permanent separate product surface.

Its capabilities should be migrated into `apps/web` as:

- reusable language selection
- multilingual prompt system
- multilingual audio/text flows
- multilingual result rendering
- multilingual TTS playback

### 3.3 `services/api` and `services/engine` become one backend

The new backend should expose one public platform boundary. AI processing becomes an internal module group, not a peer backend.

### 3.4 One shared domain model

AidCare should converge on one canonical model for:

- User
- Organization
- Role
- Patient
- Consultation
- Message
- PatientDocument
- AI output metadata
- language/session context

## 4. Product Problem Statement

AidCare is solving two layers of problems.

### 4.1 External healthcare problem

- CHWs need guided triage and escalation support.
- Clinicians need faster documentation and better consultation support.
- Organizations need shared patient and care workflows.
- Multilingual users need care support in local languages.

### 4.2 Internal product problem

The current product shape creates fragmentation:

- multilingual capability is isolated in a separate app
- operational state and AI state are split across backends
- patient and consultation identity can drift between services
- frontend contracts differ by surface
- the product story is harder to explain than the underlying value

The unification effort is therefore product work, not just engineering cleanup.

## 5. Business Goals

### 5.1 Primary business goals

- create a single flagship AidCare product
- improve adoption by reducing fragmentation
- strengthen continuity of care through patient-linked AI workflows
- make multilingual care support part of the core value proposition

### 5.2 Product goals

- unify frontend workflows in one app
- unify backend responsibilities in one service boundary
- unify domain entities and contracts
- enable every meaningful AI interaction to persist into one care history model

### 5.3 Technical goals

- eliminate duplicated orchestration logic
- reduce cross-service sync problems
- reduce contract drift between frontends and AI endpoints
- simplify deployment and observability

## 6. Users and User Types

### 6.1 Organization Admin

Primary goals:

- create organization
- onboard team
- manage access
- standardize workflows

### 6.2 Community Health Worker

Primary goals:

- capture symptoms quickly
- work in the most comfortable language
- receive simple urgency guidance
- record consultations against patients where needed

### 6.3 Consultant / Clinician

Primary goals:

- review patient context
- continue consultations
- upload supporting documents
- receive deeper clinical-support output

### 6.4 Multilingual frontline user

Primary goals:

- interact in English, Hausa, Yoruba, Igbo, or Pidgin
- use audio or text
- receive understandable guidance

## 7. Current State Summary

This PRD is grounded in the current repository.

### 7.1 Current frontend landscape

`apps/web`

- Next.js + React main app
- handles auth pages, onboarding, patient pages, dashboard, document upload, chat-based consultations
- already integrated with the operational backend and WebSockets

`apps/lang`

- Next.js + React multilingual app
- handles language selection, multilingual conversation, triage processing, and localized results
- currently acts more like a separate experience

### 7.2 Current backend landscape

`services/api`

- TypeScript/Express/Prisma
- owns auth, orgs, patients, consultation persistence, WebSocket chat orchestration
- currently calls the engine using axios

`services/engine`

- Python/FastAPI/SQLAlchemy/FAISS/LLM integrations
- owns transcription, symptom extraction, triage, clinical support, multilingual flows, TTS, document processing

### 7.3 Current schema direction

The repo already contains a shared PostgreSQL schema in `packages/database/prisma/schema.prisma` that indicates the intended convergence model:

- users
- organizations
- roles
- patients
- consultations
- chats
- patient documents

This is the right foundation for the unified product.

## 8. Target State Summary

### 8.1 Frontend target state

One main app: `apps/web`

Inside it:

- authenticated workspace
- multilingual consultation mode
- language-aware intake and support
- audio/text interaction modes
- patient-linked consultation history

### 8.2 Backend target state

One backend service, logically modular but externally unified.

The unified backend should own both:

- classic application concerns
- AI-native inference concerns

### 8.3 Data target state

One canonical relational model in PostgreSQL with all frontend and AI flows anchored to the same entities.

## 9. Product Scope

### 9.1 In scope

- consolidation of multilingual features into `apps/web`
- consolidation of API and engine into one backend boundary
- one patient and consultation model
- one care timeline model
- one document model
- one response contract strategy
- one deployment story for the backend

### 9.2 Out of scope for this phase

- full mobile-native apps
- billing or claims
- full hospital scheduling
- advanced EHR interoperability beyond foundational data modeling

## 10. Functional Requirements

### 10.1 Authentication and onboarding

The product must:

- support sign up, login, and onboarding in `apps/web`
- support organization-root-user creation
- support role-aware session persistence
- maintain secure auth state across all core workflows

### 10.2 Organization and role management

The product must:

- create organizations
- assign users to organizations
- support at least organization, consultant, and CHW roles
- make role context available in all consultation workflows

### 10.3 Patient management

The product must:

- create patients
- list patients scoped to organization
- retrieve single patient details
- link consultations to patients
- link uploaded documents to patients
- support normalized patient rendering in the frontend

### 10.4 Consultation management

The product must:

- create consultations on first relevant interaction
- continue existing consultations
- persist user and system messages
- support consultation mode selection or inference
- support patient-linked history and revisit flows

### 10.5 Multilingual support in the core app

The product must:

- support English, Hausa, Yoruba, Igbo, and Pidgin
- allow the user to choose language inside the core web app
- support multilingual prompts, placeholders, button labels, and system feedback
- support multilingual conversation continuation
- support multilingual triage output rendering
- support multilingual audio processing
- support multilingual TTS playback where configured

### 10.6 Audio workflows

The product must:

- support microphone capture in supported browsers
- support clear recording states
- transcribe recorded audio
- support text fallback when microphone access is denied or unavailable

### 10.7 CHW triage workflows

The product must:

- accept text or audio symptom descriptions
- extract symptoms
- retrieve relevant guideline context
- generate urgency level and recommended CHW actions
- display structured, readable outputs

### 10.8 Clinical support workflows

The product must:

- accept consultation audio or text
- accept manual context input
- run deeper clinical information extraction
- retrieve knowledge context
- generate structured support outputs
- incorporate patient historical documents where available

### 10.9 Document workflows

The product must:

- upload patient documents
- store file metadata
- process files into extracted text
- attach document context to patient and optionally consultation
- reuse extracted text in later clinical-support flows

### 10.10 Persistence and history

The product must:

- persist multilingual interactions within the same care history model
- persist triage and clinical-support results in the same consultation record model
- avoid disconnected AI result screens that are not linkable to patient history

## 11. UX Requirements

### 11.1 Unified product feel

The app must feel like one AidCare product.

That means:

- language selection is a mode inside the app, not an app switch
- urgency classification language is consistent
- patient and consultation flows are continuous
- AI outputs are presented within the care workflow, not as separate tools

### 11.2 Role-aware UX

The same app should adapt by role:

- CHWs see simplified triage workflows
- consultants see richer patient-context and clinical-support workflows
- admins see workspace and organization controls

### 11.3 Multilingual UX

The multilingual experience must be natively embedded:

- language switcher in the consultation flow
- language-specific assistant greeting and prompts
- text/audio interaction in selected language
- language-specific result copy and action phrasing

### 11.4 Safety UX

The product must:

- clearly frame outputs as support rather than diagnosis
- visibly surface high-risk urgency
- show action-oriented escalation guidance
- keep disclaimers consistent where triage results are shown

## 12. Technical Architecture

## 12.1 Current architecture

Current flow:

`apps/web` -> `services/api` -> `services/engine`

`apps/lang` -> `services/engine`

This creates:

- split response contracts
- split persistence expectations
- fragmented product flows

## 12.2 Target architecture

Target flow:

`apps/web` -> unified backend

Inside the unified backend:

- auth module
- organization module
- patient module
- consultation module
- messaging / realtime module
- transcription module
- multilingual module
- triage module
- clinical-support module
- retrieval module
- document-processing module
- TTS module
- monitoring/admin module

## 12.3 Backend technology direction

There are two viable implementation paths:

### Option A: TypeScript-first unified backend

- keep Express/Node/Prisma as the primary backend shell
- move AI orchestration behind internal services or Python workers
- expose one TypeScript-owned public API

Benefits:

- easier continuity with current `services/api`
- shared Prisma schema already in place
- one public contract surface

Tradeoffs:

- Python-native AI code would need wrapping, porting, or worker integration

### Option B: Python-first unified backend

- move auth and operations into FastAPI
- keep AI logic in-process
- replace current Express public boundary

Benefits:

- keeps current AI engine code closer to the core backend
- simpler in-process access to AI modules

Tradeoffs:

- larger migration for auth, org, patient, consultation, and WebSocket logic

### Recommended direction

Product-wise, the cleanest near-term route is:

- one public backend boundary owned by the current API layer concept,
- with AI modules either embedded or invoked internally,
- while preserving PostgreSQL as the single persistence layer.

This does not require choosing a full rewrite immediately, but it does require one externally unified backend contract.

## 13. Frontend Technical Architecture

### 13.1 Current web stack

From `apps/web/package.json`:

- Next.js 16
- React 19
- Socket.io client
- jsPDF / html2canvas
- Tailwind/PostCSS

### 13.2 Current lang stack

From `apps/lang/package.json`:

- Next.js 16
- React 19
- TypeScript

### 13.3 Consolidation target

`apps/web` should absorb:

- language selection state
- multilingual API client logic
- multilingual result parsing
- multilingual conversation components
- optional TTS playback controls

### 13.4 Proposed frontend module areas

Inside `apps/web`, create or consolidate:

- `features/auth`
- `features/patients`
- `features/consultations`
- `features/triage`
- `features/multilingual`
- `features/audio`
- `features/documents`
- `features/reports`
- `features/settings`

### 13.5 Proposed frontend routes

Target route ideas:

- `/`
- `/login`
- `/signup`
- `/onboard`
- `/app`
- `/app/patients/:id`
- `/app/patients/:id/consultations/:id`
- `/app/triage`
- `/app/triage/session/:id`

The multilingual flow can be:

- a language-aware mode inside `/app/triage`
- or a language-aware panel inside patient-linked consultations

## 14. Backend Technical Architecture

### 14.1 Current API stack

From `services/api/package.json`:

- Express
- Prisma
- Socket.io
- JWT/auth libs
- Zod
- Axios
- Pino
- rate-limit / cors / helmet

### 14.2 Current engine stack

From `services/engine/requirements.txt`:

- FastAPI
- SQLAlchemy
- Google Gemini client
- OpenAI client
- Torch / transformers / sentence-transformers
- FAISS
- Pillow / pdf2image / pytesseract

### 14.3 Unified backend logical modules

Proposed module map:

- `auth`
- `users`
- `organizations`
- `roles`
- `patients`
- `consultations`
- `messages`
- `realtime`
- `transcription`
- `multilingual`
- `triage`
- `clinical_support`
- `documents`
- `retrieval`
- `tts`
- `admin`
- `observability`

### 14.4 Realtime architecture

Current system already uses Socket.io for consultation events.

Target behavior:

- keep a realtime channel for active consultations
- create consultation on first message
- append user and AI messages to persistent storage
- push system response back to the client after AI processing

### 14.5 Internal AI orchestration pattern

Recommended orchestration lifecycle:

1. validate request
2. load user/patient/consultation context
3. persist incoming user event
4. decide workflow type:
   - multilingual continuation
   - CHW triage
   - clinician support
   - transcription only
   - document processing
5. call internal AI module
6. normalize raw model output
7. persist structured result
8. publish result to client

## 15. Data Model

The shared Prisma schema already points toward the target model.

### 15.1 User

Fields currently represented:

- id
- firstName
- lastName
- email
- passwordHash
- role
- active
- organizationId
- password reset/change metadata

### 15.2 Organization

Fields:

- id
- name
- description
- createdById
- createdAt
- updatedAt

### 15.3 Patient

Fields:

- id
- firstName
- lastName
- phoneNumber
- dateOfBirth
- gender
- isActive
- organizationId
- createdById
- createdAt
- updatedAt

### 15.4 Consultation

Fields:

- id
- title
- consultantId
- patientId
- mode
- isActive
- audioFilePath
- transcriptText
- manualContextInput
- extractedInfoJson
- retrievedDocsSummaryJson
- finalRecommendationJson
- startedAt
- endedAt
- createdAt
- updatedAt

### 15.5 Chat / Message

Fields:

- id
- consultationId
- sender
- userMessage
- triageData
- clinicalData
- createdAt
- updatedAt

### 15.6 PatientDocument

Fields:

- id
- patientId
- consultationId
- originalFilename
- storagePath
- fileType
- extractedText
- processingStatus
- uploadedAt
- processedAt
- errorMessage

### 15.7 Recommended additions for unification

To fully embed multilingual behavior into the core app, add either:

- consultation-level language context fields, or
- message-level language metadata, or both

Suggested additions:

- `Consultation.language`
- `Consultation.workflowSource`
- `Chat.language`
- `Chat.audioMetadataJson`
- `Chat.systemOutputType`

## 16. API Design

In the unified backend, the frontend should see one contract surface.

### 16.1 Auth endpoints

Examples:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password/:token`

### 16.2 Organization endpoints

Examples:

- `POST /api/v1/organizations`
- `GET /api/v1/organizations/:id`
- `POST /api/v1/organizations/:id/users`

### 16.3 Patient endpoints

Examples:

- `POST /api/v1/patients`
- `GET /api/v1/patients/organization`
- `GET /api/v1/patients/:id`
- `GET /api/v1/patients/:patientId/consultations/:consultationId`

### 16.4 Consultation endpoints

Examples:

- `POST /api/v1/consultations`
- `GET /api/v1/consultations/:id`
- `GET /api/v1/consultations/:id/messages`
- realtime namespace or socket channel for live interactions

### 16.5 Triage and multilingual endpoints

In the unified product, these should be product endpoints, not engine-flavored endpoints.

Examples:

- `POST /api/v1/triage/messages`
- `POST /api/v1/triage/audio`
- `POST /api/v1/triage/continue`
- `POST /api/v1/triage/multilingual/messages`
- `POST /api/v1/triage/multilingual/audio`

### 16.6 Clinical-support endpoints

Examples:

- `POST /api/v1/clinical-support/messages`
- `POST /api/v1/clinical-support/audio`
- `POST /api/v1/clinical-support/patients/:id/messages`

### 16.7 Document endpoints

Examples:

- `POST /api/v1/patients/:id/documents`
- `GET /api/v1/patients/:id/documents`
- `GET /api/v1/documents/:id`

### 16.8 TTS endpoints

Examples:

- `POST /api/v1/tts`

## 17. Response Contract Strategy

The frontend must not be coupled directly to raw model outputs.

### 17.1 Unified triage response shape

Suggested shape:

```ts
type TriageResponse = {
  consultationId: string;
  mode: "chw_triage";
  language: "en" | "ha" | "yo" | "ig" | "pcm";
  transcriptText: string;
  extractedSymptoms: string[];
  urgency: {
    level: "high" | "moderate" | "low";
    label: string;
  };
  summary: string;
  actions: string[];
  evidenceNotes?: string;
  guidelineReferences?: string[];
  audio?: {
    available: boolean;
    playbackUrl?: string;
  };
};
```

### 17.2 Unified clinical-support response shape

Suggested shape:

```ts
type ClinicalSupportResponse = {
  consultationId: string;
  mode: "clinical_support";
  language: string;
  transcriptText: string;
  extractedInfo: Record<string, unknown>;
  retrievedKnowledge: Array<{
    sourceType?: string;
    sourceName?: string;
    hint?: string;
    score?: number;
  }>;
  supportSummary: string;
  suggestedActions: string[];
  flags?: string[];
};
```

### 17.3 Multilingual continuation response shape

Suggested shape:

```ts
type ConversationTurnResponse = {
  consultationId?: string;
  sessionId: string;
  language: string;
  assistantMessage: string;
  conversationComplete: boolean;
  shouldAutoComplete: boolean;
  partialAssessment?: TriageResponse;
};
```

## 18. AI and Knowledge Architecture

### 18.1 AI capability areas

Current engine code covers:

- transcription
- symptom extraction
- detailed clinical extraction
- triage recommendation generation
- multilingual continuation
- TTS
- document processing
- FAISS retrieval

### 18.2 Model provider footprint

Current repo suggests use of:

- OpenAI
- Google Gemini
- ElevenLabs

### 18.3 Retrieval architecture

Current design uses FAISS-based local indexes for:

- CHW/CHEW/CHO guideline retrieval
- clinical knowledge retrieval

### 18.4 Unified backend AI modules

Recommended internal module separation:

- `transcription`
- `symptom_extraction`
- `clinical_extraction`
- `recommendation`
- `multilingual`
- `retrieval`
- `tts`
- `document_processing`

These remain internal modules even after backend consolidation.

## 19. Realtime and Persistence Design

### 19.1 Message lifecycle

Proposed lifecycle:

1. user sends message or audio
2. backend creates or resolves consultation
3. backend stores user message event
4. backend runs AI processing
5. backend stores system output event
6. backend emits updated state to client

### 19.2 Persistence guarantees

The backend must:

- never drop the user message if AI processing fails
- record AI processing failure in a recoverable form
- allow consultation continuity after transient model/provider failures

### 19.3 Audio persistence

Audio may be:

- stored as file path or object storage reference
- linked to consultation
- referenced in transcript generation logs

## 20. Security Requirements

The unified backend must:

- centralize auth and authorization
- enforce organization-scoped access to patients
- ensure consultation visibility follows patient/org rules
- protect documents
- sanitize and validate all AI-facing input

Recommended additions:

- signed URLs or secure document access patterns
- rate limiting on auth and AI-heavy endpoints
- audit logs for access to patient and document records

## 21. Observability Requirements

The unified system should support:

- structured request logging
- correlation IDs across realtime and HTTP flows
- AI provider timing metrics
- transcription success/failure metrics
- document processing metrics
- consultation completion metrics
- multilingual usage metrics

## 22. Deployment Requirements

### 22.1 Frontend

`apps/web` should remain independently deployable, likely on Vercel or equivalent.

### 22.2 Backend

The unified backend should be deployed as one service boundary, though internal workers or sidecar processes are acceptable if they are operationally hidden behind one platform contract.

### 22.3 Database

PostgreSQL should remain the single durable store for:

- users
- orgs
- patients
- consultations
- messages
- documents

### 22.4 Storage

Document and audio assets should move toward a durable object store abstraction rather than relying only on local filesystem paths.

## 23. Migration Plan

### Phase 1: Domain and contract unification

Deliver:

- final shared schema decisions
- stable frontend contract layer
- message and consultation lifecycle spec
- language metadata model

### Phase 2: Feature migration from `apps/lang` to `apps/web`

Deliver:

- language selector in `apps/web`
- multilingual prompt and response handling
- multilingual text/audio flows
- TTS playback support

### Phase 3: Backend unification layer

Deliver:

- one public backend contract
- internal AI orchestration boundary
- removal of frontend dependence on separate engine-flavored APIs

### Phase 4: Persistence and workflow hardening

Deliver:

- patient-linked multilingual persistence
- document-enriched clinical support
- improved realtime stability
- observability and retry handling

### Phase 5: Decommission redundant boundaries

Deliver:

- retirement or archival of `apps/lang` as a standalone product surface
- retirement of split public backend assumptions

## 24. Risks

### 24.1 Migration complexity

Merging app surfaces and backend responsibilities may create transitional duplication and regression risk.

### 24.2 AI contract instability

Without a strict normalization layer, frontend behavior can continue to drift with model or engine changes.

### 24.3 Data continuity risk

If consultation, patient, and document identity are not unified early, migration work will remain brittle.

### 24.4 Team execution risk

Trying to merge frontend and backend boundaries simultaneously without phases may slow shipping.

## 25. Success Metrics

### 25.1 Product metrics

- active organizations
- active CHWs and consultants
- consultations per week
- percentage of consultations with persisted AI output

### 25.2 Multilingual adoption metrics

- percentage of consultations using non-English flows
- completion rate by language
- audio usage by language
- TTS usage by language

### 25.3 Technical consolidation metrics

- percentage of multilingual behavior served from `apps/web`
- percentage of frontend calls served from the unified backend contract
- reduction in duplicated models/contracts
- reduction in sync failures between operational and AI state

### 25.4 Workflow quality metrics

- time from first input to visible result
- consultation continuation rate
- document-processing success rate
- realtime session success rate

## 26. Recommended Engineering Deliverables After This PRD

The next documents that should exist after this PRD are:

1. backend architecture decision record
2. unified API contract spec
3. schema migration plan
4. frontend feature migration map from `apps/lang` to `apps/web`
5. realtime consultation lifecycle spec
6. multilingual UX specification

## 27. Final Product Positioning

AidCare is a single AI-assisted healthcare platform centered on one core web application and one unified backend. It combines patient management, multilingual symptom capture, consultations, triage support, clinical support, document-enriched care workflows, and persistent care history in one integrated product.

