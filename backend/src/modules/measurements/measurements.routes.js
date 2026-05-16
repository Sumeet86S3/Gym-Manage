import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./measurements.controller.js";
import { createMeasurementSchema, listMeasurementsSchema } from "./measurements.validation.js";

export const measurementRoutes = Router();

measurementRoutes.use(authenticate, authorize("trainer", "client"));
measurementRoutes.get("/", validate(listMeasurementsSchema), controller.list);
measurementRoutes.post("/", validate(createMeasurementSchema), controller.create);
