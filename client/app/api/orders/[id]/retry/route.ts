import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const { order_id, amount, screenshot_url } = await req.json();

        if (!order_id || !amount || !screenshot_url) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        const existingOrder = await prisma.order.findUnique({ where: { id } });

        if (!existingOrder) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
        }

        if (existingOrder.user_id !== session.userId) {
            return NextResponse.json({ error: "Unauthorized access to order." }, { status: 403 });
        }

        if (existingOrder.status !== "REJECTED") {
            return NextResponse.json({ error: "Only rejected orders can be retried." }, { status: 400 });
        }

        // Update the order
        await prisma.order.update({
            where: { id },
            data: {
                order_id: order_id.toString(),
                status: "SUBMITTED",
                remarks: null,
                screenshot_url: screenshot_url
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("Error retrying order:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('order_id')) {
            return NextResponse.json({ error: "This Order ID has already been submitted by someone." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to retry order." }, { status: 500 });
    }
}
