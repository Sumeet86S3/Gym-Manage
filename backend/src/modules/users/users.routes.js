import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./users.controller.js";
import { changePasswordSchema, updateMeSchema } from "./users.validation.js";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.patch("/me", validate(updateMeSchema), controller.updateMe);
userRoutes.patch("/me/password", validate(changePasswordSchema), controller.changePassword);
userRoutes.get("/", authorize("admin"), controller.listUsers);
