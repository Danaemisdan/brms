import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { syncOrderToSheet } from '@/lib/services/googleSheets.service';

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        const payload = await req.json();
        const { product_id, order_id, amount, profile_name, reference_name, screenshot_url } = payload;

        if (!product_id || !order_id || !amount || !profile_name || !screenshot_url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const order = await prisma.order.create({
            data: {
                order_id,
                user_id: session.userId,
                product_id,
                amount: parseFloat(amount),
                profile_name,
                reference_name: reference_name || null,
                screenshot_url: screenshot_url || "https://dummyimage.com/600x400/000/fff&text=Screenshot",
                status: "SUBMITTED"
            },
            include: {
                product: true
            }
        });

        await prisma.product.update({
            where: { id: product_id },
            data: { filled_slots: { increment: 1 } }
        });

        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (user && user.email) {
            await sendEmail(
                user.email,
                "Order Successfully Submitted",
                `<h1>Thank you for your submission!</h1>
                 <p>Your order ID <strong>${order_id}</strong> for product ID <strong>${product_id}</strong> has been successfully recorded.</p>
                 <p>You can track its status from your dashboard.</p>`
            );
        }

        // Push to Google Sheets in the background so it doesn't block the UI
        syncOrderToSheet(order.id).catch(err => console.error("Sheet sync error:", err));

        return NextResponse.json({ message: "Order proof submitted successfully", order }, { status: 201 });
    } catch (error: any) {
        console.error("Error submitting order proof:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "This Order ID has already been submitted." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to submit order proof." }, { status: 500 });
    }
}
