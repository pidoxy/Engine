# AidCare — Deployment & Wiring Checklist

Use this to confirm each service is properly connected. Work through it top-to-bottom.

---

## 1. Engine (Python FastAPI) — Railway

**URL:** `https://aidcare-triage-production.up.railway.app`

- [ ] Railway env vars are set (check Railway dashboard → Variables):
  - `OPENAI_API_KEY`
  - `GEMINI_API_KEY`
  - `ELEVENLABS_API_KEY`
  - `DATABASE_URL` (PostgreSQL connection string)
  - `OPENAI_MODEL_EXTRACTION=gpt-4o-mini`
  - `OPENAI_MODEL_RECOMMEND=gpt-4o-mini`
  - `OPENAI_MODEL_MULTILINGUAL=gpt-4o`
- [ ] CORS now includes `https://theaidcare.com` ✅ *(fixed in this session)*
- [ ] Health check passes: `GET https://aidcare-triage-production.up.railway.app/health`
- [ ] Push Engine repo to GitHub so Railway picks up the CORS fix

---

## 2. Backend (TypeScript/Node.js) — Confirm deployment

**Target domain:** `api.theaidcare.com`

- [ ] Confirm where the Backend is deployed (Railway / Render / EC2 / other)
- [ ] Note the current live URL and set it as a custom domain: `api.theaidcare.com`
- [ ] Confirm env vars are set on that deployment:
  - `DATABASE` (MongoDB connection string)
  - `JWT_SECRET`
  - `CORS_ORIGIN=https://theaidcare.com,https://www.theaidcare.com,https://lang.theaidcare.com,https://triage.theaidcare.com`
  - `NODE_ENV=production`
  - `PORT=8080` (or whatever the host expects)
- [ ] Test: `GET https://api.theaidcare.com/` → should return `{ success: true, message: "Aid Care API is running" }`
- [ ] Test: `POST https://api.theaidcare.com/api/v1/auth/login` with test credentials

---

## 3. Frontend (Next.js) — Vercel

**URL:** `https://theaidcare.com`

- [ ] Set the following in Vercel → Project Settings → Environment Variables (Production):

  | Variable | Value |
  |----------|-------|
  | `NEXT_PUBLIC_API_URL` | `https://api.theaidcare.com` |
  | `NEXT_PUBLIC_WEBSOCKET_URL` | `wss://api.theaidcare.com` |
  | `NEXT_PUBLIC_API_ENGINE_URL` | `https://aidcare-triage-production.up.railway.app` |

- [ ] Trigger a Vercel redeploy after setting env vars
- [ ] Test login flow: go to `https://theaidcare.com/login`, log in, confirm it hits the Backend
- [ ] Test audio recording: record in the app, confirm the Engine transcription endpoint is called (check browser DevTools → Network tab)

---

## 4. lang.theaidcare.com — Vercel

**Vercel project:** `aidcare-lang`

- [ ] Env vars in Vercel (already set via `vercel.json` but confirm in dashboard):
  - `NEXT_PUBLIC_API_BASE_URL=https://aidcare-triage-production.up.railway.app`
  - `NEXT_PUBLIC_VOICE_EN`, `NEXT_PUBLIC_VOICE_HA`, `NEXT_PUBLIC_VOICE_YO`, `NEXT_PUBLIC_VOICE_IG`, `NEXT_PUBLIC_VOICE_PCM`
- [ ] Test: open `https://lang.theaidcare.com`, select a language, type or record, confirm you get a response

---

## 5. triage.theaidcare.com (aidcare-pwa) — Deploy if needed

- [ ] Decide: **deploy or retire?**
  - The main frontend (`theaidcare.com`) already handles triage for logged-in CHWs
  - The PWA is a simpler no-login triage tool — useful for public/unauthenticated access
  - If deploying: create a new Vercel project from `aidcare-pwa/` directory
- [ ] If deploying, set in Vercel:
  - `NEXT_PUBLIC_API_BASE_URL=https://aidcare-triage-production.up.railway.app`
- [ ] The hardcoded `localhost:8000` in `page.tsx` has been replaced with the env var ✅ *(fixed in this session)*

---

## 6. Critical: Patient ID Linkage

Right now, the TypeScript Backend (MongoDB) and the Engine (PostgreSQL) both store `Patient` records separately. There's no sync.

**The problem:** When a CHW creates a patient in the main app, and then records a consultation, the Engine creates a separate patient record with no link to the Backend's patient.

**Quick fix (recommended):** When the frontend calls the Engine to process audio/text, pass the patient's UUID (from the Backend) as a parameter. The Engine should store this as a `backend_patient_uuid` field so records can be cross-referenced.

- [ ] Agree on approach: pass UUID in Engine requests vs. full sync vs. keep separate
- [ ] Implement the chosen approach

---

## 7. After everything is connected — smoke test

Run through this end-to-end flow:

1. Go to `theaidcare.com/login` → log in with a real account
2. From `/app`, create a new patient (or select existing)
3. Click the audio recorder → record a brief symptom description
4. Confirm triage results appear (powered by the Engine)
5. Download/export a report (PDF)
6. Open `lang.theaidcare.com` → test Hausa or Yoruba triage
7. Check the Backend has the consultation record: `GET /api/v1/consultations`

---

## Files changed in this session

| File | Change |
|------|--------|
| `aidcare-backend/main.py` | Added `https://theaidcare.com` and `https://www.theaidcare.com` to CORS allowed origins |
| `aidcare-pwa/app/page.tsx` | Replaced hardcoded `localhost:8000` with `process.env.NEXT_PUBLIC_API_BASE_URL` |
| `aidcare-pwa/.env.example` | Created — documents required env var for the PWA |
| `README.md` | Replaced generic boilerplate with actual Engine repo documentation |
| `ARCHITECTURE.md` | Created — full system architecture, connection map, and known issues |
| `SETUP_CHECKLIST.md` | Created — this file |
