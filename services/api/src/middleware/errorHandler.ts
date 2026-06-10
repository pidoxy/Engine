import { logger } from "@/server";
import AppError from "@/utils/appError";
import { ServiceResponse } from "@/utils/serviceResponse";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export const unexpectedRequest: RequestHandler = (_req, res) => {
  res
    .status(StatusCodes.NOT_FOUND)
    .json(
      ServiceResponse.failure(
        "API Endpoint not found",
        null,
        StatusCodes.NOT_FOUND
      )
    );
};

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  next
) => {
  let errorMessage = "Something went wrong!";
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

  if (process.env.NODE_ENV === "development") {
    logger.error(err);
  }

  // Handle JSON syntax errors
  if (err instanceof SyntaxError && err.message.includes("JSON")) {
    errorMessage = "Invalid JSON format. Please check your request body.";
    statusCode = StatusCodes.BAD_REQUEST;
  } else if (err instanceof ZodError) {
    errorMessage = err.errors[0]?.message || "Invalid input";
    statusCode = StatusCodes.BAD_REQUEST;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    errorMessage = "Invalid request data. Please check your request body.";
    statusCode = StatusCodes.BAD_REQUEST;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const fields = Array.isArray(err.meta?.target) ? err.meta?.target.join(", ") : "field";
      errorMessage = `A record with this ${fields} already exists`;
      statusCode = StatusCodes.CONFLICT;
    } else if (err.code === "P2025") {
      errorMessage = "The requested record was not found";
      statusCode = StatusCodes.NOT_FOUND;
    }
  } else if (err.name === "JsonWebTokenError") {
    errorMessage = "Invalid token. Please log in again!";
    statusCode = StatusCodes.UNAUTHORIZED;
  } else if (err.name === "TokenExpiredError") {
    errorMessage = "Your token has expired! Please log in again.";
    statusCode = StatusCodes.UNAUTHORIZED;
  } else if (err instanceof AppError) {
    errorMessage = err.message;
    statusCode = err.statusCode;
  }

  res
    .status(statusCode)
    .json(ServiceResponse.failure(errorMessage, null, statusCode));
  next();
};

export default globalErrorHandler;
