const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a ride room (for chat & tracking)
        socket.on('joinRoom', (rideId) => {
            socket.join(rideId);
            console.log(`User joined ride room: ${rideId}`);
        });

        // Driver sends location update -> Broadcast to room
        socket.on('locationUpdate', ({ rideId, location }) => {
            // location: { lat, lng, heading }
            io.to(rideId).emit('locationUpdate', location);
        });

        // Chat message (real-time propagation)
        socket.on('chatMessage', ({ rideId, message, user }) => {
            io.to(rideId).emit('chatMessage', { rideId, message, user, createdAt: new Date() });
        });

        // Request update (e.g., Passenger requests to join)
        socket.on('rideRequest', ({ driverId, request }) => {
            // Notify specific driver
            // Note: In real app, we need to map userId to socketId or join a personal room
            io.emit(`rideRequest:${driverId}`, request);
        });

        // Simulated Live Ride Request from Rider -> Broadcast to all drivers
        socket.on('liveRideRequest', (data) => {
            console.log('Broadcasting liveRideRequest:', data.passengerName);
            io.emit('liveRideRequest', data);
        });

        // Live Ride Response from Driver -> Relay to Rider
        socket.on('liveRideResponse', (data) => {
            console.log('Broadcasting liveRideResponse for passenger:', data.passengerId, 'accepted:', data.accepted);
            io.emit('liveRideResponse', data);
        });

        // Ride Status Update (Accepted, Started, Completed)
        socket.on('rideStatus', ({ rideId, status }) => {
            io.to(rideId).emit('rideStatus', status);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

module.exports = socketHandler;
