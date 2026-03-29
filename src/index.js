import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import whatsappRoutes from './routes/whatsapp.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

import errorHandler from './middlewares/errorHandler.js';
import logger from './utils/logger.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.REACT_APP_ADMIN_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve QR code images statically
app.use('/qrcodes', express.static(path.join(__dirname, '../qrcodes')));

// ==================== DATABASE CONNECTION ====================
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-grocery');
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// ==================== ROUTES ====================
app.use('/api/webhook', whatsappRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Serve admin dashboard in production
if (process.env.NODE_ENV === 'production') {
  const adminBuildPath = path.join(__dirname, '../admin-dashboard/dist');
  app.use(express.static(adminBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(adminBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'WhatsApp Grocery Ordering System API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        webhook: '/api/webhook/whatsapp',
        products: '/api/products',
        orders: '/api/orders',
        admin: '/api/admin'
      }
    });
  });
}

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

// ==================== START SERVER ====================
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📱 WhatsApp webhook: http://localhost:${PORT}/api/webhook/whatsapp`);
  });
}

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;

