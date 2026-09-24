import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const searchParams = req.nextUrl.searchParams;
        const fieldName = searchParams.get('field'); // screenshot_url, return_window_screenshot, review_screenshot

        if (!fieldName) {
            return new NextResponse('Field name is required', { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: { review: true }
        });

        if (!order) {
            return new NextResponse('Not found', { status: 404 });
        }

        let base64Str = null;
        if (fieldName === 'screenshot_url') base64Str = order.screenshot_url;
        else if (fieldName === 'return_window_screenshot') base64Str = order.return_window_screenshot_url;
        else if (fieldName === 'review_screenshot' && order.review) base64Str = order.review.screenshot_url;

        if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
            return new NextResponse('No image data found for this field', { status: 404 });
        }

        const matches = base64Str.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
            return new NextResponse('Invalid image data', { status: 400 });
        }

        const extension = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': `image/${extension}`,
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            }
        });
    } catch (error) {
        console.error('Fetch order image error:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
