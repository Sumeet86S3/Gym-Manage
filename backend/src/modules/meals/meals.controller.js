import { created, success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./meals.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.user, req.validated.query));
});

export const missedSummary = asyncHandler(async (req, res) => {
  success(res, await service.missedSummary(req.user));
});

export const clearForClient = asyncHandler(async (req, res) => {
  success(res, await service.clearForClient(req.user, req.validated.body), "Meal history cleared");
});

export const clearMissedForClient = asyncHandler(async (req, res) => {
  success(
    res,
    await service.clearMissedForClient(req.user, req.validated.body),
    "Missed meal updates cleared",
  );
});

export const create = asyncHandler(async (req, res) => {
  created(res, await service.create(req.user, req.validated.body), "Meal logged");
});
