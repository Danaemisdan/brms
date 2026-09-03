import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { requireRole } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { brand_name, mobile, email, password, poc_name, website, country, category, commission } = body;

        if (!brand_name || !mobile) {
            return NextResponse.json({ error: 'Brand name and mobile are required' }, { status: 400 });
        }

        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: { email, AND: { id: { not: id } } }
            });
            if (existingEmail) {
                return NextResponse.json({ error: 'Email already in use by another account' }, { status: 400 });
            }
        }

        const existingMobile = await prisma.user.findFirst({
            where: { mobile, AND: { id: { not: id } } }
        });
        if (existingMobile) {
            return NextResponse.json({ error: 'Mobile already in use by another account' }, { status: 400 });
        }

        let updateData: any = {
            name: brand_name,
            mobile: mobile,
            email: email || null,
            poc_name: poc_name || null,
            website: website || null,
            country: country || 'India',
            category: category || null,
        };

        if (password && password.trim().length >= 6) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        });

        if (commission !== undefined) {
            await prisma.vendor.update({
                where: { user_id: id },
                data: { commission: parseFloat(commission) || 0 }
            });
        }

        return NextResponse.json({ message: 'Brand updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Update Brand Error:', error);
        return NextResponse.json({ error: 'Failed to update brand account' }, { status: 500 });
    }
}
