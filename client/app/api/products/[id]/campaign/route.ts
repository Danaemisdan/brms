import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
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
            return NextResponse.json({ error: "Campaign not found or has been removed." }, { status: 404 });
        }

        if (product.status !== "ACTIVE" && product.status !== "DRAFT") {
            return NextResponse.json({ error: `Campaign is currently ${product.status.toLowerCase()}.` }, { status: 400 });
        }

        return NextResponse.json({ product }, { status: 200 });
    } catch (error) {
        console.error("Error fetching campaign:", error);
        return NextResponse.json({ error: "Failed to fetch campaign details." }, { status: 500 });
    }
}
