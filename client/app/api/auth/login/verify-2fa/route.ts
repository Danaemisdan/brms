import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticator } from 'otplib';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

const verifySchema = z.object({
    userId: z.string(),
    code: z.string()
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = verifySchema.safeParse(body);
        
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const { userId, code } = parsed.data;

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.is_totp_enabled || !user.totp_secret) {
            return NextResponse.json({ error: '2FA not enabled for this user' }, { status: 400 });
        }

        const isValid = authenticator.verify({ token: code, secret: user.totp_secret });

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
        }

        const accessToken = generateAccessToken({ userId: user.id, role: user.role, token_version: user.token_version });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, token_version: user.token_version });

        const response = NextResponse.json({
            message: 'Login successful',
            token: accessToken,
            user: { id: user.id, name: user.name, role: user.role },
        }, { status: 200 });

        const isProduction = process.env.NODE_ENV === 'production';
        response.cookies.set('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 15 * 60 });
        response.cookies.set('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });

        return response;
    } catch (error) {
        console.error('2FA login verify error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
