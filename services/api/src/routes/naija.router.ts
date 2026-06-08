import express from "express";
import * as engineController from "@/controllers/engine.controller";

const router = express.Router();

// Multilingual triage is a public experience (PRD §9.3 public/CHW triage), so
// these proxy routes are intentionally unauthenticated — same as the donor app.
router.post("/process_text", engineController.naijaProcessText);
router.post("/continue_conversation", engineController.naijaContinueConversation);
router.post("/process_audio", engineController.naijaProcessAudio);

export default router;
