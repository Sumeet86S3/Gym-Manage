import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./notifications.controller.js";
import { notificationIdSchema } from "./notifications.validation.js";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get("/", controller.list);
notificationRoutes.patch("/:id/read", validate(notificationIdSchema), controller.markRead);
