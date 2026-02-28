import { Router } from "express";
import { OrderController } from "./order.controller";
import { authMiddleware } from "../../middleware/auth";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// Customer Action routes
router.post(
    "/submit",
    authMiddleware,
    roleGuard("CUSTOMER"),
    OrderController.submitOrderProof
);

router.get(
    "/phone/:mobile",
    authMiddleware,
    roleGuard("CUSTOMER"),
    OrderController.getOrdersByMobile
);

router.post(
    "/:id/refund",
    authMiddleware,
    roleGuard("CUSTOMER"),
    OrderController.claimRefund
);

// Admin routes
router.get(
    "/",
    authMiddleware,
    roleGuard("ADMIN"),
    OrderController.getAllOrders
);

router.post(
    "/:id/refund/status",
    authMiddleware,
    roleGuard("ADMIN"),
    OrderController.updateRefundStatus
);

// Customer routes
router.get(
    "/my-orders",
    authMiddleware,
    roleGuard("CUSTOMER"),
    OrderController.getMyOrders
);

export default router;
