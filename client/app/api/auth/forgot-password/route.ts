import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { email } = body;
        
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "default_secret", { expiresIn: '1h' });
        
        const clientUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.CLIENT_URL || "http://localhost:3000";
        const resetLink = `${clientUrl}/login?reset_token=${token}`;

        await sendEmail(
            user.email!,
            "Password Reset Request",
            `<h1>Password Reset</h1>
             <p>You requested a password reset. Click the link below to reset your password. It is valid for 1 hour.</p>
             <a href="${resetLink}">${resetLink}</a>`
        );

        return NextResponse.json({ message: "Password reset link sent to email" }, { status: 200 });
    } catch (error) {
        console.error("Error in forgot-password:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
