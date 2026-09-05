import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/lib/auth';

const createBrandSchema = z.object({
    brand_name: z.string().min(2, 'Brand name is required'),
    mobile: z.string().regex(/^\d{10}$/, 'Valid 10-digit mobile number is required'),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    poc_name: z.string().optional(),
    website: z.string().optional(),
    country: z.string().optional(),
    category: z.string().optional(),
    commission: z.string().optional(),
});

function firstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? 'Invalid request payload';
}

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json().catch(() => ({}));
        const parsed = createBrandSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: firstValidationError(parsed.error) }, { status: 400 });
        }

        const { brand_name, mobile, email, password, poc_name, website, country, category, commission } = parsed.data;

        const existingMobile = await prisma.user.findUnique({ where: { mobile } });
        if (existingMobile) {
            return NextResponse.json({ error: 'User with this mobile already exists' }, { status: 409 });
        }

        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });
            if (existingEmail) {
                return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
            }
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newBrandUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: brand_name,
                    mobile,
                    email: email || null,
                    password_hash,
                    role: 'VENDOR', // Keeping original VENDOR role behavior
                    poc_name: poc_name || null,
                    website: website || null,
                    country: country || 'India',
                    category: category || null,
                }
            });

            await tx.vendor.create({
                data: {
                    user_id: user.id,
                    commission: commission ? parseFloat(commission) : 0,
                }
            });

            return user;
        });

        return NextResponse.json({
            message: 'Brand account created successfully',
            user: {
                id: newBrandUser.id,
                name: newBrandUser.name,
                role: newBrandUser.role,
                mobile: newBrandUser.mobile,
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Create Brand Error:', error);
        return NextResponse.json({ error: 'Failed to create brand account' }, { status: 500 });
    }
}
