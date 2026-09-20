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

        if (order.status !== 'REFUND_APPROVED') {
            return NextResponse.json({ error: 'Order refund not approved yet' }, { status: 400 });
        }

        // Wallet Settlement: Credit the user's internal wallet
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: order.user_id },
                data: { wallet_balance: { increment: order.amount } }
            });

            await tx.order.update({
                where: { id: order.id },
                data: { status: 'WALLET_CREDITED' }
            });
        });

        return NextResponse.json({ 
            success: true, 
            message: `Amount ₹${order.amount} credited to user wallet successfully.`
        });
    } catch (error) {
        console.error('Wallet credit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
