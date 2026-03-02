import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authMiddleware } from "../../middleware/auth";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// Only Admins can access analytics
router.get("/dashboard", authMiddleware, roleGuard("ADMIN"), AnalyticsController.getDashboardStats);

export default router;
