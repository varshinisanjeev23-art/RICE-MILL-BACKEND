const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional - for logged-in users
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String },
        rating: { type: Number, required: true, min: 1, max: 5 },
        title: { type: String }, // Review title/headline
        comment: { type: String },
        displayName: { type: String }, // Public display name (guest or registered user)
        email: { type: String }, // Email (kept private)
        type: {
            type: String,
            enum: ['order_time', 'post_delivery', 'product_page'],
            default: 'order_time'
        },
        status: {
            type: String,
            enum: ['pending_verification', 'verified'],
            default: 'pending_verification'
        },
        booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
        images: [{ type: String }]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
