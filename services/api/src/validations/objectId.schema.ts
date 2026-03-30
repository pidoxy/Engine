import z from "zod";
import { Types } from "mongoose";

export const objectIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine((val) => Types.ObjectId.isValid(val), "Invalid MongoDB ObjectId"),
  }),
});

export const patientIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine(
        (val) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            val
          ),
        "Invalid patient UUID"
      ),
  }),
});

export const patientConsultationSchema = z.object({
  params: z.object({
    patientId: z
      .string()
      .refine(
        (val) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            val
          ),
        "Invalid patient UUID"
      ),
    consultationId: z
      .string()
      .refine(
        (val) => Types.ObjectId.isValid(val),
        "Invalid consultation MongoDB ObjectId"
      ),
  }),
});

export type TObjectId = z.infer<typeof objectIdSchema.shape.params>;
export type TPatientId = z.infer<typeof patientIdSchema.shape.params>;
export type TPatientConsultation = z.infer<
  typeof patientConsultationSchema.shape.params
>;
