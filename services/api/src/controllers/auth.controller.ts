import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import type {
  TForgotPassword,
  TLogin,
  TResetPassword,
  TUpdatePassword,
  TRegisterUser,
} from "@/validations/index";
import { userService } from "@/service/user.service";
import AppError from "@/utils/appError";
import catchAsync from "@/utils/catchAsync";
import { handleServiceResponse } from "@/utils/httpHandlers";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

const getCookieOptions = () => {
  const cookieExpirationInMs = Math.floor(
    Number(process.env.JWT_COOKIE_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000
  );
  const expiresIn = new Date(Date.now() + cookieExpirationInMs);

  return {
    expires: expiresIn,
    maxAge: cookieExpirationInMs,
    httpOnly: true,
    path: "/",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : ("lax" as "none" | "lax"),
    secure: process.env.NODE_ENV === "production",
    domain: process.env.COOKIE_DOMAIN,
  };
};

const setAuthCookies = (res: Response, token: string) => {
  const cookieOptions = getCookieOptions();

  res.cookie("access", token, cookieOptions);
  res.cookie("logged_in", true, {
    ...cookieOptions,
    httpOnly: false,
  });
};

class AuthController {
  public login: RequestHandler = catchAsync(
    async (req: Request<{}, {}, TLogin>, res: Response, _next: NextFunction) => {
      const serviceResponse = await userService.login(req.body);

      if (serviceResponse.success && serviceResponse.data) {
        setAuthCookies(res, serviceResponse.data.token);
      }

      return handleServiceResponse(serviceResponse, res);
    }
  );

  public register: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TRegisterUser>,
      res: Response,
      _next: NextFunction
    ) => {
      const serviceResponse = await userService.register(req.body);

      if (serviceResponse.success && serviceResponse.data) {
        setAuthCookies(res, serviceResponse.data.token);
      }

      return handleServiceResponse(serviceResponse, res);
    }
  );

  public logout: RequestHandler = catchAsync(
    async (_req: Request, res: Response, _next: NextFunction) => {
      const cookieOptions = getCookieOptions();

      res.clearCookie("access", { ...cookieOptions, maxAge: undefined, expires: undefined });
      res.clearCookie("logged_in", {
        ...cookieOptions,
        httpOnly: false,
        maxAge: undefined,
        expires: undefined,
      });

      res.status(StatusCodes.OK).json({
        message: "Logged out successfully",
        statusCode: StatusCodes.OK,
        data: null,
        success: true,
      });
    }
  );

  public forgotPassword: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TForgotPassword>,
      res: Response,
      next: NextFunction
    ) => {
      const user = await prisma.user.findUnique({
        where: { email: req.body.email },
      });

      if (!user) {
        return next(
          new AppError("There is no user with that email address", StatusCodes.NOT_FOUND)
        );
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/auth/reset-password/${resetToken}`;

      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Token generated successfully",
        data: {
          resetUrl: resetURL,
        },
        statusCode: StatusCodes.OK,
      });
    }
  );

  public resetPassword: RequestHandler = catchAsync(
    async (
      req: Request<{ token: string }, {}, TResetPassword>,
      res: Response,
      next: NextFunction
    ) => {
      const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: { gt: new Date() },
        },
      });

      if (!user) {
        return next(new AppError("Token is invalid or has expired", StatusCodes.BAD_REQUEST));
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(req.body.password),
          passwordResetToken: null,
          passwordResetExpires: null,
          passwordChangedAt: new Date(),
        },
      });

      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Password reset successfully!",
        data: null,
        statusCode: StatusCodes.OK,
      });
    }
  );

  public updatePassword: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TUpdatePassword>,
      res: Response,
      next: NextFunction
    ) => {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return next(new AppError("Authentication required", StatusCodes.UNAUTHORIZED));
      }

      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
      });

      if (!user) {
        return next(new AppError("User not found", StatusCodes.NOT_FOUND));
      }

      const isPasswordValid = await verifyPassword(
        req.body.passwordCurrent,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return next(new AppError("Your current password is wrong", StatusCodes.UNAUTHORIZED));
      }

      await prisma.user.update({
        where: { id: currentUserId },
        data: {
          passwordHash: await hashPassword(req.body.password),
          passwordChangedAt: new Date(),
        },
      });

      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Password updated successfully!",
        data: null,
        statusCode: StatusCodes.OK,
      });
    }
  );
}

export default new AuthController();
