import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('accessToken', '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 0,
    });
    response.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 0,
    });

    return response;
}
