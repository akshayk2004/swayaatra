const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['driver', 'rider', 'passenger'], default: 'passenger' },
    profileImage: { type: String, default: '' },
    rating: { type: Number, default: 5.0 },
    points: { type: Number, default: 0 },
    badges: [{ type: String }], // e.g., "Top Driver", "Reliable"
    ridesOffered: { type: Number, default: 0 },
    ridesTaken: { type: Number, default: 0 },
}, { timestamps: true });

console.log('User Model Loaded');

userSchema.pre('save', async function () {
    console.log('User Pre-Save Hook Triggered');
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
