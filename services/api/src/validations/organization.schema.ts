import { objectIdSchema } from "@/validations/objectId.schema";
import { Types } from "mongoose";
import z from "zod";

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Organization name is required",
    }),
    description: z.string().optional(),
  }),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const organizationIdSchema = objectIdSchema;



export const createOrganizationWithRootUserSchema = z.object({
  body: z
    .object({
      // Organization fields
      name: z.string({
        required_error: "Organization name is required",
      }),
      description: z.string().optional(),

      // Root user fields
      firstName: z.string({
        required_error: "First name is required",
      }),
      lastName: z.string({
        required_error: "Last name is required",
      }),
      email: z
        .string({
          required_error: "Email is required",
        })
        .email("Invalid email address"),
      password: z
        .string({
          required_error: "Password is required",
        })
        .min(8, "Password must be at least 8 characters"),
      passwordConfirm: z.string({
        required_error: "Password confirmation is required",
      }),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Passwords do not match",
      path: ["passwordConfirm"],
    }),
});

export type TCreateOrganization = z.infer<
  typeof createOrganizationSchema.shape.body
>;
export type TUpdateOrganization = z.infer<
  typeof updateOrganizationSchema.shape.body
>;
export type TCreateOrganizationWithRootUser = z.infer<
  typeof createOrganizationWithRootUserSchema.shape.body
>;
