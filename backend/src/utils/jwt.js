import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      approvalStatus: user.approvalStatus,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

export function signRefreshToken(user, session) {
  return jwt.sign(
    {
      sub: user.id,
      sid: session.sessionId,
      jti: session.tokenId,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/api/v1",
    maxAge: env.REFRESH_COOKIE_MAX_AGE_MS,
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    secure: env.COOKIE_SECURE,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/api/v1",
  });
}
