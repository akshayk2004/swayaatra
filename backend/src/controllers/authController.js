const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, role, driverDetails, emergencyContact } = req.body;
        console.log('Register Request Body:', req.body);

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            role,
            driverDetails,
            emergencyContact
        });

        if (user) { // Immediately login after register (or send OTP in real scenario)
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Verify OTP (Mock)
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    // In a real app, verify OTP against phone/email
    const { phone, otp } = req.body;

    // Mock verification
    if (otp === '1234') {
        res.json({ message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
};

module.exports = { registerUser, loginUser, verifyOTP };
