import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./trainers.controller.js";
import { listTrainersSchema, trainerStatusSchema } from "./trainers.validation.js";

export const trainerRoutes = Router();

trainerRoutes.use(authenticate, authorize("admin"));
trainerRoutes.get("/", validate(listTrainersSchema), controller.list);
trainerRoutes.get("/:id", controller.getById);
trainerRoutes.patch("/:id/status", validate(trainerStatusSchema), controller.updateStatus);
