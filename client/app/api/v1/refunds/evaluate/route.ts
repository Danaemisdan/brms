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

        const order = await prisma.order.findUnique({
            where: { id: order_id }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Refund Entry Evaluation
        if (!order.refund_entry) {
            return NextResponse.json({ error: 'Order is not eligible for refund entry' }, { status: 400 });
        }

        // Issue Detection (from Google Sheets sync, issue_flag will be true if issue found)
        if (order.issue_flag) {
            // Pause automation and escalate the ticket for manual resolution
            // Let's create a ticket for this customer automatically
            await prisma.ticket.create({
                data: {
                    user_id: order.user_id,
                    order_id: order.id,
                    subject: `System Alert: Issue Detected for Order ${order.order_id}`,
                    status: 'OPEN'
                }
            });

            return NextResponse.json({ 
                success: false, 
                message: 'Issue detected. Escapated to manual support ticket.',
                order 
            });
        } else {
            // Not Issue: mark as Order Approved for refund
            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: { status: 'REFUND_APPROVED' }
            });

            return NextResponse.json({ 
                success: true, 
                message: 'Refund evaluation passed. Order approved for refund.',
                order: updatedOrder
            });
        }
    } catch (error) {
        console.error('Refund evaluation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
