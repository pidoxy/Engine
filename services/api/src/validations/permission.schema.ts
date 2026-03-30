import z from "zod";
import { objectIdSchema } from "@/validations/objectId.schema";

export const createPermissionSchema = z.object({
  body: z.object({
    key: z.string({
      required_error: "Key is required",
    }),
    description: z.string().optional(),
  }),
});

export const updatePermissionSchema = z.object({
  body: z
    .object({
      key: z.string(),
      description: z.string(),
    })
    .partial()
    .optional(),
  params: objectIdSchema.shape.params,
});

export const addPermissionToFeatureSchema = z.object({
  body: z.object({
    permissionKey: z.string({
      required_error: "Permission key is required",
    }),
  }),
  params: objectIdSchema.shape.params,
});

export const removePermissionFromFeatureSchema = z.object({
  body: z.object({
    permissionKey: z.string({
      required_error: "Permission key is required",
    }),
  }),
  params: objectIdSchema.shape.params,
});

export type TCreatePermission = z.infer<
  typeof createPermissionSchema.shape.body
>;
export type TUpdatePermission = z.infer<
  typeof updatePermissionSchema.shape.body
>;
export type TAddPermissionToFeature = z.infer<
  typeof addPermissionToFeatureSchema.shape.body
>;
export type TRemovePermissionFromFeature = z.infer<
  typeof removePermissionFromFeatureSchema.shape.body
>;
