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
    driverDetails: {
        licenseNumber: { type: String },
        aadharNumber: { type: String },
        carModel: { type: String },
        numberPlate: { type: String },
        pucCertificate: { type: String },
        rcNumber: { type: String },
        insurancePolicy: { type: String },
    },
    emergencyContact: {
        phone: { type: String },
        email: { type: String },
    },
    vehicles: [{
        make: { type: String, required: true },
        model: { type: String, required: true },
        year: { type: String, required: true },
        plate: { type: String, required: true },
        color: { type: String, required: true },
        type: { type: String, default: 'sedan' } // sedan, suv, hatchback
    }]
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
