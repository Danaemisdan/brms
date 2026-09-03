import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { encryptBankData } from '@/lib/encryption';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { review_url, upi_id, review_screenshot, qr_code_url } = body;

        if (!review_screenshot) {
            return NextResponse.json({ error: "Review screenshot is mandatory." }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { product: true, user: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found." }, { status: 404 });
        }

        if (order.user_id !== session.userId) {
            return NextResponse.json({ error: "Unauthorized access to this order." }, { status: 403 });
        }

        const review = await prisma.review.create({
            data: {
                order_id: order.id,
                screenshot_url: review_screenshot || "",
                review_url: review_url || "",
                rating: 5,
                review_date: new Date(),
                approval_status: "SUBMITTED"
            }
        });

        await prisma.refund.create({
            data: {
                order_id: order.id,
                user_id: order.user_id,
                amount: order.product.refund_amount || 0,
                status: "PENDING",
                qr_code_url: qr_code_url || null
            }
        });

        if (upi_id || !qr_code_url) {
            await prisma.user.update({
                where: { id: order.user_id },
                data: { encrypted_bank_data: encryptBankData({ payment_method_string: upi_id || "QR Code Provided" }) }
            });
        }

        await prisma.agentTask.create({
            data: {
                task_type: 'REVIEW_VERIFY',
                status: 'PENDING',
                dedupe_key: `review:${review.id}`,
                payload: JSON.stringify({
                    review_id: review.id,
                    order_id: order.id,
                    product_url: order.product.product_link,
                    screenshot_data: review_screenshot,
                }),
            },
        });

        return NextResponse.json({ message: "Refund claimed successfully! Review is pending AI verification." }, { status: 200 });
    } catch (error: any) {
        console.error("Error claiming refund:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Refund or review already exists for this order." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to claim refund." }, { status: 500 });
    }
}
