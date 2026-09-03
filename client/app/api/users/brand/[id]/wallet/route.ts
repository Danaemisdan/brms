import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { amount, action } = body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Valid positive amount is required' }, { status: 400 });
        }

        if (action !== 'add' && action !== 'remove') {
            return NextResponse.json({ error: 'Action must be "add" or "remove"' }, { status: 400 });
        }

        const vendor = await prisma.vendor.findUnique({
            where: { user_id: id }
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
        }

        let newBalance = vendor.wallet_balance;
        if (action === 'add') {
            newBalance += amount;
        } else if (action === 'remove') {
            if (newBalance < amount) {
                return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
            }
            newBalance -= amount;
        }

        const updatedVendor = await prisma.vendor.update({
            where: { user_id: id },
            data: { wallet_balance: newBalance }
        });

        return NextResponse.json({
            message: `Successfully ${action === 'add' ? 'added funds to' : 'removed funds from'} wallet`,
            wallet_balance: updatedVendor.wallet_balance
        }, { status: 200 });

    } catch (error) {
        console.error('Update Wallet Error:', error);
        return NextResponse.json({ error: 'Failed to update wallet balance' }, { status: 500 });
    }
}
