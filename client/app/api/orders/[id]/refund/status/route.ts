import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { status } = body;

        const refund = await prisma.refund.update({
            where: { order_id: id },
            data: { status: status as any }
        });

        return NextResponse.json({ message: `Refund status updated to ${status}`, refund }, { status: 200 });
    } catch (error) {
        console.error("Error updating refund status:", error);
        return NextResponse.json({ error: "Failed to update refund status." }, { status: 500 });
    }
}
