import z from "zod";
import { UserRole } from "@/models/user.model";
import { Types } from "mongoose";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email address"),
    password: z.string({
      required_error: "Password is required",
    }),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string({
      required_error: "Token is required",
    }),
  }),
  body: z
    .object({
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

export const updatePasswordSchema = z.object({
  body: z
    .object({
      passwordCurrent: z.string({
        required_error: "Current password is required",
      }),
      password: z
        .string({
          required_error: "New password is required",
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

export const registerUserSchema = z.object({
  body: z
    .object({
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
      organization: z
        .string({
          required_error: "Organization ID is required",
        })
        .refine(
          (val) => Types.ObjectId.isValid(val),
          "Invalid organization ID"
        ),
      role: z.enum([UserRole.CONSULTANT, UserRole.COMMUNITY_HEALTH_WORKER], {
        required_error:
          "Role must be either 'consultant' or 'community health worker'",
      }),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Passwords do not match",
      path: ["passwordConfirm"],
    }),
});

export type TLogin = z.infer<typeof loginSchema.shape.body>;
export type TForgotPassword = z.infer<typeof forgotPasswordSchema.shape.body>;
export type TResetPassword = z.infer<typeof resetPasswordSchema.shape.body>;
export type TUpdatePassword = z.infer<typeof updatePasswordSchema.shape.body>;
export type TRegisterUser = z.infer<typeof registerUserSchema.shape.body>;
