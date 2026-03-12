const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    riceType: { type: String, required: true },
    costPerKg: { type: Number, required: true },
    quantityKg: { type: Number, required: true },
    notes: { type: String },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'], default: 'pending' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productImage: { type: String },
    isReviewed: { type: Boolean, default: false },
    // Status Timestamps
    placedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    shippedAt: { type: Date },
    outForDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
