import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "@/utils/catchAsync";
import { streamMultipartToEngine } from "@/lib/engine";

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
