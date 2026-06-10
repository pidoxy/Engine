import { prisma } from "@/lib/prisma";
import { ServiceResponse } from "@/utils/serviceResponse";
import { StatusCodes } from "http-status-codes";

import type { ConsultationLanguage } from "@prisma/client";

export const createConsultation = async (consultantId: string, patientId: string) => {
  return prisma.consultation.create({
    data: { consultantId, patientId, mode: "CHW_TRIAGE" },
  });
};

const LANGUAGE_CODES: ConsultationLanguage[] = ["EN", "HA", "YO", "IG", "PCM"];

const toLanguageEnum = (value: unknown): ConsultationLanguage => {
  const upper = String(value ?? "").toUpperCase();
  return (LANGUAGE_CODES as string[]).includes(upper)
    ? (upper as ConsultationLanguage)
    : "EN";
};

export interface PublicTriageTurn {
  sender: "USER" | "SYSTEM";
  text?: string;
}

/**
 * Persist a completed public/anonymous multilingual triage session so it is not
 * a dead-end (PRD §10.9). No patient/consultant is attached. The full
 * conversation is stored as Chat rows and the final result on the consultation.
 */
export const createPublicTriageSession = async (input: {
  language: unknown;
  messages?: PublicTriageTurn[];
  result?: unknown;
}) => {
  const language = toLanguageEnum(input.language);
  const turns = (input.messages ?? [])
    .filter((m) => m && (m.sender === "USER" || m.sender === "SYSTEM"))
    .map((m) => ({
      sender: m.sender,
      language,
      userMessage: m.sender === "USER" ? m.text ?? null : null,
      triageData: m.sender === "SYSTEM" ? (m.text ? { text: m.text } : undefined) : undefined,
    }));

  return prisma.consultation.create({
    data: {
      patientId: null,
      consultantId: null,
      mode: "CHW_TRIAGE",
      language,
      title: "Public triage assessment",
      finalRecommendationJson: (input.result ?? undefined) as never,
      messages: turns.length
        ? {
            create: [
              ...turns,
              { sender: "SYSTEM", language, triageData: (input.result ?? undefined) as never },
            ],
          }
        : {
            create: [{ sender: "SYSTEM", language, triageData: (input.result ?? undefined) as never }],
          },
    },
    select: { id: true, createdAt: true },
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
