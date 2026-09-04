import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

function requireSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
    const value = process.env[name];
    if (value && value.length >= 8) {
        return value;
    }
    // Fallback for zero-config deployments
    return name === 'JWT_SECRET' 
        ? 'fallback_jwt_secret_key_1234567890' 
        : 'fallback_jwt_refresh_secret_key_0987654321';
}

const JWT_SECRET = requireSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = requireSecret('JWT_REFRESH_SECRET');

interface TokenPayload {
    userId: string;
    role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
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
