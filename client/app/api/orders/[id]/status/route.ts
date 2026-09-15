import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { status, remarks } = body;

        const order = await prisma.order.update({
            where: { id },
            data: { 
                status,
                ...(remarks !== undefined && { remarks })
            }
        });

        return NextResponse.json({ message: `Order status updated to ${status}`, order }, { status: 200 });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json({ error: "Failed to update order status." }, { status: 500 });
    }
}
