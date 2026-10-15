import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { order_id } = await req.json();

        if (!order_id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id: order_id },
                    { order_id: order_id }
                ]
            },
            include: { user: true, product: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Refund Entry Evaluation:
        // Check if refund_entry is true or order status is eligible for evaluation
        const isEligible = order.refund_entry || 
                           order.status === 'Order Confirmed (dating)' || 
                           order.status === 'Order Confirmed' || 
                           order.status.includes('Approved') ||
                           order.status === 'Order Rejected (No More Slots)';

        if (!isEligible) {
            return NextResponse.json({ error: 'Order is not eligible for refund entry workflow' }, { status: 400 });
        }

        // Issue Detection: check issue_flag (fraud, dispute, expired slot)
        if (order.issue_flag) {
            // Pause automation and escalate ticket for manual resolution
            const ticket = await prisma.ticket.create({
                data: {
                    user_id: order.user_id,
                    order_id: order.id,
                    subject: `System Alert: Issue Detected for Order ${order.order_id}`,
                    status: 'OPEN'
                }
            });

            await prisma.order.update({
                where: { id: order.id },
                data: { remarks: `Issue flagged: Escalated to Ticket #${ticket.id.slice(0, 8)}` }
            });

            return NextResponse.json({ 
                success: false, 
                message: 'Issue detected. Escalated to manual support ticket.',
                ticket_id: ticket.id,
                order 
            });
        } else {
            // Not Issue: Mark as Order Approved for refund
            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: { 
                    status: 'Order Approved (After Submission of Review SS & Return Window SS)',
                    remarks: 'Order Approved (After Submission of Review SS & Return Window SS)',
                    refund_entry: true
                }
            });

            await prisma.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: 'Order Approved for Refund!',
                    message: `Your order #${order.order_id} has been approved. The refund amount is now queued for wallet settlement.`,
                    channel: 'DASHBOARD'
                }
            }).catch(err => console.error("Notification creation error:", err));

            const { syncOrderToSheet } = await import('@/lib/services/googleSheets.service');
            await syncOrderToSheet(order.id).catch(err => console.error("Sheet sync error:", err));

            return NextResponse.json({ 
                success: true, 
                message: 'Refund evaluation passed. Order approved for refund settlement.',
                order: updatedOrder
            });
        }
    } catch (error) {
        console.error('Refund evaluation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
