import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAccessToken, verifyRefreshToken } from '@/lib/jwt';

const refreshSchema = z.object({
    refreshToken: z.string().min(1),
}).partial();

function firstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? 'Invalid request payload';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const parsed = refreshSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
        }

        const cookieRefreshToken = req.cookies.get('refreshToken')?.value;
        const refreshToken = cookieRefreshToken || parsed.data.refreshToken;

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
        }

        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
        }

        const newAccessToken = generateAccessToken({ userId: payload.userId, role: payload.role });
        
        const response = NextResponse.json({ message: 'Token refreshed', token: newAccessToken }, { status: 200 });
        const isProduction = process.env.NODE_ENV === 'production';
        response.cookies.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60,
        });

        return response;
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
    }
}
