import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      match: /^[\+]?[0-9]{10,15}$/
    },
    name: {
      type: String,
      trim: true,
      default: null
    },
    email: {
      type: String,
      trim: true,
      default: null,
      lowercase: true
    },
    address: {
      type: String,
      trim: true,
      default: null
    },
    cart: {
      items: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
          },
          quantity: {
            type: Number,
            required: true,
            min: 1
          }
        }
      ],
      totalAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    orderHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Index for faster queries
userSchema.index({ phoneNumber: 1, isActive: 1 });
userSchema.index({ lastInteractionAt: -1 });

const User = mongoose.model('User', userSchema);
export default User;

