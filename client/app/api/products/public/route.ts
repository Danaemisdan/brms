import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const campaigns = await prisma.product.findMany({
            where: {
                status: "ACTIVE",
                is_public: true,
            },
            orderBy: {
                created_at: "desc",
            },
            take: 12, // Limit to 12 for the homepage display
            select: {
                id: true,
                product_name: true,
                product_image: true,
                brand: true,
                real_price: true,
                offer_price: true,
                refund_amount: true,
                total_slots: true,
                filled_slots: true,
                deadline: true,
                deal_type: true
            }
        });

        return NextResponse.json({ message: "Public campaigns fetched successfully", data: campaigns }, { status: 200 });
    } catch (error) {
        console.error("Error fetching public campaigns:", error);
        return NextResponse.json({ error: "Error fetching campaigns" }, { status: 500 });
    }
}
