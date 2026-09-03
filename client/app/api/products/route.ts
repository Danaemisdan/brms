import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN', 'VENDOR', 'CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        const whereClause = session.role === "CUSTOMER" ? { status: 'ACTIVE', is_public: true } : {};

        const products = await prisma.product.findMany({
            where: whereClause,
            include: {
                orders: true
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json({ products }, { status: 200 });
    } catch (error) {
        console.error("Error fetching all campaigns:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN', 'VENDOR']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json().catch(() => ({}));
        const {
            client_id,
            brand,
            product_name,
            product_image,
            product_link,
            platform,
            real_price,
            offer_price,
            refund_amount,
            deal_type,
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
        } = body;

        let validClientId = client_id;
        const clientExists = validClientId ? await prisma.client.findUnique({ where: { id: validClientId } }) : null;

        if (!clientExists) {
            let defaultClient = await prisma.client.findFirst();
            if (!defaultClient) {
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

        const initialStatus = session.role === 'VENDOR' ? "REQUESTED" : "ACTIVE";

        const product = await prisma.product.create({
            data: {
                client_id: validClientId,
                brand,
                product_name,
                product_image,
                product_link,
                platform,
                real_price: real_price ? parseFloat(real_price) : null,
                offer_price: offer_price ? parseFloat(offer_price) : null,
                refund_amount: refund_amount ? Math.min(Number(refund_amount) || 0, 1000000) : null,
                deal_type: deal_type || "Review Deal",
                total_slots: Math.min(Number(total_slots) || 0, 1000000),
                daily_limit: Math.min(Number(daily_limit) || 100, 1000000),
                deadline: new Date(deadline),
                instructions,
                is_public: is_public !== undefined ? Boolean(is_public) : true,
                status: initialStatus,
                delivery_type: delivery_type || "ORIGINAL",
                exchange_image: exchange_image || null,
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

        return NextResponse.json({ message: "Campaign created successfully", product }, { status: 201 });
    } catch (error: any) {
        console.error("🔴 ERROR CREATING PRODUCT START 🔴");
        console.error(error);
        console.error("🔴 ERROR CREATING PRODUCT END 🔴");
        return NextResponse.json({ error: error.message || "Failed to create campaign." }, { status: 500 });
    }
}
