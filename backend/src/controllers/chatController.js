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

// @desc    Get all conversations (rides user is part of) with last message
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all rides where user is driver OR passenger
        const rides = await Ride.find({
            $or: [
                { driver: userId },
                { passengers: userId }
            ]
        })
        .populate('driver', 'name profileImage')
        .populate('passengers', 'name profileImage')
        .sort({ updatedAt: -1 });

        const conversations = [];

        for (const ride of rides) {
            // Find last message for this ride
            const lastMessage = await ChatMessage.findOne({ ride: ride._id })
                .populate('sender', 'name profileImage')
                .sort({ createdAt: -1 });

            conversations.push({
                _id: ride._id,
                ride,
                lastMessage: lastMessage ? {
                    message: lastMessage.message,
                    sender: lastMessage.sender,
                    createdAt: lastMessage.createdAt
                } : null
            });
        }

        // Sort conversations: those with last message first, ordered by last message time, then ride date
        conversations.sort((a, b) => {
            const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.ride.createdAt);
            const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.ride.createdAt);
            return timeB - timeA;
        });

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { sendMessage, getMessages, getConversations };
