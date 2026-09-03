import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        let token = '';

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            token = req.cookies.get('accessToken')?.value || '';
        }

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: true,
                ecommerce_profile_url: true,
                encrypted_bank_data: true,
                created_at: true,
            },
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
                mobile: user.mobile,
                email: user.email,
                role: user.role,
                ecommerce_profile_url: user.ecommerce_profile_url,
                created_at: user.created_at,
                encrypted_bank_data: paymentMethodString
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
    }
}
