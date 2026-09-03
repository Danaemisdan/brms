import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');
        
        if (token !== "brms_export_secret_123") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const orders = await prisma.order.findMany({
            include: {
                user: true,
                product: true
            },
            orderBy: { created_at: 'desc' }
        });

        const headers = ["Profile Name", "Order id", "Product Name", "Product Cost", "Order Screenshot", "Deal Screenshot", "Return Window SS", "Remarks"];
        
        const rows = orders.map(order => [
            `"${(order.user?.name || "").replace(/"/g, '""')}"`,
            `"${(order.order_id || "").replace(/"/g, '""')}"`,
            `"${(order.product?.product_name || "").replace(/"/g, '""')}"`,
            `"${order.amount || 0}"`,
            `"${order.screenshot_url || ""}"`,
            `"${order.deal_screenshot_url || ""}"`,
            `"${order.return_window_screenshot_url || ""}"`,
            `"${(order.remarks || "").replace(/"/g, '""')}"`
        ].join(","));

        const csvContent = [headers.join(","), ...rows].join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="orders_export.csv"',
            }
        });
    } catch (error) {
        console.error("Error exporting orders:", error);
        return new NextResponse("Error generating export", { status: 500 });
    }
}
