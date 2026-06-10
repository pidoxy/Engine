import express from "express";
import * as engineController from "@/controllers/engine.controller";
import { persistPublicTriageSession } from "@/controllers/triage.controller";

const router = express.Router();

// Multilingual triage is a public experience (PRD §9.3 public/CHW triage), so
// these proxy routes are intentionally unauthenticated — same as the donor app.
router.post("/process_text", engineController.naijaProcessText);
router.post("/continue_conversation", engineController.naijaContinueConversation);
router.post("/process_audio", engineController.naijaProcessAudio);

// Persist a completed public assessment (PRD §10.9 — no dead-end results)
router.post("/sessions", persistPublicTriageSession);

export default router;
