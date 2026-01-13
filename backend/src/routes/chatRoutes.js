const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.route('/:rideId')
    .post(protect, sendMessage)
    .get(protect, getMessages);

module.exports = router;
