const Ride = require('../models/Ride');
const RideRequest = require('../models/RideRequest');

// @desc    Create a new ride
// @route   POST /api/rides/create
// @access  Private (Driver)
const createRide = async (req, res) => {
    try {
        const { source, destination, date, fare, seats, polyline } = req.body;

        const ride = await Ride.create({
            driver: req.user._id,
            source,
            destination,
            date,
            fare,
            seats,
            seatsAvailable: seats,
            polyline
        });

        res.status(201).json(ride);
    } catch (error) {
        res.status(400).json({ message: 'Invalid ride data', error: error.message });
    }
};

// @desc    Search for rides
// @route   GET /api/rides/search
// @access  Public
const searchRides = async (req, res) => {
    // Simple search (can be enhanced with Geospatial queries later)
    // For now, return all scheduled rides
    try {
        const rides = await Ride.find({ status: 'scheduled' })
            .populate('driver', 'name rating profileImage')
            .sort({ date: 1 });
        res.json(rides);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Join a ride (Create Request)
// @route   POST /api/rides/:id/join
// @access  Private (Passenger)
const joinRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.seatsAvailable <= 0) {
            return res.status(400).json({ message: 'Ride is full' });
        }

        // Check if request already exists
        const existingRequest = await RideRequest.findOne({
            ride: ride._id,
            passenger: req.user._id
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Request already sent' });
        }

        const request = await RideRequest.create({
            ride: ride._id,
            passenger: req.user._id
        });

        // Notify Driver via Socket
        // Event: rideRequest:{driverId}
        const io = req.app.get('io');
        const driverId = ride.driver.toString();

        // Populate passenger info for the notification
        const populatedRequest = await RideRequest.findById(request._id).populate('passenger', 'name profileImage rating');

        io.to(ride._id.toString()).emit(`rideRequest:${driverId}`, populatedRequest);
        // Also emit directly to the driver if they are in a room or just broadcast with ID
        io.emit(`rideRequest:${driverId}`, populatedRequest);

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Accept Ride Request
// @route   POST /api/rides/requests/:requestId/accept
// @access  Private (Driver)
const acceptRequest = async (req, res) => {
    try {
        const request = await RideRequest.findById(req.params.requestId).populate('ride');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const ride = await Ride.findById(request.ride._id);
        if (ride.driver.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (ride.seatsAvailable <= 0) {
            return res.status(400).json({ message: 'Ride is full' });
        }

        // Update Request Status
        request.status = 'accepted';
        await request.save();

        // Add Passenger to Ride
        ride.passengers.push(request.passenger);
        ride.seatsAvailable -= 1;
        await ride.save();

        // Notify Passenger
        const io = req.app.get('io');
        io.emit(`requestUpdate:${request.passenger}`, { status: 'accepted', rideId: ride._id });

        res.json({ message: 'Request accepted', request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reject Ride Request
// @route   POST /api/rides/requests/:requestId/reject
// @access  Private (Driver)
const rejectRequest = async (req, res) => {
    try {
        const request = await RideRequest.findById(req.params.requestId).populate('ride');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const ride = await Ride.findById(request.ride._id);
        if (ride.driver.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update Request Status
        request.status = 'rejected';
        await request.save();

        // Notify Passenger
        const io = req.app.get('io');
        io.emit(`requestUpdate:${request.passenger}`, { status: 'rejected', rideId: ride._id });

        res.json({ message: 'Request rejected' });
    } catch (error) {
        console.error(error);
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Pending Requests for Driver
// @route   GET /api/rides/requests/pending
// @access  Private (Driver)
const getPendingRequests = async (req, res) => {
    try {
        // Find rides where the current user is the driver
        const rides = await Ride.find({ driver: req.user._id });
        const rideIds = rides.map(ride => ride._id);

        // Find requests for these rides with status 'pending'
        const requests = await RideRequest.find({
            ride: { $in: rideIds },
            status: 'pending'
        }).populate('passenger', 'name profileImage rating')
            .populate('ride', 'source destination date');

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Ride Details
// @route   GET /api/rides/:id
// @access  Private
const getRideDetails = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('driver', 'name phone rating profileImage')
            .populate('passengers', 'name profileImage');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        res.json(ride);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createRide, searchRides, joinRide, getRideDetails, acceptRequest, rejectRequest, getPendingRequests };
