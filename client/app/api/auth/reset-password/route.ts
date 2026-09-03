import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { token, newPassword } = body;
        
        if (!token || !newPassword) {
            return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        } catch (err) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { password_hash: hashedPassword }
        });

        return NextResponse.json({ message: "Password successfully reset" }, { status: 200 });
    } catch (error) {
        console.error("Error in reset-password:", error);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
