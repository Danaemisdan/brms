import { Router } from 'express';
import { getPendingRefundsQueue, completeRefundTask, verifyReviewCallback } from './agent.controller';

const router = Router();

// These routes are secured via AGENT_SECRET_KEY manually in the controller, 
// so they do not use the standard JWT authMiddleware.
router.get('/queue', getPendingRefundsQueue);
router.post('/queue/:id/complete', completeRefundTask);
router.post('/reviews/:id/verify_callback', verifyReviewCallback);

export default router;
