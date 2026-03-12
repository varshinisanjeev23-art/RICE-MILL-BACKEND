const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/report.controller');

router.get('/transactions', auth('admin'), ctrl.transactionsPdf);

module.exports = router;
