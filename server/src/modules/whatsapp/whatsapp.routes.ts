import { Router } from "express";
import { WhatsAppController } from "./whatsapp.controller";
import { authMiddleware } from "../../middleware/auth";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// Admin only route to trigger local agent
router.post(
    "/launch",
    authMiddleware,
    roleGuard("ADMIN"),
    WhatsAppController.launchCampaign
);

export default router;
