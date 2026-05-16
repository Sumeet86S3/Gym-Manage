import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode ?? (error instanceof ZodError ? 400 : 500);
  const isOperational = error.isOperational || statusCode < 500;

  if (!isOperational) {
    logger.error({ err: error, reqId: req.id }, "Unhandled backend error");
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? error.message : "Internal server error",
    ...(error.details ? { details: error.details } : {}),
  });
}
