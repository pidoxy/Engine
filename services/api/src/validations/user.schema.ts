import { objectIdSchema } from "@/validations/objectId.schema";
import z from "zod";

export const createUserSchema = z.object({
  body: z
    .object({
      firstName: z.string({
        required_error: "First Name is required",
      }),
      lastName: z.string({
        required_error: "Last Name is required",
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
        .min(8, "Password must be at least 8 characters long"),
      passwordConfirm: z.string({
        required_error: "Password Confirm is required",
      }),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      path: ["passwordConfirm"],
      message: "Passwords do not match",
    }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
    })
    .partial(),
});

export type TCreateUser = z.infer<typeof createUserSchema.shape.body>;
export type TUpdateUser = z.infer<typeof updateUserSchema.shape.body>;
export type TUpdateUserModel = z.infer<typeof updateUserSchema>;
