import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./workouts.controller.js";
import { createWorkoutSchema, workoutFeedbackSchema } from "./workouts.validation.js";

export const workoutRoutes = Router();

workoutRoutes.use(authenticate);
workoutRoutes.get("/", authorize("admin", "trainer", "client"), controller.list);
workoutRoutes.post("/", authorize("trainer"), validate(createWorkoutSchema), controller.create);
workoutRoutes.get("/today", authorize("client"), controller.clientWorkout);
workoutRoutes.post(
  "/exercises/:exerciseId/feedback",
  authorize("client"),
  validate(workoutFeedbackSchema),
  controller.submitFeedback,
);
