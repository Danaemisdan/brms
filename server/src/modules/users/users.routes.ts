import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';
import bcrypt from 'bcrypt';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';
import { decryptBankData, encryptBankData } from '../../utils/encryption';

const router = Router();

const createBrandSchema = z.object({
    brand_name: z.string().min(2, 'Brand name is required'),
    mobile: z.string().regex(/^\d{10}$/, 'Valid 10-digit mobile number is required'),
    email: z.string().email('Invalid email format').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

function firstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? 'Invalid request payload';
}

// POST /api/users/brand
// Admin only endpoint to create a new Brand (Vendor) user
router.post('/brand', authMiddleware, roleGuard('ADMIN'), async (req: Request, res: Response) => {
    try {
        const parsed = createBrandSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: firstValidationError(parsed.error) });
            return;
        }

        const { brand_name, mobile, email, password } = parsed.data;

        // Check if mobile or email exists
        const existingMobile = await prisma.user.findUnique({ where: { mobile } });
        if (existingMobile) {
            res.status(409).json({ error: 'User with this mobile already exists' });
            return;
        }

        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });
            if (existingEmail) {
                res.status(409).json({ error: 'User with this email already exists' });
                return;
            }
        }

        const password_hash = await bcrypt.hash(password, 10);

        // Run transaction to create User and Vendor profile
        const newBrandUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: brand_name,
                    mobile,
                    email: email || null,
                    password_hash,
                    role: 'VENDOR',
                }
            });

            await tx.vendor.create({
                data: {
                    user_id: user.id,
                }
            });

            return user;
        });

        res.status(201).json({
            message: 'Brand account created successfully',
            user: {
                id: newBrandUser.id,
                name: newBrandUser.name,
                role: newBrandUser.role,
                mobile: newBrandUser.mobile,
            }
        });

    } catch (error) {
        console.error('Create Brand Error:', error);
        res.status(500).json({ error: 'Failed to create brand account' });
    }
});

// GET /api/users/brands
// Retrieve list of brands for Admin table
router.get('/brands', authMiddleware, roleGuard('ADMIN'), async (req: Request, res: Response) => {
    try {
        const brands = await prisma.user.findMany({
            where: { role: 'VENDOR' },
            include: { managed_vendors: true },
            orderBy: { created_at: 'desc' }
        });

        const formatted = brands.map(b => ({
            id: b.id,
            name: b.name,
            mobile: b.mobile,
            email: b.email,
            status: b.managed_vendors?.[0]?.status || 'active',
            // NOTE: prisma.user.products relation isn't direct for VENDORS in the schema.
            // Products are linked to CLIENT. For now, just send a default or calculate properly.
            products: 0
        }));

        res.json({ brands: formatted });
    } catch (error) {
        console.error('Fetch Brands Error:', error);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

// GET /api/users/profile
// Retrieve current user's profile and payment information
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let paymentMethodString: string | null = null;
        if (user.encrypted_bank_data) {
            try {
                const parsed = decryptBankData(user.encrypted_bank_data);
                paymentMethodString = parsed?.payment_method_string || null;
            } catch {
                paymentMethodString = null;
            }
        }

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                encrypted_bank_data: paymentMethodString,
            }
        });
    } catch (error) {
        console.error('Fetch Profile Error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PUT /api/users/bank-details
// Update current user's payment details (UPI or Bank)
router.put('/bank-details', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { payment_method_string } = req.body;

        if (!payment_method_string) {
            res.status(400).json({ error: 'Payment information string is required' });
            return;
        }

        await prisma.user.update({
            where: { id: req.user!.userId },
            data: { encrypted_bank_data: encryptBankData({ payment_method_string }) }
        });

        res.json({ message: 'Payment details updated successfully' });
    } catch (error) {
        console.error('Update Bank Details Error:', error);
        res.status(500).json({ error: 'Failed to update payment details' });
    }
});

export default router;
