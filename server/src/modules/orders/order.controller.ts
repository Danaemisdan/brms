import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export class OrderController {
    // CUSTOMER: Submit an order proof for a product
    static async submitOrderProof(req: Request, res: Response) {
        try {
            const { product_id, order_id, amount, screenshot_url } = req.body;
            const userId = (req as any).user.userId;

            // Create Order
            const order = await prisma.order.create({
                data: {
                    order_id,
                    user_id: userId,
                    product_id,
                    amount: parseFloat(amount),
                    screenshot_url: screenshot_url || "https://dummyimage.com/600x400/000/fff&text=Screenshot",
                    status: "SUBMITTED"
                },
                include: {
                    product: true
                }
            });

            // Update product filled_slots
            await prisma.product.update({
                where: { id: product_id },
                data: { filled_slots: { increment: 1 } }
            });

            res.status(201).json({ message: "Order proof submitted successfully", order });
        } catch (error: any) {
            console.error("Error submitting order proof:", error);
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "This Order ID has already been submitted." });
            }
            res.status(500).json({ error: "Failed to submit order proof." });
        }
    }

    // PUBLIC: Get all orders for a specific mobile number (for Refund Modal)
    static async getOrdersByMobile(req: Request, res: Response) {
        try {
            const { mobile } = req.params;

            const user = await prisma.user.findUnique({
                where: { mobile },
                select: { id: true }
            });

            if (!user) {
                return res.json({ orders: [] });
            }

            const orders = await prisma.order.findMany({
                where: { user_id: user.id },
                include: {
                    product: {
                        select: {
                            product_name: true,
                            platform: true,
                            refund_amount: true
                        }
                    },
                    refund: true,
                    review: true
                },
                orderBy: { order_date: 'desc' }
            });

            const formattedOrders = orders.map(o => ({
                id: o.id,
                order_id: o.order_id,
                productName: o.product.product_name,
                platform: o.product.platform,
                refundAmount: o.product.refund_amount,
                status: o.status,
                hasRefund: !!o.refund,
                hasReview: !!o.review,
                refundStatus: o.refund?.status || null,
                screenshot_url: o.screenshot_url
            }));

            res.json({ orders: formattedOrders });
        } catch (error) {
            console.error("Error fetching orders:", error);
            res.status(500).json({ error: "Failed to fetch orders." });
        }
    }

    // CUSTOMER: Submit review and claim refund
    static async claimRefund(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { review_url, upi_id, review_screenshot } = req.body;
            const userId = (req as any).user.userId;

            if (!review_screenshot) {
                return res.status(400).json({ error: "Review screenshot is mandatory." });
            }

            const order = await prisma.order.findUnique({
                where: { id },
                include: { product: true, user: true }
            });

            if (!order) {
                return res.status(404).json({ error: "Order not found." });
            }

            // Verify the logged in user owns this order
            if (order.user_id !== userId) {
                return res.status(403).json({ error: "Unauthorized access to this order." });
            }

            // Create Review
            const review = await prisma.review.create({
                data: {
                    order_id: order.id,
                    screenshot_url: review_screenshot || "",
                    review_url: review_url || "",
                    rating: 5, // Defaulting
                    review_date: new Date(),
                    approval_status: "SUBMITTED"
                }
            });

            // Create Refund Request
            await prisma.refund.create({
                data: {
                    order_id: order.id,
                    user_id: order.user_id,
                    amount: order.product.refund_amount,
                    status: "PENDING"
                }
            });

            // Update user's bank details/UPI
            await prisma.user.update({
                where: { id: order.user_id },
                data: { encrypted_bank_data: upi_id }
            });

            // Trigger AI Agent for DOM Verification
            const localAgentPath = path.resolve(__dirname, "../../../../local_agent");
            if (!fs.existsSync(localAgentPath)) {
                fs.mkdirSync(localAgentPath, { recursive: true });
            }

            const payloadData = {
                timestamp: new Date().toISOString(),
                command: "VERIFY_REVIEW",
                review_id: review.id,
                order_id: order.id,
                product_url: order.product.product_link,
                screenshot_url: review_screenshot
            };

            const payloadFile = path.join(localAgentPath, `verify_review_${review.id}.json`);
            fs.writeFileSync(payloadFile, JSON.stringify(payloadData, null, 2));

            res.json({ message: "Refund claimed successfully! Review is pending AI verification." });
        } catch (error: any) {
            console.error("Error claiming refund:", error);
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "Refund or review already exists for this order." });
            }
            res.status(500).json({ error: "Failed to claim refund." });
        }
    }

    // ADMIN: Get all orders
    static async getAllOrders(req: Request, res: Response) {
        try {
            const orders = await prisma.order.findMany({
                include: {
                    product: true,
                    user: true,
                    review: true,
                    refund: true
                },
                orderBy: { created_at: 'desc' }
            });
            res.json({ orders });
        } catch (error) {
            console.error("Error fetching all orders:", error);
            res.status(500).json({ error: "Failed to fetch orders." });
        }
    }

    // CUSTOMER: Get orders for the logged-in user
    static async getMyOrders(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const orders = await prisma.order.findMany({
                where: { user_id: userId },
                include: {
                    product: true,
                    review: true,
                    refund: true
                },
                orderBy: { created_at: 'desc' }
            });

            const formattedOrders = orders.map(o => ({
                id: o.id,
                order_id: o.order_id,
                productName: o.product.product_name,
                platform: o.product.platform,
                refundAmount: o.product.refund_amount,
                status: o.status,
                hasRefund: !!o.refund,
                hasReview: !!o.review,
                refundStatus: o.refund?.status || null,
                screenshot_url: o.screenshot_url
            }));

            res.json({ orders: formattedOrders });
        } catch (error) {
            console.error("Error fetching my orders:", error);
            res.status(500).json({ error: "Failed to fetch your orders." });
        }
    }

    // ADMIN: Update refund status manually
    static async updateRefundStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const refund = await prisma.refund.update({
                where: { order_id: id },
                data: { status: status as any }
            });

            res.json({ message: `Refund status updated to ${status}`, refund });
        } catch (error) {
            console.error("Error updating refund status:", error);
            res.status(500).json({ error: "Failed to update refund status." });
        }
    }
}
