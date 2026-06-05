import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [isCompleting, setIsCompleting] = useState(false);

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

    const handleCompleteRide = async () => {
        setIsCompleting(true);
        try {
            await api.post(`/rides/${rideId}/complete`, { paymentMethod: selectedMethod });
            setShowPaymentModal(false);
            Alert.alert('Success', `Ride completed successfully! Collected ₹${ride.fare} via ${selectedMethod.toUpperCase()}.`);
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to complete ride');
        } finally {
            setIsCompleting(false);
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
                        onPress={() => setShowPaymentModal(true)}
                        colors={['#2ECC71', '#27ae60']}
                        style={{ marginTop: 15 }}
                    />
                )}
            </View>

            {/* Payment Collection Modal */}
            <Modal
                visible={showPaymentModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Collect Payment</Text>
                            <TouchableOpacity onPress={() => setShowPaymentModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Fare Info */}
                        <View style={styles.fareContainer}>
                            <Text style={styles.fareLabel}>FARE TO COLLECT</Text>
                            <Text style={styles.fareAmount}>₹{ride.fare}</Text>
                            <Text style={styles.tripRoute}>
                                {ride.source.name.split(',')[0]} ➔ {ride.destination.name.split(',')[0]}
                            </Text>
                        </View>

                        <Text style={styles.sectionTitle}>Select Payment Method</Text>

                        {/* Cash Option */}
                        <TouchableOpacity
                            style={[
                                styles.methodCard,
                                selectedMethod === 'cash' && styles.methodCardSelected,
                                { borderColor: selectedMethod === 'cash' ? '#2ECC71' : '#E5E5EA' }
                            ]}
                            onPress={() => setSelectedMethod('cash')}
                        >
                            <View style={[styles.methodIconBg, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="cash-outline" size={24} color="#2ECC71" />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>Cash</Text>
                                <Text style={styles.methodDesc}>Collect physical cash from passenger</Text>
                            </View>
                            <View style={styles.radioCircle}>
                                {selectedMethod === 'cash' && <View style={[styles.radioDot, { backgroundColor: '#2ECC71' }]} />}
                            </View>
                        </TouchableOpacity>

                        {/* UPI Option */}
                        <TouchableOpacity
                            style={[
                                styles.methodCard,
                                selectedMethod === 'upi' && styles.methodCardSelected,
                                { borderColor: selectedMethod === 'upi' ? '#9B59B6' : '#E5E5EA' }
                            ]}
                            onPress={() => setSelectedMethod('upi')}
                        >
                            <View style={[styles.methodIconBg, { backgroundColor: '#F3E5F5' }]}>
                                <Ionicons name="qr-code-outline" size={24} color="#9B59B6" />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>UPI / QR Code</Text>
                                <Text style={styles.methodDesc}>Show QR code for instant passenger scan</Text>
                            </View>
                            <View style={styles.radioCircle}>
                                {selectedMethod === 'upi' && <View style={[styles.radioDot, { backgroundColor: '#9B59B6' }]} />}
                            </View>
                        </TouchableOpacity>

                        {/* QR Code Container if UPI selected */}
                        {selectedMethod === 'upi' && (
                            <View style={styles.qrContainer}>
                                <Image
                                    source={{
                                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=swayaatra@ybl%26pn=Swayaatra%26am=${ride.fare}%26cu=INR`
                                    }}
                                    style={styles.qrImage}
                                    resizeMode="contain"
                                />
                                <Text style={styles.qrHelpText}>Ask passenger to scan this code to pay</Text>
                            </View>
                        )}

                        {/* Wallet Option */}
                        <TouchableOpacity
                            style={[
                                styles.methodCard,
                                selectedMethod === 'wallet' && styles.methodCardSelected,
                                { borderColor: selectedMethod === 'wallet' ? '#29B6F6' : '#E5E5EA' }
                            ]}
                            onPress={() => setSelectedMethod('wallet')}
                        >
                            <View style={[styles.methodIconBg, { backgroundColor: '#E1F5FE' }]}>
                                <Ionicons name="wallet-outline" size={24} color="#29B6F6" />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>Swayaatra Wallet</Text>
                                <Text style={styles.methodDesc}>Deduct immediately from passenger's balance</Text>
                            </View>
                            <View style={styles.radioCircle}>
                                {selectedMethod === 'wallet' && <View style={[styles.radioDot, { backgroundColor: '#29B6F6' }]} />}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmPaymentBtn, isCompleting && styles.confirmPaymentBtnDisabled]}
                            onPress={handleCompleteRide}
                            disabled={isCompleting}
                        >
                            {isCompleting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmPaymentBtnText}>Confirm Payment & Complete Ride</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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

    // Modal Overlay and Content Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1C1C1E',
    },
    closeBtn: {
        padding: 4,
    },

    // Fare Card
    fareContainer: {
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    fareLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    fareAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    tripRoute: {
        fontSize: 14,
        color: '#3A3A3C',
        fontWeight: '500',
    },

    // Methods
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 16,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    methodCardSelected: {
        borderWidth: 2,
    },
    methodIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    methodDesc: {
        fontSize: 12,
        color: '#8E8E93',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#C7C7CC',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    // QR Code
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderStyle: 'dashed',
    },
    qrImage: {
        width: 120,
        height: 120,
        marginBottom: 10,
    },
    qrHelpText: {
        fontSize: 11,
        color: '#8E8E93',
        textAlign: 'center',
    },

    // Confirm Button
    confirmPaymentBtn: {
        backgroundColor: '#6C63FF',
        borderRadius: 16,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    confirmPaymentBtnDisabled: {
        backgroundColor: '#AEAEB2',
    },
    confirmPaymentBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RideDetailsScreen;
