import express from "express";
import * as consultationController from "@/controllers/consultation.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validateRequest } from "@/utils/httpHandlers";
import { objectIdSchema } from "@/validations/objectId.schema";

const router = express.Router();



// Get all messages in a consultation
router.get(
  "/:id/messages",
  authenticate,
  validateRequest(objectIdSchema),
  consultationController.getConsultationMessages
);

export default router;
