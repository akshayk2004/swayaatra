import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Button from '../../components/Button';
import { AuthContext } from '../../context/AuthContext';

const RideDetailsScreen = ({ route, navigation }) => {
    const { rideId } = route.params;
    const { user } = useContext(AuthContext);
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRideDetails();
    }, []);

    const fetchRideDetails = async () => {
        try {
            const response = await api.get(`/rides/${rideId}`);
            setRide(response.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load ride details');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRide = async () => {
        try {
            await api.post(`/rides/${rideId}/join`);
            Alert.alert('Success', 'Request sent to driver!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to join');
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color="#6C63FF" /></View>;
    if (!ride) return <View style={styles.center}><Text>Ride not found</Text></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: ride.source.lat,
                        longitude: ride.source.lng,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                >
                    <Marker coordinate={{ latitude: ride.source.lat, longitude: ride.source.lng }} title={ride.source.name} />
                    <Marker coordinate={{ latitude: ride.destination.lat, longitude: ride.destination.lng }} title={ride.destination.name} pinColor="blue" />
                    {/* Polyline would go here if we had detailed coordinates */}
                </MapView>
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.driverSection}>
                    <Image source={ride.driver.profileImage ? { uri: ride.driver.profileImage } : { uri: 'https://via.placeholder.com/60' }} style={styles.avatar} />
                    <View>
                        <Text style={styles.driverName}>{ride.driver.name}</Text>
                        <View style={styles.ratingBox}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.ratingText}>{ride.driver.rating?.toFixed(1) || 'New'}</Text>
                        </View>
                    </View>
                    <View style={styles.priceTag}>
                        <Text style={styles.price}>₹{ride.fare}</Text>
                    </View>
                </View>

                <View style={styles.routeInfo}>
                    <Text style={styles.label}>From</Text>
                    <Text style={styles.address}>{ride.source.name}</Text>
                    <View style={styles.connector} />
                    <Text style={styles.label}>To</Text>
                    <Text style={styles.address}>{ride.destination.name}</Text>
                </View>

                <View style={styles.metaInfo}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar" size={20} color="#666" />
                        <Text style={styles.metaText}>{new Date(ride.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time" size={20} color="#666" />
                        <Text style={styles.metaText}>{new Date(ride.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="people" size={20} color="#666" />
                        <Text style={styles.metaText}>{ride.seatsAvailable} seats</Text>
                    </View>
                </View>

                <Button
                    title="Open Chat"
                    onPress={() => navigation.navigate('Chat', { rideId })}
                    colors={['#4ca1af', '#2c3e50']}
                />

                {user._id !== ride.driver._id && (
                    <Button
                        title="Request to Join"
                        onPress={handleJoinRide}
                    />
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        height: 250,
        width: '100%',
    },
    map: {
        flex: 1,
    },
    detailsContainer: {
        flex: 1,
        padding: 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
        backgroundColor: '#fff',
    },
    driverSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FBC02D',
        marginLeft: 5,
    },
    priceTag: {
        marginLeft: 'auto',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    routeInfo: {
        marginBottom: 25,
    },
    label: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
    },
    address: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    connector: {
        height: 20,
        borderLeftWidth: 1,
        borderLeftColor: '#ddd',
        marginLeft: 10,
        marginVertical: 5,
    },
    metaInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    metaItem: {
        alignItems: 'center',
    },
    metaText: {
        marginTop: 5,
        color: '#666',
        fontSize: 12,
    },
});

export default RideDetailsScreen;
