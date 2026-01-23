# Vercel Deployment Guide for AidCare Frontend

## Deployment Steps

### 1. Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **"Add New"** → **"Project"**
3. Select the repository: `TheAidCare/Engine`
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `aidcare-pwa`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 2. Environment Variables

Add these environment variables in Vercel:

```
NEXT_PUBLIC_API_BASE_URL=https://aidcare-triage-production.up.railway.app
NEXT_PUBLIC_AIDCARE_API_BASE_URL=https://aidcare-triage-production.up.railway.app
```

### 3. Deploy

Click **"Deploy"** and wait for the build to complete.

---

## Custom Domain Setup (triage.theaidcare.com)

### Step 1: Add Domain in Vercel

1. After deployment, go to your project settings
2. Navigate to **"Domains"** tab
3. Click **"Add"**
4. Enter: `triage.theaidcare.com`
5. Vercel will provide DNS records to configure

### Step 2: Configure DNS in Namecheap

1. Log in to Namecheap
2. Go to **Domain List** → Select `theaidcare.com`
3. Click **"Advanced DNS"**
4. Add a new record:

   **Option A: CNAME Record (Recommended)**
   - Type: `CNAME Record`
   - Host: `triage`
   - Value: `cname.vercel-dns.com.`
   - TTL: Automatic

   **Option B: A Record (Alternative)**
   - Type: `A Record`
   - Host: `triage`
   - Value: `76.76.21.21` (Vercel IP)
   - TTL: Automatic

5. Click **"Save All Changes"**

### Step 3: Verify in Vercel

1. Return to Vercel → Domains
2. Wait for DNS propagation (can take 5-60 minutes)
3. Once verified, you'll see a green checkmark
4. Your app will be live at https://triage.theaidcare.com

---

## CORS Configuration (Important!)

Your backend needs to allow requests from the frontend domain. Update your Railway backend environment variables:

```
ALLOWED_ORIGINS=https://triage.theaidcare.com,https://*.vercel.app
```

Or update the FastAPI CORS middleware in `main.py` to include:
```python
origins = [
    "https://triage.theaidcare.com",
    "https://*.vercel.app",
    "http://localhost:3000",  # for local development
]
```

---

## Deployment URLs

- **Frontend (Vercel)**: https://triage.theaidcare.com
- **Backend (Railway)**: https://aidcare-triage-production.up.railway.app
- **Vercel Auto URL**: Will be assigned (e.g., `aidcare-pwa-*.vercel.app`)

---

## Troubleshooting

### DNS Not Propagating
- Check DNS with: https://dnschecker.org
- Wait up to 48 hours (usually 5-60 minutes)
- Clear your browser cache

### Build Failures
- Check that `package.json` scripts are correct
- Verify environment variables are set
- Check build logs in Vercel dashboard

### CORS Errors
- Ensure backend CORS is configured
- Check that API URLs don't have trailing slashes mismatch
- Verify environment variables are set correctly
