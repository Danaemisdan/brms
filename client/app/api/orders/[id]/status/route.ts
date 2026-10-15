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

        const oldOrder = await prisma.order.findUnique({ 
            where: { id }, 
            include: { user: true, product: true } 
        });

        if (!oldOrder) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
        }

        const isConfirming = (status === "Order Confirmed (dating)" || status === "Order Confirmed") && 
                             oldOrder.status !== "Order Confirmed (dating)" && 
                             oldOrder.status !== "Order Confirmed";

        const isNoSlots = status === "Order Rejected (No More Slots)";

        const order = await prisma.order.update({
            where: { id },
            data: { 
                status,
                ...(remarks !== undefined ? { remarks } : { remarks: status }),
                ...(isNoSlots ? { refund_entry: true } : {})
            },
            include: { user: true, product: true }
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

        // Sync with Google Sheets
        const { syncOrderToSheet } = await import('@/lib/services/googleSheets.service');
        await syncOrderToSheet(id).catch(err => console.error("Sheet sync error:", err));

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
