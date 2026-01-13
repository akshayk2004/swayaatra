const express = require('express');
const { createRide, searchRides, joinRide, getRideDetails, acceptRequest, rejectRequest, getPendingRequests } = require('../controllers/rideController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', protect, createRide);
router.get('/search', searchRides);
router.post('/:id/join', protect, joinRide);
router.get('/:id', protect, getRideDetails);
router.post('/requests/:requestId/accept', protect, acceptRequest);
router.post('/requests/:requestId/accept', protect, acceptRequest);
router.post('/requests/:requestId/reject', protect, rejectRequest);
router.get('/requests/pending', protect, getPendingRequests);

module.exports = router;
