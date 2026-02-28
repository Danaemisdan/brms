import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { encryptBankData } from '../../utils/encryption';

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';

const mobileSchema = z.string().regex(/^\d{10}$/, 'Valid 10-digit mobile number is required');

const registerSchema = z.object({
    name: z.string().trim().min(2, 'Name is required').max(100, 'Name is too long'),
    mobile: mobileSchema,
    email: z.union([z.string().trim().email('Invalid email format'), z.literal('')]).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    ecommerce_profile_url: z.union([z.string().trim().url('Invalid e-commerce profile URL'), z.literal('')]).optional(),
});

const loginSchema = z.object({
    identifier: z.string().min(1, 'Mobile or Email is required'),
    password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1),
}).partial();

function firstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? 'Invalid request payload';
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

function clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
    });
}

// POST /api/auth/register (Customers Only)
router.post('/register', async (req: Request, res: Response) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: firstValidationError(parsed.error) });
            return;
        }

        const {
            name,
            mobile,
            email,
            password,
            ecommerce_profile_url,
        } = parsed.data;

        const existingMobile = await prisma.user.findUnique({ where: { mobile } });
        if (existingMobile) {
            res.status(409).json({ error: 'User with this mobile already exists' });
            return;
        }

        if (email?.trim()) {
            const existingEmail = await prisma.user.findUnique({ where: { email: email.trim() } });
            if (existingEmail) {
                res.status(409).json({ error: 'User with this email already exists' });
                return;
            }
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                mobile,
                email: email?.trim() || null,
                password_hash,
                ecommerce_profile_url: ecommerce_profile_url?.trim() || null,
                role: 'CUSTOMER',
            },
        });

        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
        setAuthCookies(res, accessToken, refreshToken);

        res.status(201).json({
            message: 'Registration successful',
            token: accessToken,
            user: { id: user.id, name: user.name, role: user.role },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ error: 'User with this mobile or email already exists' });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: firstValidationError(parsed.error) });
            return;
        }

        const { identifier, password } = parsed.data;

        // Find by mobile or email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { mobile: identifier },
                    { email: identifier }
                ]
            }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (!user.password_hash) {
            res.status(401).json({ error: 'Account not set up with a password. Please contact support.' });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const accessToken = generateAccessToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
        setAuthCookies(res, accessToken, refreshToken);

        res.json({
            message: 'Login successful',
            token: accessToken,
            user: { id: user.id, name: user.name, role: user.role },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const parsed = refreshSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            res.status(400).json({ error: firstValidationError(parsed.error) });
            return;
        }

        const refreshToken = req.cookies?.refreshToken || parsed.data.refreshToken;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
            return;
        }

        const newAccessToken = generateAccessToken({ userId: payload.userId, role: payload.role });
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000,
        });

        res.json({ message: 'Token refreshed' });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: true,
                ecommerce_profile_url: true,
                created_at: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

export default router;
