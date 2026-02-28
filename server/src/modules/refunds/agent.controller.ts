import { Request, Response } from 'express';
import prisma from '../../config/database';
import { decryptBankData } from '../../utils/encryption';

const AGENT_SECRET_KEY = process.env.AGENT_SECRET_KEY || "brms_local_agent_secret_2026";

export const getPendingRefundsQueue = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${AGENT_SECRET_KEY}`) {
            res.status(401).json({ error: "Unauthorized agent access." });
            return;
        }

        const refunds = await prisma.refund.findMany({
            where: {
                status: 'PROCESSING'
            },
            include: {
                order: {
                    include: {
                        product: true,
                    }
                },
                user: true
            },
            take: 10,
            orderBy: {
                created_at: 'asc'
            }
        });

        const mappedQueue = refunds.map(r => {
            let decryptedBank = null;
            if (r.user.encrypted_bank_data) {
                try {
                    decryptedBank = decryptBankData(r.user.encrypted_bank_data);
                } catch (e) { }
            }

            return {
                refund_id: r.id,
                amount: r.amount,
                customer_name: r.user.name,
                mobile: r.user.mobile,
                product_name: r.order.product.product_name,
                bank_details: decryptedBank
            };
        });

        res.status(200).json({ queue: mappedQueue });
    } catch (error) {
        console.error("Agent Queue Error:", error);
        res.status(500).json({ error: "Failed to fetch agent queue." });
    }
};

export const completeRefundTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${AGENT_SECRET_KEY}`) {
            res.status(401).json({ error: "Unauthorized agent access." });
            return;
        }

        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!['REFUNDED', 'FAILED'].includes(status)) {
            res.status(400).json({ error: "Invalid status update from agent." });
            return;
        }

        const refund = await prisma.refund.update({
            where: { id },
            data: {
                status: status as any,
                ...(remarks && { remarks: remarks })
            }
        });

        res.status(200).json({ message: `Refund marked as ${status}` });
    } catch (error) {
        console.error("Agent Completion Error:", error);
        res.status(500).json({ error: "Failed to complete agent task." });
    }
};

export const verifyReviewCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${AGENT_SECRET_KEY}`) {
            res.status(401).json({ error: "Unauthorized agent access." });
            return;
        }

        const { id } = req.params;
        const { status, reason, proof_image } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            res.status(400).json({ error: "Invalid status update from agent." });
            return;
        }

        // Update Review Status
        const review = await prisma.review.update({
            where: { id },
            data: {
                approval_status: status as any,
                ...(status === 'APPROVED' && proof_image ? { screenshot_url: proof_image } : {})
            }
        });

        // Auto-approve or reject the associated Refund request based on review finding
        await prisma.refund.updateMany({
            where: { order_id: review.order_id, status: 'PENDING' },
            data: {
                status: status === 'APPROVED' ? 'PROCESSING' : 'FAILED'
            }
        });

        res.status(200).json({ message: `Review verification marked as ${status}` });
    } catch (error) {
        console.error("Agent Verification Callback Error:", error);
        res.status(500).json({ error: "Failed to process agent verification callback." });
    }
};
