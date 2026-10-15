export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const totalUsers = await prisma.user.count({ where: { role: "CUSTOMER" } });
        const totalBrands = await prisma.user.count({ where: { role: "VENDOR" } });

        const activeProducts = await prisma.product.count({ 
            where: { status: { equals: "ACTIVE", mode: "insensitive" } } 
        });

        const orders = await prisma.order.findMany({
            select: {
                id: true,
                created_at: true,
                order_date: true,
                amount: true,
                status: true,
                refund: {
                    select: {
                        status: true,
                        amount: true
                    }
                }
            }
        });

        const totalOrders = orders.length;
        const completedRefunds = orders.filter(o => o.refund?.status === "REFUNDED");
        const totalRefundedAmount = completedRefunds.reduce((sum, o) => sum + (o.refund?.amount || 0), 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const recentUsers = await prisma.user.findMany({
            where: {
                role: "CUSTOMER",
                created_at: { gte: thirtyDaysAgo }
            },
            select: { created_at: true }
        });

        // Continuous 30-day timeline with both signups and orders
        const dailyMap: Record<string, { signups: number; orders: number; date: string; label: string }> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailyMap[key] = { signups: 0, orders: 0, date: key, label };
        }

        recentUsers.forEach(u => {
            const key = u.created_at.toISOString().split('T')[0];
            if (dailyMap[key]) {
                dailyMap[key].signups++;
            }
        });

        orders.forEach(o => {
            const orderDt = o.created_at || o.order_date;
            if (orderDt) {
                const key = orderDt.toISOString().split('T')[0];
                if (dailyMap[key]) {
                    dailyMap[key].orders++;
                }
            }
        });

        const signupTrend = Object.values(dailyMap).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Fetch top products with rich campaign metrics
        const products = await prisma.product.findMany({
            select: {
                id: true,
                product_name: true,
                product_image: true,
                platform: true,
                brand: true,
                total_slots: true,
                filled_slots: true,
                refund_amount: true,
                offer_price: true,
                real_price: true,
                status: true,
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: [
                { orders: { _count: 'desc' } },
                { created_at: 'desc' }
            ],
            take: 6
        });

        const topProducts = products.map(p => {
            let img = "";
            try {
                if (p.product_image) {
                    if (p.product_image.startsWith("[")) {
                        const parsed = JSON.parse(p.product_image);
                        img = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "";
                    } else {
                        img = p.product_image;
                    }
                }
            } catch (_) {}

            return {
                id: p.id,
                name: p.product_name,
                shortName: p.product_name.length > 24 ? p.product_name.substring(0, 22) + "..." : p.product_name,
                platform: p.platform || "AMAZON",
                brand: p.brand || "Brand",
                orders: p._count.orders,
                total_slots: p.total_slots || 0,
                filled_slots: Math.max(p.filled_slots || 0, p._count.orders),
                refund_amount: p.refund_amount || p.offer_price || 0,
                status: p.status || "ACTIVE",
                image: img || ""
            };
        });

        return NextResponse.json({
            kpis: {
                totalUsers,
                totalBrands,
                activeProducts,
                totalOrders,
                totalRefundedAmount
            },
            signupTrend,
            topProducts
        }, { status: 200 });
    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
    }
}
