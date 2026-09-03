import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

const loginSchema = z.object({
    identifier: z.string().trim().min(1, 'Mobile or Email is required'),
    password: z.string().trim().min(1, 'Password is required'),
});

function firstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? 'Invalid request payload';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
        }

        const { identifier, password } = parsed.data;

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { mobile: identifier },
                    { email: identifier }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (!user.password_hash) {
            return NextResponse.json({ error: 'Account not set up with a password. Please contact support.' }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

        const response = NextResponse.json({
            message: 'Login successful',
            token: accessToken,
            user: { id: user.id, name: user.name, role: user.role },
        }, { status: 200 });

        const isProduction = process.env.NODE_ENV === 'production';
        response.cookies.set('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 60 * 60 });
        response.cookies.set('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
