import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let paymentMethodString: string | null = null;
        if (user.encrypted_bank_data) {
            try {
                const parsed = require('@/lib/encryption').decryptBankData(user.encrypted_bank_data);
                paymentMethodString = parsed?.payment_method_string || null;
            } catch {
                paymentMethodString = null;
            }
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                encrypted_bank_data: paymentMethodString,
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Fetch Profile Error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
