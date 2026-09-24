import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const searchParams = req.nextUrl.searchParams;
        const fieldName = searchParams.get('field');

        if (!fieldName) {
            return new NextResponse('Field name is required', { status: 400 });
        }

        const record = await prisma.customRecord.findUnique({
            where: { id }
        });

        if (!record || !record.data) {
            return new NextResponse('Not found', { status: 404 });
        }

        const data = record.data as Record<string, any>;
        const base64Str = data[fieldName];

        if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
            return new NextResponse('No image data found for this field', { status: 404 });
        }

        // Example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
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
        console.error('Fetch custom image error:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
