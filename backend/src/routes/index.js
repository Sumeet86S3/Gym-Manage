import { Router } from "express";
import { attendanceRoutes } from "../modules/attendance/attendance.routes.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { clientRoutes } from "../modules/clients/clients.routes.js";
import { feedbackRoutes } from "../modules/feedback/feedback.routes.js";
import { goalRoutes } from "../modules/goals/goals.routes.js";
import { mealRoutes } from "../modules/meals/meals.routes.js";
import { measurementRoutes } from "../modules/measurements/measurements.routes.js";
import { notificationRoutes } from "../modules/notifications/notifications.routes.js";
import { paymentRoutes } from "../modules/payments/payments.routes.js";
import { trainerRoutes } from "../modules/trainers/trainers.routes.js";
import { userRoutes } from "../modules/users/users.routes.js";
import { workoutRoutes } from "../modules/workouts/workouts.routes.js";
import { success } from "../utils/apiResponse.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => {
  success(res, { status: "ok", service: "fitsphere-api", uptime: process.uptime() });
});

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/users", userRoutes);
apiRoutes.use("/trainers", trainerRoutes);
apiRoutes.use("/clients", clientRoutes);
apiRoutes.use("/workouts", workoutRoutes);
apiRoutes.use("/feedback", feedbackRoutes);
apiRoutes.use("/meals", mealRoutes);
apiRoutes.use("/attendance", attendanceRoutes);
apiRoutes.use("/payments", paymentRoutes);
apiRoutes.use("/goals", goalRoutes);
apiRoutes.use("/measurements", measurementRoutes);
apiRoutes.use("/notifications", notificationRoutes);
