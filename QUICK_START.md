# AidCare Quick Start Guide

Complete guide to run the AidCare medical triage system with Valyu integration.

## System Overview

**AidCare** is an AI-powered medical triage assistant with:
- **Backend**: FastAPI + Gemini AI + FAISS + Valyu integration
- **Frontend**: Next.js + React (simple, clean UI)
- **Features**: Symptom analysis, evidence-based recommendations, real-time medical research

---

## Prerequisites

### Required
- Python 3.9+ (for backend)
- Node.js 18+ (for frontend)
- pip (Python package manager)
- npm (Node package manager)

### Optional
- Valyu API key (for enhanced medical research)
- PostgreSQL (for patient data persistence)

---

## Step 1: Backend Setup

### Install Dependencies

```bash
cd aidcare-backend
pip install -r requirements.txt
```

### Configure Environment

Edit `aidcare-backend/.env`:

```bash
# Required: Google Gemini API
GOOGLE_API_KEY="your-gemini-api-key"

# Optional: Valyu Integration (for enhanced research)
VALYU_API_KEY="your-valyu-api-key"
ENABLE_VALYU_SEARCH=true
VALYU_MAX_RESULTS=5
VALYU_CACHE_TTL=7200
VALYU_USAGE_RATE=0.2

# Database (optional)
DATABASE_URL="postgresql://user:password@localhost:5432/aidcare_db"
```

**Notes**:
- Get Gemini API key from: https://makersuite.google.com/app/apikey
- Valyu integration is optional - system works with FAISS only
- Set `ENABLE_VALYU_SEARCH=false` to disable Valyu

### Start Backend

```bash
cd aidcare-backend
uvicorn main:app --reload
```

Backend will start at: **http://localhost:8000**

### Verify Backend

Check startup logs for:
```
✓ Whisper model loaded
✓ CHW Retriever loaded. Index has XXX vectors.
✓ Clinical Retriever loaded. Index has XXX vectors.
✓ Valyu searcher initialized successfully (if enabled)
✓ CHW Hybrid Retriever (FAISS + Valyu) initialized (if enabled)
```

Test API:
```bash
curl http://localhost:8000/health
```

---

## Step 2: Frontend Setup

### Install Dependencies

```bash
cd aidcare-pwa
npm install
```

### Start Frontend

```bash
npm run dev
```

Frontend will start at: **http://localhost:3000**

### Access Application

Open browser: **http://localhost:3000**

---

## Step 3: Test Triage Flow

### Simple Test (FAISS Only)

1. Open http://localhost:3000
2. Enter: "Patient has mild fever"
3. Click "Analyze Symptoms"
4. Review results:
   - Urgency level displayed
   - Symptoms identified
   - Recommended actions
   - Knowledge sources (Local Guidelines only)

### Complex Test (FAISS + Valyu)

1. Enter: "Patient has high fever, persistent cough, difficulty breathing, and chest pain"
2. Click "Analyze Symptoms"
3. Review results:
   - Urgency level (likely "Urgent Referral")
   - 4 symptoms identified
   - Knowledge sources (Local Guidelines + Research Articles)
   - **Valyu Research Evidence section** (if enabled)
   - Evidence-based notes in recommendation

---

## Architecture Overview

### Data Flow

```
User Input (Text)
    ↓
Frontend (Next.js)
    ↓
Backend API (/triage/process_text/)
    ↓
Symptom Extraction (Gemini)
    ↓
Hybrid Knowledge Retrieval
    ├─ FAISS (Local Guidelines) ← Always
    └─ Valyu (Research, Drugs) ← Conditional
    ↓
Recommendation Generation (Gemini + Valyu Context)
    ↓
Response with Valyu Enrichment
    ↓
Frontend Display
```

### Valyu Trigger Logic

**When Valyu is Used:**
- Complex cases (3+ symptoms)
- Clinical mode (always)
- Random 20% baseline (cost optimization)

**When FAISS Only:**
- Simple cases (1-2 symptoms in CHW mode)
- Valyu disabled or unavailable
- Cost-saving fallback

---

## Common Issues & Solutions

### Issue: Backend won't start

**Error**: "GOOGLE_API_KEY not found"

**Solution**: Set `GOOGLE_API_KEY` in `aidcare-backend/.env`

---

### Issue: FAISS index empty

**Error**: "FAISS index is empty (0 vectors)"

**Solution**:
```bash
cd aidcare-backend
python scripts/prepare_chw_kb.py
python scripts/prepare_clinical_kb.py
```

---

### Issue: Frontend can't connect to backend

**Error**: "Failed to process triage"

**Solutions**:
1. Check backend is running: http://localhost:8000/health
2. Check CORS settings in `aidcare-backend/main.py`
3. Verify API_BASE_URL in `aidcare-pwa/app/page.tsx`

---

### Issue: Valyu not working

**Symptom**: No research articles in results

**Solutions**:
1. Check `VALYU_API_KEY` is set in `.env`
2. Verify `ENABLE_VALYU_SEARCH=true`
3. Test with complex symptoms (3+)
4. Check backend logs for Valyu initialization

---

## System Status Check

### Backend Health

```bash
# Check if running
curl http://localhost:8000/health

# Test triage endpoint
curl -X POST http://localhost:8000/triage/process_text/ \
  -H "Content-Type: application/json" \
  -d '{"transcript_text": "Patient has fever and cough"}'
```

### Frontend Health

Navigate to: http://localhost:3000

Expected: Clean medical interface with "Enter Patient Symptoms" form

---

## Production Deployment

### Backend (Railway/Render)

1. Set environment variables in platform
2. Use production Gemini API key
3. Configure production database
4. Update CORS origins

### Frontend (Vercel)

1. Update `API_BASE_URL` to production backend URL
2. Deploy to Vercel: `vercel --prod`
3. Configure environment variables if needed

---

## Features Overview

### Current Features ✓

- ✅ Text-based symptom input
- ✅ AI symptom extraction (Gemini)
- ✅ Local guideline retrieval (FAISS)
- ✅ Hybrid knowledge retrieval (FAISS + Valyu)
- ✅ Evidence-based recommendations
- ✅ Real-time medical research (Valyu)
- ✅ Drug information display
- ✅ Knowledge source tracking
- ✅ Urgency level classification
- ✅ Clean medical UI

### Future Enhancements

- [ ] Audio recording & transcription
- [ ] Patient data persistence
- [ ] User authentication
- [ ] Print/export reports
- [ ] Mobile app version
- [ ] Offline mode
- [ ] Multi-language support

---

## Cost Estimates

### With Valyu Enabled (20% usage):
- **Gemini API**: ~$0.05/1,000 assessments
- **Valyu API**: ~$0.10/1,000 assessments
- **Total**: ~$0.15/1,000 assessments

### With Caching (60% hit rate):
- **Actual cost**: ~$0.06/1,000 assessments

### FAISS Only (Valyu disabled):
- **Gemini API**: ~$0.05/1,000 assessments
- **Total**: ~$0.05/1,000 assessments

---

## Support

### Documentation
- Backend: See `IMPLEMENTATION_SUMMARY.md`
- Frontend: See `aidcare-pwa/README.md`

### Logs
- Backend logs: Terminal where `uvicorn main:app --reload` is running
- Frontend logs: Browser console + Terminal

### Common Commands

```bash
# Backend
cd aidcare-backend
uvicorn main:app --reload              # Start
pip install -r requirements.txt        # Install deps
python scripts/prepare_chw_kb.py       # Rebuild FAISS index

# Frontend
cd aidcare-pwa
npm run dev                            # Start
npm install                            # Install deps
npm run build                          # Production build
```

---

## Quick Reference

| Component | URL | Port |
|-----------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:8000 | 8000 |
| API Docs | http://localhost:8000/docs | 8000 |

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/triage/process_text/` | POST | Text-based triage |
| `/triage/process_audio/` | POST | Audio-based triage |
| `/health` | GET | Health check |

---

**Ready to Go!** 🚀

1. Start backend: `cd aidcare-backend && uvicorn main:app --reload`
2. Start frontend: `cd aidcare-pwa && npm run dev`
3. Open: http://localhost:3000
4. Test with: "Patient has fever, cough, and difficulty breathing"

Enjoy using AidCare! 🏥
