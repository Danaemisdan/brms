import { Router } from 'express';
import {
    claimAgentTask,
    completeAgentTask,
    getAgentTaskStats,
    getPendingRefundsQueue,
    completeRefundTask,
    verifyReviewCallback,
} from './agent.controller';
import { authMiddleware } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

// These routes are secured via AGENT_SECRET_KEY manually in the controller, 
// so they do not use the standard JWT authMiddleware.
router.get('/tasks/next', claimAgentTask);
router.post('/tasks/:id/complete', completeAgentTask);
router.get('/queue', getPendingRefundsQueue);
router.post('/queue/:id/complete', completeRefundTask);
router.post('/reviews/:id/verify_callback', verifyReviewCallback);

// Admin visibility into agent queue workload
router.get('/tasks/stats', authMiddleware, roleGuard('ADMIN'), getAgentTaskStats);

export default router;
