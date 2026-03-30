import { logger } from "@/server";
import AppError from "@/utils/appError";
import { ServiceResponse } from "@/utils/serviceResponse";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { Error as MongooseError } from "mongoose";
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
  } else if (err instanceof MongooseError.CastError) {
    errorMessage = `Invalid ObjectId. Please check your request body`;
    statusCode = StatusCodes.BAD_REQUEST;
  } else if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((el) => el.message);
    errorMessage = `Invalid input data. ${errors.join(". ")}`;
    statusCode = StatusCodes.BAD_REQUEST;
  } else if (err.code === 11000) {
    // Extract the collection name from the error message
    const collectionRegex = /collection:\s*[^.]+\.(\w+)/;
    const collectionMatch = err.message.match(collectionRegex);
    const collection = collectionMatch
      ? collectionMatch[1].toLowerCase()
      : "record";

    // Get the singular form of the collection name (remove trailing 's' if present)
    const entityName = collection.endsWith("s")
      ? collection.slice(0, -1)
      : collection;

    // Get the field name and value from keyValue
    const fieldName = Object.keys(err.keyValue)[0];
    const fieldValue = err.keyValue[fieldName];

    errorMessage = `A ${entityName} with this ${fieldName} (${fieldValue}) already exists`;
    statusCode = StatusCodes.CONFLICT;
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
