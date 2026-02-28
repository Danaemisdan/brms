import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export class WhatsAppController {
    static async launchCampaign(req: Request, res: Response) {
        try {
            const { product_id, template, target = "all_customers", custom_phones = "" } = req.body;

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

            // Dump payload into the local_agent folder for the user's WhatsApp bot script to pick up and process
            const localAgentPath = path.resolve(__dirname, "../../../../../local_agent");

            if (!fs.existsSync(localAgentPath)) {
                fs.mkdirSync(localAgentPath, { recursive: true });
            }

            const payloadData = {
                timestamp: new Date().toISOString(),
                product_id,
                message: finalMessage,
                command: "BLAST_CAMPAIGN",
                target,
                custom_phones
            };

            const payloadFile = path.join(localAgentPath, `campaign_${Date.now()}.json`);
            fs.writeFileSync(payloadFile, JSON.stringify(payloadData, null, 2));

            res.status(200).json({
                message: "Campaign queued for Local Agent successfully.",
                finalMessage,
                payloadFile
            });
        } catch (error) {
            console.error("Error launching WA campaign:", error);
            res.status(500).json({ error: "Failed to queue WhatsApp campaign." });
        }
    }
}
