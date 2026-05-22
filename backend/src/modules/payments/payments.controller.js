import { created, success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./payments.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.user, req.validated.query));
});

export const create = asyncHandler(async (req, res) => {
  created(res, await service.create(req.validated.body), "Payment created");
});

export const markPaid = asyncHandler(async (req, res) => {
  success(res, await service.markPaid(req.user, req.validated.params.id), "Payment marked paid");
});
