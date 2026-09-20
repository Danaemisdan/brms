import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

// Placeholder for Email Dispatch
async function dispatchConfirmationEmail(orderId: string, userEmail: string) {
    console.log(`[Email Dispatch Stub] Sending order confirmation to ${userEmail} for Order ${orderId}`);
}

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { order_id } = await req.json();

        if (!order_id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: order_id },
            include: { product: true, user: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Slot Validation
        if (order.product.filled_slots < order.product.total_slots) {
            // Condition Check: Slots Exist
            // 1. Increment filled_slots
            await prisma.product.update({
                where: { id: order.product.id },
                data: { filled_slots: { increment: 1 } }
            });

            // 2. Update order status to CONFIRMED
            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: { status: 'CONFIRMED' }
            });

            // 3. Automated Mail Trigger (Placeholder)
            if (order.user.email) {
                await dispatchConfirmationEmail(order.order_id, order.user.email);
            }

            return NextResponse.json({ 
                success: true, 
                message: 'Order confirmed successfully', 
                order: updatedOrder 
            });
        } else {
            // Condition Check: No Slots
            // Terminate confirmation and initiate "Refund Entry"
            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'REFUND_ENTRY',
                    refund_entry: true
                }
            });

            return NextResponse.json({ 
                success: false, 
                message: 'No slots available. Order routed to Refund Entry.', 
                order: updatedOrder 
            });
        }
    } catch (error) {
        console.error('Order confirmation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
