import { prisma } from "@/lib/prisma";
import { ServiceResponse } from "@/utils/serviceResponse";
import { StatusCodes } from "http-status-codes";
import AppError from "@/utils/appError";
import axios from "axios";

const ENGINE_URL = process.env.ENGINE_URL || "https://aidcare-triage-production.up.railway.app";

export class PatientService {
  async create(patientData: any): Promise<ServiceResponse<any | null>> {
    const organization = await prisma.organization.findUnique({
      where: { id: patientData.organization },
    });
    if (!organization) throw new AppError("Organization not found", StatusCodes.NOT_FOUND);

    const patient = await prisma.patient.create({
      data: {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phoneNumber: patientData.phoneNumber,
        dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : undefined,
        gender: patientData.gender,
        organizationId: patientData.organization,
        createdById: patientData.createdBy,
      },
    });

    // Sync to Engine — non-blocking, log on failure
    axios
      .post(`${ENGINE_URL}/patients/`, {
        patient_uuid: patient.id,
        full_name: `${patient.firstName} ${patient.lastName}`,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
      })
      .catch((err) => console.error("[Engine sync] Failed to create patient:", err.message));

    return ServiceResponse.success("Patient created successfully", patient, StatusCodes.CREATED);
  }

  async getPatientsByOrganization(organizationId: string): Promise<ServiceResponse<any[] | null>> {
    const patients = await prisma.patient.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true, firstName: true, lastName: true, phoneNumber: true,
        dateOfBirth: true, gender: true,
        consultations: {
          where: { isActive: true },
          select: { id: true, title: true, createdAt: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return ServiceResponse.success("Patients retrieved successfully", patients, StatusCodes.OK);
  }

  async getPatientById(patientId: string): Promise<ServiceResponse<any | null>> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        consultations: {
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
          include: {
            messages: {
              select: { id: true, sender: true, createdAt: true, triageData: true, userMessage: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!patient) return ServiceResponse.failure("Patient not found", null, StatusCodes.NOT_FOUND);
    return ServiceResponse.success("Patient retrieved successfully", patient, StatusCodes.OK);
  }

  async getPatientWithConsultation(
    patientId: string,
    consultationId: string,
    requestingUserId: string
  ): Promise<ServiceResponse<any | null>> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true, firstName: true, lastName: true, phoneNumber: true,
        dateOfBirth: true, gender: true, organizationId: true, isActive: true,
      },
    });
    if (!patient) return ServiceResponse.failure("Patient not found", null, StatusCodes.NOT_FOUND);

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        messages: {
          select: { id: true, sender: true, createdAt: true, triageData: true, clinicalData: true, userMessage: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!consultation) return ServiceResponse.failure("Consultation not found", null, StatusCodes.NOT_FOUND);
    if (consultation.patientId !== patientId)
      return ServiceResponse.failure("Consultation does not belong to this patient", null, StatusCodes.BAD_REQUEST);

    const age = patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return ServiceResponse.success("Patient and consultation retrieved successfully", {
      patient: { ...patient, fullName: `${patient.firstName} ${patient.lastName}`, age },
      consultation: { ...consultation, messageCount: consultation.messages.length },
    }, StatusCodes.OK);
  }
}

export const patientService = new PatientService();
