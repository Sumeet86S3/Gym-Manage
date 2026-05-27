import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as controller from "./auth.controller.js";
import { loginSchema, trainerSignupSchema } from "./auth.validation.js";

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), controller.login);
authRoutes.post("/trainer-signup", validate(trainerSignupSchema), controller.signupTrainer);
authRoutes.post("/refresh", controller.refresh);
authRoutes.post("/logout", authenticate, controller.logout);
authRoutes.post("/logout-all", authenticate, controller.logoutAll);
authRoutes.get("/me", authenticate, controller.me);
