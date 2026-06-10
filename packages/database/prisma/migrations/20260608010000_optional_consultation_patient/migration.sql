-- Public/anonymous triage sessions have no linked patient (PRD §9.3)
ALTER TABLE "consultations" ALTER COLUMN "patientId" DROP NOT NULL;
