import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { status } = body;

        if (!["ACTIVE", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status. Must be ACTIVE or REJECTED." }, { status: 400 });
        }

        const product = await prisma.product.update({
            where: { id },
            data: { status },
            include: {
                client: {
                    include: {
                        user: true
                    }
                }
            }
        });

        const brandMobile = product.client?.user?.mobile;
        if (brandMobile) {
            const message = status === "ACTIVE"
                ? `✅ *Product Approved*\n\nYour product request for *${product.product_name}* has been approved and is now active on the BRMS platform!`
                : `❌ *Product Declined*\n\nYour product request for *${product.product_name}* has been declined by the administrator.`;

            await prisma.agentTask.create({
                data: {
                    task_type: 'WHATSAPP_BLAST',
                    status: 'PENDING',
                    payload: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        product_id: product.id,
                        message,
                        command: "BLAST_CAMPAIGN",
                        target: "custom",
                        custom_phones: brandMobile,
                        recipients: [brandMobile],
                    }),
                    dedupe_key: `whatsapp:status_update:${product.id}:${status}`,
                }
            });
            console.log(`📤 Auto-queued WhatsApp notification for brand ${brandMobile} (Status: ${status})`);
        }

        return NextResponse.json({ message: `Campaign marked as ${status}`, product }, { status: 200 });
    } catch (error) {
        console.error("Error updating campaign status:", error);
        return NextResponse.json({ error: "Failed to update campaign status." }, { status: 500 });
    }
}
