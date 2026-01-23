const Ride = require('../models/Ride');
const RideRequest = require('../models/RideRequest');

// @desc    Create a new ride
// @route   POST /api/rides/create
// @access  Private (Driver)
const createRide = async (req, res) => {
    try {
        const { source, destination, date, fare, seats, polyline, vehicle } = req.body;

        const ride = await Ride.create({
            driver: req.user._id,
            source,
            destination,
            date,
            fare,
            seats,
            seatsAvailable: seats,
            polyline,
            vehicle
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
    try {
        const { source, destination, date, seats } = req.query;
        let query = { status: 'scheduled' };

        if (source && source !== 'Current location' && source !== 'Unknown Location') {
            query['source.name'] = { $regex: source, $options: 'i' };
        }

        if (destination) {
            query['destination.name'] = { $regex: destination, $options: 'i' };
        }

        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(searchDate.getDate() + 1);

            query.date = {
                $gte: searchDate.toISOString(),
                $lt: nextDay.toISOString()
            };
        }

        if (seats) {
            query.seatsAvailable = { $gte: Number(seats) };
        }

        const rides = await Ride.find(query)
            .populate('driver', 'name rating profileImage')
            .sort({ date: 1 });

        res.json(rides);
    } catch (error) {
        console.error(error);
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

// @desc    Get Current User's Rides (as driver or passenger)
// @route   GET /api/rides/my-rides
// @access  Private
const getMyRides = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();

        // Find rides where user is driver OR passenger
        const rides = await Ride.find({
            $or: [
                { driver: userId },
                { passengers: userId }
            ]
        })
            .populate('driver', 'name rating profileImage')
            .sort({ date: -1 }); // Sort by latest first

        const upcoming = [];
        const past = [];

        rides.forEach(ride => {
            const rideDate = new Date(ride.date);
            // Add user specific role to the ride object for frontend
            const rideObj = ride.toObject();
            rideObj.userRole = (ride.driver._id.toString() === userId.toString()) ? 'driver' : 'passenger';

            if (rideDate >= now && ride.status !== 'completed' && ride.status !== 'cancelled') {
                upcoming.unshift(rideObj); // Put closest upcoming dates first (since we sorted desc)
                // Wait, if sort is desc (newest first), upcoming rides in the future will be first.
                // Actually with date: -1, Future dates (bigger) are first.
                // So upcoming list is [Far Future, Near Future].
                // We probably want [Near Future, Far Future]. 
                // Let's just sort the final arrays again to be safe.
            } else {
                past.push(rideObj);
            }
        });

        // Sort upcoming: Closest date first (Ascending)
        upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
        // Sort past: Most recent date first (Descending)
        past.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ upcoming, past });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Complete a Ride
// @route   POST /api/rides/:id/complete
// @access  Private (Driver)
const completeRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driver.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        ride.status = 'completed';
        await ride.save();

        res.json({ message: 'Ride completed successfully', ride });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createRide, searchRides, joinRide, getRideDetails, acceptRequest, rejectRequest, getPendingRequests, getMyRides, completeRide };
