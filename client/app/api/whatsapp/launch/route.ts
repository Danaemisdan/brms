import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { resolveRecipients } from '@/lib/whatsapp/targeting';

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json().catch(() => ({}));
        const { product_id, template, target = "all_customers", custom_phones = "", attachment_url, scheduled_at } = body;

        const product = await prisma.product.findUnique({
            where: { id: product_id }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found." }, { status: 404 });
        }

        let finalMessage = template
            .replace(/{{product_name}}/g, product.product_name)
            .replace(/{{platform}}/g, product.platform)
            .replace(/{{real_price}}/g, (product.real_price || "").toString())
            .replace(/{{offer_price}}/g, (product.offer_price || "").toString())
            .replace(/{{refund_amount}}/g, (product.refund_amount || 0).toString())
            .replace(/{{available_slots}}/g, (product.total_slots - product.filled_slots).toString())
            .replace(/{{product_link}}/g, product.product_link)
            .replace(/{{deadline}}/g, new Date(product.deadline).toLocaleDateString());

        const payloadData = {
            timestamp: new Date().toISOString(),
            product_id,
            message: finalMessage,
            command: "BLAST_CAMPAIGN",
            target,
            custom_phones,
            attachment_url: attachment_url || product.wa_attachment_url || null,
            recipients: await resolveRecipients(prisma as any, target, custom_phones),
        };

        if (!Array.isArray(payloadData.recipients) || payloadData.recipients.length === 0) {
            return NextResponse.json({ error: "No recipients found for the selected WhatsApp target." }, { status: 400 });
        }

        const dedupeKey = target === 'custom'
            ? null
            : `whatsapp:product:${product_id}:${new Date().toISOString().slice(0, 16)}`;

        const task = await prisma.agentTask.create({
            data: {
                task_type: 'WHATSAPP_BLAST',
                status: 'PENDING',
                payload: JSON.stringify(payloadData),
                dedupe_key: dedupeKey,
                available_at: scheduled_at ? new Date(scheduled_at) : undefined,
            }
        });

        return NextResponse.json({
            message: "Campaign queued for Local Agent successfully.",
            finalMessage,
            task_id: task.id
        }, { status: 200 });
    } catch (error) {
        console.error("Error launching WA campaign:", error);
        return NextResponse.json({ error: "Failed to queue WhatsApp campaign." }, { status: 500 });
    }
}
