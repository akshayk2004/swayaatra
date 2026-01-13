import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Android Emulator: 10.0.2.2
// iOS Simulator: localhost
// Physical Device: Your IP Address
// Replace with your local IP if not using Emulator
const BASE_URL = 'http://172.17.127.94:5000/api';

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

export default api;
