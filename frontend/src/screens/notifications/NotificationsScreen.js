import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const NotificationsScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false); // In real app, fetch from DB initially
    // Since we don't have a specific "get my requests" API yet, we rely on real-time 
    // or we should store them in local state/context if they persist.
    // Ideally: GET /api/rides/requests/pending 

    // For this demo, we'll start with empty and listen for sockets, 
    // OR assuming we only catch live ones. 
    // To be robust, let's assume we catch live ones for now.

    useEffect(() => {
        fetchPendingRequests();

        if (socket && user) {
            console.log(`Listening for rideRequest:${user._id}`);
            socket.on(`rideRequest:${user._id}`, (request) => {
                console.log('New Request received', request);
                setRequests(prev => [request, ...prev]);
            });
        }

        return () => {
            if (socket && user) {
                socket.off(`rideRequest:${user._id}`);
            }
        };
    }, [socket, user]);

    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get('/rides/requests/pending');
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            await api.post(`/rides/requests/${requestId}/accept`);
            Alert.alert('Success', 'Ride accepted!');
            setRequests(prev => prev.filter(req => req._id !== requestId));
        } catch (error) {
            Alert.alert('Error', 'Failed to accept ride');
        }
    };

    const handleReject = async (requestId) => {
        try {
            await api.post(`/rides/requests/${requestId}/reject`);
            setRequests(prev => prev.filter(req => req._id !== requestId));
        } catch (error) {
            Alert.alert('Error', 'Failed to reject ride');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Ionicons name="person-circle" size={40} color="#666" />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.passenger.name}</Text>
                    <Text style={styles.subtext}>Rating: {item.passenger.rating} ★</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleReject(item._id)}>
                    <Text style={styles.btnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => handleAccept(item._id)}>
                    <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notifications</Text>
            {requests.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No new requests</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        color: '#999',
        fontSize: 16,
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    info: {
        marginLeft: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtext: {
        color: '#666',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    btn: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    acceptBtn: {
        backgroundColor: '#4CAF50',
    },
    rejectBtn: {
        backgroundColor: '#F44336',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default NotificationsScreen;
