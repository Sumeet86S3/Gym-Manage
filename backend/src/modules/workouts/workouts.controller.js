import { created, success } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./workouts.service.js";

export const list = asyncHandler(async (req, res) => {
  success(res, await service.list(req.user));
});

export const create = asyncHandler(async (req, res) => {
  created(res, await service.create(req.user, req.validated.body), "Workout created");
});

export const clientWorkout = asyncHandler(async (req, res) => {
  success(res, await service.getClientWorkout(req.user));
});

export const submitFeedback = asyncHandler(async (req, res) => {
  created(
    res,
    await service.submitFeedback(req.user, req.validated.params.exerciseId, req.validated.body),
    "Feedback submitted",
  );
});

export const listFeedback = asyncHandler(async (req, res) => {
  success(res, await service.listFeedback(req.user, req.query.filter));
});
