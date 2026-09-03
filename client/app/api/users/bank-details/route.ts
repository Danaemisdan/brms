import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: NextRequest) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json().catch(() => ({}));
        const { payment_method_string } = body;

        if (!payment_method_string) {
            return NextResponse.json({ error: 'Payment information string is required' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.userId },
            data: { encrypted_bank_data: require('@/lib/encryption').encryptBankData({ payment_method_string }) }
        });

        return NextResponse.json({ message: 'Payment details updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Update Bank Details Error:', error);
        return NextResponse.json({ error: 'Failed to update payment details' }, { status: 500 });
    }
}
