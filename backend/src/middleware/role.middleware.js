import { AppError } from "../utils/AppError.js";

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to access this resource", 403));
    }
    if (req.user.role === "trainer" && req.user.approvalStatus !== "Approved") {
      return next(new AppError("Trainer account is not approved yet", 403));
    }
    next();
  };
}
