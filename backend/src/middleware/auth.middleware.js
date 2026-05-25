import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { users } from "../db/schema.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new AppError("Authentication required", 401);

    const payload = verifyAccessToken(token);
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user || user.deletedAt) throw new AppError("User not found", 401);
    if (payload.tokenVersion !== user.tokenVersion) throw new AppError("Invalid token", 401);

    req.user = user;
    next();
  } catch (error) {
    next(error.name === "AppError" ? error : new AppError("Invalid or expired token", 401));
  }
}
