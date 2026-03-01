import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';

const router = express.Router();

// Define storage location and filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../uploads/products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Upload up to 6 images with proper error catching
router.post('/products', authMiddleware, roleGuard('ADMIN', 'VENDOR'), (req, res) => {
    upload.array('images', 6)(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error("Multer Parsing Error:", err);
            return res.status(500).json({ error: err.message });
        } else if (err) {
            console.error("Unknown Upload Error:", err);
            return res.status(500).json({ error: 'Failed to upload images' });
        }

        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const urls = req.files.map((file: any) => `/uploads/products/${file.filename}`);
            res.status(200).json({ urls });
        } catch (error) {
            console.error('Upload Error:', error);
            res.status(500).json({ error: 'Failed to process images' });
        }
    });
});

export default router;
