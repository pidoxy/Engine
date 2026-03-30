import { prisma } from "@/lib/prisma";
import { ServiceResponse } from "@/utils/serviceResponse";
import { StatusCodes } from "http-status-codes";

export const createConsultation = async (consultantId: string, patientId: string) => {
  return prisma.consultation.create({
    data: { consultantId, patientId, mode: "CHW_TRIAGE" },
  });
};

export const getConsultationById = async (consultationId: string) => {
  return prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      patient: true,
    },
  });
};

export const getConsultationsByUserId = async (userId: string) => {
  return prisma.consultation.findMany({
    where: { consultantId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

export const getConsultationsByPatientId = async (patientId: string) => {
  return prisma.consultation.findMany({
    where: { patientId },
    orderBy: { updatedAt: "desc" },
    include: {
      consultant: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
    },
  });
};

export const addUserMessage = async (consultationId: string, message: string) => {
  return prisma.chat.create({
    data: { consultationId, sender: "USER", userMessage: message },
  });
};

export const addSystemMessage = async (consultationId: string, triageData: any) => {
  return prisma.chat.create({
    data: { consultationId, sender: "SYSTEM", triageData },
  });
};

export const addClinicalSystemMessage = async (consultationId: string, clinicalData: any) => {
  return prisma.chat.create({
    data: { consultationId, sender: "SYSTEM", clinicalData },
  });
};

export const getLatestMessages = async (consultationId: string, limit = 50) => {
  return prisma.chat.findMany({
    where: { consultationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
};

export const getPatientForConsultation = async (consultationId: string) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { patient: { select: { id: true, firstName: true, lastName: true } } },
  });
  return consultation?.patient ?? null;
};

export const getAllMessagesInConsultation = async (
  consultationId: string,
  requestingUserId: string
): Promise<ServiceResponse<any | null>> => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { patient: { select: { id: true, organizationId: true } } },
  });

  if (!consultation) return ServiceResponse.failure("Consultation not found", null, StatusCodes.NOT_FOUND);

  const hasDirectAccess = consultation.consultantId === requestingUserId;

  let hasOrganizationAccess = false;
  if (consultation.patient?.organizationId) {
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { organizationId: true },
    });
    hasOrganizationAccess =
      requestingUser?.organizationId === consultation.patient.organizationId;
  }

  if (!hasDirectAccess && !hasOrganizationAccess)
    return ServiceResponse.failure("Access denied", null, StatusCodes.FORBIDDEN);

  const messages = await prisma.chat.findMany({
    where: { consultationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, sender: true, createdAt: true, triageData: true, userMessage: true },
  });

  return ServiceResponse.success("Consultation messages retrieved successfully", {
    consultation: {
      id: consultation.id, title: consultation.title,
      consultantId: consultation.consultantId, patientId: consultation.patientId,
      createdAt: consultation.createdAt, updatedAt: consultation.updatedAt,
      isActive: consultation.isActive,
    },
    messages,
    messageCount: messages.length,
  });
};
