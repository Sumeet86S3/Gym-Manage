import { AppError } from "../utils/AppError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(new AppError("Request validation failed", 400, result.error.flatten()));
    }

    req.validated = result.data;
    next();
  };
}
