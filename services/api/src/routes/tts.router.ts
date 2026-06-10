import express from "express";
import * as engineController from "@/controllers/engine.controller";

const router = express.Router();

// TTS playback for the public multilingual triage flow — unauthenticated,
// mirrors the Engine's public /tts/generate/ endpoint. Returns audio/mpeg.
router.post("/generate", engineController.ttsGenerate);

export default router;
