const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');
const { auth, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth(), ctrl.create);
router.get('/my', auth(), ctrl.myMessages);

module.exports = router;
