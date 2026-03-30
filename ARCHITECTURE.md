# AidCare — Architecture & Setup Guide

> Last updated: March 2026
> Status: Live (Backend + Engine deployed), cleanup in progress

---

## Overview

AidCare is a three-layer system. Each layer lives in its own GitHub repository and has its own deployment. They talk to each other via environment variables.

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER (Browser/Mobile)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │     theaidcare.com          │  ← Frontend repo (Vercel)
          │  Next.js · JavaScript       │    TheAidCare/frontend
          │                             │
          │  /login  /onboard  /app     │
          │  /app/patient               │
          └────────┬──────────┬─────────┘
                   │          │
          NEXT_PUBLIC_API_URL  NEXT_PUBLIC_API_ENGINE_URL
          NEXT_PUBLIC_WEBSOCKET_URL
                   │          │
    ┌──────────────▼──┐    ┌──▼──────────────────────────────────┐
    │   Backend API   │    │        Engine (AI Pipeline)          │
    │  TypeScript/    │    │  Python FastAPI · Railway            │
    │  Node.js/       │    │  aidcare-triage-production           │
    │  Express        │    │    .up.railway.app                   │
    │  MongoDB        │    │  PostgreSQL (SQLAlchemy)             │
    │  Socket.io      │    │                                      │
    │  MQTT           │    │  /transcribe  /process               │
    │                 │    │  /recommend   /multilingual          │
    │  /api/v1/auth   │    │  /tts         /rag                  │
    │  /api/v1/user   │    │  /copilot/*   /admin/*              │
    │  /api/v1/org    │    └──────────────┬──────────────────────┘
    │  /api/v1/       │                   │
    │    patients     │         also serves:
    │  /api/v1/       │
    │    consultations│    ┌──────────────▼──────────────┐
    └─────────────────┘    │   lang.theaidcare.com        │
                           │  Next.js · Vercel            │
                           │  aidcare-lang (Engine repo)  │
                           │  Multilingual triage UI      │
                           │  → aidcare-triage-           │
                           │    production.up.railway.app │
                           └─────────────────────────────┘
```

---

## Repos at a Glance

| Repo | Language | Deployment | Domain / URL |
|------|----------|------------|--------------|
| `TheAidCare/frontend` | Next.js / JS | Vercel | `theaidcare.com` |
| `TheAidCare/Backend` | TypeScript / Node.js | TBD | `api.theaidcare.com` (target) |
| `TheAidCare/Engine` | Python + Next.js | Railway + Vercel | `aidcare-triage-production.up.railway.app` + `lang.theaidcare.com` |

---

## Layer 1 — Frontend (`TheAidCare/frontend`)

**Stack:** Next.js (Pages Router), React 19, Tailwind CSS, Socket.io client, jsPDF
**Deployment:** Vercel
**Domain:** `theaidcare.com`

### Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing / homepage |
| `/login` | Email + password auth |
| `/onboard` | New user onboarding |
| `/app` | Main dashboard (ChatDashboard) |
| `/app/patient/[id]` | Per-patient view |

### Key Components
- `ChatDashboard` — main interface with audio + text input
- `AudioRecorder` — microphone capture, sends to Engine
- `PatientHeader`, `Sidebar` — navigation/layout
- `DocumentUploader` — upload patient docs to Engine
- `ReportGenerator` — jsPDF export
- `Analytics` — Google Analytics (gtag)

### Environment Variables Required
```env
NEXT_PUBLIC_API_URL=           # TypeScript Backend base URL (e.g. https://api.theaidcare.com)
NEXT_PUBLIC_WEBSOCKET_URL=     # WebSocket URL for real-time chat (same server)
NEXT_PUBLIC_API_ENGINE_URL=    # Python Engine URL (https://aidcare-triage-production.up.railway.app)
```

---

## Layer 2 — Backend (`TheAidCare/Backend`)

**Stack:** TypeScript, Node.js, Express, MongoDB (Mongoose), Socket.io, JWT auth, MQTT, Zod
**Deployment:** (confirm deployment target — Railway / Render / EC2)
**Domain target:** `api.theaidcare.com`

### Routes
| Path | Purpose |
|------|---------|
| `POST /api/v1/auth/login` | Login, returns JWT |
| `POST /api/v1/auth/register` | Register new user |
| `GET/POST /api/v1/user` | User profile management |
| `GET/POST /api/v1/organization` | Organization/facility management |
| `GET/POST /api/v1/patients` | Patient records (CRUD) |
| `GET/POST /api/v1/consultations` | Consultation records |

### Data Models (MongoDB)
- `User` — accounts, roles, credentials
- `Patient` — patient records linked to organization
- `Organization` — facility/clinic record
- `Consultation` — consultation metadata
- `Chat` — real-time chat history
- `Role` — RBAC roles

### Environment Variables Required
```env
DATABASE=               # MongoDB connection string
JWT_SECRET=             # JWT signing secret
CORS_ORIGIN=            # Comma-separated allowed origins (https://theaidcare.com,https://lang.theaidcare.com)
PORT=                   # Server port (default 8080)
NODE_ENV=               # production
```

---

## Layer 3 — Engine (`TheAidCare/Engine`)

**Stack:** Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL, OpenAI (Whisper + GPT-4o), Google Gemini, ElevenLabs TTS, FAISS vector search
**Deployment:** Railway (`aidcare-triage-production.up.railway.app`)
**Build:** Dockerfile + `start.py`

### AI Pipeline Modules
| Module | What it does |
|--------|-------------|
| `transcription.py` | Audio → text via OpenAI Whisper API |
| `symptom_extraction.py` | Text → structured symptoms via GPT-4o-mini |
| `clinical_info_extraction.py` | Deep clinical data extraction via Gemini |
| `recommendation.py` | Triage recommendation from symptoms + RAG context |
| `rag_retrieval.py` | FAISS vector search on standing orders / guidelines |
| `multilingual.py` | Hausa / Yoruba / Igbo / Pidgin conversation via GPT-4o |
| `tts_service.py` | Text → speech via ElevenLabs (per-language voices) |
| `document_processing.py` | Patient document ingestion + text extraction |
| `copilot_router.py` | Copilot feature (separate project — leave for now) |
| `admin_router.py` | Admin endpoints |

### Data Models (PostgreSQL)
- `Patient` — patient records in the AI pipeline context
- `PatientDocument` — uploaded docs with extracted text
- `ConsultationSession` — AI session with transcript + results

### Subproject: `aidcare-lang` (lang.theaidcare.com)
- Next.js frontend for multilingual triage
- Deployed separately on Vercel (project: `aidcare-lang`)
- Points to Engine Railway URL via `NEXT_PUBLIC_API_BASE_URL`

### Subproject: `aidcare-pwa` (INCOMPLETE — see issues below)
- Early-stage PWA triage UI
- **Not deployed** — API base URL still hardcoded to `http://localhost:8000`
- Superseded by the main frontend's triage flow

---

## ⚠️ Known Issues to Fix

### Critical

1. **`aidcare-pwa` hardcodes localhost**
   `app/page.tsx` has `const API_BASE_URL = 'http://localhost:8000'`
   → Either wire it to an env var and deploy as `triage.theaidcare.com`, or retire it since the main frontend already handles triage.

2. **Duplicate patient records**
   Both the TypeScript Backend (MongoDB) and Python Engine (PostgreSQL) have their own `Patient` models. There is no sync mechanism. CHW-created patients in the main app are not linked to Engine consultation sessions.
   → Agree on a single source of truth or implement a patient UUID handoff from Backend → Engine.

3. **Frontend env vars may not be set in Vercel**
   The frontend `.env.example` shows all three variables as placeholders. Confirm they are set correctly in Vercel's project settings for the production deployment.

### Important

4. **Backend deployment URL unknown**
   `NEXT_PUBLIC_API_URL` in the frontend must point to wherever the TypeScript Backend is deployed. This needs to be confirmed and set.

5. **Engine CORS not configured for all origins**
   The Python FastAPI engine's CORS settings need to allow `https://theaidcare.com` and `https://lang.theaidcare.com`.

6. **Engine README is stale**
   The root `README.md` in the Engine repo still says "Speech to Text Application" — generic boilerplate from project start. Needs a proper update.

7. **`aidcare-pwa` and `aidcare-copilot` are in the Engine repo but shouldn't be**
   These are independent projects. They bloat the Engine repo and confuse the codebase structure. They should either get their own repos or be clearly separated.

---

## Environment Variables — Master Reference

### Frontend (Vercel project: `theaidcare.com`)
```env
NEXT_PUBLIC_API_URL=https://api.theaidcare.com          # TypeScript Backend
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.theaidcare.com      # WebSocket (same server)
NEXT_PUBLIC_API_ENGINE_URL=https://aidcare-triage-production.up.railway.app
```

### Backend (wherever it's deployed)
```env
DATABASE=mongodb+srv://...
JWT_SECRET=...
CORS_ORIGIN=https://theaidcare.com,https://lang.theaidcare.com,https://triage.theaidcare.com
PORT=8080
NODE_ENV=production
```

### Engine (Railway)
```env
OPENAI_API_KEY=...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
DATABASE_URL=postgresql://...
OPENAI_MODEL_EXTRACTION=gpt-4o-mini
OPENAI_MODEL_RECOMMEND=gpt-4o-mini
OPENAI_MODEL_MULTILINGUAL=gpt-4o
GEMINI_MODEL_CLINICAL_EXTRACT=gemini-3-pro-preview
GEMINI_MODEL_CLINICAL_SUPPORT=gemini-3-pro-preview
```

### lang.theaidcare.com (Vercel project: `aidcare-lang`)
```env
NEXT_PUBLIC_API_BASE_URL=https://aidcare-triage-production.up.railway.app
NEXT_PUBLIC_VOICE_EN=...
NEXT_PUBLIC_VOICE_HA=...
NEXT_PUBLIC_VOICE_YO=...
NEXT_PUBLIC_VOICE_IG=...
NEXT_PUBLIC_VOICE_PCM=...
```

---

## Request Flow Examples

### CHW Records Audio Consultation
```
CHW opens theaidcare.com/app
  → Selects patient (GET /api/v1/patients → TypeScript Backend)
  → Records audio in AudioRecorder component
  → POST audio blob to Engine /transcribe
  → Engine runs Whisper → returns transcript
  → POST transcript to Engine /process (symptom extraction + RAG + recommendation)
  → Engine returns triage result (urgency level, actions, guidelines)
  → Frontend displays result + allows PDF export via ReportGenerator
  → POST consultation record to TypeScript Backend /api/v1/consultations
```

### Multilingual Triage (lang.theaidcare.com)
```
CHW opens lang.theaidcare.com
  → Selects language (Hausa / Yoruba / Igbo / Pidgin / English)
  → Records voice or types
  → POST to Engine /multilingual or /naija-conversation
  → Engine runs GPT-4o multilingual pipeline
  → Engine calls ElevenLabs TTS with language-specific voice
  → Response returned as audio + text
```

---

## Recommended Next Steps (Priority Order)

1. **Confirm and set frontend Vercel env vars** — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WEBSOCKET_URL`, `NEXT_PUBLIC_API_ENGINE_URL`
2. **Decide on `aidcare-pwa`** — retire it (the main frontend covers triage) or deploy it as `triage.theaidcare.com` with proper env var
3. **Fix patient ID handoff** — when the frontend creates a patient via the TypeScript Backend, pass the same UUID to Engine sessions so records link up
4. **Update Engine CORS** — ensure `https://theaidcare.com` is in the allowed origins list
5. **Update Engine `README.md`** — replace the boilerplate with the real architecture description
6. **Move `aidcare-copilot` out of the Engine repo** — it's a separate project, should not be in the Engine monorepo
