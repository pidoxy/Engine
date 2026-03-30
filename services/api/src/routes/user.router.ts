import UserController from "@/controllers/user.controller";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { objectIdSchema } from "@/validations/objectId.schema";
import { createUserSchema, updateUserSchema } from "@/validations/user.schema";
import { validateRequest } from "@/utils/httpHandlers";
import express, { type Router } from "express";
import { UserRole } from "@/models/user.model";
const userRouter: Router = express.Router();

userRouter.post(
  "/",
  validateRequest(createUserSchema),
  UserController.createUser
);

userRouter.get("/", authenticate, UserController.getUsers);

// Get users in the authenticated user's organization
userRouter.get(
  "/organization",
  authenticate,
  UserController.getOrganizationUsers
);

userRouter.get("/me", authenticate, UserController.getLoggedInUser);
userRouter.put(
  "/",
  authenticate,
  validateRequest(updateUserSchema),
  UserController.updateUser
);

userRouter.get("/:id", validateRequest(objectIdSchema), UserController.getUser);

export default userRouter;
