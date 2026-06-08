import z from "zod";
import { normalizeGenderInput } from "@/utils/contractTransforms";

export const createPatientSchema = z.object({
  body: z
    .object({
      firstName: z
        .string({
          required_error: "First name is required",
        })
        .min(1, "First name cannot be empty")
        .trim(),

      lastName: z
        .string({
          required_error: "Last name is required",
        })
        .min(1, "Last name cannot be empty")
        .trim(),

      phoneNumber: z.string().optional(),

      dateOfBirth: z
        .string({
          required_error: "Date of birth is required",
        })
        .refine((val) => {
          const date = new Date(val);
          return date <= new Date();
        }, "Date of birth cannot be in the future"),

      gender: z
        .string({
          required_error: "Gender is required",
        })
        .transform((value, ctx) => {
          const normalized = normalizeGenderInput(value);
          if (!normalized) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Gender is required",
            });
            return z.NEVER;
          }

          return normalized;
        }),

      organization: z.string().uuid("Invalid organization ID").optional(),
      organizationId: z.string().uuid("Invalid organization ID").optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.organization && !data.organizationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Organization ID is required",
          path: ["organization"],
        });
      }
    })
    .transform(({ organization, organizationId, ...data }) => ({
      ...data,
      organization: organization ?? organizationId!,
    })),
});

export type TCreatePatient = z.infer<typeof createPatientSchema.shape.body>;
