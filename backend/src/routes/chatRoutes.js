const express = require('express');
const { sendMessage, getMessages, getConversations } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.route('/conversations')
    .get(protect, getConversations);

router.route('/:rideId')
    .post(protect, sendMessage)
    .get(protect, getMessages);

module.exports = router;
