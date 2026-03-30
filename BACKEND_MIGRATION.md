# Backend Migration Guide — MongoDB → PostgreSQL (Prisma)

This guide walks through migrating `services/api` (the TypeScript/Node backend) from Mongoose/MongoDB to Prisma/PostgreSQL, so both the API and the Python Engine share one database.

---

## Overview of changes

| Before | After |
|--------|-------|
| `mongoose` for ORM | `@prisma/client` |
| MongoDB Atlas | PostgreSQL (same DB as Engine) |
| `mongoose.Types.ObjectId` for IDs | `String` UUIDs (`uuid()`) |
| Schema defined in model files | Schema in `packages/database/prisma/schema.prisma` |
| Separate DB from Engine | Shared DB — both services use `DATABASE_URL` |

---

## Step 1 — Run the database migration

```bash
# From the monorepo root
cd packages/database
npm install
DATABASE_URL="postgresql://..." npx prisma migrate dev --name init
```

This creates all tables defined in `packages/database/prisma/schema.prisma`.

---

## Step 2 — Update `services/api/package.json`

Remove Mongoose, add Prisma:

```diff
- "mongoose": "^8.12.1",
+ "@prisma/client": "^5.22.0",
+ "@aidcare/database": "*",
+ "@aidcare/types": "*",
```

Add to `devDependencies`:
```json
"prisma": "^5.22.0"
```

---

## Step 3 — Add Prisma client singleton

Create `services/api/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@aidcare/database/generated/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Step 4 — Update `server.ts`

Remove the Mongoose connection block entirely. Prisma manages the connection automatically.

```diff
- import mongoose from "mongoose";
- mongoose.connect(process.env.DATABASE || "")
-   .then(() => console.log("Database connection successfully established"))
-   .catch((error) => { console.error("Error connecting to database:", error); process.exit(1); });
```

---

## Step 5 — Replace model files

Each Mongoose model becomes a set of Prisma queries. Below is a direct mapping.

### User model (`src/models/user.model.ts`)

Replace with queries using `prisma.user`. Key differences:

| Mongoose | Prisma |
|----------|--------|
| `User.findOne({ email })` | `prisma.user.findUnique({ where: { email } })` |
| `User.create({ ... })` | `prisma.user.create({ data: { ... } })` |
| `user.save()` | `prisma.user.update({ where: { id }, data: { ... } })` |
| `user.organization` (populated) | `prisma.user.findUnique({ include: { organization: true } })` |

**Password hashing** — keep bcrypt but do it manually before `prisma.user.create`:

```typescript
import bcrypt from "bcrypt";

// In auth controller, before creating user:
const passwordHash = await bcrypt.hash(password, 12);
const user = await prisma.user.create({
  data: { firstName, lastName, email, passwordHash, role, organizationId },
});
```

**Password verification** in auth controller:

```typescript
const isValid = await bcrypt.compare(candidatePassword, user.passwordHash);
```

### Patient model (`src/models/patient.model.ts`)

```typescript
// Create
const patient = await prisma.patient.create({
  data: { firstName, lastName, phoneNumber, dateOfBirth, gender, organizationId, createdById },
});

// Find all for an org
const patients = await prisma.patient.findMany({
  where: { organizationId, isActive: true },
  orderBy: { createdAt: "desc" },
});

// fullName virtual → compute in application layer
const fullName = `${patient.firstName} ${patient.lastName}`;
```

### Organization model (`src/models/organization.model.ts`)

```typescript
const org = await prisma.organization.create({
  data: { name, description, createdById: userId },
});
```

### Consultation model (`src/models/consultation.model.ts`)

The Consultation model is now unified with the Engine's ConsultationSession. The `messages` (Chat) relation replaces the separate Chat model virtual:

```typescript
const consultation = await prisma.consultation.create({
  data: { patientId, consultantId: userId, mode: "CHW_TRIAGE", title },
});

// Fetch with messages
const full = await prisma.consultation.findUnique({
  where: { id },
  include: { messages: { orderBy: { createdAt: "asc" } }, patient: true },
});
```

### Chat model (`src/models/chat.model.ts`)

```typescript
const chat = await prisma.chat.create({
  data: {
    consultationId,
    sender: "USER",
    userMessage: transcriptText,
    triageData: triageResultJson,
  },
});
```

### Role model (`src/models/role.model.ts`)

```typescript
const role = await prisma.role.create({
  data: { name, organizationId, permissions, description, isDefault },
});
```

---

## Step 6 — Update the chat service (Socket.io)

The `chat.service.ts` currently calls the Engine at `/triage/process_text/` and `/clinical_support/process_text/`. This stays the same — just replace the DB write from Mongoose to Prisma:

```typescript
// Old (Mongoose)
const chat = await Chat.create({ consultationId, sender: "system", triageData });

// New (Prisma)
const chat = await prisma.chat.create({
  data: { consultationId, sender: "SYSTEM", triageData },
});
```

---

## Step 7 — Update environment variables

Remove `DATABASE` (MongoDB connection string). Add:

```env
DATABASE_URL=postgresql://aidcare:aidcare_dev@localhost:5432/aidcare
```

In production, this should match the same `DATABASE_URL` used by `services/engine`.

---

## Step 8 — Update the Engine's SQLAlchemy models

The Python engine's `db_models.py` uses its own table names. After running the Prisma migration, the tables will be named based on the Prisma schema's `@@map()` directives. The Engine's SQLAlchemy models need to match.

**Required table name changes in `services/engine/aidcare_pipeline/db_models.py`:**

```python
# Patient
class Patient(Base):
    __tablename__ = "patients"          # already matches ✅

# PatientDocument
class PatientDocument(Base):
    __tablename__ = "patient_documents" # already matches ✅

# ConsultationSession → now "consultations"
class ConsultationSession(Base):
    __tablename__ = "consultations"     # CHANGE from "consultation_sessions"
```

Also add the new fields to `ConsultationSession` that are in the Prisma schema:

```python
# Add to ConsultationSession:
title = Column(String(255), nullable=True, default="New Consultation")
consultant_id = Column(String(36), nullable=True)  # FK to users.id
is_active = Column(Boolean, nullable=True, default=True)
```

And add a `patient_uuid` column to `Patient` to store the Backend-assigned UUID so records stay linked:

```python
# Patient — add these fields to align with Prisma schema:
first_name = Column(String(255), nullable=True)     # split from full_name
last_name = Column(String(255), nullable=True)
organization_id = Column(String(36), nullable=True)
created_by_id = Column(String(36), nullable=True)
```

---

## Step 9 — Test the migration

```bash
# Start postgres locally
docker compose up postgres -d

# Run migrations
cd packages/database && npm run db:migrate

# Start the API
cd services/api && npm run dev

# Start the Engine
cd services/engine && python start.py

# Run the end-to-end smoke test from SETUP_CHECKLIST.md
```

---

## Common gotchas

- **ObjectId vs UUID**: MongoDB uses 24-char hex ObjectIds; Prisma uses 36-char UUIDs. Any stored ObjectId strings won't be valid UUIDs. For fresh deployments this isn't an issue. If migrating existing data, you'll need a mapping script.
- **Populate vs include**: Mongoose's `.populate()` becomes Prisma's `include: { relation: true }`. You get the full relation object, not just the ID.
- **Pre-save hooks**: Mongoose's pre-save hooks (password hashing, validation) move to the controller layer or into a service function. There's no Prisma equivalent of model hooks.
- **Soft deletes**: The `isActive` flag is used for soft-deletes. Always add `where: { isActive: true }` to list queries unless you intentionally want to include inactive records.
