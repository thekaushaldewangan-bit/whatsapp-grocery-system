import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import logger from '../utils/logger.js';

dotenv.config();

const SAMPLE_PRODUCTS = [
  // Fruits
  {
    name: 'Apple',
    description: 'Fresh red apples',
    category: 'fruits',
    price: 80,
    unit: 'kg',
    stock: 50
  },
  {
    name: 'Banana',
    description: 'Fresh yellow bananas',
    category: 'fruits',
    price: 40,
    unit: 'dozen',
    stock: 30
  },
  {
    name: 'Orange',
    description: 'Fresh citrus oranges',
    category: 'fruits',
    price: 60,
    unit: 'kg',
    stock: 25
  },
  // Vegetables
  {
    name: 'Carrot',
    description: 'Fresh orange carrots',
    category: 'vegetables',
    price: 50,
    unit: 'kg',
    stock: 40
  },
  {
    name: 'Onion',
    description: 'Fresh white onions',
    category: 'vegetables',
    price: 30,
    unit: 'kg',
    stock: 100
  },
  {
    name: 'Tomato',
    description: 'Fresh red tomatoes',
    category: 'vegetables',
    price: 40,
    unit: 'kg',
    stock: 60
  },
  {
    name: 'Potato',
    description: 'Fresh potatoes',
    category: 'vegetables',
    price: 25,
    unit: 'kg',
    stock: 150
  },
  // Dairy
  {
    name: 'Milk',
    description: 'Fresh whole milk',
    category: 'dairy',
    price: 60,
    unit: 'liter',
    stock: 100
  },
  {
    name: 'Butter',
    description: 'Fresh creamery butter',
    category: 'dairy',
    price: 250,
    unit: 'kg',
    stock: 20
  },
  {
    name: 'Cheese',
    description: 'Processed cheese',
    category: 'dairy',
    price: 350,
    unit: 'kg',
    stock: 15
  },
  {
    name: 'Yogurt',
    description: 'Fresh yogurt',
    category: 'dairy',
    price: 40,
    unit: 'piece',
    stock: 50
  },
  // Grains
  {
    name: 'Rice',
    description: 'Basmati rice',
    category: 'grains',
    price: 80,
    unit: 'kg',
    stock: 80
  },
  {
    name: 'Wheat Flour',
    description: 'All-purpose wheat flour',
    category: 'grains',
    price: 40,
    unit: 'kg',
    stock: 60
  },
  // Bakery
  {
    name: 'Bread',
    description: 'Fresh white bread',
    category: 'bakery',
    price: 50,
    unit: 'piece',
    stock: 30
  },
  {
    name: 'Biscuits',
    description: 'Tea biscuits',
    category: 'bakery',
    price: 100,
    unit: 'piece',
    stock: 40
  },
  // Beverages
  {
    name: 'Tea',
    description: 'Premium tea leaves',
    category: 'beverages',
    price: 200,
    unit: 'kg',
    stock: 25
  },
  {
    name: 'Coffee',
    description: 'Ground coffee',
    category: 'beverages',
    price: 350,
    unit: 'kg',
    stock: 20
  },
  // Snacks
  {
    name: 'Chips',
    description: 'Potato chips',
    category: 'snacks',
    price: 30,
    unit: 'piece',
    stock: 100
  },
  {
    name: 'Nuts Mix',
    description: 'Mixed nuts',
    category: 'snacks',
    price: 200,
    unit: 'kg',
    stock: 30
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-grocery');

    logger.info('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    logger.info('🗑️  Cleared existing products');

    // Insert sample products
    const insertedProducts = await Product.insertMany(SAMPLE_PRODUCTS);
    logger.info(`✅ Inserted ${insertedProducts.length} sample products`);

    // Create default admin if not exists
    const existingAdmin = await Admin.findOne({ email: 'admin@grocery.com' });
    if (!existingAdmin) {
      const admin = new Admin({
        email: 'admin@grocery.com',
        password: 'Admin@123', // Will be hashed automatically
        fullName: 'Default Admin',
        role: 'admin'
      });
      await admin.save();
      logger.info('✅ Default admin created: admin@grocery.com (password: Admin@123)');
    }

    logger.info('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

