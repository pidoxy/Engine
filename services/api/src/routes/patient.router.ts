import express from "express";
import * as patientController from "@/controllers/patient.controller";
import { validateRequest } from "@/utils/httpHandlers";
import { authenticate } from "@/middleware/auth.middleware";
import { createPatientSchema } from "@/validations/patient.validation";
import { patientConsultationSchema } from "@/validations/objectId.schema";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all patients in user's organization with consultations
router.get("/organization", patientController.getOrganizationPatients);

// Get a single patient by ID
router.get("/:id", patientController.getPatientById);

// Get patient details with a specific consultation and all its messages
router.get(
  "/:patientId/consultation/:consultationId",
  validateRequest(patientConsultationSchema),
  patientController.getPatientConsultation
);

// Patient create operation
router.post(
  "/",
  validateRequest(createPatientSchema),
  patientController.createPatient
);

export default router;
