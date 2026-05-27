import { created, success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./attendance.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.user, req.validated.query.date));
});

export const toggle = asyncHandler(async (req, res) => {
  created(res, await service.toggle(req.user, req.validated.body), "Attendance updated");
});

export const updateSettings = asyncHandler(async (req, res) => {
  success(
    res,
    await service.updateSettings(req.user, req.validated.body),
    "Attendance settings updated",
  );
});
