import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const customers = await prisma.user.findMany({
            where: { role: 'CUSTOMER' },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                created_at: true,
                _count: {
                    select: { orders: true, tickets: true }
                }
            }
        });

        return NextResponse.json({ customers }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch customers:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}
