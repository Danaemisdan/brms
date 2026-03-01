import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { resolveRecipients } from '../modules/whatsapp/targeting';

const prisma = new PrismaClient();

export const startWhatsAppScheduler = () => {
    console.log("📅 WhatsApp Campaign Scheduler initialized (Runs daily at 09:00 AM)");

    // Run daily at 09:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log("⏳ Running Daily WhatsApp Campaign Scheduler Job...");

        try {
            const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(); // e.g., MONDAY

            // Find all active products that have a schedule configured
            const products = await prisma.product.findMany({
                where: {
                    status: 'ACTIVE',
                    wa_template: { not: null },
                    wa_schedule_frequency: { in: ['DAILY', 'ONCE_A_WEEK', 'TWICE_A_WEEK'] }
                }
            });

            for (const product of products) {
                let shouldSend = false;
                const sentToday = product.wa_last_sent_at
                    ? product.wa_last_sent_at.toDateString() === new Date().toDateString()
                    : false;

                if (sentToday) {
                    continue;
                }

                if (product.wa_schedule_frequency === 'DAILY') {
                    shouldSend = true;
                } else if (product.wa_schedule_days && product.wa_schedule_days.toUpperCase().includes(todayName)) {
                    shouldSend = true;
                }

                if (shouldSend) {
                    const finalMessage = product.wa_template!
                        .replace(/{{product_name}}/g, product.product_name)
                        .replace(/{{platform}}/g, product.platform)
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

                    const dedupeKey = `whatsapp:schedule:${product.id}:${new Date().toISOString().slice(0, 10)}`;
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
