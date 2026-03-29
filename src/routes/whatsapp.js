import express from 'express';
import { handleWhatsAppMessage, verifyWebhook } from '../controllers/whatsappController.js';

const router = express.Router();

// GET - Verify webhook (Twilio sends this)
router.get('/whatsapp', verifyWebhook);

// POST - Handle incoming messages
router.post('/whatsapp', handleWhatsAppMessage);

export default router;

