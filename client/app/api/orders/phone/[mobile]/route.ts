import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ mobile: string }> }) {
    const session = requireRole(req, ['CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        const { mobile } = await params;

        const user = await prisma.user.findUnique({
            where: { mobile },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ orders: [] }, { status: 200 });
        }

        if (user.id !== session.userId) {
            return NextResponse.json({ error: "Unauthorized access to this mobile's orders." }, { status: 403 });
        }

        const orders = await prisma.order.findMany({
            where: { user_id: user.id },
            include: {
                product: {
                    select: {
                        product_name: true,
                        platform: true,
                        refund_amount: true
                    }
                },
                refund: true,
                review: true
            },
            orderBy: { order_date: 'desc' }
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
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
    }
}
