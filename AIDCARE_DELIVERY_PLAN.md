# AidCare Unified Delivery Plan

Version: 1.0
Date: 2026-06-08
Derives from: `AIDCARE_INTEGRATED_PRD.md` (Unified PRD v3.0)
Reconciles with: `BACKEND_CONSOLIDATION_PLAN.md`, `FRONTEND_CONSOLIDATION_PLAN.md`, `CONSOLIDATION_BACKLOG.md`, `BACKEND_CONTRACTS.md`

This is the execution plan that turns PRD v3.0's four phases into concrete, file-level work. It is sequenced so each phase leaves the product shippable.

---

## 0. Two strategic decisions this plan locks in

The PRD is directionally clear but leaves two high-cost questions open. This plan resolves both so we don't build on moving ground.

### Decision A — "One backend" = one boundary, not one process

PRD §3.2 and §11 ask to combine `services/api` and `services/engine`. PRD §11.2 also says the backend "may still be internally modular."

**We satisfy the PRD by making `services/api` the single backend boundary the frontend ever talks to**, with `services/engine` (Python/ML) sitting behind it as an internal inference module. The frontend never calls the engine directly.

- One public contract (api).
- One auth/authorization enforcement point (api).
- Engine becomes an implementation detail reached only via api server-to-server calls.

We do **not** rewrite the Python ML pipeline into TypeScript or co-host both in one runtime. That is cost without product value.

### Decision B — Multilingual lands in `apps/web`, with `apps/triage` as the staging ground

PRD §3.1/§10.4 wants multilingual native to `apps/web`. The current frontend plan keeps `apps/triage` separate, and `apps/web` is **Pages Router (`.js`)** while `apps/triage`/`apps/lang` are **App Router (`.tsx`)**.

**Plan:** consolidate the multilingual + TTS feature set into `apps/triage` first (low-risk, same router family as the donor `apps/lang`), then port it into `apps/web` as a `/triage` route group once the api contract is stable. `apps/triage` is the proving ground; `apps/web` is the final home.

---

## Phase 1 — Contract & domain unification (PRD §17 Phase 1) — ✅ COMPLETE (2026-06-08)

**Status:** Done. `services/api` typechecks clean against the unified Prisma contract; the `language` migration is written; `BACKEND_CONTRACTS.md` matches the implemented shapes. See sub-section notes below.

**Goal:** one patient/consultation/message model and one response contract before anything else changes.

**Why first:** every frontend fix is half-temporary until the api contract is stable (see `CONSOLIDATION_BACKLOG.md` "Recommended Start").

### 1.1 Finish the Prisma migration in `services/api` — ✅ done
- Deleted the dead Mongoose layer: `src/models/` (6 files) + `src/utils/verifyToken.ts` (a broken duplicate of the Prisma `verifyToken` in `auth.middleware.ts`).
- Renamed misleading legacy validation naming: `validations/objectId.schema.ts` → `validations/id.schema.ts`; `objectIdSchema`→`idParamSchema`, `TObjectId`→`TIdParam` (8 importers updated). The validation logic was already UUID-safe (`z.string().uuid()`).
- Fixed 3 pre-existing Prisma type errors surfaced by the typecheck: invalid `omit` option in `user.service.ts`, optional update body in `organization.service.ts`, unguarded `req.user.id` in `consultation.controller.ts`.
- `req.user` is `Omit<User,"passwordHash">`; user responses go through `serializeUser`. Verified: no Mongoose/`ObjectId`/`_id` remnants remain; `tsc --noEmit` is clean.

### 1.2 Lock the data model against the PRD §12 entities
Current state of `packages/database/prisma/schema.prisma` (verified):
- Present: `User, Organization, Role, Patient, Consultation, Chat, PatientDocument`.
- PRD's `Message` already exists as **`Chat`** (`sender`, `userMessage`, `createdAt`). PRD's `AIResponse` is **already embedded** as JSON on `Chat` (`triageData`, `clinicalData`) and on `Consultation` (`finalRecommendationJson`, `extractedInfoJson`). Keep it embedded — do not add a separate `AIResponse` table; just reconcile the PRD's naming (`Message` = `Chat`) in `BACKEND_CONTRACTS.md`.
- **Migration shipped — ✅ done:** added `ConsultationLanguage` enum (`EN|HA|YO|IG|PCM`), `Consultation.language` (default `EN`, PRD §12.1) and optional per-turn `Chat.language` (PRD §12). Migration: `packages/database/prisma/migrations/20260608000000_add_consultation_language/`. Defaults keep all existing create paths working unchanged; threading `language` through the triage flow is Phase 3. Schema validates and the Prisma client regenerates clean.

### 1.3 Publish one contract doc and one transform layer — ✅ done
- Updated `BACKEND_CONTRACTS.md` to the **implemented** shapes: the `User` wire shape now documents the real `serializeUser` output (legacy `role` + `roleKey` enum + `organization`/`organizationId`), and Consultation/Chat now carry `language`.
- Documented the two canonical normalization points: `services/api/src/utils/contractTransforms.ts` (backend) and `apps/web/utils/contracts.js` (frontend). No component should re-implement that mapping.

**Phase 1 exit — met:** api returns stable Prisma-shaped payloads (clean typecheck); one contract doc reflecting reality; one transform layer on each side; language metadata in the domain model.

> ⚠️ The `language` migration must be applied to the database before Phase 3 (`prisma migrate deploy`, or `prisma migrate dev` against a live dev DB). It is written but not yet run — there was no live DB in this environment.

---

## Phase 2 — Backend consolidation behind one boundary (PRD §17 Phase 2)

**Goal:** frontend talks only to `services/api`; engine is internal.

### 2.1 Make `services/api` the only frontend-facing backend
- Audit every engine route the frontend currently hits directly; replace with api endpoints that proxy to the engine server-to-server.
- Engine base URL (`ENGINE_URL`) lives only in api config, never in frontend env.

### 2.2 Fix the api→engine route wiring
Engine route inventory (`services/engine/main.py`):
- `/triage/process_text/`, `/triage/process_audio/`, `/triage/continue_conversation/`
- `/clinical_support/process_consultation/`, `/clinical_support/process_text/`, `/clinical_support/process_text/{patient_uuid}`, `/clinical_support/process_consultation/{patient_uuid}/`
- `/naija/process_text/`, `/naija/process_audio/`, `/naija/continue_conversation/`
- `/tts/generate/`, `/transcribe/audio/`, `/patients/{patient_uuid}/upload_document/`

Status in `services/api/src/service/chat.service.ts`:
- text triage → `/triage/process_text/` ✅ aligned
- clinical support → `/clinical_support/process_text/${patientId}` ✅ now exists (main.py:715)
- **TODO:** wire audio triage, naija (multilingual) routes, TTS, transcription, and document upload through api — these are not yet proxied.

### 2.3 Fix engine document-upload background task
`services/engine/main.py` `/patients/{patient_uuid}/upload_document/` schedules a background OCR task whose args don't match the task signature (Backend plan Gap #4). Fix the call so async OCR is trustworthy.

### 2.4 Resolve duplicate persistence
Decide and document ownership (PRD §11.1, §16.3):
- api + `packages/database` own shared app records (patient/consultation/message/document).
- engine keeps SQLAlchemy mirrors **only** where inference genuinely needs them; no dual writes to the same concept.
- Copilot tables (`copilot_models.py`) stay engine-owned for now.

### 2.5 Align env/docs with reality
Update `services/engine/env.example` and provider docs to reflect actual stack (OpenAI Whisper/GPT-4o(-mini), Azure Neural TTS + OpenAI fallback per recent commits, OCR). Backend plan Gap #5.

**Phase 2 exit:** frontend has exactly one backend URL (api); engine is unreachable from the browser; upload OCR works; ownership documented.

---

## Phase 3 — Multilingual into the core app (PRD §17 Phase 3)

**Goal:** language selection + multilingual triage + TTS native to the product, persisted in the same consultation model.

### 3.1 Consolidate multilingual into `apps/triage` (staging)
Port from `apps/lang` (App Router, same family):
- `apps/lang/components/LanguageSelector.tsx`, `apps/lang/lib/languages.ts` → language system (en/ha/yo/ig/pcm)
- `apps/lang/lib/tts.ts`, `apps/lang/components/NaijaConversation.tsx` → TTS playback
- `apps/lang/components/NaijaResults.tsx` → result cards (urgency/symptoms/actions/evidence)
Port from `aidcare-pwa`:
- `aidcare-pwa/src/app/components/AudioRecorder.jsx` → mic-permission + unsupported-browser fallback
Keep from `apps/triage/app/page.tsx`: disclaimer gate + action CTAs.

### 3.2 Route multilingual through api → engine `/naija/*`
All triage (English and Naija) flows hit api, which proxies to engine `/naija/*` or `/triage/*`. Results persist as `Message`/`AIResponse` rows on a `Consultation` with language metadata — no dead-end responses (PRD §10.9).

### 3.3 Port the multilingual surface into `apps/web`
Once api contract is stable: bring the language system + TTS into `apps/web` as a `/triage` route group. Bridge the Pages↔App Router gap deliberately (either an App-Router segment in `apps/web` or a shared `packages/` UI lib). This is the step that fulfills PRD §3.1 ("not a separate product surface").

**Phase 3 exit:** parity checklist from `FRONTEND_CONSOLIDATION_PLAN.md` met; multilingual available inside `apps/web`; `apps/lang` has no unique value left.

---

## Phase 4 — Full workflow hardening (PRD §17 Phase 4)

**Goal:** continuity, documents, reporting, observability; retire donors.

### 4.1 Replace mocked/disconnected outputs
- `apps/web/components/ReportGenerator/index.js` — replace mock data with real consultation/AI data.
- `apps/web/components/ChatDashboard/index.js` — confirm role-aware response handling against final contract.

### 4.2 Document-enriched clinical workflow
End-to-end: upload (`apps/web/components/DocumentUploader/index.js`) → api → engine OCR → extracted text linked to patient/consultation → reused in later clinical-support calls (PRD §10.8).

### 4.3 Live collaboration (deferred until contract stable — PRD §16.1, backlog P2)
Current realtime in `chat.service.ts` / `ChatDashboard` is single-session. Build room-based shared CHW↔doctor triage (presence, broadcasts, escalation) only after Phases 1–2 land, so it isn't built on moving IDs/roles.

### 4.4 Retire donors (only after parity confirmed)
Harvest then remove: `apps/lang`, `aidcare-pwa`, `aidcare-backend`, and duplicate root frontend folders (`pages/`, `components/`, `public/`, `styles/`, `utils/`, `lib/`, `context/`). Harvest KB-prep scripts + medical data assets from `aidcare-backend` into `services/engine` first (Backend plan Gap #6).

**Phase 4 exit:** one core app, one backend boundary, no donor apps, real (non-mock) outputs, observability in place.

---

## Sequencing summary

| Phase | Blocks | Can start | Headline deliverable |
| --- | --- | --- | --- |
| 1 Contract/domain | everything | now | Stable Prisma contract + one transform layer |
| 2 Backend boundary | 3, 4 | after 1.1 | api is the only public backend; engine internal |
| 3 Multilingual | 4.4 | after 1.3 | Multilingual + TTS inside apps/web |
| 4 Hardening | — | after 2 | Real outputs, docs workflow, donor retirement |

## Critical path
`1.1 Prisma cleanup → 1.3 contract+transforms → 2.1/2.2 api boundary+wiring → 3.x multilingual → 4.x hardening`

Live collaboration (4.3) and donor retirement (4.4) are intentionally last.

## Open questions to confirm before build
1. Decision A (one boundary vs one process) — confirm we are NOT co-hosting the Python engine in the api runtime.
2. Decision B — confirm `apps/triage` is staging and `apps/web` is the final multilingual home (vs. keeping `apps/triage` as a permanent public app).
3. Naming: confirm we keep the schema's `Chat` model and treat the PRD's `Message`/`AIResponse` as documentation aliases (recommended — already implemented), rather than renaming the table. Only firm requirement: add `language` metadata to `Consultation` in 1.2.
