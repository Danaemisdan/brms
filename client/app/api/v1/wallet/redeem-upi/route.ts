import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json().catch(() => ({}));
        const { amount, upi_id: requestUpiId } = body;
        const redeemAmount = parseFloat(amount);

        if (!redeemAmount || redeemAmount <= 0) {
            return NextResponse.json({ error: 'Valid positive amount is required.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        const targetUpi = (requestUpiId || user.upi_id || "").trim();

        if (!targetUpi) {
            return NextResponse.json({ 
                error: 'UPI ID is required to redeem. Please provide a valid UPI VPA (e.g. yourname@okaxis).' 
            }, { status: 400 });
        }

        if (user.wallet_balance < redeemAmount) {
            return NextResponse.json({ 
                error: `Insufficient wallet balance. Available: ₹${user.wallet_balance.toFixed(2)}, Requested: ₹${redeemAmount.toFixed(2)}` 
            }, { status: 400 });
        }

        // Execute redemption in transaction
        let remainingBalance = 0;
        await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: { 
                    wallet_balance: { decrement: redeemAmount },
                    upi_id: targetUpi
                }
            });

            remainingBalance = updatedUser.wallet_balance;

            // In production, integrate with RazorpayX / Cashfree / Decentro UPI Payout API.
            console.log(`[UPI Gateway Payout] Transferred ₹${redeemAmount} to VPA ${targetUpi} for User ${user.id}`);

            // Create in-app notification
            await tx.notification.create({
                data: {
                    user_id: user.id,
                    type: 'GENERAL',
                    title: 'UPI Redemption Initiated',
                    message: `₹${redeemAmount} payout initiated to UPI ID (${targetUpi}). Remaining wallet balance: ₹${remainingBalance.toFixed(2)}.`,
                    channel: 'DASHBOARD'
                }
            });
        });

        return NextResponse.json({ 
            success: true, 
            message: `Redemption of ₹${redeemAmount} via UPI to ${targetUpi} initiated successfully.`,
            transferred_amount: redeemAmount,
            upi_id: targetUpi,
            remaining_balance: remainingBalance
        });
    } catch (error) {
        console.error('Redeem error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
