import { success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./notifications.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.user));
});

export const markRead = asyncHandler(async (req, res) => {
  success(res, await service.markRead(req.user, req.params.id), "Notification read");
});
