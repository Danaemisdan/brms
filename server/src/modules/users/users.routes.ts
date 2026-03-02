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

        const newBrandUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: brand_name,
                    mobile,
                    email: email || null,
                    password_hash,
                    role: 'VENDOR',
                    poc_name: req.body.poc_name || null,
                    website: req.body.website || null,
                    country: req.body.country || 'India',
                    category: req.body.category || null,
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

// PUT /api/users/brand/:id
// Admin: Edit a brand account
router.put('/brand/:id', authMiddleware, roleGuard('ADMIN'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { brand_name, mobile, email, password, poc_name, website, country } = req.body;

        if (!brand_name || !mobile) {
            res.status(400).json({ error: 'Brand name and mobile are required' });
            return;
        }

        // Check for duplicates
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: { email, AND: { id: { not: id } } }
            });
            if (existingEmail) {
                res.status(400).json({ error: 'Email already in use by another account' });
                return;
            }
        }

        const existingMobile = await prisma.user.findFirst({
            where: { mobile, AND: { id: { not: id } } }
        });
        if (existingMobile) {
            res.status(400).json({ error: 'Mobile already in use by another account' });
            return;
        }

        let updateData: any = {
            name: brand_name,
            mobile: mobile,
            email: email || null,
            poc_name: poc_name || null,
            website: website || null,
            country: country || 'India',
            category: req.body.category || null,
        };

        if (password && password.trim().length >= 6) {
            const bcrypt = require('bcrypt');
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        });

        res.json({ message: 'Brand updated successfully' });
    } catch (error) {
        console.error('Update Brand Error:', error);
        res.status(500).json({ error: 'Failed to update brand account' });
    }
});
// Admin: Add or remove funds from a brand's wallet
router.put('/brand/:id/wallet', authMiddleware, roleGuard('ADMIN'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, action } = req.body; // action: 'add' or 'remove'

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ error: 'Valid positive amount is required' });
            return;
        }

        if (action !== 'add' && action !== 'remove') {
            res.status(400).json({ error: 'Action must be "add" or "remove"' });
            return;
        }

        const vendor = await prisma.vendor.findUnique({
            where: { user_id: id }
        });

        if (!vendor) {
            res.status(404).json({ error: 'Brand profile not found' });
            return;
        }

        let newBalance = vendor.wallet_balance;
        if (action === 'add') {
            newBalance += amount;
        } else if (action === 'remove') {
            if (newBalance < amount) {
                res.status(400).json({ error: 'Insufficient wallet balance' });
                return;
            }
            newBalance -= amount;
        }

        const updatedVendor = await prisma.vendor.update({
            where: { user_id: id },
            data: { wallet_balance: newBalance }
        });

        res.json({
            message: `Successfully ${action === 'add' ? 'added funds to' : 'removed funds from'} wallet`,
            wallet_balance: updatedVendor.wallet_balance
        });
    } catch (error) {
        console.error('Update Wallet Error:', error);
        res.status(500).json({ error: 'Failed to update wallet balance' });
    }
});

// GET /api/users/brands
// Retrieve list of brands for Admin table
router.get('/brands', authMiddleware, roleGuard('ADMIN'), async (req: Request, res: Response) => {
    try {
        const brands = await prisma.user.findMany({
            where: { role: 'VENDOR' },
            include: {
                vendor: true, // Include the related Vendor model for status
                _count: {
                    select: {
                        orders: true // Count orders for the 'products' field
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const formattedBrands = brands.map(brand => ({
            id: brand.id,
            name: brand.name,
            email: brand.email,
            mobile: brand.mobile,
            poc_name: brand.poc_name,
            website: brand.website,
            country: brand.country,
            category: brand.category,
            registered_at: brand.created_at,
            status: brand.vendor?.status || 'active',
            wallet_balance: brand.vendor?.wallet_balance || 0,
            products: brand._count.orders
        }));

        res.json({ brands: formattedBrands });
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
