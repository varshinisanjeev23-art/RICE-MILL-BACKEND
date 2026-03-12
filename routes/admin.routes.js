const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { list } = require('../controllers/booking.controller');
const paymentCtrl = require('../controllers/payment.controller');
const contactCtrl = require('../controllers/contact.controller');
const userCtrl = require('../controllers/user.controller');

router.get('/bookings', auth('admin'), list);
router.get('/payments', auth('admin'), paymentCtrl.all);
router.delete('/payments/:id', auth('admin'), paymentCtrl.removeOne); // soft-delete
router.delete('/payments', auth('admin'), paymentCtrl.removeMany); // soft-delete bulk
router.patch('/payments/:id/restore', auth('admin'), paymentCtrl.restoreOne);
router.patch('/payments/restore', auth('admin'), paymentCtrl.restoreMany);
router.delete('/payments/:id/purge', auth('admin'), paymentCtrl.purgeOne);
router.delete('/payments/purge', auth('admin'), paymentCtrl.purgeMany);
router.get('/messages', auth('admin'), contactCtrl.list);
router.post('/messages/:id/reply', auth('admin'), contactCtrl.reply);
router.patch('/messages/:id', auth('admin'), contactCtrl.update);
router.delete('/messages/:id', auth('admin'), contactCtrl.remove);
router.patch('/users/:id', auth('admin'), userCtrl.update);
router.delete('/users/:id', auth('admin'), userCtrl.remove);
router.get('/users', auth('admin'), userCtrl.list);

module.exports = router;
