import QRCode from 'qrcode';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QRCODES_DIR = path.join(__dirname, '../../qrcodes');
fs.ensureDirSync(QRCODES_DIR);

// ==================== GENERATE UPI PAYMENT LINK ====================
export const generateUPILink = (amount, orderId) => {
  try {
    const upiId = process.env.UPI_ID || 'merchant@bank';
    const shopName = encodeURIComponent(process.env.SHOP_NAME || 'Grocery Store');
    const roundedAmount = Math.round(amount * 100) / 100;

    const upiLink = `upi://pay?pa=${upiId}&pn=${shopName}&am=${roundedAmount}&tn=Order%20${orderId}&tr=${orderId}`;

    logger.info(`💳 Generated UPI link for order ${orderId}: ${upiLink}`);
    return upiLink;
  } catch (error) {
    logger.error('Error generating UPI link:', error);
    throw error;
  }
};

// ==================== GENERATE QR CODE ====================
export const generateQRCode = async (upiLink, orderId) => {
  try {
    const fileName = `qr-${orderId}-${Date.now()}.png`;
    const filePath = path.join(QRCODES_DIR, fileName);

    await QRCode.toFile(filePath, upiLink, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    logger.info(`📱 QR code generated: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error('Error generating QR code:', error);
    throw error;
  }
};

// ==================== GENERATE QR CODE AS BASE64 DATA URI ====================
export const generateQRCodeBase64 = async (upiLink) => {
  try {
    const dataUrl = await QRCode.toDataURL(upiLink, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
    return dataUrl;
  } catch (error) {
    logger.error('Error generating QR code base64:', error);
    return null;
  }
};

// ==================== SEND QR CODE VIA WHATSAPP ====================
export const sendQRCodeViaWhatsApp = async (client, phoneNumber, qrCodePath, orderId) => {
  try {
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const upiLink = `upi://pay?pa=${process.env.UPI_ID}&pn=${encodeURIComponent(process.env.SHOP_NAME || 'Grocery Store')}&am=0&tn=Order%20${orderId}`;
    const qrDataUrl = await generateQRCodeBase64(upiLink);

    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`,
      mediaUrl: qrDataUrl ? [qrDataUrl] : []
    });

    logger.info(`✅ QR code sent to ${phoneNumber}: ${response.sid}`);
    return response.sid;
  } catch (error) {
    logger.error('Error sending QR code:', error);
    throw error;
  }
};

// ==================== VERIFY PAYMENT STATUS ====================
export const verifyPaymentStatus = async (orderId) => {
  try {
    // In a real scenario, you would:
    // 1. Call your payment gateway API
    // 2. Check UPI transaction status
    // 3. Update order payment status in database

    logger.info(`🔍 Verifying payment for order: ${orderId}`);

    // Placeholder for actual payment verification
    return {
      status: 'pending',
      message: 'Payment verification pending'
    };
  } catch (error) {
    logger.error('Error verifying payment:', error);
    throw error;
  }
};

export default {
  generateUPILink,
  generateQRCode,
  generateQRCodeBase64,
  sendQRCodeViaWhatsApp,
  verifyPaymentStatus
};

