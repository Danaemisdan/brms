import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        const orders = await prisma.order.findMany({
            where: { user_id: session.userId },
            include: {
                product: true,
                review: true,
                refund: true
            },
            orderBy: { created_at: 'desc' }
        });

        const formattedOrders = orders.map(o => ({
            id: o.id,
            order_id: o.order_id,
            productName: o.product.product_name,
            platform: o.product.platform,
            refundAmount: o.product.refund_amount,
            status: o.status,
            hasRefund: !!o.refund,
            hasReview: !!o.review,
            refundStatus: o.refund?.status || null,
            screenshot_url: o.screenshot_url,
            created_at: o.created_at
        }));

        return NextResponse.json({ orders: formattedOrders }, { status: 200 });
    } catch (error) {
        console.error("Error fetching my orders:", error);
        return NextResponse.json({ error: "Failed to fetch your orders." }, { status: 500 });
    }
}
