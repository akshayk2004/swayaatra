const express = require('express');
const { getUserProfile, addVehicle, updateRideVehicles, updateUserProfile, deleteVehicle } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/vehicle/add', protect, addVehicle);
router.post('/vehicle/update-all', protect, updateRideVehicles);
router.delete('/vehicle/:id', protect, deleteVehicle);

module.exports = router;
