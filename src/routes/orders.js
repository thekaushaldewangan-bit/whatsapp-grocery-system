import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authMiddleware } from '../middlewares/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ==================== GET ALL ORDERS (USER) ====================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user.id };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.productId', 'name')
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
    logger.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GET ORDER BY ID ====================
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CREATE ORDER ====================
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, customerName, customerAddress, items, totalAmount } = req.body;

    if (!phoneNumber || !customerName || !customerAddress || !items) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ phoneNumber, name: customerName, address: customerAddress });
      await user.save();
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order = new Order({
      orderId,
      userId: user._id,
      phoneNumber,
      customerName,
      customerAddress,
      items,
      totalAmount
    });

    await order.save();

    user.orderHistory.push(order._id);
    await user.save();

    logger.info(`✅ Order created: ${orderId}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== UPDATE ORDER STATUS ====================
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    if (!orderStatus && !paymentStatus) {
      return res.status(400).json({
        success: false,
        error: 'Provide orderStatus or paymentStatus to update'
      });
    }

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    if (orderStatus === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    logger.info(`✅ Order updated: ${req.params.orderId}`);

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

// ==================== GET ORDERS BY PHONE (For WhatsApp) ====================
router.get('/by-phone/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const orders = await Order.find({ phoneNumber })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('items.productId', 'name');

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    logger.error('Error fetching orders by phone:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

