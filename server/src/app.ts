import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import prisma from './config/database';
import authRoutes from './modules/auth/auth.controller';
import usersRoutes from './modules/users/users.routes';
import productRoutes from './modules/products/product.routes';
import orderRoutes from './modules/orders/order.routes';
import uploadRoutes from './modules/upload/upload.routes';
import supportRoutes from './modules/support/support.routes';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes';
import agentRoutes from './modules/refunds/agent.routes';
import { startWhatsAppScheduler } from './jobs/wa_scheduler';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Static serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/refunds', agentRoutes);

// Start Background Jobs
startWhatsAppScheduler();

// Start Server
const server = app.listen(PORT, () => {
    console.log(`🚀 BRMS Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await prisma.$disconnect();
    server.close(() => {
        console.log('HTTP server closed');
    });
});

export { app, prisma };
