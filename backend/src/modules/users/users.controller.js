import { success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./users.service.js";

export const updateMe = asyncHandler(async (req, res) => {
  success(res, await service.updateMe(req.user, req.validated.body), "Profile updated");
});

export const changePassword = asyncHandler(async (req, res) => {
  success(res, await service.changePassword(req.user, req.validated.body), "Password updated");
});

export const listUsers = asyncHandler(async (_req, res) => {
  success(res, await service.listUsers());
});
