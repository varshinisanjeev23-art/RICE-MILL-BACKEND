const Review = require('../models/Review');
const Product = require('../models/Product');
const Booking = require('../models/Booking');

// For logged-in users rating at order time (requires auth)
exports.createRating = async (req, res) => {
    try {
        const { productId, productName, rating, bookingId, type, title, comment, displayName, email } = req.body;

        const review = await Review.create({
            user: req.user ? req.user.id : undefined,
            product: productId,
            productName,
            rating,
            title,
            comment,
            displayName: displayName || (req.user ? req.user.name : 'Anonymous'),
            email,
            booking: bookingId,
            type: type || 'order_time',
            status: type === 'post_delivery' ? 'verified' : (type === 'product_page' ? 'verified' : 'pending_verification')
        });

        // Update Product average rating if productId is provided and verified
        if (productId && review.status === 'verified') {
            const reviews = await Review.find({ product: productId, status: 'verified' });
            const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
            await Product.findByIdAndUpdate(productId, {
                rating: avgRating.toFixed(1),
                reviewsCount: reviews.length
            });
        }

        // Mark booking as reviewed if bookingId is provided
        if (bookingId) {
            await Booking.findByIdAndUpdate(bookingId, { isReviewed: true });
        }

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Public review submission from product page (no auth required)
exports.submitProductPageReview = async (req, res) => {
    try {
        const { productId, productName, rating, title, comment, displayName, email } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        const review = await Review.create({
            product: productId,
            productName,
            rating,
            title,
            comment,
            displayName: displayName || 'Anonymous',
            email,
            type: 'product_page',
            status: 'verified'
        });

        // Update Product average rating
        if (productId) {
            const reviews = await Review.find({ product: productId, status: 'verified' });
            const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
            await Product.findByIdAndUpdate(productId, {
                rating: avgRating.toFixed(1),
                reviewsCount: reviews.length
            });
        }

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addReviewText = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { comment, images } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        if (review.user && review.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        review.comment = comment;
        review.images = images || review.images;
        review.type = 'post_delivery';
        review.status = 'verified';
        await review.save();

        // Update Product average rating after verification
        if (review.product) {
            const reviews = await Review.find({ product: review.product, status: 'verified' });
            const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
            await Product.findByIdAndUpdate(review.product, {
                rating: avgRating.toFixed(1),
                reviewsCount: reviews.length
            });
        }

        res.json(review);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Fetch public reviews for a product (product_page + post_delivery, verified)
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({
            product: productId,
            status: 'verified',
            type: { $in: ['post_delivery', 'product_page'] }
        })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id }).populate('product');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Fetch ALL reviews for a product (Admin side)
exports.getAdminProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ product: productId })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
