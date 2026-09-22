import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ type: string; id: string }> }
) {
    try {
        const { type, id } = await context.params;
        const searchParams = request.nextUrl.searchParams;
        const field = searchParams.get('field') || 'screenshot_url';
        
        let base64Data = null;

        if (type === 'order') {
            const order = await prisma.order.findUnique({
                where: { id },
                include: { review: true }
            });
            if (field === 'review_screenshot' && order?.review) {
                base64Data = order.review.screenshot_url;
            } else if (field === 'return_window_screenshot') {
                base64Data = order?.return_window_screenshot_url;
            } else {
                base64Data = order?.screenshot_url;
            }
        } else if (type === 'refund') {
            const refund = await prisma.refund.findUnique({
                where: { id }
            });
            base64Data = refund?.screenshot_url;
        } else if (type === 'custom') {
            const record = await prisma.customRecord.findUnique({
                where: { id }
            });
            // data is JSON, field is the key
            if (record && record.data && typeof record.data === 'object') {
                base64Data = (record.data as any)[field];
            }
        } else if (type === 'product') {
            const product = await prisma.product.findUnique({
                where: { id }
            });
            // Product can have multiple images, let's just use first
            if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
                base64Data = product.images[0];
            }
        }

        if (!base64Data || !base64Data.startsWith('data:image')) {
            return new NextResponse('Image not found or not in valid format', { status: 404 });
        }

        // Base64 format: data:image/png;base64,iVBORw0KGgo...
        const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
            return new NextResponse('Invalid image data', { status: 400 });
        }

        const mimeType = `image/${matches[1]}`;
        const buffer = Buffer.from(matches[2], 'base64');

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
            }
        });

    } catch (error) {
        console.error('Error fetching image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
