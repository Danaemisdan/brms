import { Request, Response } from 'express';
import prisma from '../../config/database';
import { decryptBankData } from '../../utils/encryption';

const AGENT_SECRET_KEY = process.env.AGENT_SECRET_KEY || '';

function ensureAgentAuth(req: Request, res: Response): boolean {
    if (!AGENT_SECRET_KEY) {
        res.status(500).json({ error: 'AGENT_SECRET_KEY is not configured on server.' });
        return false;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${AGENT_SECRET_KEY}`) {
        res.status(401).json({ error: 'Unauthorized agent access.' });
        return false;
    }
    return true;
}

type QueueTaskType = 'REVIEW_VERIFY' | 'WHATSAPP_BLAST';
type QueueTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

function parseTaskType(value: string | undefined): QueueTaskType | null {
    if (value === 'REVIEW_VERIFY' || value === 'WHATSAPP_BLAST') return value;
    return null;
}

export const getPendingRefundsQueue = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!ensureAgentAuth(req, res)) return;

        const refunds = await prisma.refund.findMany({
            where: { status: 'PROCESSING' },
            include: {
                order: { include: { product: true } },
                user: true,
            },
            take: 10,
            orderBy: { created_at: 'asc' },
        });

        const mappedQueue = refunds.map((r) => {
            let decryptedBank: unknown = null;
            if (r.user.encrypted_bank_data) {
                try {
                    decryptedBank = decryptBankData(r.user.encrypted_bank_data);
                } catch {
                    decryptedBank = null;
                }
            }

            return {
                refund_id: r.id,
                amount: r.amount,
                customer_name: r.user.name,
                mobile: r.user.mobile,
                product_name: r.order.product.product_name,
                bank_details: decryptedBank,
            };
        });

        res.status(200).json({ queue: mappedQueue });
    } catch (error) {
        console.error('Agent Queue Error:', error);
        res.status(500).json({ error: 'Failed to fetch agent queue.' });
    }
};

export const completeRefundTask = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!ensureAgentAuth(req, res)) return;

        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!['REFUNDED', 'FAILED'].includes(status)) {
            res.status(400).json({ error: 'Invalid status update from agent.' });
            return;
        }

        await prisma.refund.update({
            where: { id },
            data: {
                status: status as string,
                ...(remarks && { batch_id: String(remarks).slice(0, 128) }),
            },
        });

        res.status(200).json({ message: `Refund marked as ${status}` });
    } catch (error) {
        console.error('Agent Completion Error:', error);
        res.status(500).json({ error: 'Failed to complete agent task.' });
    }
};

export const verifyReviewCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!ensureAgentAuth(req, res)) return;

        const { id } = req.params;
        const { status, reason, proof_image } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            res.status(400).json({ error: 'Invalid status update from agent.' });
            return;
        }

        const review = await prisma.review.update({
            where: { id },
            data: {
                approval_status: status as string,
                correction_reason: status === 'REJECTED' ? (reason || 'Review verification failed') : null,
                ...(status === 'APPROVED' && proof_image ? { screenshot_url: proof_image } : {}),
            },
        });

        await prisma.refund.updateMany({
            where: { order_id: review.order_id, status: 'PENDING' },
            data: { status: status === 'APPROVED' ? 'PROCESSING' : 'FAILED' },
        });

        res.status(200).json({ message: `Review verification marked as ${status}` });
    } catch (error) {
        console.error('Agent Verification Callback Error:', error);
        res.status(500).json({ error: 'Failed to process agent verification callback.' });
    }
};

export const claimAgentTask = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!ensureAgentAuth(req, res)) return;

        const taskType = parseTaskType(String(req.query.type || ''));
        if (!taskType) {
            res.status(400).json({ error: 'Invalid or missing task type.' });
            return;
        }

        const workerId = String(req.query.worker_id || 'local-agent');
        const now = new Date();

        const candidate = await prisma.agentTask.findFirst({
            where: {
                task_type: taskType,
                status: 'PENDING',
                available_at: { lte: now },
            },
            orderBy: [{ created_at: 'asc' }],
        });

        if (!candidate) {
            res.status(200).json({ task: null });
            return;
        }

        const claimed = await prisma.agentTask.updateMany({
            where: {
                id: candidate.id,
                status: 'PENDING',
            },
            data: {
                status: 'IN_PROGRESS',
                locked_by: workerId,
                locked_at: now,
                attempts: { increment: 1 },
            },
        });

        if (claimed.count === 0) {
            res.status(200).json({ task: null });
            return;
        }

        const task = await prisma.agentTask.findUnique({ where: { id: candidate.id } });
        if (!task) {
            res.status(200).json({ task: null });
            return;
        }

        res.status(200).json({
            task: {
                id: task.id,
                type: task.task_type,
                status: task.status,
                payload: JSON.parse(task.payload),
                attempts: task.attempts,
                created_at: task.created_at,
            },
        });
    } catch (error) {
        console.error('Agent task claim error:', error);
        res.status(500).json({ error: 'Failed to claim task.' });
    }
};

export const completeAgentTask = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!ensureAgentAuth(req, res)) return;

        const { id } = req.params;
        const {
            status,
            result,
            retry_after_seconds,
        }: {
            status: QueueTaskStatus;
            result?: unknown;
            retry_after_seconds?: number;
        } = req.body || {};

        if (!['COMPLETED', 'FAILED', 'PENDING'].includes(status)) {
            res.status(400).json({ error: 'Invalid completion status.' });
            return;
        }

        const data: {
            status: QueueTaskStatus;
            result?: string;
            available_at?: Date;
            locked_at: null;
            locked_by: null;
        } = {
            status,
            locked_at: null,
            locked_by: null,
        };

        if (typeof result !== 'undefined') {
            data.result = JSON.stringify(result);
        }

        if (status === 'PENDING' || (status === 'FAILED' && retry_after_seconds && retry_after_seconds > 0)) {
            data.status = 'PENDING';
            data.available_at = new Date(Date.now() + retry_after_seconds! * 1000);
        }

        await prisma.agentTask.update({
            where: { id },
            data,
        });

        res.status(200).json({ message: 'Task updated.' });
    } catch (error) {
        console.error('Agent task complete error:', error);
        res.status(500).json({ error: 'Failed to update task.' });
    }
};

export const getAgentTaskStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const grouped = await prisma.agentTask.groupBy({
            by: ['task_type', 'status'],
            _count: { _all: true },
        });

        const stats: Record<string, Record<string, number>> = {};
        for (const row of grouped) {
            if (!stats[row.task_type]) stats[row.task_type] = {};
            stats[row.task_type][row.status] = row._count._all;
        }

        res.status(200).json({ stats });
    } catch (error) {
        console.error('Agent task stats error:', error);
        res.status(500).json({ error: 'Failed to fetch task stats.' });
    }
};
