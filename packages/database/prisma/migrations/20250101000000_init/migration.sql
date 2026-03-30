-- ─────────────────────────────────────────────────────────
-- AidCare — Initial Database Migration
-- Generated from packages/database/prisma/schema.prisma
-- ─────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CONSULTANT', 'ORGANIZATION', 'COMMUNITY_HEALTH_WORKER');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "consultation_mode" AS ENUM ('CHW_TRIAGE', 'CLINICAL_SUPPORT');

-- CreateEnum
CREATE TYPE "chat_sender" AS ENUM ('USER', 'SYSTEM');

-- CreateTable: organizations (no FK dependencies)
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: roles (depends on organizations)
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: users (depends on organizations)
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'CONSULTANT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "passwordChangedAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: patients (depends on users, organizations)
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "gender" NOT NULL DEFAULT 'PREFER_NOT_TO_SAY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable: consultations (depends on users, patients)
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Consultation',
    "consultantId" TEXT,
    "patientId" TEXT NOT NULL,
    "mode" "consultation_mode" NOT NULL DEFAULT 'CHW_TRIAGE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "audioFilePath" TEXT,
    "transcriptText" TEXT,
    "manualContextInput" TEXT,
    "extractedInfoJson" JSONB,
    "retrievedDocsSummaryJson" JSONB,
    "finalRecommendationJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: chats (depends on consultations)
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "sender" "chat_sender" NOT NULL,
    "userMessage" TEXT,
    "triageData" JSONB,
    "clinicalData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable: patient_documents (depends on patients, consultations)
CREATE TABLE "patient_documents" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileType" TEXT,
    "extractedText" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'queued',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "patient_documents_pkey" PRIMARY KEY ("id")
);

-- ─── Indexes ─────────────────────────────────────────────

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE UNIQUE INDEX "roles_name_organizationId_key" ON "roles"("name", "organizationId");
CREATE INDEX "roles_organizationId_idx" ON "roles"("organizationId");

CREATE INDEX "patients_organizationId_idx" ON "patients"("organizationId");
CREATE INDEX "patients_firstName_lastName_idx" ON "patients"("firstName", "lastName");
CREATE INDEX "patients_phoneNumber_idx" ON "patients"("phoneNumber");
CREATE INDEX "patients_isActive_idx" ON "patients"("isActive");

CREATE INDEX "consultations_consultantId_createdAt_idx" ON "consultations"("consultantId", "createdAt" DESC);
CREATE INDEX "consultations_patientId_createdAt_idx" ON "consultations"("patientId", "createdAt" DESC);
CREATE INDEX "consultations_isActive_idx" ON "consultations"("isActive");

CREATE INDEX "chats_consultationId_createdAt_idx" ON "chats"("consultationId", "createdAt" DESC);

CREATE INDEX "patient_documents_patientId_idx" ON "patient_documents"("patientId");
CREATE INDEX "patient_documents_consultationId_idx" ON "patient_documents"("consultationId");
CREATE INDEX "patient_documents_processingStatus_idx" ON "patient_documents"("processingStatus");

-- ─── Foreign Keys ─────────────────────────────────────────

-- organizations.createdById → users.id (self-referential, added after users exists)
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- roles.organizationId → organizations.id
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- users.organizationId → organizations.id
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- patients.organizationId → organizations.id
ALTER TABLE "patients" ADD CONSTRAINT "patients_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- patients.createdById → users.id
ALTER TABLE "patients" ADD CONSTRAINT "patients_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- consultations.consultantId → users.id
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_consultantId_fkey"
    FOREIGN KEY ("consultantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- consultations.patientId → patients.id
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- chats.consultationId → consultations.id
ALTER TABLE "chats" ADD CONSTRAINT "chats_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- patient_documents.patientId → patients.id
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- patient_documents.consultationId → consultations.id
ALTER TABLE "patient_documents" ADD CONSTRAINT "patient_documents_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
