import { success, created } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { clearRefreshCookie, setRefreshCookie } from "../../utils/jwt.js";
import * as authService from "./auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body);
  setRefreshCookie(res, result.refreshToken);
  success(res, { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }, "Logged in");
});

export const signupTrainer = asyncHandler(async (req, res) => {
  const result = await authService.signupTrainer(req.validated.body);
  setRefreshCookie(res, result.refreshToken);
  created(
    res,
    { user: result.user, trainer: result.trainer, accessToken: result.accessToken, refreshToken: result.refreshToken },
    "Trainer application submitted",
  );
});

export const refresh = asyncHandler(async (req, res) => {
  // Try to get refresh token from cookie first (same-domain), then from body (cross-domain)
  const refreshToken = req.cookies.refreshToken || req.body?.refreshToken;
  const result = await authService.refresh(refreshToken);
  setRefreshCookie(res, result.refreshToken);
  success(res, { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }, "Token refreshed");
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) await authService.revokeRefreshTokens(req.user.id);
  clearRefreshCookie(res);
  success(res, null, "Logged out");
});

export const me = asyncHandler(async (req, res) => {
  success(res, await authService.me(req.user));
});
