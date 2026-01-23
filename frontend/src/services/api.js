import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getLocalIP } from '../../getIP';

// Android Emulator: 10.0.2.2
// iOS Simulator: localhost
// Physical Device: Your IP Address
// Replace with your local IP if not using Emulator
const BASE_URL = `http://${getLocalIP()}:5000/api`;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const addVehicle = async (vehicleData) => {
    const response = await api.post('/users/vehicle/add', vehicleData);
    return response.data;
};

export const deleteVehicle = async (vehicleId) => {
    const response = await api.delete(`/users/vehicle/${vehicleId}`);
    return response.data;
};

export const getUserProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
};

export const updateProfile = async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
};

// Attach methods to the axios instance for default import usage (optional but helpful)
Object.assign(api, {
    addVehicle,
    deleteVehicle,
    getUserProfile,
    updateProfile
});

export default api;
