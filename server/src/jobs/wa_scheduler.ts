import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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

            const localAgentPath = path.resolve(__dirname, "../../../local_agent");
            if (!fs.existsSync(localAgentPath)) {
                fs.mkdirSync(localAgentPath, { recursive: true });
            }

            for (const product of products) {
                let shouldSend = false;

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
                        custom_phones: product.wa_custom_phones || ""
                    };

                    const payloadFile = path.join(localAgentPath, `campaign_cron_${product.id}_${Date.now()}.json`);
                    fs.writeFileSync(payloadFile, JSON.stringify(payloadData, null, 2));
                    console.log(`✅ Scheduled campaign payload dropped for product: ${product.product_name}`);
                }
            }
        } catch (error) {
            console.error("❌ Error in WhatsApp Campaign Scheduler:", error);
        }
    });
};
