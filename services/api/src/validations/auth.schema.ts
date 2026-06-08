import z from "zod";
import { normalizeUserRoleInput } from "@/utils/contractTransforms";

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
      organization: z.string().uuid("Invalid organization ID").optional(),
      organizationId: z.string().uuid("Invalid organization ID").optional(),
      role: z
        .string({
          required_error:
            "Role must be either 'consultant' or 'community health worker'",
        })
        .transform((value, ctx) => {
          const normalized = normalizeUserRoleInput(value);
          if (!normalized || normalized === "ORGANIZATION") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "Role must be either 'consultant' or 'community health worker'",
            });
            return z.NEVER;
          }

          return normalized;
        }),
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
    }))
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
