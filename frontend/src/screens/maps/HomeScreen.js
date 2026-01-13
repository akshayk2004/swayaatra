import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, TextInput, Image, ScrollView, Alert, Modal, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';

const HomeScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [hasNotifications, setHasNotifications] = useState(false);

    // Search State
    const [fromLocation, setFromLocation] = useState('Current location');
    const [toLocation, setToLocation] = useState('');
    const [date, setDate] = useState(new Date());
    const [seats, setSeats] = useState(1);

    // Modals
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSeatPicker, setShowSeatPicker] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [pickedLocation, setPickedLocation] = useState(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();

        if (socket && user && (user.role === 'driver' || user.role === 'rider')) {
            socket.on(`rideRequest:${user._id}`, (request) => {
                setHasNotifications(true);
                Alert.alert('New Ride Request', `Passenger: ${request.passenger?.name || 'Unknown'}`);
            });
        }

        return () => {
            if (socket && user) {
                socket.off(`rideRequest:${user._id}`);
            }
        }
    }, [socket, user]);

    const handleUseGPS = async () => {
        if (!location) {
            Alert.alert('Waiting for location...');
            return;
        }
        try {
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const addressString = `${addr.street || ''} ${addr.name || ''}, ${addr.city}`;
                setFromLocation(addressString.trim());
            } else {
                setFromLocation('Unknown Location');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not fetch address');
        }
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const confirmLocationPick = async () => {
        if (pickedLocation) {
            try {
                const reverseGeocode = await Location.reverseGeocodeAsync(pickedLocation);
                if (reverseGeocode.length > 0) {
                    const addr = reverseGeocode[0];
                    const addressString = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}`;
                    setToLocation(addressString.trim());
                } else {
                    setToLocation(`${pickedLocation.latitude.toFixed(4)}, ${pickedLocation.longitude.toFixed(4)}`);
                }
            } catch (error) {
                setToLocation(`${pickedLocation.latitude.toFixed(4)}, ${pickedLocation.longitude.toFixed(4)}`);
            }
        }
        setShowMapPicker(false);
    };

    const handleSearch = () => {
        navigation.navigate('Rides', {
            source: fromLocation,
            destination: toLocation,
            date: date.toISOString(),
            seats
        });
    };

    const initialRegion = {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Top Gradient Section */}
            <LinearGradient
                colors={['#00C6FB', '#005BEA']}
                style={styles.topSection}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.iconBg}>
                            <Ionicons name="sparkles" size={20} color="#FFD700" />
                        </View>
                        <Text style={styles.headerTitle}>Find Your Ride</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                        <View style={styles.starIcon}>
                            <Ionicons name="notifications" size={20} color="#FFD700" />
                            {hasNotifications && <View style={styles.badge} />}
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={styles.subHeader}>Where are you headed today?</Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.statLabel}>Active</Text>
                        <Text style={styles.statValue}>234</Text>
                        <Text style={styles.statSub}>rides now</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="people" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.statLabel}>Drivers</Text>
                        <Text style={styles.statValue}>156</Text>
                        <Text style={styles.statSub}>online</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="wallet" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.statLabel}>Avg</Text>
                        <Text style={styles.statValue}>₹12</Text>
                        <Text style={styles.statSub}>per ride</Text>
                    </View>
                </View>

                {/* Search Panel */}
                <View style={styles.searchPanel}>
                    {/* From Input */}
                    <View style={styles.inputRow}>
                        <View style={[styles.iconCircle, { backgroundColor: '#2196F3' }]}>
                            <Ionicons name="location-outline" size={16} color="#fff" />
                        </View>
                        <TextInput
                            style={styles.input}
                            value={fromLocation}
                            onChangeText={setFromLocation}
                            placeholder="From"
                        />
                        <TouchableOpacity style={styles.gpsButton} onPress={handleUseGPS}>
                            <Text style={styles.gpsText}>Use GPS</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Swap Icon */}
                    <View style={styles.swapContainer}>
                        <View style={styles.swapButton}>
                            <Ionicons name="swap-vertical" size={20} color="#333" />
                        </View>
                    </View>

                    {/* To Input */}
                    <TouchableOpacity onPress={() => setShowMapPicker(true)}>
                        <View style={styles.inputRow}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FF5252' }]}>
                                <Ionicons name="location-outline" size={16} color="#fff" />
                            </View>
                            <Text style={[styles.input, { lineHeight: 40, color: toLocation ? '#333' : '#ccc' }]}>
                                {toLocation || "To: Where are you going?"}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Date & Seats Row */}
                    <View style={styles.splitRow}>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={20} color="#2ECC71" />
                            <Text style={styles.splitInputText}>{date.toLocaleDateString()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.seatInput} onPress={() => setShowSeatPicker(true)}>
                            <Ionicons name="people-outline" size={20} color="#9B59B6" />
                            <Text style={styles.splitInputText}>{seats} seat{seats > 1 ? 's' : ''}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Button */}
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleSearch}
                    >
                        <Ionicons name="search" size={20} color="#2ECC71" />
                        <Text style={styles.searchButtonText}>Search Rides</Text>
                        <Ionicons name="sparkles-outline" size={16} color="#2ECC71" />
                    </TouchableOpacity>
                </View>

                {/* Quick Links */}
                <View style={styles.quickLinks}>
                    <TouchableOpacity style={styles.quickBtn}>
                        <Ionicons name="home" size={16} color="#FF9800" />
                        <Text style={styles.quickBtnText}>To Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickBtn}>
                        <Ionicons name="briefcase" size={16} color="#795548" />
                        <Text style={styles.quickBtnText}>To Work</Text>
                    </TouchableOpacity>
                </View>

                {/* Driver Offer Button */}
                {(user?.role === 'driver' || user?.role === 'rider') && (
                    <TouchableOpacity
                        style={styles.offerButtonMain}
                        onPress={() => navigation.navigate('CreateRide')}
                    >
                        <LinearGradient
                            colors={['#FF512F', '#DD2476']}
                            style={styles.offerButtonGradient}
                        >
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={styles.offerButtonText}>Offer a Ride</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </LinearGradient>

            {/* Map Section */}
            <View style={styles.mapSection}>
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    showsUserLocation={true}
                    initialRegion={initialRegion}
                    region={location ? {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    } : initialRegion}
                >
                    {location && (
                        <Marker
                            coordinate={{
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            }}
                            title="You"
                        />
                    )}
                </MapView>

                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Ionicons name="person" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}

            {/* Seat Picker Modal */}
            <Modal visible={showSeatPicker} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Seats</Text>
                        <View style={styles.seatCounter}>
                            <TouchableOpacity onPress={() => setSeats(Math.max(1, seats - 1))} style={styles.counterBtn}>
                                <Ionicons name="remove" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.seatCount}>{seats}</Text>
                            <TouchableOpacity onPress={() => setSeats(Math.min(8, seats + 1))} style={styles.counterBtn}>
                                <Ionicons name="add" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowSeatPicker(false)}>
                            <Text style={styles.confirmBtnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Map Picker Modal */}
            <Modal visible={showMapPicker} animationType="slide">
                <View style={styles.fullScreenMap}>
                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={initialRegion}
                        region={location ? {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        } : initialRegion}
                        onPress={(e) => setPickedLocation(e.nativeEvent.coordinate)}
                    >
                        {pickedLocation && <Marker coordinate={pickedLocation} pinColor="red" />}
                    </MapView>
                    <View style={styles.mapOverlay}>
                        <Text style={styles.mapInstruction}>Tap to select destination</Text>
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.cancelMapBtn} onPress={() => setShowMapPicker(false)}>
                                <Text style={styles.cancelMapText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmMapBtn} onPress={confirmLocationPick}>
                                <Text style={styles.confirmMapText}>Confirm Location</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topSection: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBg: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 8,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    starIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    subHeader: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        padding: 10,
        width: '31%',
        alignItems: 'flex-start',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 5,
    },
    statValue: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
        marginVertical: 2,
    },
    statSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
    },
    searchPanel: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 5,
        marginBottom: 5,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
    },
    input: {
        flex: 1,
        paddingHorizontal: 10,
        fontSize: 14,
        color: '#333',
        height: 40,
    },
    gpsButton: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginRight: 5,
    },
    gpsText: {
        color: '#2ECC71',
        fontSize: 12,
        fontWeight: 'bold',
    },
    swapContainer: {
        alignItems: 'center',
        height: 20,
        zIndex: 10,
        marginTop: -10,
        marginBottom: -10,
    },
    swapButton: {
        backgroundColor: '#fff',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#eee',
    },
    splitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 15,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        width: '48%',
        padding: 10,
        borderRadius: 12,
    },
    seatInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        width: '48%',
        padding: 10,
        borderRadius: 12,
    },
    splitInputText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    searchButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff',
    },
    searchButtonText: {
        color: '#2ECC71',
        fontWeight: 'bold',
        fontSize: 16,
        marginHorizontal: 10,
    },
    quickLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    quickBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: '48%',
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    offerButtonMain: {
        alignSelf: 'center',
        marginTop: 15,
        width: '60%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    offerButtonGradient: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    offerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    mapSection: {
        flex: 1,
        marginTop: -30,
        backgroundColor: '#f0f0f0',
        zIndex: 1,
    },
    map: {
        flex: 1,
    },
    profileBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#6C63FF',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        borderWidth: 1,
        borderColor: '#fff'
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    seatCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    counterBtn: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 10,
    },
    seatCount: {
        fontSize: 30,
        fontWeight: 'bold',
        marginHorizontal: 20,
    },
    confirmBtn: {
        backgroundColor: '#6C63FF',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    fullScreenMap: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 5,
    },
    mapInstruction: {
        fontSize: 16,
        marginBottom: 15,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelMapBtn: {
        padding: 10,
        flex: 1,
        alignItems: 'center',
    },
    cancelMapText: {
        color: '#F44336',
        fontWeight: 'bold',
    },
    confirmMapBtn: {
        backgroundColor: '#2ECC71',
        padding: 10,
        borderRadius: 10,
        flex: 1,
        alignItems: 'center',
        marginLeft: 10,
    },
    confirmMapText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default HomeScreen;
