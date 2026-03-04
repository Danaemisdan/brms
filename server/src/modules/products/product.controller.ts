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
                wa_attachment_url,
                wa_start_date,
                wa_end_date,
                wa_times_per_day,
                wa_time_1,
                wa_time_2,
                wa_time_3
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
                    refund_amount: Math.min(Number(refund_amount) || 0, 1000000),
                    total_slots: Math.min(Number(total_slots) || 0, 1000000),
                    daily_limit: Math.min(Number(daily_limit) || 100, 1000000),
                    deadline: new Date(deadline),
                    instructions,
                    is_public: is_public !== undefined ? Boolean(is_public) : true,
                    status: initialStatus,
                    delivery_type: delivery_type || "ORIGINAL", // Added
                    exchange_image: exchange_image || null, // Added
                    wa_target: wa_target || "all_customers",
                    wa_custom_phones: wa_custom_phones || null,
                    wa_template: wa_template || null,
                    wa_attachment_url: wa_attachment_url || null,
                    wa_start_date: wa_start_date ? new Date(wa_start_date) : null,
                    wa_end_date: wa_end_date ? new Date(wa_end_date) : null,
                    wa_times_per_day: wa_times_per_day ? parseInt(wa_times_per_day) : null,
                    wa_time_1: wa_time_1 || null,
                    wa_time_2: wa_time_2 || null,
                    wa_time_3: wa_time_3 || null
                }
            });

            // User requested to use "Chat on WhatsApp" modal for immediate blasting,
            // so we no longer auto-blast upon saving here.

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
                wa_attachment_url,
                wa_start_date,
                wa_end_date,
                wa_times_per_day,
                wa_time_1,
                wa_time_2,
                wa_time_3
            } = req.body;

            const product = await prisma.product.update({
                where: { id },
                data: {
                    product_name,
                    product_image,
                    product_link,
                    platform,
                    refund_amount: refund_amount ? Math.min(parseFloat(refund_amount), 1000000) : undefined,
                    total_slots: total_slots ? Math.min(parseInt(total_slots), 1000000) : undefined,
                    daily_limit: daily_limit ? Math.min(parseInt(daily_limit), 1000000) : undefined,
                    deadline: deadline ? new Date(deadline) : undefined,
                    instructions,
                    status,
                    is_public: is_public !== undefined ? Boolean(is_public) : undefined,
                    wa_target: wa_target !== undefined ? wa_target : undefined,
                    wa_custom_phones: wa_custom_phones !== undefined ? wa_custom_phones : undefined,
                    wa_template: wa_template !== undefined ? wa_template : undefined,
                    wa_attachment_url: wa_attachment_url !== undefined ? wa_attachment_url : undefined,
                    wa_start_date: wa_start_date ? new Date(wa_start_date) : (wa_start_date === null ? null : undefined),
                    wa_end_date: wa_end_date ? new Date(wa_end_date) : (wa_end_date === null ? null : undefined),
                    wa_times_per_day: wa_times_per_day !== undefined ? (wa_times_per_day === null ? null : parseInt(wa_times_per_day)) : undefined,
                    wa_time_1: wa_time_1 !== undefined ? wa_time_1 : undefined,
                    wa_time_2: wa_time_2 !== undefined ? wa_time_2 : undefined,
                    wa_time_3: wa_time_3 !== undefined ? wa_time_3 : undefined
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
