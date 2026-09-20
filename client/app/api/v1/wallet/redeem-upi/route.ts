import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const { amount } = await req.json();
        const redeemAmount = parseFloat(amount);

        if (!redeemAmount || redeemAmount <= 0) {
            return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.upi_id) {
            return NextResponse.json({ error: 'UPI ID is required to redeem' }, { status: 400 });
        }

        if (user.wallet_balance < redeemAmount) {
            return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
        }

        // User Redemption
        await prisma.$transaction(async (tx) => {
            // Deduct from wallet
            await tx.user.update({
                where: { id: user.id },
                data: { wallet_balance: { decrement: redeemAmount } }
            });
            
            // In a real system, you'd trigger the UPI Gateway API here.
            // For now, we simulate success and log it.
            console.log(`[UPI Gateway Stub] Paid ₹${redeemAmount} to VPA ${user.upi_id}`);
        });

        return NextResponse.json({ 
            success: true, 
            message: `Redemption of ₹${redeemAmount} via UPI initiated successfully.`
        });
    } catch (error) {
        console.error('Redeem error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
