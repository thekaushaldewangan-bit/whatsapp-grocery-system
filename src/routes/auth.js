import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import logger from '../utils/logger.js';

const router = express.Router();

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role = 'staff', secretKey } = req.body;

    if (process.env.ADMIN_SECRET_KEY && secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        error: 'Invalid admin secret key'
      });
    }

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and fullName are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if user exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Create new admin
    const admin = new Admin({
      email,
      password,
      fullName,
      role
    });

    await admin.save();

    logger.info(`✅ New admin registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully'
    });
  } catch (error) {
    logger.error('Error in registration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Find admin with password field
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`✅ Admin logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role
      }
    });
  } catch (error) {
    logger.error('Error in login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GET PROFILE ====================
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

