import { created, success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./meals.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.user, req.validated.query));
});

export const create = asyncHandler(async (req, res) => {
  created(res, await service.create(req.user, req.validated.body), "Meal logged");
});
