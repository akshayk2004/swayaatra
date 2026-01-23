const express = require('express');
const { createRide, searchRides, joinRide, getRideDetails, acceptRequest, rejectRequest, getPendingRequests, getMyRides, completeRide } = require('../controllers/rideController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', protect, createRide);
router.get('/search', searchRides);
router.get('/my-rides', protect, getMyRides); // Specific route FIRST
router.get('/requests/pending', protect, getPendingRequests); // Specific route FIRST

router.post('/:id/join', protect, joinRide);
router.get('/:id', protect, getRideDetails); // Parameter route LAST
router.post('/:id/complete', protect, completeRide);
router.post('/requests/:requestId/accept', protect, acceptRequest);
router.post('/requests/:requestId/reject', protect, rejectRequest);

module.exports = router;
