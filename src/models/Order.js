import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: true
    },
    customerAddress: {
      type: String,
      required: true
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        productName: String,
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true
        },
        unit: String,
        subtotal: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'qr_code', 'manual'],
      default: 'upi'
    },
    upiLink: {
      type: String,
      default: null
    },
    qrCodePath: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    estimatedDelivery: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    },
    deliveredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'orders'
  }
);

// Index for common queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ phoneNumber: 1, orderStatus: 1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;

