import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureAgentAuth } from '@/lib/agentAuth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = ensureAgentAuth(req);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { status, reason, proof_image } = body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status update from agent.' }, { status: 400 });
        }

        const review = await prisma.review.update({
            where: { id },
            data: {
                approval_status: status as string,
                correction_reason: status === 'REJECTED' ? (reason || 'Review verification failed') : null,
                ...(status === 'APPROVED' && proof_image ? { screenshot_url: proof_image } : {}),
            },
        });

        await prisma.refund.updateMany({
            where: { order_id: review.order_id, status: 'PENDING' },
            data: { status: status === 'APPROVED' ? 'PROCESSING' : 'FAILED' },
        });

        return NextResponse.json({ message: `Review verification marked as ${status}` }, { status: 200 });
    } catch (error) {
        console.error('Agent Verification Callback Error:', error);
        return NextResponse.json({ error: 'Failed to process agent verification callback.' }, { status: 500 });
    }
}
