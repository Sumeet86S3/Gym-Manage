import { created, success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./goals.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.user, req.validated.query));
});

export const create = asyncHandler(async (req, res) => {
  created(res, await service.create(req.user, req.validated.body), "Goal created");
});

export const update = asyncHandler(async (req, res) => {
  success(res, await service.update(req.user, req.validated.params.id, req.validated.body), "Goal updated");
});

export const remove = asyncHandler(async (req, res) => {
  success(res, await service.remove(req.user, req.validated.params.id), "Goal deleted");
});
