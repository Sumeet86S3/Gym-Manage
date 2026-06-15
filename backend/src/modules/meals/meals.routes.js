import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./meals.controller.js";
import { clearMealsSchema, createMealSchema, listMealsSchema } from "./meals.validation.js";

export const mealRoutes = Router();

mealRoutes.use(authenticate);
mealRoutes.get("/missed", authorize("admin", "trainer", "client"), controller.missedSummary);
mealRoutes.delete(
  "/clear",
  authorize("trainer"),
  validate(clearMealsSchema),
  controller.clearForClient,
);
mealRoutes.get(
  "/",
  authorize("admin", "trainer", "client"),
  validate(listMealsSchema),
  controller.list,
);
mealRoutes.post("/", authorize("client"), validate(createMealSchema), controller.create);
