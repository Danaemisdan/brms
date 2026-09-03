import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const totalUsers = await prisma.user.count({ where: { role: "CUSTOMER" } });
        const totalBrands = await prisma.user.count({ where: { role: "VENDOR" } });

        const activeProducts = await prisma.product.count({ where: { status: "ACTIVE" } });

        const orders = await prisma.order.findMany({
            include: { refund: true }
        });

        const totalOrders = orders.length;
        const completedRefunds = orders.filter(o => o.refund?.status === "REFUNDED");
        const totalRefundedAmount = completedRefunds.reduce((sum, o) => sum + (o.refund?.amount || 0), 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsers = await prisma.user.findMany({
            where: {
                role: "CUSTOMER",
                created_at: { gte: thirtyDaysAgo }
            },
            select: { created_at: true }
        });

        const signupsByDay = recentUsers.reduce((acc: any, user) => {
            const date = user.created_at.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().split('T')[0];
        const todayDate = new Date().toISOString().split('T')[0];
        if (!signupsByDay[thirtyDaysAgoDate]) signupsByDay[thirtyDaysAgoDate] = 0;
        if (!signupsByDay[todayDate]) signupsByDay[todayDate] = 0;

        const signupTrend = Object.entries(signupsByDay)
            .map(([date, count]) => ({ date, signups: count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const products = await prisma.product.findMany({
            select: {
                id: true,
                product_name: true,
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: {
                orders: { _count: 'desc' }
            },
            take: 5
        });

        const topProducts = products.map(p => ({
            name: p.product_name,
            orders: p._count.orders
        }));

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
