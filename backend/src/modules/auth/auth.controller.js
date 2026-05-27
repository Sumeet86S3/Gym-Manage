import { success, created } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { clearRefreshCookie, setRefreshCookie } from "../../utils/jwt.js";
import * as authService from "./auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body, {
    userAgent: req.get("user-agent"),
  });
  setRefreshCookie(res, result.refreshToken, result.cookieMaxAgeMs);
  success(res, { user: result.user, accessToken: result.accessToken }, "Logged in");
});

export const signupTrainer = asyncHandler(async (req, res) => {
  const result = await authService.signupTrainer(req.validated.body, {
    userAgent: req.get("user-agent"),
  });
  setRefreshCookie(res, result.refreshToken, result.cookieMaxAgeMs);
  created(
    res,
    { user: result.user, trainer: result.trainer, accessToken: result.accessToken },
    "Trainer application submitted",
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const result = await authService.refresh(refreshToken);
  setRefreshCookie(res, result.refreshToken, result.cookieMaxAgeMs);
  success(res, { user: result.user, accessToken: result.accessToken }, "Token refreshed");
});

export const logout = asyncHandler(async (req, res) => {
  await authService.revokeRefreshSession(req.cookies.refreshToken, req.user?.id);
  clearRefreshCookie(res);
  success(res, null, "Logged out");
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.revokeRefreshTokens(req.user.id);
  clearRefreshCookie(res);
  success(res, null, "Logged out");
});

export const me = asyncHandler(async (req, res) => {
  success(res, await authService.me(req.user));
});
