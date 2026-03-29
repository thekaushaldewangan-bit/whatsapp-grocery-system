import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['fruits', 'vegetables', 'dairy', 'grains', 'bakery', 'beverages', 'snacks', 'other'],
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'lb', 'piece', 'liter', 'ml', 'dozen'],
      default: 'kg'
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    image: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  },
  {
    timestamps: true,
    collection: 'products'
  }
);

// Index for searching
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;

