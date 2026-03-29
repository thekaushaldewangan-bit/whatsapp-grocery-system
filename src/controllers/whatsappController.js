import twilio from 'twilio';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import logger from '../utils/logger.js';
import { downloadAudio, transcribeAudio } from '../services/voiceService.js';
import { parseVoiceOrder } from '../services/nlpService.js';
import { generateUPILink, generateQRCode, generateQRCodeBase64 } from '../services/paymentService.js';
import { v4 as uuidv4 } from 'uuid';

const DEMO_MODE = process.env.DEMO_MODE === 'true';

let client = null;
if (!DEMO_MODE && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ==================== MENU DEFINITIONS ====================
const MENU_CATEGORIES = {
  fruits: { emoji: '🍎', label: 'Fruits' },
  vegetables: { emoji: '🥕', label: 'Vegetables' },
  dairy: { emoji: '🥛', label: 'Dairy' },
  grains: { emoji: '🌾', label: 'Grains' },
  bakery: { emoji: '🍞', label: 'Bakery' },
  beverages: { emoji: '☕', label: 'Beverages' },
  snacks: { emoji: '🍿', label: 'Snacks' }
};

// ==================== WEBHOOK - Main Entry Point ====================
export const handleWhatsAppMessage = async (req, res) => {
  try {
    const { From, Body, MediaUrl0, MediaContentType0, NumMedia } = req.body;
    const phoneNumber = From.replace('whatsapp:', '');
    const numMedia = parseInt(NumMedia || '0', 10);

    logger.info(`📨 Received message from ${phoneNumber}`, { numMedia, MediaContentType0 });

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ phoneNumber });
      await user.save();
      logger.info(`✅ New user created: ${phoneNumber}`);
    }

    user.lastInteractionAt = new Date();
    await user.save();

    let responseText = '';

    const isAudio = numMedia > 0 && MediaContentType0 && MediaContentType0.startsWith('audio/');
    if (isAudio && MediaUrl0) {
      responseText = await handleVoiceMessage(user, MediaUrl0, phoneNumber);
    } else if (Body) {
      responseText = await handleTextMessage(user, Body.trim(), phoneNumber);
    }

    if (responseText) {
      await sendWhatsAppMessage(phoneNumber, responseText);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error in handleWhatsAppMessage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== HANDLE VOICE MESSAGES ====================
const handleVoiceMessage = async (user, mediaUrl, phoneNumber) => {
  try {
    logger.info(`🎤 Processing voice message from ${phoneNumber}`);

    // Download audio file
    const audioPath = await downloadAudio(mediaUrl);
    logger.info(`✅ Audio downloaded: ${audioPath}`);

    // Transcribe using Whisper API
    const transcription = await transcribeAudio(audioPath);
    logger.info(`📝 Transcribed text: ${transcription}`);

    // Parse voice order
    const parsedOrder = await parseVoiceOrder(transcription);
    logger.info(`🛒 Parsed order:`, parsedOrder);

    // Add items to cart
    if (parsedOrder.items && parsedOrder.items.length > 0) {
      for (const item of parsedOrder.items) {
        const product = await Product.findOne({
          name: new RegExp(item.name, 'i'),
          isActive: true
        });

        if (product) {
          const existingItem = user.cart.items.find(
            i => i.productId.toString() === product._id.toString()
          );

          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            user.cart.items.push({
              productId: product._id,
              quantity: item.quantity
            });
          }
        }
      }

      // Update cart total
      await calculateCartTotal(user);
      await user.save();

      return `🎤 Voice order received!\n\n*Detected items:*\n${parsedOrder.items
        .map(i => `• ${i.quantity} ${i.name}`)
        .join('\n')}\n\n*Current cart total:* ₹${user.cart.totalAmount.toFixed(2)}\n\nReply with:\n*"show cart"* - View all items\n*"checkout"* - Proceed to payment`;
    } else {
      return `❌ Could not understand the order from voice. Please type items manually or try again.`;
    }
  } catch (error) {
    logger.error('Error handling voice message:', error);
    return `❌ Error processing voice message. Please try again or type your order.`;
  }
};

// ==================== HANDLE TEXT MESSAGES ====================
const handleTextMessage = async (user, message, phoneNumber) => {
  const lowerMessage = message.toLowerCase();

  // Greeting
  if (['hi', 'hello', 'hey', 'start'].includes(lowerMessage)) {
    return getMainMenu();
  }

  // Show menu
  if (lowerMessage === 'menu' || lowerMessage === '1') {
    return getMainMenu();
  }

  // Show categories
  if (lowerMessage === 'categories') {
    return getCategoriesMenu();
  }

  // Browse category (e.g., "fruits", "vegetables")
  if (Object.keys(MENU_CATEGORIES).includes(lowerMessage)) {
    return await getProductsByCategory(lowerMessage);
  }

  // Add item (e.g., "add 2 milk", "add 1kg apples")
  if (lowerMessage.startsWith('add ')) {
    return await addToCart(user, message.substring(4), phoneNumber);
  }

  // Remove item (e.g., "remove milk")
  if (lowerMessage.startsWith('remove ')) {
    return await removeFromCart(user, message.substring(7), phoneNumber);
  }

  // Show cart
  if (lowerMessage === 'show cart' || lowerMessage === 'cart') {
    return showCart(user);
  }

  // Clear cart
  if (lowerMessage === 'clear cart') {
    user.cart = { items: [], totalAmount: 0, lastUpdated: new Date() };
    await user.save();
    return '🗑️ Cart cleared!';
  }

  // Checkout
  if (lowerMessage === 'checkout' || lowerMessage === 'order') {
    if (user.cart.items.length === 0) {
      return '❌ Your cart is empty. Add items first!';
    }
    return `✅ Please provide your details to place the order:\n\nReply with: *name, address, phone*\nExample: John Doe, 123 Main St, 9876543210`;
  }

  // Payment confirmation (e.g., "paid ORD-123")
  if (lowerMessage.startsWith('paid ')) {
    return await confirmPayment(user, message.substring(5).trim());
  }

  // Place order (format: "name, address, phone" - requires exactly 3 parts)
  if (message.includes(',') && message.split(',').length >= 3) {
    return await placeOrder(user, message, phoneNumber);
  }

  // Default help message
  return getHelpMenu();
};

// ==================== MENU FUNCTIONS ====================
const getMainMenu = () => {
  return `👋 Welcome to *Grocery Store*!\n\nWhat would you like to do?\n\n1️⃣ *Browse Categories* - View product categories\n2️⃣ *Show Cart* - View your shopping cart\n3️⃣ *Checkout* - Place your order\n4️⃣ *Help* - View help menu\n\nReply with the number or the action.`;
};

const getCategoriesMenu = () => {
  let message = `📂 *Product Categories:*\n\n`;
  Object.entries(MENU_CATEGORIES).forEach(([key, value]) => {
    message += `${value.emoji} *${value.label}* - Type "${key}"\n`;
  });
  message += `\n📝 Or use voice! Send an audio message like "I want 2 kg apples and 1 milk"`;
  return message;
};

const getProductsByCategory = async (category) => {
  const products = await Product.find({
    category,
    isActive: true,
    stock: { $gt: 0 }
  }).limit(10);

  if (products.length === 0) {
    return `❌ No products available in ${category} category right now.`;
  }

  let message = `📦 *${MENU_CATEGORIES[category].label} Products:*\n\n`;
  products.forEach((product, index) => {
    message += `${index + 1}. *${product.name}* - ₹${product.price}/${product.unit} (Stock: ${product.stock})\n`;
  });
  message += `\n💬 Reply: "add 2 ${products[0].name}" to add to cart`;
  return message;
};

const getHelpMenu = () => {
  return `❓ *Help Menu:*\n\n*Available Commands:*\n\n• *menu* - Show main menu\n• *categories* - View product categories\n• *show cart* - View cart items\n• *add [qty] [item]* - Add item (e.g., "add 2 milk")\n• *remove [item]* - Remove item\n• *checkout* - Proceed to payment\n• *clear cart* - Empty your cart\n\n🎤 *Voice Orders:* Send audio message with your order!\n\nNeed help? Contact us at ${process.env.SHOP_PHONE}`;
};

// ==================== CART FUNCTIONS ====================
const addToCart = async (user, itemString, phoneNumber) => {
  try {
    // Parse quantity and item name (e.g., "2 milk" or "1kg apples")
    const match = itemString.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s+(.*)/);
    if (!match) {
      return `❌ Invalid format. Use: "add [qty][unit] [item name]"\nExample: "add 2 milk" or "add 1kg apples"`;
    }

    const quantity = parseFloat(match[1]);
    const unit = match[2] || '';
    const itemName = match[3].trim();

    // Find product
    const product = await Product.findOne({
      name: new RegExp(itemName, 'i'),
      isActive: true
    });

    if (!product) {
      return `❌ Product "${itemName}" not found. Try:\n${(await getProductsByCategory('fruits')).substring(0, 200)}...`;
    }

    if (quantity > product.stock) {
      return `❌ Only ${product.stock} ${product.unit} available. Stock limit reached!`;
    }

    // Add to cart or update quantity
    const existingItem = user.cart.items.find(
      i => i.productId.toString() === product._id.toString()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.items.push({
        productId: product._id,
        quantity
      });
    }

    await calculateCartTotal(user);
    await user.save();

    return `✅ Added ${quantity} ${product.unit} of *${product.name}* to cart!\n\n*Cart Total:* ₹${user.cart.totalAmount.toFixed(2)}\n\n📝 Reply "show cart" to view all items or "checkout" to proceed`;
  } catch (error) {
    logger.error('Error adding to cart:', error);
    return `❌ Error adding item to cart. Please try again.`;
  }
};

const removeFromCart = async (user, itemName, phoneNumber) => {
  try {
    const product = await Product.findOne({
      name: new RegExp(itemName, 'i'),
      isActive: true
    });

    if (!product) {
      return `❌ Product not found in your request.`;
    }

    user.cart.items = user.cart.items.filter(
      i => i.productId.toString() !== product._id.toString()
    );

    await calculateCartTotal(user);
    await user.save();

    return `✅ Removed *${product.name}* from cart!\n\n*New Total:* ₹${user.cart.totalAmount.toFixed(2)}`;
  } catch (error) {
    logger.error('Error removing from cart:', error);
    return `❌ Error removing item. Please try again.`;
  }
};

const showCart = async (user) => {
  if (user.cart.items.length === 0) {
    return `🛒 Your cart is empty!\n\nType "categories" to browse products or send a voice message with your order.`;
  }

  let message = `🛒 *Your Cart:*\n\n`;

  for (const item of user.cart.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      const subtotal = product.price * item.quantity;
      message += `• *${product.name}* - ${item.quantity} ${product.unit} × ₹${product.price} = *₹${subtotal.toFixed(2)}*\n`;
    }
  }

  message += `\n*Grand Total:* ₹${user.cart.totalAmount.toFixed(2)}\n\n💬 Reply:\n• "add [qty] [item]" - Add more items\n• "remove [item]" - Remove item\n• "checkout" - Proceed to payment`;

  return message;
};

// ==================== ORDER FUNCTIONS ====================
const placeOrder = async (user, detailsString, phoneNumber) => {
  try {
    const parts = detailsString.split(',').map(p => p.trim());
    if (parts.length < 3) {
      return `❌ Please provide all details:\nFormat: name, address, phone`;
    }

    const [customerName, address, phone] = parts;

    if (user.cart.items.length === 0) {
      return `❌ Your cart is empty!`;
    }

    // Create order
    const orderId = `ORD-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of user.cart.items) {
      const product = await Product.findById(cartItem.productId);
      if (product) {
        const subtotal = product.price * cartItem.quantity;
        orderItems.push({
          productId: product._id,
          productName: product.name,
          quantity: cartItem.quantity,
          price: product.price,
          unit: product.unit,
          subtotal
        });
        totalAmount += subtotal;
      }
    }

    const order = new Order({
      orderId,
      userId: user._id,
      phoneNumber,
      customerName,
      customerAddress: address,
      items: orderItems,
      totalAmount
    });

    const upiLink = generateUPILink(totalAmount, orderId);
    const qrCodePath = await generateQRCode(upiLink, orderId);

    order.upiLink = upiLink;
    order.qrCodePath = qrCodePath;

    await order.save();

    user.orderHistory.push(order._id);
    user.cart = { items: [], totalAmount: 0, lastUpdated: new Date() };
    await user.save();

    logger.info(`✅ Order placed: ${orderId}`);

    // Send QR code as a separate media message if possible
    try {
      const qrBase64 = await generateQRCodeBase64(upiLink);
      if (client && qrBase64) {
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        await client.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${formattedNumber}`,
          body: `📱 QR Code for Order ${orderId} - Scan to pay ₹${totalAmount.toFixed(2)}`,
          mediaUrl: [qrBase64]
        });
      }
    } catch (qrError) {
      logger.warn('Could not send QR image via WhatsApp:', qrError.message);
    }

    return `✅ *Order Confirmed!*\n\n*Order ID:* ${orderId}\n*Total Amount:* ₹${totalAmount.toFixed(2)}\n\n💳 *Payment Options:*\n\n1️⃣ *UPI Link (tap to pay):*\n${upiLink}\n\n2️⃣ *Confirm Payment:*\nAfter paying, reply "paid ${orderId}"`;

  } catch (error) {
    logger.error('Error placing order:', error);
    return `❌ Error creating order. Please try again.`;
  }
};

// ==================== PAYMENT CONFIRMATION ====================
const confirmPayment = async (user, orderId) => {
  try {
    const order = await Order.findOne({
      orderId: orderId.toUpperCase(),
      userId: user._id
    });

    if (!order) {
      return `❌ Order *${orderId}* not found. Please check the order ID.`;
    }

    if (order.paymentStatus === 'completed') {
      return `✅ Payment for order *${order.orderId}* was already confirmed!`;
    }

    order.paymentStatus = 'completed';
    order.orderStatus = 'confirmed';
    await order.save();

    logger.info(`✅ Payment confirmed for order: ${order.orderId}`);
    return `✅ Payment confirmed for order *${order.orderId}*!\n\nYour order is now being processed. We'll update you when it's packed.`;
  } catch (error) {
    logger.error('Error confirming payment:', error);
    return `❌ Error confirming payment. Please try again.`;
  }
};

// ==================== UTILITY FUNCTIONS ====================
const calculateCartTotal = async (user) => {
  let total = 0;
  for (const item of user.cart.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      total += product.price * item.quantity;
    }
  }
  user.cart.totalAmount = total;
  user.cart.lastUpdated = new Date();
};

const sendWhatsAppMessage = async (phoneNumber, message) => {
  if (DEMO_MODE || !client) {
    logger.info(`[DEMO] Message to ${phoneNumber}: ${message.substring(0, 100)}...`);
    return 'demo-message-sid';
  }

  try {
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`,
      body: message
    });

    logger.info(`✅ Message sent to ${phoneNumber}:`, { messageSid: response.sid });
    return response.sid;
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

// ==================== VERIFY WEBHOOK ====================
export const verifyWebhook = (req, res) => {
  res.status(200).send();
};

export default {
  handleWhatsAppMessage,
  verifyWebhook
};

