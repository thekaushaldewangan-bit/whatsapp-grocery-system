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
import settingsRoutes from './routes/settings.js';

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
  origin: true,
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
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      logger.info('⚡ Using in-memory MongoDB (demo mode - data resets on restart)');
    }

    await mongoose.connect(uri);
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
app.use('/api/settings', settingsRoutes);

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

// ==================== AUTO-SEED (for demo/fresh deployments) ====================
async function autoSeed() {
  const Product = (await import('./models/Product.js')).default;
  const Admin = (await import('./models/Admin.js')).default;

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    logger.info('🌱 No products found, auto-seeding...');
    const sampleProducts = [
      { name: 'Apple', description: 'Fresh red apples', category: 'fruits', price: 80, unit: 'kg', stock: 50 },
      { name: 'Banana', description: 'Fresh yellow bananas', category: 'fruits', price: 40, unit: 'dozen', stock: 30 },
      { name: 'Orange', description: 'Fresh citrus oranges', category: 'fruits', price: 60, unit: 'kg', stock: 25 },
      { name: 'Carrot', description: 'Fresh orange carrots', category: 'vegetables', price: 50, unit: 'kg', stock: 40 },
      { name: 'Onion', description: 'Fresh white onions', category: 'vegetables', price: 30, unit: 'kg', stock: 100 },
      { name: 'Tomato', description: 'Fresh red tomatoes', category: 'vegetables', price: 40, unit: 'kg', stock: 60 },
      { name: 'Potato', description: 'Fresh potatoes', category: 'vegetables', price: 25, unit: 'kg', stock: 150 },
      { name: 'Milk', description: 'Fresh whole milk', category: 'dairy', price: 60, unit: 'liter', stock: 100 },
      { name: 'Butter', description: 'Fresh creamery butter', category: 'dairy', price: 250, unit: 'kg', stock: 20 },
      { name: 'Cheese', description: 'Processed cheese', category: 'dairy', price: 350, unit: 'kg', stock: 15 },
      { name: 'Rice', description: 'Basmati rice', category: 'grains', price: 80, unit: 'kg', stock: 80 },
      { name: 'Bread', description: 'Fresh white bread', category: 'bakery', price: 50, unit: 'piece', stock: 30 },
      { name: 'Tea', description: 'Premium tea leaves', category: 'beverages', price: 200, unit: 'kg', stock: 25 },
      { name: 'Coffee', description: 'Ground coffee', category: 'beverages', price: 350, unit: 'kg', stock: 20 },
      { name: 'Chips', description: 'Potato chips', category: 'snacks', price: 30, unit: 'piece', stock: 100 },
    ];
    await Product.insertMany(sampleProducts);
    logger.info(`✅ Seeded ${sampleProducts.length} products`);
  }

  const SettingsModel = (await import('./models/Settings.js')).default;
  const { DEFAULT_SETTINGS } = await import('./models/Settings.js');
  const settingsCount = await SettingsModel.countDocuments();
  if (settingsCount === 0) {
    for (const s of DEFAULT_SETTINGS) {
      await SettingsModel.set(s.key, process.env[s.key.toUpperCase()] || s.value, { label: s.label, group: s.group });
    }
    logger.info(`✅ Seeded ${DEFAULT_SETTINGS.length} default settings`);
  }

  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const admin = new Admin({
      email: 'admin@grocery.com',
      password: 'Admin@123',
      fullName: 'Default Admin',
      role: 'admin'
    });
    await admin.save();
    logger.info('✅ Default admin created: admin@grocery.com / Admin@123');
  }
}

// ==================== START SERVER ====================
async function startServer() {
  await connectDB();
  await autoSeed();

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

