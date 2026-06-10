import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "@/utils/catchAsync";
import { ServiceResponse } from "@/utils/serviceResponse";
import { createPublicTriageSession } from "@/service/consultation.service";

/**
 * POST /api/v1/naija/sessions
 * Persist a completed public/anonymous triage assessment so it is not a
 * dead-end (PRD §10.9). Public and unauthenticated.
 */
export const persistPublicTriageSession = catchAsync(
  async (req: Request, res: Response) => {
    const { language, messages, result } = req.body ?? {};
    const session = await createPublicTriageSession({ language, messages, result });
    const response = ServiceResponse.success(
      "Triage session saved",
      session,
      StatusCodes.CREATED
    );
    return res.status(response.statusCode).json(response);
  }
);
