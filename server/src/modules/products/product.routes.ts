import { Router } from "express";
import { ProductController } from "./product.controller";
import { authMiddleware } from "../../middleware/auth";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// Public route for the /p/[id] landing page
router.get("/:id/campaign", ProductController.getCampaignDetails);

// Admin, Vendor & Customer routes
router.get(
    "/",
    authMiddleware,
    roleGuard("ADMIN", "VENDOR", "CUSTOMER"),
    ProductController.getAllCampaigns
);

router.post(
    "/",
    authMiddleware,
    roleGuard("ADMIN", "VENDOR"),
    ProductController.createCampaign
);

router.put(
    "/:id",
    authMiddleware,
    roleGuard("ADMIN", "VENDOR"),
    ProductController.updateCampaign
);

router.delete(
    "/:id",
    authMiddleware,
    roleGuard("ADMIN", "VENDOR"),
    ProductController.deleteCampaign
);

export default router;
