const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const { auth } = require('../middleware/auth');

router.post('/', auth(), ctrl.create);
router.get('/my', auth(), ctrl.myBookings);
router.get('/order-count', auth(), ctrl.getOrderCount);
router.get('/', auth('admin'), ctrl.list);
router.patch('/:id', auth(), ctrl.updateStatus);
router.put('/:id/status', auth('admin'), ctrl.updateStatus);

module.exports = router;
