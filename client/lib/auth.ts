import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';

export interface AuthSession {
    userId: string;
    role: string;
}

export function getSession(req: NextRequest): AuthSession | null {
    const authHeader = req.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else {
        token = req.cookies.get('accessToken')?.value || '';
    }

    if (!token) return null;

    const decoded = verifyAccessToken(token);
    if (!decoded) return null;

    return decoded as AuthSession;
}

export function requireAuth(req: NextRequest): AuthSession | NextResponse {
    const session = getSession(req);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return session;
}

export function requireRole(req: NextRequest, allowedRoles: string[]): AuthSession | NextResponse {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    if (!allowedRoles.includes(session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return session;
}
