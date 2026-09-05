import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { Prisma } from '@prisma/client';

const mobileSchema = z.string().regex(/^\d{10}$/, 'Valid 10-digit mobile number is required');

const registerSchema = z.object({
    name: z.string().trim().min(2, 'Name is required').max(100, 'Name is too long'),
    mobile: mobileSchema,
    email: z.union([z.string().trim().email('Invalid email format'), z.literal('')]).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    ecommerce_profile_url: z.union([z.string().trim().url('Invalid e-commerce profile URL'), z.literal('')]).optional(),
    category: z.string().optional(),
});

function firstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? 'Invalid request payload';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
        }

        const { name, mobile, email, password, ecommerce_profile_url } = parsed.data;

        const existingMobile = await prisma.user.findUnique({ where: { mobile } });
        if (existingMobile) {
            return NextResponse.json({ error: 'User with this mobile already exists' }, { status: 409 });
        }

        if (email?.trim()) {
            const existingEmail = await prisma.user.findUnique({ where: { email: email.trim() } });
            if (existingEmail) {
                return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
            }
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                mobile,
                email: email?.trim() || null,
                password_hash,
                ecommerce_profile_url: ecommerce_profile_url?.trim() || null,
                role: 'CUSTOMER',
            },
        });

        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

        const response = NextResponse.json({
            message: 'Registration successful',
            token: accessToken,
            user: { id: user.id, name: user.name, role: user.role },
        }, { status: 201 });

        const isProduction = process.env.NODE_ENV === 'production';
        response.cookies.set('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 60 * 60 });
        response.cookies.set('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });

        return response;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ error: 'User with this mobile or email already exists' }, { status: 409 });
        }
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
