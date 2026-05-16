import { success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./feedback.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.user, req.validated.query));
});
