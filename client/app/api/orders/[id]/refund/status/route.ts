import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { status, reason, remarks } = body;

        // Support lookup by order UUID or order_id
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id: id },
                    { order_id: id }
                ]
            },
            include: { refund: true, user: true, product: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
        }

        const isMarkingPaid = status === 'REFUNDED' || status === 'processed' || status === 'PAID';
        const isRejecting = status === 'FAILED' || status === 'REJECTED' || status === 'failed' || status === 'Refund Reject, Wrong Written';
        const finalReason = reason || remarks || (isRejecting ? "Refund Reject, Wrong Written" : "");

        let updatedRefund = null;

        if (isMarkingPaid) {
            updatedRefund = await prisma.refund.upsert({
                where: { order_id: order.id },
                update: {
                    status: 'REFUNDED',
                    processed_date: new Date()
                },
                create: {
                    order_id: order.id,
                    user_id: order.user_id,
                    amount: order.product?.refund_amount || order.amount || 0,
                    status: 'REFUNDED',
                    processed_date: new Date()
                }
            });

            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'Refund Processing (15 days of Order Confirmation)',
                    remarks: 'Refund Sent & Processed'
                }
            });

            await prisma.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: 'Refund Sent Successfully!',
                    message: `₹${updatedRefund.amount} has been marked as sent for Order #${order.order_id}. Please check your UPI / Bank account.`,
                    channel: 'DASHBOARD'
                }
            }).catch(e => console.error("Notification error:", e));
        } else if (isRejecting) {
            updatedRefund = await prisma.refund.upsert({
                where: { order_id: order.id },
                update: {
                    status: 'FAILED'
                },
                create: {
                    order_id: order.id,
                    user_id: order.user_id,
                    amount: order.product?.refund_amount || order.amount || 0,
                    status: 'FAILED'
                }
            });

            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'Refund Reject, Wrong Written',
                    remarks: finalReason
                }
            });

            await prisma.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: 'Refund Payment Not Sent',
                    message: `Your refund for Order #${order.order_id} could not be sent. Reason: ${finalReason}`,
                    channel: 'DASHBOARD'
                }
            }).catch(e => console.error("Notification error:", e));
        } else {
            // General status update (e.g. PROCESSING, APPROVED)
            updatedRefund = await prisma.refund.upsert({
                where: { order_id: order.id },
                update: {
                    status: status as any
                },
                create: {
                    order_id: order.id,
                    user_id: order.user_id,
                    amount: order.product?.refund_amount || order.amount || 0,
                    status: status as any
                }
            });
        }

        const { syncOrderToSheet } = await import('@/lib/services/googleSheets.service');
        await syncOrderToSheet(order.id).catch(err => console.error("Sheet sync error:", err));

        return NextResponse.json({ 
            success: true, 
            message: isMarkingPaid ? "Refund marked as sent successfully." : isRejecting ? "Refund marked as not sent." : `Refund status updated to ${status}`,
            refund: updatedRefund 
        }, { status: 200 });
    } catch (error) {
        console.error("Error updating refund status:", error);
        return NextResponse.json({ error: "Failed to update refund status." }, { status: 500 });
    }
}
