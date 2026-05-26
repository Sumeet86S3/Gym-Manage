export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export const forbidden = (message = "You do not have permission to access this resource") =>
  new AppError(message, 403);

export const notFound = (resource = "Resource") => new AppError(`${resource} not found`, 404);

export const unauthorized = (message = "Authentication required") => new AppError(message, 401);
