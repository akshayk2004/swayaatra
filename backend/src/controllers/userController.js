const User = require('../models/User');

// @desc    Get User Profile (including vehicles)
// @route   GET /api/users/profile
// @access  Private
// @desc    Get User Profile (including vehicles & dashboard stats)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const Ride = require('../models/Ride');
        const user = await User.findById(req.user._id).select('-password');

        if (user) {
            // Aggregate Dashboard Stats
            const driverStats = await Ride.aggregate([
                { $match: { driver: user._id, status: 'completed' } },
                { $group: { _id: null, totalEarnings: { $sum: "$fare" }, ridesCount: { $count: {} } } }
            ]);

            const passengerStats = await Ride.countDocuments({ passengers: user._id, status: 'completed' });

            const earned = driverStats[0]?.totalEarnings || 0;
            const ridesOffered = driverStats[0]?.ridesCount || 0;
            const ridesTaken = passengerStats;

            // Mock CO2 calc (approx 0.2kg per km, assuming avg ride 10km for now as we don't store distance)
            // In a real app, we'd store distance in the Ride model. 
            const co2Saved = Math.round((ridesOffered + ridesTaken) * 10 * 0.2);

            // Calculate Badges (Always return all, mark earned: true/false)
            const badges = [
                { id: 'newbie', name: 'Newbie', icon: 'leaf', earned: (ridesOffered + ridesTaken >= 1) },
                { id: 'verified', name: 'Verified Car', icon: 'checkmark-circle', earned: (user.vehicles.length > 0) },
                { id: 'super', name: 'Super Driver', icon: 'star', earned: (user.rating >= 4.8 && ridesOffered > 10) },
                { id: 'eco', name: 'Eco Warrior', icon: 'planet', earned: (ridesOffered > 50) },
                { id: 'commuter', name: 'Daily Commuter', icon: 'bus', earned: (ridesTaken > 20) },
                { id: 'early', name: 'Early Bird', icon: 'alarm', earned: false } // Mock logic
            ];

            // Stats for "This Month" (Mocking month filtering for simplicity, or we can add date match)
            // For now, returning total as monthly to populate the UI
            const dashboard = {
                ridesCompleted: ridesOffered + ridesTaken,
                totalEarnings: earned,
                avgRating: user.rating,
                co2Saved: co2Saved
            };

            res.json({
                ...user.toObject(),
                ridesOffered,
                ridesTaken,
                totalEarnings: earned,
                dashboard,
                achievements: badges
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a Vehicle
// @route   POST /api/users/vehicle/add
// @access  Private
const addVehicle = async (req, res) => {
    try {
        const { make, model, year, plate, color, type } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            const newVehicle = {
                make,
                model,
                year,
                plate,
                color,
                type: type || 'sedan'
            };

            user.vehicles.push(newVehicle);
            await user.save();

            res.status(201).json(user.vehicles);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Backfill/Update Vehicle for All Rides
// @route   POST /api/users/vehicle/update-all
// @access  Private
const updateRideVehicles = async (req, res) => {
    try {
        const { vehicleQuery } = req.body; // e.g. "Civic"
        const Ride = require('../models/Ride');
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find the matching vehicle
        const targetVehicle = user.vehicles.find(v =>
            v.model.toLowerCase().includes(vehicleQuery.toLowerCase()) ||
            v.make.toLowerCase().includes(vehicleQuery.toLowerCase())
        );

        if (!targetVehicle) {
            return res.status(404).json({ message: 'Vehicle not found in your profile' });
        }

        // Update all rides by this driver
        const result = await Ride.updateMany(
            { driver: req.user._id },
            {
                $set: {
                    vehicle: {
                        make: targetVehicle.make,
                        model: targetVehicle.model,
                        color: targetVehicle.color,
                        plate: targetVehicle.plate,
                        year: targetVehicle.year,
                        type: targetVehicle.type || 'sedan'
                    }
                }
            }
        );

        res.json({ message: `Updated ${result.modifiedCount} rides with ${targetVehicle.make} ${targetVehicle.model}` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.profileImage = req.body.profileImage || user.profileImage;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                profileImage: updatedUser.profileImage,
                rating: updatedUser.rating,
                token: req.headers.authorization.split(' ')[1] // Keep existing token
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a Vehicle
// @route   DELETE /api/users/vehicle/:id
// @access  Private
const deleteVehicle = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.vehicles = user.vehicles.filter(
                (vehicle) => vehicle._id.toString() !== req.params.id
            );
            await user.save();
            res.json(user.vehicles);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getUserProfile, addVehicle, updateRideVehicles, updateUserProfile, deleteVehicle };
