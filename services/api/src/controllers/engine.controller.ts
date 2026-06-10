import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "@/utils/catchAsync";
import {
  streamMultipartToEngine,
  postJsonToEngine,
  postJsonToEngineBinary,
} from "@/lib/engine";

/**
 * Proxy endpoints that put the Engine behind the services/api boundary.
 * These are transparent multipart proxies: the Engine's JSON response is
 * returned as-is so existing frontend consumers only need to change the
 * base URL (from the Engine to the API) and add the auth header.
 */

// POST /api/v1/patients/:patientId/documents  ->  Engine /patients/{id}/upload_document/
export const uploadPatientDocument = catchAsync(
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const data = await streamMultipartToEngine(
      req,
      `/patients/${patientId}/upload_document/`
    );
    return res.status(StatusCodes.OK).json(data);
  }
);

// POST /api/v1/transcribe/audio  ->  Engine /transcribe/audio/
export const transcribeAudio = catchAsync(
  async (req: Request, res: Response) => {
    const data = await streamMultipartToEngine(req, `/transcribe/audio/`);
    return res.status(StatusCodes.OK).json(data);
  }
);

// ── Multilingual (Naija) triage proxies ──────────────────────────────────────

// POST /api/v1/naija/process_text  ->  Engine /naija/process_text/
export const naijaProcessText = catchAsync(
  async (req: Request, res: Response) => {
    const data = await postJsonToEngine("/naija/process_text/", req.body);
    return res.status(StatusCodes.OK).json(data);
  }
);

// POST /api/v1/naija/continue_conversation  ->  Engine /naija/continue_conversation/
export const naijaContinueConversation = catchAsync(
  async (req: Request, res: Response) => {
    const data = await postJsonToEngine("/naija/continue_conversation/", req.body);
    return res.status(StatusCodes.OK).json(data);
  }
);

// POST /api/v1/naija/process_audio  ->  Engine /naija/process_audio/
export const naijaProcessAudio = catchAsync(
  async (req: Request, res: Response) => {
    const data = await streamMultipartToEngine(req, `/naija/process_audio/`);
    return res.status(StatusCodes.OK).json(data);
  }
);

// POST /api/v1/tts/generate  ->  Engine /tts/generate/  (returns audio/mpeg)
export const ttsGenerate = catchAsync(async (req: Request, res: Response) => {
  const { data, contentType } = await postJsonToEngineBinary(
    "/tts/generate/",
    req.body
  );
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  return res.status(StatusCodes.OK).send(data);
});
