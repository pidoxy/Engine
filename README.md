# AidCare Engine

The AI/ML engine powering [theaidcare.com](https://theaidcare.com). This repo contains the Python FastAPI backend that handles all AI processing, plus the Next.js apps for the multilingual subdomain and triage PWA.

> **Full architecture docs:** see [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## What's in this repo

| Folder | What it is | Deployed at |
|--------|-----------|-------------|
| `aidcare-backend/` | Python FastAPI — AI pipeline | Railway (`aidcare-triage-production.up.railway.app`) |
| `aidcare-lang/` | Next.js — multilingual triage UI | Vercel (`lang.theaidcare.com`) |
| `aidcare-pwa/` | Next.js — standalone triage PWA | Vercel (`triage.theaidcare.com`) |
| `aidcare-copilot/` | Next.js — separate copilot project | Independent deployment |

---

## aidcare-backend (Python FastAPI)

The AI engine. Handles: audio transcription, symptom extraction, triage recommendations, RAG retrieval from clinical guidelines, multilingual conversation, and TTS output.

### Prerequisites
- Python 3.11+
- PostgreSQL database
- OpenAI API key (Whisper + GPT-4o)
- Google Gemini API key
- ElevenLabs API key

### Local setup

```bash
cd aidcare-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp env.example .env   # fill in your API keys
python start.py
```

Server runs at `http://localhost:8000`

### Key endpoints

| Method | Path | What it does |
|--------|------|-------------|
| POST | `/transcribe` | Audio → text (Whisper) |
| POST | `/process` | Text → symptoms + triage recommendation |
| POST | `/naija/process_text/` | Multilingual text triage |
| POST | `/naija/process_audio/` | Multilingual audio triage |
| POST | `/naija/continue_conversation/` | Continue multilingual session |
| POST | `/tts/generate` | Text → speech (ElevenLabs) |
| GET | `/health` | Health check + rate limit stats |

### Deployment (Railway)

Deployed via Dockerfile. Railway config in `railway.json` — start command is `python start.py`.

---

## aidcare-lang (lang.theaidcare.com)

Next.js app for multilingual triage in Hausa, Yoruba, Igbo, Pidgin, and English. Calls the Engine backend.

```bash
cd aidcare-lang
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev
```

---

## aidcare-pwa (triage.theaidcare.com)

Standalone triage PWA. Simpler interface — useful for low-bandwidth or direct CHW use without login.

```bash
cd aidcare-pwa
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev
```

---

## Related repos

- **Frontend** (theaidcare.com): [TheAidCare/frontend](https://github.com/TheAidCare/frontend)
- **Backend API** (auth, patients, orgs): [TheAidCare/Backend](https://github.com/TheAidCare/Backend)
