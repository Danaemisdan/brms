import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/mailer';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { status, remarks } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required." }, { status: 400 });
        }

        const oldOrder = await prisma.order.findFirst({ 
            where: {
                OR: [
                    { id: id },
                    { order_id: id }
                ]
            }, 
            include: { user: true, product: true, refund: true } 
        });

        if (!oldOrder) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
        }

        const isConfirming = (status === "Order Confirmed (dating)" || status === "Order Confirmed") && 
                             oldOrder.status !== "Order Confirmed (dating)" && 
                             oldOrder.status !== "Order Confirmed";

        // Slot Validation Check
        if (isConfirming && oldOrder.product) {
            const hasSlots = (oldOrder.product.total_slots || 0) > (oldOrder.product.filled_slots || 0);

            if (!hasSlots) {
                // If No Slots: Terminate confirmation and initiate "Refund Entry" workflow
                const updatedOrder = await prisma.order.update({
                    where: { id: oldOrder.id },
                    data: {
                        status: 'Order Rejected (No More Slots)',
                        remarks: 'Order Rejected (No More Slots)',
                        refund_entry: true
                    },
                    include: { user: true, product: true }
                });

                await prisma.notification.create({
                    data: {
                        user_id: oldOrder.user_id,
                        type: 'GENERAL',
                        title: 'Order Rejected (No More Slots)',
                        message: `Campaign slots for "${oldOrder.product.product_name}" are full. Order routed to refund entry workflow.`,
                        channel: 'DASHBOARD'
                    }
                }).catch(err => console.error("Notification creation error:", err));

                return NextResponse.json({ 
                    success: false, 
                    no_slots: true,
                    message: 'No slots available for this campaign. Order marked as Order Rejected (No More Slots).', 
                    order: updatedOrder 
                }, { status: 200 });
            }

            // Decrement remaining slots by incrementing filled_slots
            await prisma.product.update({
                where: { id: oldOrder.product_id },
                data: { filled_slots: { increment: 1 } }
            }).catch(err => console.error("Slot increment error:", err));
        }

        const isNoSlots = status === "Order Rejected (No More Slots)";
        const isApproved = status === "Order Approved (After Submission of Review SS & Return Window SS)";
        const isRefundProcessing = status === "Refund Processing (15 days of Order Confirmation)";
        const isRefundReject = status === "Refund Reject, Wrong Written";

        const order = await prisma.order.update({
            where: { id: oldOrder.id },
            data: { 
                status,
                remarks: remarks !== undefined ? remarks : status,
                ...(isNoSlots ? { refund_entry: true } : {})
            },
            include: { user: true, product: true, refund: true }
        });

        // Automated Mail Trigger & Notification upon verification / confirmation
        if (isConfirming && order.user?.email) {
            await sendOrderConfirmationEmail({
                to: order.user.email,
                customerName: order.user.name || order.profile_name || "Valued Customer",
                orderId: order.order_id,
                productName: order.product.product_name,
                platform: order.product.platform,
                amount: order.product.refund_amount || order.amount,
                remarks: status
            }).catch(err => console.error("Error dispatching confirmation email:", err));

            // Create in-app notification
            await prisma.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: 'Order Confirmed!',
                    message: `Your order #${order.order_id} for "${order.product.product_name}" has been reviewed and verified by admin. Confirmation email dispatched.`,
                    channel: 'DASHBOARD'
                }
            }).catch(err => console.error("Notification creation error:", err));
        }

        // Auto-initialize or update Refund record when Approved or in Refund Processing
        if (isApproved || isRefundProcessing) {
            const refundAmount = order.product?.refund_amount || order.amount || 0;
            await prisma.refund.upsert({
                where: { order_id: order.id },
                update: {
                    status: isRefundProcessing ? 'PROCESSING' : 'PENDING',
                    amount: refundAmount
                },
                create: {
                    order_id: order.id,
                    user_id: order.user_id,
                    amount: refundAmount,
                    status: isRefundProcessing ? 'PROCESSING' : 'PENDING'
                }
            }).catch(err => console.error("Refund upsert error:", err));

            await prisma.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: isApproved ? 'Review & Return Window Proofs Approved!' : 'Refund Processing',
                    message: isApproved 
                        ? `Your proofs for Order #${order.order_id} have been approved. Refund is scheduled for payout.`
                        : `Your refund for Order #${order.order_id} is processing (15 days cycle from order confirmation).`,
                    channel: 'DASHBOARD'
                }
            }).catch(err => console.error("Notification creation error:", err));
        }

        // If Refund Reject, Wrong Written: update refund status to FAILED if exists
        if (isRefundReject) {
            await prisma.refund.updateMany({
                where: { order_id: order.id },
                data: { status: 'FAILED' }
            }).catch(err => console.error("Refund failed update error:", err));

            await prisma.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: 'Refund Rejected (Wrong Written)',
                    message: `Refund rejected for Order #${order.order_id}.${remarks ? ` Reason: ${remarks}` : ''}`,
                    channel: 'DASHBOARD'
                }
            }).catch(err => console.error("Notification creation error:", err));
        }

        // Sync with Google Sheets
        const { syncOrderToSheet } = await import('@/lib/services/googleSheets.service');
        await syncOrderToSheet(order.id).catch(err => console.error("Sheet sync error:", err));

        return NextResponse.json({ 
            success: true, 
            message: `Order status updated to ${status}`, 
            order 
        }, { status: 200 });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json({ error: "Failed to update order status." }, { status: 500 });
    }
}
