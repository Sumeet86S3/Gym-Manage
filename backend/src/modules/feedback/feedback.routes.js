import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./feedback.controller.js";
import { listFeedbackSchema } from "./feedback.validation.js";

export const feedbackRoutes = Router();

feedbackRoutes.use(authenticate, authorize("admin", "trainer"));
feedbackRoutes.get("/", validate(listFeedbackSchema), controller.list);
