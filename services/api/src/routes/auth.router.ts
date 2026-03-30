import AuthController from "@/controllers/auth.controller";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { UserRole } from "@/models/user.model";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  registerUserSchema,
} from "@/validations/index";
import { validateRequest } from "@/utils/httpHandlers";
import express, { type Router } from "express";

export const authRouter: Router = express.Router();

authRouter.post("/login", validateRequest(loginSchema), AuthController.login);
authRouter.post(
  "/register",
  validateRequest(registerUserSchema),
  AuthController.register
);
authRouter.post("/logout", AuthController.logout);

// Password management routes
authRouter.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword
);

authRouter.post(
  "/reset-password/:token",
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword
);

authRouter.patch(
  "/update-password",
  authenticate,
  validateRequest(updatePasswordSchema),
  AuthController.updatePassword
);

export default authRouter;
