import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, RefreshControl, Image } from 'react-native';
import api from '../../services/api';
import RideCard from '../../components/RideCard';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const SearchResultsScreen = ({ navigation, route }) => {
    const { source, destination, date, seats, sourceLat, sourceLng, destLat, destLng } = route.params || {};
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRides = async () => {
        try {
            setLoading(true);
            const params = {};
            if (source) params.source = source;
            if (destination) params.destination = destination;
            if (date) params.date = date;
            if (seats) params.seats = seats;
            if (sourceLat !== undefined && sourceLat !== null) params.sourceLat = sourceLat;
            if (sourceLng !== undefined && sourceLng !== null) params.sourceLng = sourceLng;
            if (destLat !== undefined && destLat !== null) params.destLat = destLat;
            if (destLng !== undefined && destLng !== null) params.destLng = destLng;

            const response = await api.get('/rides/search', { params });
            setRides(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRides();
    }, [source, destination, date, seats, sourceLat, sourceLng, destLat, destLng]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRides();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Text style={styles.title}>Available Rides</Text>
            {rides.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search" size={80} color="#ddd" />
                    <Text style={styles.emptyTitle}>No rides found</Text>
                    <Text style={styles.emptyText}>
                        We couldn't find any rides matching your search.
                        Try adjusting your filters or date.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={rides}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <RideCard
                            ride={item}
                            onPress={() => navigation.navigate('RideDetails', { rideId: item._id })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    list: {
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        marginTop: 10,
        paddingHorizontal: 40,
        lineHeight: 22,
    },
});

export default SearchResultsScreen;
