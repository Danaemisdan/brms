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

        const product = await prisma.product.findUnique({
            where: { id: product_id }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        if (product.filled_slots >= product.total_slots) {
            return NextResponse.json({ error: "Sorry, this product is sold out." }, { status: 400 });
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
                status: "Order Validating",
                remarks: "Order Validating"
            },
            include: {
                product: true
            }
        });

        const newFilledSlots = product.filled_slots + 1;
        
        await prisma.product.update({
            where: { id: product_id },
            data: { 
                filled_slots: newFilledSlots,
                status: newFilledSlots >= product.total_slots ? "SOLD_OUT" : product.status
            }
        });

        // Create an in-app notification for the customer
        await prisma.notification.create({
            data: {
                user_id: session.userId,
                type: 'GENERAL',
                title: 'Order Submitted - Under Validation',
                message: `Your order #${order_id} for "${product.product_name}" is currently being manually reviewed by our admin team. You will receive an email once it is confirmed.`,
                channel: 'DASHBOARD'
            }
        }).catch(err => console.error("Notification creation error:", err));

        // Push to Google Sheets in the background
        // IMPORTANT: Await the sheet sync so Vercel doesn't kill the background task!
        await syncOrderToSheet(order.id).catch(err => console.error("Sheet sync error:", err));

        return NextResponse.json({ message: "Order submitted successfully", order }, { status: 201 });
    } catch (error: any) {
        console.error("Error submitting order proof:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "This Order ID has already been submitted." }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to submit order proof." }, { status: 500 });
    }
}
