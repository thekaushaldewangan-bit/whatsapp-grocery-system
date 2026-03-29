import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { adminMiddleware } from '../middlewares/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ==================== GET DASHBOARD STATS ====================
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProducts,
        totalUsers
      }
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GET ALL ORDERS (ADMIN) ====================
router.get('/orders', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.productId')
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching admin orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== UPDATE ORDER STATUS (ADMIN) ====================
router.patch('/orders/:orderId', adminMiddleware, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    if (orderStatus === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.orderId, updateData, {
      new: true
    }).populate('items.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    logger.info(`✅ Admin updated order: ${order.orderId}`);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    logger.error('Error updating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GET ALL PRODUCTS (ADMIN) ====================
router.get('/products', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (category) query.category = category;

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
    logger.error('Error fetching admin products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GET ALL USERS (ADMIN) ====================
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ lastInteractionAt: -1 });

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

