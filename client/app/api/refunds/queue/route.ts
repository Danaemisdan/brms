import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureAgentAuth } from '@/lib/agentAuth';

export async function GET(req: NextRequest) {
    const authError = ensureAgentAuth(req);
    if (authError) return authError;

    try {
        const refunds = await prisma.refund.findMany({
            where: { status: 'PROCESSING' },
            include: {
                order: { include: { product: true } },
                user: true,
            },
            take: 10,
            orderBy: { created_at: 'asc' },
        });

        const mappedQueue = refunds.map((r) => {
            let decryptedBank: unknown = null;
            if (r.user.encrypted_bank_data) {
                try {
                    decryptedBank = require('@/lib/encryption').decryptBankData(r.user.encrypted_bank_data);
                } catch {
                    decryptedBank = null;
                }
            }

            return {
                refund_id: r.id,
                amount: r.amount,
                customer_name: r.user.name,
                mobile: r.user.mobile,
                product_name: r.order.product.product_name,
                bank_details: decryptedBank,
            };
        });

        return NextResponse.json({ queue: mappedQueue }, { status: 200 });
    } catch (error) {
        console.error('Agent Queue Error:', error);
        return NextResponse.json({ error: 'Failed to fetch agent queue.' }, { status: 500 });
    }
}
