# 🚂 Railway Deployment Guide - Step by Step

## Step 1: Install Railway CLI

```bash
# Using npm (recommended)
npm install -g @railway/cli

# Or using Homebrew (macOS)
brew install railway

# Verify installation
railway --version
```

## Step 2: Login to Railway

```bash
railway login
```

This will open your browser. Sign up or login with:
- GitHub (recommended)
- Google
- Email

## Step 3: Navigate to Backend Directory

```bash
cd /Users/mac/Desktop/career/code/aidcare/aidcare-backend
```

## Step 4: Initialize Railway Project

```bash
# Initialize a new Railway project
railway init

# You'll be asked:
# - Project name: aidcare-backend (or whatever you prefer)
# - Start from scratch: Yes
```

## Step 5: Add Environment Variables

```bash
# Add your Google API key
railway variables set GOOGLE_API_KEY="your_actual_google_api_key_here"

# Add other environment variables
railway variables set MAX_GEMINI_REQUESTS_PER_MINUTE=50
railway variables set MAX_GEMINI_REQUESTS_PER_DAY=1000
railway variables set ENABLE_GEMINI_CACHING=true
railway variables set CACHE_TTL_SECONDS=3600

# Model configurations
railway variables set GEMINI_MODEL_EXTRACTION="gemini-3-flash-preview"
railway variables set GEMINI_MODEL_RECOMMEND="gemini-3-flash-preview"
railway variables set GEMINI_MODEL_CLINICAL_EXTRACT="gemini-3-pro-preview"
railway variables set GEMINI_MODEL_CLINICAL_SUPPORT="gemini-3-pro-preview"

# Optional: Add database URL if you have one
# railway variables set DATABASE_URL="your_database_url"
```

Or add them via Railway Dashboard:
1. Go to https://railway.app/dashboard
2. Select your project
3. Click "Variables" tab
4. Add each variable

## Step 6: Create Railway Configuration File

Create `railway.json` in your backend directory:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Or create a `Procfile`:

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Step 7: Deploy!

```bash
# Deploy to Railway
railway up

# Or link to existing project and deploy
railway link
railway up
```

You'll see:
```
✓ Build completed
✓ Deployment live
✓ https://aidcare-backend-production.up.railway.app
```

## Step 8: Verify Deployment

```bash
# Get your deployment URL
railway domain

# Test health endpoint
curl https://your-app.up.railway.app/health

# Or open in browser
railway open
```

## Step 9: View Logs

```bash
# Stream logs in real-time
railway logs

# Or view in dashboard
# https://railway.app/dashboard -> Your Project -> Deployments
```

## Step 10: Update Frontend with Backend URL

Once deployed, copy your Railway URL and update the frontend:

```bash
cd ../aidcare-pwa

# Create or update .env.local
echo "NEXT_PUBLIC_FASTAPI_URL=https://your-app.up.railway.app" > .env.local
```

---

## 🎯 Quick Reference Commands

```bash
# Login
railway login

# Initialize new project
railway init

# Link to existing project
railway link

# Deploy
railway up

# Set environment variable
railway variables set KEY=value

# View environment variables
railway variables

# View logs
railway logs

# Open dashboard
railway open

# Get domain
railway domain

# Disconnect from project
railway unlink
```

---

## 🐛 Troubleshooting

### Issue: "Command not found: railway"

**Solution:**
```bash
# Reinstall Railway CLI
npm install -g @railway/cli

# Check PATH
echo $PATH

# Try with npx
npx @railway/cli login
```

### Issue: "Build failed - requirements.txt not found"

**Solution:**
Make sure you're in the `aidcare-backend` directory:
```bash
cd aidcare-backend
ls requirements.txt  # Should exist
railway up
```

### Issue: "Port binding error"

**Solution:**
Railway automatically sets `$PORT`. Make sure your start command uses it:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Issue: "Application crashed"

**Solution:**
```bash
# View logs to see error
railway logs

# Common fixes:
# 1. Missing dependencies in requirements.txt
# 2. Missing environment variables
# 3. Import errors

# Check environment variables
railway variables
```

### Issue: "Cannot connect to database"

**Solution:**
If you don't have a database yet, comment out database-related code in `main.py`:
```python
# Temporarily comment out:
# from aidcare_pipeline import crud, db_models
# from aidcare_pipeline.database import get_db, engine
# from sqlalchemy.orm import Session
```

Or add a Railway Postgres:
```bash
railway add
# Select PostgreSQL
# Railway will auto-set DATABASE_URL
```

---

## 🎨 Alternative: Using Railway Dashboard (GUI)

If you prefer clicking instead of CLI:

### 1. Go to Railway Dashboard
https://railway.app/new

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect GitHub account
- Select your repository
- Select `aidcare-backend` as root directory

### 3. Configure Settings
- **Root Directory**: `/aidcare-backend`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Build Command**: (leave empty, Railway auto-detects)

### 4. Add Environment Variables
Go to Variables tab and add:
- `GOOGLE_API_KEY`
- `MAX_GEMINI_REQUESTS_PER_MINUTE=50`
- `MAX_GEMINI_REQUESTS_PER_DAY=1000`
- `ENABLE_GEMINI_CACHING=true`
- All model configurations

### 5. Deploy
Click "Deploy" and watch it build!

---

## 💡 Pro Tips

### Custom Domain
```bash
# Add custom domain
railway domain add yourdomain.com

# Railway will give you DNS records to add
```

### Automatic Deploys
When using GitHub:
1. Railway auto-deploys on push to main branch
2. Configure in Settings → Deploys

### Environment-Specific Variables
```bash
# Add different variables per environment
railway variables set --environment production GOOGLE_API_KEY="prod_key"
railway variables set --environment staging GOOGLE_API_KEY="staging_key"
```

### Scale Up (if needed later)
1. Go to Settings in Railway dashboard
2. Increase CPU/Memory if needed
3. Railway starts free, pay as you grow

---

## 📊 Expected Costs

Railway Pricing:
- **Free Tier**: $5 worth of credits monthly
- **Pay as you go**: ~$0.000231/GB-hour for memory
- **Estimated for this app**: $3-5/month (hobby tier)

---

## ✅ Deployment Checklist

- [ ] Railway CLI installed
- [ ] Logged into Railway
- [ ] In `aidcare-backend` directory
- [ ] `railway init` completed
- [ ] Environment variables set
- [ ] `railway up` executed
- [ ] Deployment successful (check logs)
- [ ] Health endpoint working
- [ ] Copy deployment URL
- [ ] Update frontend `.env.local` with URL
- [ ] Test triage endpoint

---

## 🚀 What's Next?

After backend is deployed:

### 1. Deploy Frontend (Vercel)
```bash
cd ../aidcare-pwa
npm install -g vercel
vercel login
vercel --prod
```

### 2. Test Production
- Open your frontend URL
- Navigate to Triage
- Test voice input
- Test text input
- Verify results display correctly

### 3. Monitor
```bash
# Check usage
curl https://your-app.up.railway.app/admin/stats

# View logs
railway logs
```

---

You're ready to deploy! Run through these steps and let me know if you hit any issues. 🚂
