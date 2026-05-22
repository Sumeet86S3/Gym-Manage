import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./payments.controller.js";
import { createPaymentSchema, listPaymentsSchema, paymentIdSchema } from "./payments.validation.js";

export const paymentRoutes = Router();

paymentRoutes.use(authenticate);
paymentRoutes.get(
  "/",
  authorize("admin", "trainer", "client"),
  validate(listPaymentsSchema),
  controller.list,
);
paymentRoutes.post(
  "/",
  authorize("admin", "trainer"),
  validate(createPaymentSchema),
  controller.create,
);
paymentRoutes.patch(
  "/:id/mark-paid",
  authorize("admin", "trainer"),
  validate(paymentIdSchema),
  controller.markPaid,
);
