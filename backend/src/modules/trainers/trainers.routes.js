import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./trainers.controller.js";
import { listTrainersSchema, trainerIdSchema, trainerStatusSchema } from "./trainers.validation.js";

export const trainerRoutes = Router();

trainerRoutes.use(authenticate, authorize("admin"));
trainerRoutes.get("/", validate(listTrainersSchema), controller.list);
trainerRoutes.get("/:id", validate(trainerIdSchema), controller.getById);
trainerRoutes.patch("/:id/status", validate(trainerStatusSchema), controller.updateStatus);
trainerRoutes.delete("/:id", validate(trainerIdSchema), controller.remove);
