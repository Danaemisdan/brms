import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(user.email || user.mobile, 'Sample Lelo Admin', secret);
        
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        await prisma.user.update({
            where: { id: user.id },
            data: { totp_secret: secret } // is_totp_enabled stays as it is until verified
        });

        return NextResponse.json({ secret, qrCodeDataUrl }, { status: 200 });
    } catch (error) {
        console.error('Failed to generate 2FA:', error);
        return NextResponse.json({ error: 'Failed to generate 2FA' }, { status: 500 });
    }
}
