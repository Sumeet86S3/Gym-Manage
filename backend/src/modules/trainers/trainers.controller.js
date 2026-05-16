import { success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./trainers.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.validated?.query ?? req.query));
});

export const getById = asyncHandler(async (req, res) => {
  success(res, await service.getById(req.params.id));
});

export const updateStatus = asyncHandler(async (req, res) => {
  success(
    res,
    await service.updateStatus(req.validated.params.id, req.validated.body.status),
    "Trainer status updated",
  );
});
