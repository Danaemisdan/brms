import { NextRequest, NextResponse } from 'next/server';

const AGENT_SECRET_KEY = process.env.AGENT_SECRET_KEY || '';

export function ensureAgentAuth(req: NextRequest): NextResponse | null {
    if (!AGENT_SECRET_KEY) {
        return NextResponse.json({ error: 'AGENT_SECRET_KEY is not configured on server.' }, { status: 500 });
    }
    const authHeader = req.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${AGENT_SECRET_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized agent access.' }, { status: 401 });
    }
    return null; // Authorization successful
}
