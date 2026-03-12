const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth');

router.post('/order', auth(), ctrl.createOrder);
router.post('/verify', auth(), ctrl.verify);

module.exports = router;
