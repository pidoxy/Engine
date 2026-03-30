import { objectIdSchema } from "@/validations/objectId.schema";
import { Types } from "mongoose";
import z from "zod";

export const createPatientSchema = z.object({
  body: z.object({
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

    gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
      required_error: "Gender is required",
    }),

    organization: z
      .string({
        required_error: "Organization ID is required",
      })
      .refine((val) => Types.ObjectId.isValid(val), "Invalid organization ID"),
  }),
});

export type TCreatePatient = z.infer<typeof createPatientSchema.shape.body>;
