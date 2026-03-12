const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', auth('admin'), upload.array('images', 3), ctrl.create);
router.put('/:id', auth('admin'), upload.array('images', 3), ctrl.update);
router.delete('/:id', auth('admin'), ctrl.remove);

module.exports = router;
