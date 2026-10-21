export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const orders = await prisma.order.findMany({
            include: {
                product: true,
                user: true,
                review: true,
                refund: true
            },
            orderBy: { created_at: 'desc' }
        });

        const formattedOrders = orders.map(o => {
            let decryptedBank = null;
            if (o.user?.encrypted_bank_data) {
                try {
                    const { decryptBankData } = require('@/lib/encryption');
                    decryptedBank = decryptBankData(o.user.encrypted_bank_data);
                } catch (_) {
                    decryptedBank = null;
                }
            }

            return {
                ...o,
                user: {
                    ...o.user,
                    bank_details: decryptedBank
                }
            };
        });

        return NextResponse.json({ orders: formattedOrders }, { status: 200 });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
    }
}
