const router = require('express').Router();
const ctrl = require('../controllers/review.controller');
const { auth } = require('../middleware/auth');

router.post('/rate', auth(), ctrl.createRating);
router.post('/product-page', ctrl.submitProductPageReview); // Public, no auth required
router.patch('/:reviewId/text', auth(), ctrl.addReviewText);
router.get('/product/:productId', ctrl.getProductReviews);
router.get('/admin/product/:productId', auth('admin'), ctrl.getAdminProductReviews);
router.get('/user', auth(), ctrl.getUserReviews);

module.exports = router;
