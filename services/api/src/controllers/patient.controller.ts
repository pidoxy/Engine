import { Request, Response, NextFunction } from "express";
import { patientService } from "@/service/patient.service";
import catchAsync from "@/utils/catchAsync";
import { handleServiceResponse } from "@/utils/httpHandlers";
import type { TCreatePatient } from "@/validations/patient.validation";

/**
 * Create a new patient
 */
export const createPatient = catchAsync(
  async (
    req: Request<{}, {}, TCreatePatient>,
    res: Response,
    _next: NextFunction
  ) => {
    const serviceResponse = await patientService.create(req.body);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * Get all patients in the authenticated user's organization with their consultations
 */
export const getOrganizationPatients = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const organizationId = req.user?.organization;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "User organization not found",
        data: null,
        statusCode: 400,
      });
    }

    const serviceResponse = await patientService.getPatientsByOrganization(
      organizationId.toString()
    );
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * Get a single patient by ID
 */
export const getPatientById = catchAsync(
  async (req: Request<{ id: string }>, res: Response, _next: NextFunction) => {
    const serviceResponse = await patientService.getPatientById(req.params.id);
    return handleServiceResponse(serviceResponse, res);
  }
);

/**
 * Get patient details with a specific consultation and all its chat messages
 */
export const getPatientConsultation = catchAsync(
  async (
    req: Request<{ patientId: string; consultationId: string }>,
    res: Response,
    _next: NextFunction
  ) => {
    const { patientId, consultationId } = req.params;
    const requestingUserId = req.user?.id;

    if (!requestingUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        data: null,
        statusCode: 401,
      });
    }

    const serviceResponse = await patientService.getPatientWithConsultation(
      patientId,
      consultationId,
      requestingUserId
    );
    return handleServiceResponse(serviceResponse, res);
  }
);
