import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./attendance.controller.js";
import {
  listAttendanceSchema,
  markAttendanceSchema,
  updateAttendanceSettingsSchema,
} from "./attendance.validation.js";

export const attendanceRoutes = Router();

attendanceRoutes.use(authenticate, authorize("trainer", "client"));
attendanceRoutes.get("/", validate(listAttendanceSchema), controller.list);
attendanceRoutes.post("/", validate(markAttendanceSchema), controller.toggle);
attendanceRoutes.patch(
  "/settings",
  authorize("trainer"),
  validate(updateAttendanceSettingsSchema),
  controller.updateSettings,
);
