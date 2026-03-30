import crypto from "crypto";
import User from "@/models/user.model";
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
// import Email from "@/utils/email";
import { handleServiceResponse } from "@/utils/httpHandlers";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || "";
  const expiresIn = process.env.JWT_EXPIRES_IN || "90d";

  // Cast the expiresIn to any to bypass the type checking
  return jwt.sign({ id }, secret, { expiresIn } as any);
};
class AuthController {
  public login: RequestHandler = catchAsync(
    async (req: Request<{}, {}, TLogin>, res: Response, next: NextFunction) => {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (
        !user ||
        !(await user.correctPassword(
          password as string,
          user.password as string
        ))
      ) {
        return next(new AppError("Incorrect email or password", 401));
      }

      const token = signToken(user._id as string);
      const cookieExpirationInMs = Math.floor(
        Number(process.env.JWT_COOKIE_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000
      ); // Convert days to milliseconds
      const expiresIn = new Date(Date.now() + cookieExpirationInMs);

      const cookieOptions = {
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

      res.cookie("access", token, cookieOptions);
      res.cookie("logged_in", true, {
        ...cookieOptions,
        httpOnly: false,
      });

      res.status(200).json({
        message: "Logged in successfully",
        success: true,
        data: {
          user,
          token,
        },
        statusCode: StatusCodes.OK,
      });
    }
  );

  public register: RequestHandler = catchAsync(
    async (
      req: Request<{}, {}, TRegisterUser>,
      res: Response,
      next: NextFunction
    ) => {
      const serviceResponse = await userService.register(req.body);

      if (serviceResponse.success && serviceResponse.data) {
        const { user, token } = serviceResponse.data;

        // Set cookies for automatic login (same as login method)
        const cookieExpirationInMs = Math.floor(
          Number(process.env.JWT_COOKIE_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000
        ); // Convert days to milliseconds
        const expiresIn = new Date(Date.now() + cookieExpirationInMs);

        const cookieOptions = {
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

        res.cookie("access", token, cookieOptions);
        res.cookie("logged_in", true, {
          ...cookieOptions,
          httpOnly: false,
        });
      }

      return handleServiceResponse(serviceResponse, res);
    }
  );

  public logout: RequestHandler = catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
      res.clearCookie("access");
      res.clearCookie("logged_in");
      res.status(200).json({
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
      // 1) Get user based on POSTed email
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return next(
          new AppError("There is no user with that email address", 404)
        );
      }

      // 2) Generate the random reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      try {
        const resetURL = `${req.protocol}://${req.get(
          "host"
        )}/api/v1/auth/reset-password/${resetToken}`;

        // await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
          status: "success",
          message: "Token sent to email!",
          data: null,
          statusCode: StatusCodes.OK,
        });
      } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(
          new AppError(
            "There was an error sending the email. Try again later!",
            500
          )
        );
      }
    }
  );

  public resetPassword: RequestHandler = catchAsync(
    async (
      req: Request<{ token: string }, {}, TResetPassword>,
      res: Response,
      next: NextFunction
    ) => {
      // 1) Get user based on the token
      const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      // 2) If token has not expired, and there is user, set the new password
      if (!user) {
        return next(new AppError("Token is invalid or has expired", 400));
      }

      user.password = req.body.password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // 3) Update changedPasswordAt property for the user - done by pre-save middleware

      res.status(200).json({
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
      // 1) Get user from collection
      const user = await User.findById(req.user!.id).select("+password");
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      // 2) Check if POSTed current password is correct
      if (
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
      ) {
        return next(new AppError("Your current password is wrong", 401));
      }

      // 3) If so, update password
      user.password = req.body.password;
      await user.save();

      res.status(200).json({
        status: "success",
        message: "Password updated successfully!",
        data: null,
        statusCode: StatusCodes.OK,
      });
    }
  );
}

export default new AuthController();
