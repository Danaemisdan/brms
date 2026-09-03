import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const orders = await prisma.order.findMany({
            include: {
                product: true,
                user: true,
                review: true,
                refund: true
            },
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json({ orders }, { status: 200 });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
    }
}
