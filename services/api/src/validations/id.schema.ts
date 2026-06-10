import z from "zod";

const uuidSchema = z.string().uuid("Invalid UUID");

export const idParamSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const patientIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const patientConsultationSchema = z.object({
  params: z.object({
    patientId: uuidSchema,
    consultationId: uuidSchema,
  }),
});

export type TIdParam = z.infer<typeof idParamSchema.shape.params>;
export type TPatientId = z.infer<typeof patientIdSchema.shape.params>;
export type TPatientConsultation = z.infer<
  typeof patientConsultationSchema.shape.params
>;
