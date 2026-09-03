import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN', 'VENDOR']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        
        const {
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
        } = body;

        const product = await prisma.product.update({
            where: { id },
            data: {
                product_name,
                product_image,
                product_link,
                platform,
                real_price: real_price !== undefined ? (real_price ? parseFloat(real_price) : null) : undefined,
                offer_price: offer_price !== undefined ? (offer_price ? parseFloat(offer_price) : null) : undefined,
                refund_amount: refund_amount !== undefined ? (refund_amount ? Math.min(parseFloat(refund_amount), 1000000) : null) : undefined,
                deal_type: deal_type !== undefined ? deal_type : undefined,
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

        return NextResponse.json({ message: "Campaign updated successfully", product }, { status: 200 });
    } catch (error) {
        console.error("Error updating campaign:", error);
        return NextResponse.json({ error: "Failed to update campaign." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN', 'VENDOR']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

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

        return NextResponse.json({ message: "Campaign and all associated items deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return NextResponse.json({ error: "Failed to delete campaign due to an internal constraint." }, { status: 500 });
    }
}
