import UserController from "@/controllers/user.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { idParamSchema } from "@/validations/id.schema";
import { createUserSchema, updateUserSchema } from "@/validations/user.schema";
import { validateRequest } from "@/utils/httpHandlers";
import express, { type Router } from "express";
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

userRouter.get("/:id", validateRequest(idParamSchema), UserController.getUser);

export default userRouter;
