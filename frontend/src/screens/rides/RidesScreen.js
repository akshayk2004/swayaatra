import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../services/api';
import RideCard from '../../components/RideCard'; // You need to create this
import { StatusBar } from 'expo-status-bar';

const RidesScreen = ({ navigation }) => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRides = async () => {
        try {
            const response = await api.get('/rides/search');
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
    }, []);

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
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No rides available at the moment.</Text>
                }
            />
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
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
        marginTop: 50,
    },
});

export default RidesScreen;
