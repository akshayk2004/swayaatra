import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import Button from '../../components/Button';
import { AuthContext } from '../../context/AuthContext';

const RideDetailsScreen = ({ route, navigation }) => {
    const { rideId } = route.params;
    const { user } = useContext(AuthContext);
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [routeDetails, setRouteDetails] = useState({ distance: 0, duration: 0 });

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
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: ride.source.lat,
                        longitude: ride.source.lng,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    <Marker coordinate={{ latitude: ride.source.lat, longitude: ride.source.lng }} title={ride.source.name} />
                    <Marker coordinate={{ latitude: ride.destination.lat, longitude: ride.destination.lng }} title={ride.destination.name} pinColor="blue" />

                    <MapViewDirections
                        origin={{ latitude: ride.source.lat, longitude: ride.source.lng }}
                        destination={{ latitude: ride.destination.lat, longitude: ride.destination.lng }}
                        apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
                        strokeWidth={4}
                        strokeColor="#005BEA"
                        onReady={result => {
                            setRouteDetails({
                                distance: result.distance,
                                duration: result.duration,
                            });
                        }}
                    />
                </MapView>

                {/* Route Stats Overlay */}
                <View style={styles.routeStats}>
                    <View style={styles.statBadge}>
                        <Ionicons name="time" size={16} color="#fff" />
                        <Text style={styles.statText}>{Math.round(routeDetails.duration)} min</Text>
                    </View>
                    <View style={[styles.statBadge, { marginLeft: 10, backgroundColor: '#2ECC71' }]}>
                        <Ionicons name="navigate" size={16} color="#fff" />
                        <Text style={styles.statText}>{routeDetails.distance.toFixed(1)} km</Text>
                    </View>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.headerRow}>
                    <View style={styles.driverSection}>
                        <Image
                            source={ride.driver?.profileImage ? { uri: ride.driver.profileImage } : { uri: 'https://via.placeholder.com/60' }}
                            style={styles.avatar}
                        />
                        <View>
                            <Text style={styles.driverName}>{ride.driver?.name || 'Unknown Driver'}</Text>
                            <View style={styles.ratingBox}>
                                <Ionicons name="star" size={14} color="#FFD700" />
                                <Text style={styles.ratingText}>{ride.driver?.rating?.toFixed(1) || 'New'}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.priceTag}>
                        <Text style={styles.price}>₹{ride.fare}</Text>
                    </View>
                </View>

                {/* Vehicle Info Section */}
                {ride.vehicle && (
                    <View style={styles.vehicleInfo}>
                        <View style={styles.vehicleIcon}>
                            <Ionicons name={ride.vehicle.type === 'bike' ? "bicycle" : "car-sport"} size={20} color="#005BEA" />
                        </View>
                        <View>
                            <Text style={styles.vehicleName}>{ride.vehicle.make} {ride.vehicle.model}</Text>
                            <Text style={styles.vehicleDetail}>{ride.vehicle.color} • {ride.vehicle.plate}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.divider} />

                <View style={styles.routeInfo}>
                    <View style={styles.routeRow}>
                        <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
                        <View style={styles.addressBox}>
                            <Text style={styles.label}>Pick Up</Text>
                            <Text style={styles.address}>{ride.source.name}</Text>
                        </View>
                    </View>
                    <View style={styles.connector} />
                    <View style={styles.routeRow}>
                        <View style={[styles.dot, { backgroundColor: '#FF5252' }]} />
                        <View style={styles.addressBox}>
                            <Text style={styles.label}>Drop Off</Text>
                            <Text style={styles.address}>{ride.destination.name}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.metaInfo}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={22} color="#555" />
                        <Text style={styles.metaText}>{new Date(ride.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={22} color="#555" />
                        <Text style={styles.metaText}>{new Date(ride.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={22} color="#555" />
                        <Text style={styles.metaText}>{ride.seatsAvailable} seats left</Text>
                    </View>
                </View>

                <Button
                    title="Open Chat"
                    onPress={() => navigation.navigate('Chat', { rideId })}
                    colors={['#00C6FB', '#005BEA']}
                />

                {user?._id !== ride.driver?._id && (
                    <Button
                        title="Request to Join"
                        onPress={handleJoinRide}
                        colors={['#2ECC71', '#27ae60']}
                        style={{ marginTop: 15 }}
                    />
                )}

                {user?._id === ride.driver?._id && ride.status === 'scheduled' && (
                    <Button
                        title="Complete Ride"
                        onPress={async () => {
                            try {
                                Alert.alert(
                                    "Complete Ride?",
                                    "This will mark the ride as finished and update your stats.",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Confirm",
                                            onPress: async () => {
                                                await api.post(`/rides/${rideId}/complete`);
                                                Alert.alert('Success', 'Ride marked as completed!');
                                                navigation.goBack();
                                            }
                                        }
                                    ]
                                );
                            } catch (error) {
                                Alert.alert('Error', 'Failed to complete ride');
                            }
                        }}
                        colors={['#2ECC71', '#27ae60']}
                        style={{ marginTop: 15 }}
                    />
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mapContainer: { height: 250, width: '100%' },
    map: { flex: 1 },
    routeStats: { position: 'absolute', bottom: 40, right: 20, flexDirection: 'row' },
    statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#005BEA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.2, elevation: 3 },
    statText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },

    detailsContainer: { flex: 1, padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { height: -2, width: 0 }, shadowOpacity: 0.1, elevation: 5 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    driverSection: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    driverName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
    ratingText: { fontSize: 12, fontWeight: 'bold', color: '#FBC02D', marginLeft: 4 },

    priceTag: { backgroundColor: '#E0F7FA', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
    price: { fontSize: 20, fontWeight: 'bold', color: '#006064' },

    vehicleInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 12, borderRadius: 12, marginBottom: 20 },
    vehicleIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    vehicleName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    vehicleDetail: { fontSize: 12, color: '#666' },

    divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 },

    routeInfo: { marginBottom: 25 },
    routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: 15 },
    addressBox: { flex: 1 },
    label: { fontSize: 12, color: '#999', marginBottom: 2 },
    address: { fontSize: 15, color: '#333', fontWeight: '500' },
    connector: { height: 20, borderLeftWidth: 1, borderLeftColor: '#ddd', marginLeft: 4.5, marginVertical: 2 },

    metaInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, backgroundColor: '#FAFAFA', padding: 15, borderRadius: 15 },
    metaItem: { alignItems: 'center', flex: 1 },
    metaText: { marginTop: 5, color: '#555', fontSize: 12, fontWeight: '500' },
});

export default RideDetailsScreen;
