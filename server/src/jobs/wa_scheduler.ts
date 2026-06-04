import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { resolveRecipients } from '../modules/whatsapp/targeting';

const prisma = new PrismaClient();

export const startWhatsAppScheduler = () => {
    console.log("📅 WhatsApp Campaign Scheduler initialized (Runs daily at 09:00 AM)");

    // Run every minute to check for precise time matches
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const currentHours = now.getHours().toString().padStart(2, '0');
            const currentMinutes = now.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentHours}:${currentMinutes}`;

            // Find all active products that have a schedule configured
            const products = await prisma.product.findMany({
                where: {
                    status: 'ACTIVE',
                    wa_template: { not: null },
                    wa_times_per_day: { gt: 0 }
                }
            });

            for (const product of products) {
                // Check if current date is within start and end dates (inclusive, timezone considered via Date objects)
                if (product.wa_start_date) {
                    const startDate = new Date(product.wa_start_date);
                    startDate.setHours(0, 0, 0, 0);
                    if (now < startDate) continue;
                }

                if (product.wa_end_date) {
                    const endDate = new Date(product.wa_end_date);
                    endDate.setHours(23, 59, 59, 999);
                    if (now > endDate) continue;
                }

                // Check if the current time matches any of the configured times
                let shouldSend = false;
                if (product.wa_time_1 === currentTimeStr) shouldSend = true;
                if (product.wa_time_2 === currentTimeStr) shouldSend = true;
                if (product.wa_time_3 === currentTimeStr) shouldSend = true;

                if (shouldSend) {
                    const finalMessage = product.wa_template!
                        .replace(/{{product_name}}/g, product.product_name)
                        .replace(/{{platform}}/g, product.platform)
                        .replace(/{{real_price}}/g, (product.real_price || "").toString())
                        .replace(/{{offer_price}}/g, (product.offer_price || "").toString())
                        .replace(/{{refund_amount}}/g, product.refund_amount.toString())
                        .replace(/{{available_slots}}/g, (product.total_slots - product.filled_slots).toString())
                        .replace(/{{product_link}}/g, product.product_link)
                        .replace(/{{deadline}}/g, new Date(product.deadline).toLocaleDateString());

                    const payloadData = {
                        timestamp: new Date().toISOString(),
                        product_id: product.id,
                        message: finalMessage,
                        command: "BLAST_CAMPAIGN",
                        target: product.wa_target || "all_customers",
                        custom_phones: product.wa_custom_phones || "",
                        attachment_url: product.wa_attachment_url || null,
                        recipients: await resolveRecipients(
                            prisma,
                            product.wa_target || "all_customers",
                            product.wa_custom_phones || ""
                        ),
                    };

                    if (!Array.isArray(payloadData.recipients) || payloadData.recipients.length === 0) {
                        console.log(`⚠️ Skipping scheduled campaign for ${product.product_name}: no recipients resolved.`);
                        continue;
                    }

                    const dedupeKey = `whatsapp:schedule:${product.id}:${now.toISOString().slice(0, 16)}`; // Unique per minute
                    try {
                        await prisma.agentTask.create({
                            data: {
                                task_type: 'WHATSAPP_BLAST',
                                status: 'PENDING',
                                payload: JSON.stringify(payloadData),
                                dedupe_key: dedupeKey,
                            },
                        });
                        await prisma.product.update({
                            where: { id: product.id },
                            data: { wa_last_sent_at: new Date() },
                        });
                        console.log(`✅ Scheduled campaign queued for product: ${product.product_name}`);
                    } catch (err: any) {
                        if (err?.code !== 'P2002') {
                            throw err;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error in WhatsApp Campaign Scheduler:", error);
        }
    });
};
