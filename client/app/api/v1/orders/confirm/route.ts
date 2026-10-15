import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { order_id } = await req.json();

        if (!order_id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // Search by DB uuid or ecommerce order_id
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id: order_id },
                    { order_id: order_id }
                ]
            },
            include: { product: true, user: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Slot Validation: verify slots available
        if (order.product.filled_slots <= order.product.total_slots) {
            // Condition Check: Slots Exist
            // 1. Update order status to 'Order Confirmed (dating)'
            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: { 
                    status: 'Order Confirmed (dating)',
                    remarks: 'Order Confirmed (dating)'
                },
                include: { product: true, user: true }
            });

            // 2. Automated Mail Trigger
            if (order.user?.email) {
                await sendOrderConfirmationEmail({
                    to: order.user.email,
                    customerName: order.user.name || order.profile_name || "Valued Customer",
                    orderId: order.order_id,
                    productName: order.product.product_name,
                    platform: order.product.platform,
                    amount: order.product.refund_amount || order.amount,
                    remarks: 'Order Confirmed (dating)'
                }).catch(err => console.error("Error dispatching confirmation email:", err));
            }

            // 3. Create in-app notification
            await prisma.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: 'Order Confirmed!',
                    message: `Your order #${order.order_id} for "${order.product.product_name}" has been verified by the admin team. Confirmation email dispatched.`,
                    channel: 'DASHBOARD'
                }
            }).catch(err => console.error("Notification creation error:", err));

            const { syncOrderToSheet } = await import('@/lib/services/googleSheets.service');
            await syncOrderToSheet(order.id).catch(err => console.error("Sheet sync error:", err));

            return NextResponse.json({ 
                success: true, 
                message: 'Order verified and confirmed successfully. Confirmation email dispatched.', 
                order: updatedOrder 
            });
        } else {
            // Condition Check: No Slots
            // Terminate confirmation and initiate "Refund Entry" workflow
            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'Order Rejected (No More Slots)',
                    remarks: 'Order Rejected (No More Slots)',
                    refund_entry: true
                },
                include: { product: true, user: true }
            });

            await prisma.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: 'Order Rejected (No More Slots)',
                    message: `Campaign slots for "${order.product.product_name}" are full. Order routed to refund entry workflow.`,
                    channel: 'DASHBOARD'
                }
            }).catch(err => console.error("Notification creation error:", err));

            const { syncOrderToSheet } = await import('@/lib/services/googleSheets.service');
            await syncOrderToSheet(order.id).catch(err => console.error("Sheet sync error:", err));

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
