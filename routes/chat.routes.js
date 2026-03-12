const router = require('express').Router();
const chatCtrl = require('../controllers/chat.controller');

// Chat endpoint - secure proxy to Groq
router.post('/message', chatCtrl.handleChat);

module.exports = router;
