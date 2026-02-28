import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const cookieToken = req.cookies?.accessToken as string | undefined;
    const token = headerToken || cookieToken;

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    const payload = verifyAccessToken(token);

    if (!payload) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    req.user = payload;
    next();
}
