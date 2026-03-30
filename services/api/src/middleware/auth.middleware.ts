import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import { passwordChangedAfter } from "@/lib/auth";
import AppError from "@/utils/appError";
import catchAsync from "@/utils/catchAsync";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, "passwordHash">;
    }
  }
}

const getUserFromToken = async (token: string) => {
  const decoded = (await promisify<any>(jwt.verify as any)(
    token,
    process.env.JWT_SECRET as string
  )) as jwt.JwtPayload;

  const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!currentUser) throw new AppError("The user belonging to this token no longer exists.", 401);

  if (decoded.iat && passwordChangedAfter(currentUser.passwordChangedAt, decoded.iat)) {
    throw new AppError("User recently changed password! Please log in again.", 401);
  }

  return { user: currentUser, decodedId: decoded.id };
};

export const authenticate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers.cookie) {
      const accessCookie = req.headers.cookie
        .split(";")
        .find((c) => c.trim().startsWith("access="));
      if (accessCookie) token = accessCookie.split("=")[1].trim();
    }

    if (!token) return next(new AppError("You are not logged in! Please log in to get access.", 401));

    const { user } = await getUserFromToken(token);
    const { passwordHash: _, ...safeUser } = user;
    req.user = safeUser;
    res.locals.user = safeUser;
    next();
  }
);

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};

export const verifyToken = async (token: string): Promise<string> => {
  const { user, decodedId } = await getUserFromToken(token);
  return decodedId;
};
