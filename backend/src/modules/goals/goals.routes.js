import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./goals.controller.js";
import { createGoalSchema, goalIdSchema, listGoalsSchema, updateGoalSchema } from "./goals.validation.js";

export const goalRoutes = Router();

goalRoutes.use(authenticate);
goalRoutes.get(
  "/",
  authorize("admin", "trainer", "client"),
  validate(listGoalsSchema),
  controller.list,
);
goalRoutes.post("/", authorize("trainer"), validate(createGoalSchema), controller.create);
goalRoutes.patch(
  "/:id",
  authorize("admin", "trainer", "client"),
  validate(updateGoalSchema),
  controller.update,
);
goalRoutes.delete(
  "/:id",
  authorize("admin", "trainer", "client"),
  validate(goalIdSchema),
  controller.remove,
);
