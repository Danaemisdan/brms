import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['VENDOR']);
    if (session instanceof NextResponse) return session;

    try {
        const user = await prisma.user.findUnique({ where: { id: session.userId } });

        if (!user) {
            return NextResponse.json({ error: "Access denied. Only vendors can view brand orders." }, { status: 403 });
        }

        const orders = await prisma.order.findMany({
            where: {
                product: {
                    brand: user.name
                }
            },
            include: {
                product: true,
                user: {
                    select: { name: true, mobile: true, email: true }
                },
                refund: true,
                review: true
            },
            orderBy: { created_at: "desc" }
        });

        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + (order.product?.refund_amount || 0), 0);
        
        return NextResponse.json({ orders, analytics: { totalOrders, totalSpent } }, { status: 200 });
    } catch (error) {
        console.error("Error fetching brand orders:", error);
        return NextResponse.json({ error: "Failed to fetch brand orders." }, { status: 500 });
    }
}
