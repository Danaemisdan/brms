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

        const isApproved = order.status.includes('Approved') || 
                           order.status === 'REFUND_APPROVED' ||
                           order.status === 'Order Approved (After Submission of Review SS & Return Window SS)';

        if (!isApproved) {
            return NextResponse.json({ 
                error: 'Order is not approved for refund yet. Please evaluate and approve order first.' 
            }, { status: 400 });
        }

        const creditAmount = order.product?.refund_amount || order.amount || 0;

        // Wallet Settlement: Credit the user's internal wallet
        await prisma.$transaction(async (tx) => {
            // 1. Increment wallet balance
            await tx.user.update({
                where: { id: order.user_id },
                data: { wallet_balance: { increment: creditAmount } }
            });

            // 2. Update order status to 'Refund Processing (15 days of Order Confirmation)'
            await tx.order.update({
                where: { id: order.id },
                data: { 
                    status: 'Refund Processing (15 days of Order Confirmation)',
                    remarks: 'Refund Processing (15 days of Order Confirmation)'
                }
            });

            // 3. Upsert Refund record
            await tx.refund.upsert({
                where: { order_id: order.id },
                update: {
                    status: 'REFUNDED',
                    amount: creditAmount,
                    processed_date: new Date()
                },
                create: {
                    order_id: order.id,
                    user_id: order.user_id,
                    amount: creditAmount,
                    status: 'REFUNDED',
                    processed_date: new Date()
                }
            });

            // 4. In-app notification
            await tx.notification.create({
                data: {
                    user_id: order.user_id,
                    type: 'GENERAL',
                    title: 'Wallet Balance Credited!',
                    message: `₹${creditAmount} has been successfully credited to your wallet for Order #${order.order_id}. You can now redeem via UPI anytime.`,
                    channel: 'DASHBOARD'
                }
            });
        });

        const { syncRefundToSheet } = await import('@/lib/services/googleSheets.service');
        await syncRefundToSheet(order.id).catch(err => console.error("Refund sheet sync error:", err));

        return NextResponse.json({ 
            success: true, 
            message: `Amount ₹${creditAmount} credited to user wallet successfully. Order status updated to Refund Processing.`,
            credited_amount: creditAmount
        });
    } catch (error) {
        console.error('Wallet credit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
