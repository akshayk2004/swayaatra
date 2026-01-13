const ChatMessage = require('../models/ChatMessage');
const Ride = require('../models/Ride');

// @desc    Send a message in a ride
// @route   POST /api/chat/:rideId
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { rideId } = req.params;

        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        const newMessage = await ChatMessage.create({
            ride: rideId,
            sender: req.user._id,
            message
        });

        const fullMessage = await ChatMessage.findById(newMessage._id).populate('sender', 'name profileImage');

        res.status(201).json(fullMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages for a ride
// @route   GET /api/chat/:rideId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { rideId } = req.params;

        const messages = await ChatMessage.find({ ride: rideId })
            .populate('sender', 'name profileImage')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { sendMessage, getMessages };
