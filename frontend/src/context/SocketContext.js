import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

import { getLocalIP } from '../../getIP';

// Android Emulator: 10.0.2.2
const SOCKET_URL = `http://${getLocalIP()}:5000`;

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket);

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
