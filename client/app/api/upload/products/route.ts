import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN', 'VENDOR']);
    if (session instanceof NextResponse) return session;

    try {
        const formData = await req.formData();
        const files = formData.getAll('images') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        const urls: string[] = [];

        for (const file of files) {
            const buffer = await file.arrayBuffer();
            const base64String = Buffer.from(buffer).toString('base64');
            const dataUri = `data:${file.type};base64,${base64String}`;
            urls.push(dataUri);
        }

        return NextResponse.json({ urls }, { status: 200 });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Failed to process images' }, { status: 500 });
    }
}
