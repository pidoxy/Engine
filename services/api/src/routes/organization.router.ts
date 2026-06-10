import OrganizationController from "@/controllers/organization.controller";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { idParamSchema } from "@/validations/id.schema";
import { UserRole } from "@prisma/client";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  createOrganizationWithRootUserSchema,
} from "@/validations/organization.schema";
import { validateRequest } from "@/utils/httpHandlers";
import express, { type Router } from "express";
const organizationRouter: Router = express.Router();

// Create a new organization with root user
organizationRouter.post(
  "/with-root-user",
  validateRequest(createOrganizationWithRootUserSchema),
  OrganizationController.createOrganizationWithRootUser
);

// Create a new organization
organizationRouter.post(
  "/",
  authenticate,
  // authorize(UserRole.ADMIN),
  validateRequest(createOrganizationSchema),
  OrganizationController.createOrganization
);

// Get all organizations
organizationRouter.get(
  "/",
  authenticate,
  OrganizationController.getOrganizations
);

// Get organization by ID
organizationRouter.get(
  "/:id",
  authenticate,
  validateRequest(idParamSchema),
  OrganizationController.getOrganization
);

// Update organization
organizationRouter.patch(
  "/:id",
  authenticate,
  authorize(UserRole.ORGANIZATION),
  validateRequest(idParamSchema),
  validateRequest(updateOrganizationSchema),
  OrganizationController.updateOrganization
);

// Delete organization
organizationRouter.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ORGANIZATION),
  validateRequest(idParamSchema),
  OrganizationController.deleteOrganization
);

export default organizationRouter;
