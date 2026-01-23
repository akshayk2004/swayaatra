const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: {
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    destination: {
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    date: { type: Date, required: true }, // Scheduled time
    fare: { type: Number, required: true },
    seats: { type: Number, required: true },
    seatsAvailable: { type: Number, required: true },
    passengers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['scheduled', 'active', 'completed', 'cancelled'], default: 'scheduled' },
    polyline: { type: String },
    vehicle: {
        make: String,
        model: String,
        color: String,
        plate: String,
        year: String,
        type: { type: String, default: 'sedan' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
