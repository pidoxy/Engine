# Monorepo Setup Guide

This repo is now a Turborepo monorepo. Use this guide to complete the setup after the structural reorganisation.

---

## Current structure

```
aidcare/ (TheAidCare/Engine repo)
├── apps/
│   ├── web/        ← TO BE ADDED: clone from TheAidCare/frontend
│   ├── lang/       ✅ moved from aidcare-lang/
│   └── triage/     ✅ moved from aidcare-pwa/
├── services/
│   ├── api/        ← TO BE ADDED: clone from TheAidCare/Backend
│   └── engine/     ✅ moved from aidcare-backend/
├── packages/
│   ├── database/   ✅ NEW — unified Prisma schema
│   └── types/      ✅ NEW — shared TypeScript types
├── aidcare-copilot/ (separate project, not in monorepo workspaces)
├── docker-compose.yml
├── package.json
├── turbo.json
└── .env.example
```

---

## Step 1 — Add the Frontend code

```bash
# From monorepo root
cd apps/web

# Option A: copy from local clone
cp -r /path/to/TheAidCare/frontend/. .

# Option B: pull directly from GitHub
git remote add frontend-remote https://github.com/TheAidCare/frontend.git
git fetch frontend-remote
git checkout frontend-remote/main -- .

# Remove any nested .git if present
rm -rf .git
```

Then update `apps/web/package.json` to add shared packages:
```json
{
  "dependencies": {
    "@aidcare/types": "*"
  }
}
```

---

## Step 2 — Add the Backend code

```bash
# From monorepo root
cd services/api

# Option A: copy from local clone
cp -r /path/to/TheAidCare/Backend/. .

# Option B: pull directly from GitHub
git remote add backend-remote https://github.com/TheAidCare/Backend.git
git fetch backend-remote
git checkout backend-remote/main -- .

rm -rf .git
```

Then follow `BACKEND_MIGRATION.md` to migrate from MongoDB/Mongoose to PostgreSQL/Prisma.

---

## Step 3 — Install dependencies

```bash
# From monorepo root
npm install
```

This installs deps for all workspaces (apps/* and services/api).

> Note: `services/engine` is Python — install separately:
> ```bash
> cd services/engine && pip install -r requirements.txt
> ```

---

## Step 4 — Set up the database

```bash
# Start postgres (Docker)
docker compose up postgres -d

# Generate Prisma client + run migrations
npm run db:migrate
```

---

## Step 5 — Run locally

```bash
# All services via Docker
docker compose up

# Or run services individually:
# API (TypeScript)
cd services/api && npm run dev

# Engine (Python)
cd services/engine && python start.py

# Frontend
cd apps/web && npm run dev

# Lang app
cd apps/lang && npm run dev
```

---

## Step 6 — Update deployment configs

### Railway — Engine service
In Railway dashboard:
1. Go to the Engine service settings
2. Change **Root Directory** from `aidcare-backend` to `services/engine`
3. The `railway.json` inside `services/engine/` handles the rest

### Railway — API service (new)
To deploy the TypeScript Backend on Railway:
1. Add a new service in the same Railway project
2. Set **Root Directory** to `services/api`
3. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`
4. The service needs a `Dockerfile` (add one if not present)

### Vercel — apps/lang
In Vercel project settings for `aidcare-lang`:
1. Change **Root Directory** from `aidcare-lang` to `apps/lang`
2. Trigger a redeploy

### Vercel — apps/triage
To deploy the triage PWA on `triage.theaidcare.com`:
1. Create a new Vercel project
2. Import this repo, set **Root Directory** to `apps/triage`
3. Add env var: `NEXT_PUBLIC_API_BASE_URL=https://aidcare-triage-production.up.railway.app`
4. Set custom domain: `triage.theaidcare.com`

### Vercel — apps/web
To deploy the main frontend:
1. Create a new Vercel project (or update existing one for `theaidcare.com`)
2. Set **Root Directory** to `apps/web`
3. Add env vars:
   - `NEXT_PUBLIC_API_URL=https://api.theaidcare.com`
   - `NEXT_PUBLIC_WEBSOCKET_URL=wss://api.theaidcare.com`
   - `NEXT_PUBLIC_API_ENGINE_URL=https://aidcare-triage-production.up.railway.app`

---

## Step 7 — Push to GitHub

```bash
git add -A
git commit -m "refactor: restructure into monorepo with unified PostgreSQL schema"
git push origin main
```

Railway and Vercel will auto-deploy once they detect the push (after you've updated their Root Directory settings above).

---

## Shared packages — how to use them

### In TypeScript services and apps

```typescript
// Use shared types in apps/web or services/api
import type { Patient, Consultation, TriageResult } from "@aidcare/types";

// Use Prisma client in services/api
import { prisma } from "../lib/prisma";
const patients = await prisma.patient.findMany({ where: { organizationId } });
```

### In the Python Engine

The Python engine doesn't import from `packages/` (it's Python), but it uses the same database. After running `npm run db:migrate`, the tables are created. The engine reads from and writes to those same tables via SQLAlchemy. See `BACKEND_MIGRATION.md` Step 8 for the table name alignment.
