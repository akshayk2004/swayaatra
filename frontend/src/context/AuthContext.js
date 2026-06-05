import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [splashLoading, setSplashLoading] = useState(true);

    const register = async (name, email, phone, password, role, driverDetails = null, emergencyContact = null) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                phone,
                password,
                role,
                driverDetails,
                emergencyContact
            });
            const userInfo = response.data;
            setUser(userInfo);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));
            await SecureStore.setItemAsync('token', userInfo.token);
            setIsLoading(false);
            return userInfo; // Return user info for success handling
        } catch (error) {
            console.log('Register error', error.response?.data || error);
            setIsLoading(false);
            throw error; // Re-throw to handle in component
        }
    };

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });
            const userInfo = response.data;
            setUser(userInfo);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));
            await SecureStore.setItemAsync('token', userInfo.token);
            setIsLoading(false);
            return userInfo; // Return user info for success handling
        } catch (error) {
            console.log('Login error', error.response?.data || error);
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await SecureStore.deleteItemAsync('userInfo');
            await SecureStore.deleteItemAsync('token');
            setUser(null);
            setIsLoading(false);
        } catch (error) {
            console.log('Logout error', error);
            setIsLoading(false);
        }
    };

    const checkLoginStatus = async () => {
        try {
            const userInfo = await SecureStore.getItemAsync('userInfo');
            const token = await SecureStore.getItemAsync('token');

            if (userInfo && token) {
                setUser(JSON.parse(userInfo));
            } else {
                setUser(null);
            }
        } catch (e) {
            console.log('Login status check error', e);
        } finally {
            // Artificial delay to show splash animation
            setTimeout(() => {
                setSplashLoading(false);
            }, 2000);
        }
    };

    useEffect(() => {
        checkLoginStatus();

        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isLoading,
                user,
                splashLoading,
                register,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
