import express from "express";
import * as engineController from "@/controllers/engine.controller";
import { authenticate } from "@/middleware/auth.middleware";

const router = express.Router();

router.use(authenticate);

// Transcribe recorded audio — proxied through the API to the Engine (Whisper)
router.post("/audio", engineController.transcribeAudio);

export default router;
