import { Request, Response, NextFunction } from "express";
import { getAllMessagesInConsultation } from "@/service/consultation.service";
import catchAsync from "@/utils/catchAsync";
import { ServiceResponse } from "@/utils/serviceResponse";
import { StatusCodes } from "http-status-codes";
import AppError from "@/utils/appError";

/**
 * Get all messages in a consultation
 */
export const getConsultationMessages = catchAsync(
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { id: consultationId } = req.params;
    const requestingUserId = req.user?.id;

    const serviceResponse = await getAllMessagesInConsultation(
      consultationId,
      requestingUserId
    );
    return res.status(serviceResponse.statusCode).json(serviceResponse);
  }
);
