import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { resolveRecipients } from "./targeting";

const prisma = new PrismaClient();

export class WhatsAppController {
    static async launchCampaign(req: Request, res: Response) {
        try {
            const { product_id, template, target = "all_customers", custom_phones = "", attachment_url, scheduled_at } = req.body;

            const product = await prisma.product.findUnique({
                where: { id: product_id }
            });

            if (!product) {
                return res.status(404).json({ error: "Product not found." });
            }

            // Replace template variables dynamically based on product data
            let finalMessage = template
                .replace(/{{product_name}}/g, product.product_name)
                .replace(/{{platform}}/g, product.platform)
                .replace(/{{refund_amount}}/g, product.refund_amount.toString())
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
                recipients: await resolveRecipients(prisma, target, custom_phones),
            };

            if (!Array.isArray(payloadData.recipients) || payloadData.recipients.length === 0) {
                return res.status(400).json({ error: "No recipients found for the selected WhatsApp target." });
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

            res.status(200).json({
                message: "Campaign queued for Local Agent successfully.",
                finalMessage,
                task_id: task.id
            });
        } catch (error) {
            console.error("Error launching WA campaign:", error);
            res.status(500).json({ error: "Failed to queue WhatsApp campaign." });
        }
    }
}
