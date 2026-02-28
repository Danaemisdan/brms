import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

function requireSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
    const value = process.env[name];
    if (!value || value.length < 32 || value.includes('change_me')) {
        throw new Error(`${name} is missing or weak. Set a strong secret (>=32 chars) in environment variables.`);
    }
    return value;
}

const JWT_SECRET = requireSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = requireSecret('JWT_REFRESH_SECRET');

interface TokenPayload {
    userId: string;
    role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}
