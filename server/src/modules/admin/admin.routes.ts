import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authMiddleware } from "../../middleware/auth";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// Only Admins can trigger sync
router.post("/sync-sheets", authMiddleware, roleGuard("ADMIN"), AdminController.forceSyncGoogleSheets);

export default router;
