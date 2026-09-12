import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { authenticator } from 'otplib';

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json().catch(() => ({}));
        const { code } = body;

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (!user || !user.totp_secret) {
            return NextResponse.json({ error: '2FA not initialized' }, { status: 400 });
        }

        const isValid = authenticator.verify({ token: code, secret: user.totp_secret });
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { is_totp_enabled: true }
        });

        return NextResponse.json({ message: '2FA enabled successfully' }, { status: 200 });
    } catch (error) {
        console.error('Failed to verify 2FA:', error);
        return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
    }
}
