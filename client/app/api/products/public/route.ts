export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function parseProductImage(imgStr: string | null | undefined): string {
    if (!imgStr) return "";
    try {
        const parsed = JSON.parse(imgStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0];
        }
        if (typeof parsed === 'string') return parsed;
    } catch {
        // Not a JSON string, return as is
    }
    return imgStr.trim();
}

export async function GET() {
    try {
        // 1. Try finding active, public products with case-insensitivity
        let campaigns = await prisma.product.findMany({
            where: {
                status: { equals: "ACTIVE", mode: "insensitive" },
                is_public: true,
            },
            orderBy: {
                created_at: "desc",
            },
            take: 12,
            select: {
                id: true,
                product_name: true,
                product_image: true,
                brand: true,
                platform: true,
                real_price: true,
                offer_price: true,
                refund_amount: true,
                total_slots: true,
                filled_slots: true,
                deadline: true,
                deal_type: true
            }
        });

        // 2. If no public active products found, try any active products
        if (!campaigns || campaigns.length === 0) {
            campaigns = await prisma.product.findMany({
                where: {
                    status: { equals: "ACTIVE", mode: "insensitive" }
                },
                orderBy: {
                    created_at: "desc",
                },
                take: 12,
                select: {
                    id: true,
                    product_name: true,
                    product_image: true,
                    brand: true,
                    platform: true,
                    real_price: true,
                    offer_price: true,
                    refund_amount: true,
                    total_slots: true,
                    filled_slots: true,
                    deadline: true,
                    deal_type: true
                }
            });
        }

        // Clean & format images
        const formattedCampaigns = campaigns.map(c => ({
            ...c,
            product_image: parseProductImage(c.product_image) || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop",
            platform: c.platform || "Amazon",
            refund_amount: c.refund_amount || c.real_price || 499,
            real_price: c.real_price || c.refund_amount || 499,
            total_slots: c.total_slots || 50,
            filled_slots: c.filled_slots || 0
        }));

        return NextResponse.json({ 
            success: true,
            message: "Public campaigns fetched successfully", 
            data: formattedCampaigns 
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching public campaigns:", error);
        return NextResponse.json({ error: "Error fetching campaigns" }, { status: 500 });
    }
}
