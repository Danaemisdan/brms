import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { resolveRecipients } from "../whatsapp/targeting";

const prisma = new PrismaClient();

export class ProductController {
    // PUBLIC: Get product details for the /p/[id] landing page
    static async getCampaignDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const product = await prisma.product.findUnique({
                where: { id },
                select: {
                    id: true,
                    product_name: true,
                    product_image: true,
                    brand: true,
                    platform: true,
                    refund_amount: true,
                    instructions: true,
                    total_slots: true,
                    filled_slots: true,
                    status: true,
                    product_link: true,
                    is_public: true,
                }
            });

            if (!product) {
                return res.status(404).json({ error: "Campaign not found or has been removed." });
            }

            // Optional: Add logic to hide if slots are full or campaign is paused
            if (product.status !== "ACTIVE" && product.status !== "DRAFT") {
                return res.status(400).json({ error: `Campaign is currently ${product.status.toLowerCase()}.` });
            }

            res.json({ product });
        } catch (error) {
            console.error("Error fetching campaign:", error);
            res.status(500).json({ error: "Failed to fetch campaign details." });
        }
    }

    // ADMIN/VENDOR/CUSTOMER: Get all campaigns
    static async getAllCampaigns(req: Request, res: Response) {
        try {
            const user = (req as any).user;

            // Customers only see active, public campaigns. Admins/Vendors see all.
            const whereClause = user?.role === "CUSTOMER" ? { status: 'ACTIVE', is_public: true } : {};

            const products = await prisma.product.findMany({
                where: whereClause,
                include: {
                    orders: true
                },
                orderBy: { created_at: 'desc' }
            });
            res.json({ products });
        } catch (error) {
            console.error("Error fetching all campaigns:", error);
            res.status(500).json({ error: "Failed to fetch campaigns." });
        }
    }

    // ADMIN: Create a new campaign (Product)
    static async createCampaign(req: Request, res: Response) {
        try {
            const {
                client_id,
                brand,
                product_name,
                product_image,
                product_link,
                platform,
                refund_amount,
                total_slots,
                daily_limit,
                deadline,
                instructions,
                is_public,
                delivery_type,
                exchange_image,
                wa_target,
                wa_custom_phones,
                wa_template,
                wa_schedule_frequency,
                wa_schedule_days
            } = req.body;

            // Ensure a valid client_id exists
            let validClientId = client_id;
            const clientExists = validClientId ? await prisma.client.findUnique({ where: { id: validClientId } }) : null;

            if (!clientExists) {
                let defaultClient = await prisma.client.findFirst();
                if (!defaultClient) {
                    // Create a dummy user and client if absolutely none exist
                    const defaultUser = await prisma.user.create({
                        data: {
                            mobile: `internal-${Date.now()}`,
                            role: "CLIENT",
                            name: "System Client"
                        }
                    });
                    defaultClient = await prisma.client.create({
                        data: {
                            user_id: defaultUser.id,
                            company_name: "Internal Brand"
                        }
                    });
                }
                validClientId = defaultClient.id;
            }

            const vendorUser: any = (req as any).user;
            const initialStatus = vendorUser?.role === 'VENDOR' ? "REQUESTED" : "ACTIVE";

            const product = await prisma.product.create({
                data: {
                    client_id: validClientId,
                    brand,
                    product_name,
                    product_image,
                    product_link,
                    platform,
                    refund_amount: Number(refund_amount),
                    total_slots: Number(total_slots),
                    daily_limit: Number(daily_limit) || 100,
                    deadline: new Date(deadline),
                    instructions,
                    is_public: is_public !== undefined ? Boolean(is_public) : true,
                    status: initialStatus,
                    delivery_type: delivery_type || "ORIGINAL", // Added
                    exchange_image: exchange_image || null, // Added
                    wa_target: wa_target || "all_customers",
                    wa_custom_phones: wa_custom_phones || null,
                    wa_template: wa_template || null,
                    wa_schedule_frequency: wa_schedule_frequency || "NONE",
                    wa_schedule_days: wa_schedule_days || null
                }
            });

            // Auto-launch WhatsApp Campaign if template is provided and schedule is NONE
            if (wa_template && (!wa_schedule_frequency || wa_schedule_frequency === "NONE")) {
                try {
                    const finalMessage = wa_template
                        .replace(/{{product_name}}/g, product.product_name)
                        .replace(/{{platform}}/g, product.platform)
                        .replace(/{{refund_amount}}/g, product.refund_amount.toString())
                        .replace(/{{available_slots}}/g, (product.total_slots - product.filled_slots).toString())
                        .replace(/{{product_link}}/g, product.product_link)
                        .replace(/{{deadline}}/g, new Date(product.deadline).toLocaleDateString());

                    const target = wa_target || "all_customers";
                    const customPhones = wa_custom_phones || "";
                    const recipients = await resolveRecipients(prisma, target, customPhones);

                    if (Array.isArray(recipients) && recipients.length > 0) {
                        const dedupeKey = target === 'custom'
                            ? null
                            : `whatsapp:product:${product.id}:${new Date().toISOString().slice(0, 16)}`;

                        await prisma.agentTask.create({
                            data: {
                                task_type: 'WHATSAPP_BLAST',
                                status: 'PENDING',
                                payload: JSON.stringify({
                                    timestamp: new Date().toISOString(),
                                    product_id: product.id,
                                    message: finalMessage,
                                    command: "BLAST_CAMPAIGN",
                                    target,
                                    custom_phones: customPhones,
                                    recipients,
                                }),
                                dedupe_key: dedupeKey,
                            }
                        });
                        console.log(`📤 Auto-queued WhatsApp blast for product: ${product.product_name} (${recipients.length} recipients)`);
                    } else {
                        console.warn(`⚠️ WhatsApp blast skipped for ${product.product_name}: no recipients resolved.`);
                    }
                } catch (waErr) {
                    // Non-fatal: product was created, just log the WA failure
                    console.error("WhatsApp auto-blast error (non-fatal):", waErr);
                }
            }

            res.status(201).json({ message: "Campaign created successfully", product });
        } catch (error: any) {
            console.error("🔴 ERROR CREATING PRODUCT START 🔴");
            console.error(error);
            console.error("🔴 ERROR CREATING PRODUCT END 🔴");
            res.status(500).json({ error: error.message || "Failed to create campaign." });
        }
    }
    // ADMIN: Update a campaign (Product)
    static async updateCampaign(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                product_name,
                product_image,
                product_link,
                platform,
                refund_amount,
                total_slots,
                daily_limit,
                deadline,
                instructions,
                status,
                is_public,
                wa_target,
                wa_custom_phones,
                wa_template,
                wa_schedule_frequency,
                wa_schedule_days
            } = req.body;

            const product = await prisma.product.update({
                where: { id },
                data: {
                    product_name,
                    product_image,
                    product_link,
                    platform,
                    refund_amount: refund_amount ? parseFloat(refund_amount) : undefined,
                    total_slots: total_slots ? parseInt(total_slots) : undefined,
                    daily_limit: daily_limit ? parseInt(daily_limit) : undefined,
                    deadline: deadline ? new Date(deadline) : undefined,
                    instructions,
                    status,
                    is_public: is_public !== undefined ? Boolean(is_public) : undefined,
                    wa_target: wa_target !== undefined ? wa_target : undefined,
                    wa_custom_phones: wa_custom_phones !== undefined ? wa_custom_phones : undefined,
                    wa_template: wa_template !== undefined ? wa_template : undefined,
                    wa_schedule_frequency: wa_schedule_frequency !== undefined ? wa_schedule_frequency : undefined,
                    wa_schedule_days: wa_schedule_days !== undefined ? wa_schedule_days : undefined
                }
            });

            res.json({ message: "Campaign updated successfully", product });
        } catch (error) {
            console.error("Error updating campaign:", error);
            res.status(500).json({ error: "Failed to update campaign." });
        }
    }

    // ADMIN: Delete a campaign (Product) and all associated orders/invoices
    static async deleteCampaign(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Use a transaction to delete all associated orders and invoices first, then the product
            await prisma.$transaction([
                prisma.order.deleteMany({
                    where: { product_id: id }
                }),
                prisma.invoice.deleteMany({
                    where: { product_id: id }
                }),
                prisma.product.delete({
                    where: { id }
                })
            ]);

            res.json({ message: "Campaign and all associated items deleted successfully" });
        } catch (error) {
            console.error("Error deleting campaign:", error);
            res.status(500).json({ error: "Failed to delete campaign due to an internal constraint." });
        }
    }

    // ADMIN: Update campaign status (Accept/Decline requested products)
    static async updateCampaignStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body; // Expects "ACTIVE" or "REJECTED"

            if (!["ACTIVE", "REJECTED"].includes(status)) {
                return res.status(400).json({ error: "Invalid status. Must be ACTIVE or REJECTED." });
            }

            // Update the product and fetch related client/user info for WhatsApp notification
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

            // Queue a WhatsApp notification to the Brand
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

            res.json({ message: `Campaign marked as ${status}`, product });
        } catch (error) {
            console.error("Error updating campaign status:", error);
            res.status(500).json({ error: "Failed to update campaign status." });
        }
    }
}
