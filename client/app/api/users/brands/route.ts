import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const brands = await prisma.user.findMany({
            where: { role: 'VENDOR' },
            include: {
                vendor: true,
                _count: {
                    select: {
                        orders: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const formattedBrands = brands.map(brand => ({
            id: brand.id,
            name: brand.name,
            email: brand.email,
            mobile: brand.mobile,
            poc_name: brand.poc_name,
            website: brand.website,
            country: brand.country,
            category: brand.category,
            registered_at: brand.created_at,
            status: brand.vendor?.status || 'active',
            wallet_balance: brand.vendor?.wallet_balance || 0,
            commission: brand.vendor?.commission || 0,
            products: brand._count.orders
        }));

        return NextResponse.json({ brands: formattedBrands }, { status: 200 });
    } catch (error) {
        console.error('Fetch Brands Error:', error);
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }
}
