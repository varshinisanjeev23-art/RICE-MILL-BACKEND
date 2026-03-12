const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    ratePerKg: { type: Number, required: true },
    originalPrice: { type: Number },
    imageUrl: { type: String },           // Primary image (backward compat)
    images: [{ type: String }],           // Up to 3 image URLs
    quantityOptions: {                     // Admin-configurable weight variants (kg)
      type: [Number],
      default: [10, 25, 100]
    },
    rating: { type: Number, default: 5 },
    reviewsCount: { type: Number, default: 0 },
    category: { type: String, default: 'Rice' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    stockStatus: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
