import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./clients.controller.js";
import {
  clientIdSchema,
  createClientSchema,
  listClientsSchema,
  updateClientSchema,
} from "./clients.validation.js";

export const clientRoutes = Router();

clientRoutes.use(authenticate);
clientRoutes.get("/", authorize("admin", "trainer"), validate(listClientsSchema), controller.list);
clientRoutes.post("/", authorize("trainer"), validate(createClientSchema), controller.create);
clientRoutes.get(
  "/:id",
  authorize("admin", "trainer"),
  validate(clientIdSchema),
  controller.getById,
);
clientRoutes.patch("/:id", authorize("trainer"), validate(updateClientSchema), controller.update);
clientRoutes.delete("/:id", authorize("trainer"), validate(clientIdSchema), controller.remove);
