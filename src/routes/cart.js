import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ==================== GET CART ====================
router.get('/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const user = await User.findOne({ phoneNumber }).populate('cart.items.productId');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.cart
    });
  } catch (error) {
    logger.error('Error fetching cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADD TO CART ====================
router.post('/add', async (req, res) => {
  try {
    const { phoneNumber, productId, quantity } = req.body;

    if (!phoneNumber || !productId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ phoneNumber });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const existingItem = user.cart.items.find(
      i => i.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.items.push({ productId, quantity });
    }

    // Calculate total
    let total = 0;
    for (const item of user.cart.items) {
      const prod = await Product.findById(item.productId);
      if (prod) total += prod.price * item.quantity;
    }
    user.cart.totalAmount = total;

    await user.save();

    logger.info(`✅ Item added to cart for ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Item added to cart',
      data: user.cart
    });
  } catch (error) {
    logger.error('Error adding to cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== REMOVE FROM CART ====================
router.post('/remove', async (req, res) => {
  try {
    const { phoneNumber, productId } = req.body;

    if (!phoneNumber || !productId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.cart.items = user.cart.items.filter(
      i => i.productId.toString() !== productId
    );

    // Recalculate total
    let total = 0;
    for (const item of user.cart.items) {
      const product = await Product.findById(item.productId);
      if (product) total += product.price * item.quantity;
    }
    user.cart.totalAmount = total;

    await user.save();

    logger.info(`✅ Item removed from cart for ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: user.cart
    });
  } catch (error) {
    logger.error('Error removing from cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CLEAR CART ====================
router.post('/clear', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number required'
      });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.cart = { items: [], totalAmount: 0, lastUpdated: new Date() };
    await user.save();

    logger.info(`✅ Cart cleared for ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Cart cleared',
      data: user.cart
    });
  } catch (error) {
    logger.error('Error clearing cart:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

