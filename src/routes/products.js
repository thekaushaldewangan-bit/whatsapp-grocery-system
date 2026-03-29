import express from 'express';
import Product from '../models/Product.js';
import { adminMiddleware } from '../middlewares/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ==================== GET ALL PRODUCTS ====================
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GET CATEGORIES (must be before /:id) ====================
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GET PRODUCT BY ID ====================
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CREATE PRODUCT (ADMIN) ====================
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, description, category, price, unit, stock, image } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const product = new Product({
      name,
      description,
      category,
      price,
      unit,
      stock: stock || 0,
      image,
      createdBy: req.user.id
    });

    await product.save();

    logger.info(`✅ Product created: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== UPDATE PRODUCT (ADMIN) ====================
router.patch('/:id', adminMiddleware, async (req, res) => {
  try {
    const { name, description, category, price, unit, stock, image, isActive } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Update fields if provided
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) product.price = price;
    if (unit) product.unit = unit;
    if (stock !== undefined) product.stock = stock;
    if (image !== undefined) product.image = image;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    logger.info(`✅ Product updated: ${product.name}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DELETE PRODUCT (ADMIN) ====================
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    logger.info(`✅ Product deleted: ${product.name}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

