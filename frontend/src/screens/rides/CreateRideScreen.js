import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateRideScreen = ({ navigation }) => {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [fare, setFare] = useState('');
    const [seats, setSeats] = useState(1);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('source'); // 'source' or 'destination'
    const [pickedLocation, setPickedLocation] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showSeatPicker, setShowSeatPicker] = useState(false);

    const handleUseGPS = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Allow location access to use GPS');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const addressString = `${addr.street || ''} ${addr.name || ''}, ${addr.city}`;
                setSource(addressString.trim());
            } else {
                setSource('Unknown Location');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not fetch location');
        }
    };

    const openMapPicker = (mode) => {
        setPickerMode(mode);
        setShowMapPicker(true);
        setPickedLocation(null);
    };

    const confirmLocationPick = async () => {
        if (!pickedLocation) return;

        try {
            const reverseGeocode = await Location.reverseGeocodeAsync(pickedLocation);
            let addressString = `${pickedLocation.latitude.toFixed(4)}, ${pickedLocation.longitude.toFixed(4)}`;

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                addressString = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}`.trim();
            }

            if (pickerMode === 'source') {
                setSource(addressString);
            } else {
                setDestination(addressString);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setShowMapPicker(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(false);
        setDate(currentDate);
    };

    const handleTimeChange = (event, selectedTime) => {
        const currentTime = selectedTime || time;
        setShowTimePicker(false);
        setTime(currentTime);
    };

    const handleCreateRide = async () => {
        if (!source || !destination || !fare) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Combine Date and Time
            const rideDateTime = new Date(date);
            rideDateTime.setHours(time.getHours());
            rideDateTime.setMinutes(time.getMinutes());

            const rideData = {
                source: {
                    name: source,
                    lat: 37.7749, // Placeholder lat until real geocoding
                    lng: -122.4194
                },
                destination: {
                    name: destination,
                    lat: 34.0522,
                    lng: -118.2437
                },
                date: rideDateTime.toISOString(),
                fare: Number(fare),
                seats: Number(seats)
            };

            await api.post('/rides/create', rideData);
            Alert.alert('Success', 'Ride created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create ride');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const initialRegion = {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    return (
        <LinearGradient
            colors={['#00C6FB', '#005BEA']}
            style={styles.container}
        >
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Offer a Ride</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Route Details</Text>

                    {/* Source Input */}
                    <View style={styles.inputContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: '#2196F3' }]}>
                            <Ionicons name="navigate-circle-outline" size={20} color="#fff" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Pickup Location"
                            value={source}
                            onChangeText={setSource}
                        />
                        <TouchableOpacity onPress={handleUseGPS} style={styles.gpsIcon}>
                            <Ionicons name="locate" size={20} color="#2196F3" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openMapPicker('source')} style={styles.mapIcon}>
                            <Ionicons name="map" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.connector} />

                    {/* Destination Input */}
                    <TouchableOpacity onPress={() => openMapPicker('destination')}>
                        <View style={styles.inputContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FF5252' }]}>
                                <Ionicons name="location-outline" size={20} color="#fff" />
                            </View>
                            <Text style={[styles.input, { lineHeight: 40, color: destination ? '#333' : '#999' }]}>
                                {destination || "Destination"}
                            </Text>
                            <TouchableOpacity onPress={() => openMapPicker('destination')} style={styles.mapIcon}>
                                <Ionicons name="map" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Ride Info</Text>

                    <View style={styles.row}>
                        {/* Date Picker */}
                        <TouchableOpacity
                            style={[styles.inputContainer, styles.halfInput]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#2ECC71' }]}>
                                <Ionicons name="calendar-outline" size={20} color="#fff" />
                            </View>
                            <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
                        </TouchableOpacity>

                        {/* Time Picker */}
                        <TouchableOpacity
                            style={[styles.inputContainer, styles.halfInput]}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#FFA726' }]}>
                                <Ionicons name="time-outline" size={20} color="#fff" />
                            </View>
                            <Text style={styles.inputText}>
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, styles.halfInput]}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FFCA28' }]}>
                                <Text style={styles.currencyIcon}>₹</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Fare"
                                value={fare}
                                onChangeText={setFare}
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.inputContainer, styles.halfInput]}
                            onPress={() => setShowSeatPicker(true)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#9B59B6' }]}>
                                <Ionicons name="people-outline" size={20} color="#fff" />
                            </View>
                            <Text style={styles.inputText}>{seats} Seat(s)</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateRide} disabled={loading}>
                    <LinearGradient
                        colors={['#FF512F', '#DD2476']}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.buttonText}>{loading ? "Creating..." : "Publish Ride"}</Text>
                        <Ionicons name="rocket-outline" size={20} color="#fff" style={{ marginLeft: 10 }} />
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>

            {/* Modals */}

            {/* Map Picker Modal */}
            <Modal visible={showMapPicker} animationType="slide">
                <View style={styles.fullScreenMap}>
                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={initialRegion}
                        onPress={(e) => setPickedLocation(e.nativeEvent.coordinate)}
                    >
                        {pickedLocation && <Marker coordinate={pickedLocation} pinColor="red" />}
                    </MapView>
                    <View style={styles.mapOverlay}>
                        <Text style={styles.mapInstruction}>
                            Pick {pickerMode === 'source' ? 'Pickup' : 'Destination'} Location
                        </Text>
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.cancelMapBtn} onPress={() => setShowMapPicker(false)}>
                                <Text style={styles.cancelMapText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmMapBtn} onPress={confirmLocationPick}>
                                <Text style={styles.confirmMapText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date/Time Pickers */}
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={time}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                />
            )}

            {/* Seat Picker Modal */}
            <Modal visible={showSeatPicker} transparent={true} animationType="fade">
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

        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        opacity: 0.7,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        padding: 5,
        marginBottom: 10,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    currencyIcon: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: 40,
    },
    inputText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    gpsIcon: {
        padding: 8,
    },
    mapIcon: {
        padding: 8,
    },
    connector: {
        height: 20,
        borderLeftWidth: 2,
        borderLeftColor: '#eee',
        marginLeft: 24,
        marginVertical: -5,
        zIndex: -1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    createButton: {
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 30,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    // Modal Styles
    fullScreenMap: {
        flex: 1,
        backgroundColor: '#fff',
    },
    map: {
        flex: 1,
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
});

export default CreateRideScreen;
