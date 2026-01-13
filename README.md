# Swayaatra

A fully functional, production-ready ridesharing mobile app using React Native + Expo Go for the frontend and Node.js + Express + MongoDB + Socket.io for the backend.

## Tech Stack

- **Frontend**: React Native, Expo Go
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Real-time**: Socket.io
- **Maps**: Google Maps API

## Setup Instructions

### Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `backend/` and add your configuration (see `.env.example`).
4.  Run the server:
    ```bash
    npm run dev
    ```

### Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in `frontend/` (if needed) or update constants.
4.  Start the app:
    ```bash
    npx expo start
    ```

## Features

- User Authentication (JWT + OTP)
- Driver & Passenger Roles
- Real-time Ride Tracking
- Live Chat
- Google Maps Integration
