import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./measurements.controller.js";
import {
  createMeasurementSchema,
  deleteMeasurementSchema,
  listMeasurementsSchema,
  updateMeasurementSchema,
} from "./measurements.validation.js";

export const measurementRoutes = Router();

measurementRoutes.use(authenticate, authorize("trainer", "client"));
measurementRoutes.get("/", validate(listMeasurementsSchema), controller.list);
measurementRoutes.post("/", validate(createMeasurementSchema), controller.create);
measurementRoutes.patch("/:id", validate(updateMeasurementSchema), controller.update);
measurementRoutes.delete("/:id", validate(deleteMeasurementSchema), controller.remove);
