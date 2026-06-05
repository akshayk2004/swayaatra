import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api, { getUserProfile, addVehicle } from '../../services/api';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';

const MAPUSA_PANJIM_COORDS = [
    { latitude: 15.5937, longitude: 73.8105 }, // Mapusa
    { latitude: 15.5800, longitude: 73.8130 },
    { latitude: 15.5650, longitude: 73.8150 },
    { latitude: 15.5453, longitude: 73.8180 }, // Porvorim
    { latitude: 15.5250, longitude: 73.8210 },
    { latitude: 15.5100, longitude: 73.8240 },
    { latitude: 15.4989, longitude: 73.8278 }  // Panjim
];

const MAPUSA_CALANGUTE_COORDS = [
    { latitude: 15.5937, longitude: 73.8105 }, // Mapusa
    { latitude: 15.5820, longitude: 73.7980 },
    { latitude: 15.5710, longitude: 73.7850 },
    { latitude: 15.5612, longitude: 73.7741 }, // Saligao
    { latitude: 15.5500, longitude: 73.7680 },
    { latitude: 15.5399, longitude: 73.7628 }  // Calangute
];

const PANJIM_CALANGUTE_COORDS = [
    { latitude: 15.4989, longitude: 73.8278 }, // Panjim
    { latitude: 15.5080, longitude: 73.8120 },
    { latitude: 15.5183, longitude: 73.7915 }, // Reis Magos
    { latitude: 15.5280, longitude: 73.7750 },
    { latitude: 15.5399, longitude: 73.7628 }  // Calangute
];

const CreateRideScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [sourceCoords, setSourceCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [fare, setFare] = useState('');
    const [seats, setSeats] = useState(1);
    const [loading, setLoading] = useState(false);

    // Vehicle State
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

    // New Vehicle Form State
    const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', plate: '', color: '', type: 'sedan' });
    const [addingVehicle, setAddingVehicle] = useState(false);

    // Modal States for Pickers
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('source');
    const [pickedLocation, setPickedLocation] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Fetch User Vehicles
    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const profile = await getUserProfile();
            if (profile.vehicles && profile.vehicles.length > 0) {
                setVehicles(profile.vehicles);
                setSelectedVehicle(profile.vehicles[0]); // Default to first vehicle
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    };

    const handleAddVehicle = async () => {
        if (!newVehicle.make || !newVehicle.model || !newVehicle.plate) {
            Alert.alert('Error', 'Please fill in required fields (Make, Model, Plate)');
            return;
        }

        setAddingVehicle(true);
        try {
            const updatedVehicles = await addVehicle(newVehicle);
            setVehicles(updatedVehicles);
            // Select the newly added vehicle (last in list)
            if (updatedVehicles.length > 0) {
                setSelectedVehicle(updatedVehicles[updatedVehicles.length - 1]);
            }
            setShowAddVehicleModal(false);
            setNewVehicle({ make: '', model: '', year: '', plate: '', color: '', type: 'sedan' }); // Reset form
        } catch (error) {
            Alert.alert('Error', 'Failed to add vehicle');
        } finally {
            setAddingVehicle(false);
        }
    };

    const handleCreateRide = async () => {
        if (!source || !destination || !fare) {
            Alert.alert('Error', 'Please fill in route and fare details');
            return;
        }

        if (!selectedVehicle) {
            Alert.alert('Error', 'Please select a vehicle');
            return;
        }

        setLoading(true);
        try {
            const rideDateTime = new Date(date);
            rideDateTime.setHours(time.getHours());
            rideDateTime.setMinutes(time.getMinutes());

            // Determine active coordinates / polyline list
            let sCoords = sourceCoords || { latitude: 15.4989, longitude: 73.8278 };
            let dCoords = destCoords || { latitude: 15.5937, longitude: 73.8105 };
            let routeCoords = [];

            const sName = source.toLowerCase();
            const dName = destination.toLowerCase();

            if (sName.includes('mapusa') && dName.includes('panjim')) {
                routeCoords = MAPUSA_PANJIM_COORDS;
                sCoords = MAPUSA_PANJIM_COORDS[0];
                dCoords = MAPUSA_PANJIM_COORDS[MAPUSA_PANJIM_COORDS.length - 1];
            } else if (sName.includes('panjim') && dName.includes('mapusa')) {
                routeCoords = [...MAPUSA_PANJIM_COORDS].reverse();
                sCoords = routeCoords[0];
                dCoords = routeCoords[routeCoords.length - 1];
            } else if (sName.includes('mapusa') && dName.includes('calangute')) {
                routeCoords = MAPUSA_CALANGUTE_COORDS;
                sCoords = MAPUSA_CALANGUTE_COORDS[0];
                dCoords = MAPUSA_CALANGUTE_COORDS[MAPUSA_CALANGUTE_COORDS.length - 1];
            } else if (sName.includes('calangute') && dName.includes('mapusa')) {
                routeCoords = [...MAPUSA_CALANGUTE_COORDS].reverse();
                sCoords = routeCoords[0];
                dCoords = routeCoords[routeCoords.length - 1];
            } else if (sName.includes('panjim') && dName.includes('calangute')) {
                routeCoords = PANJIM_CALANGUTE_COORDS;
                sCoords = PANJIM_CALANGUTE_COORDS[0];
                dCoords = PANJIM_CALANGUTE_COORDS[PANJIM_CALANGUTE_COORDS.length - 1];
            } else if (sName.includes('calangute') && dName.includes('panjim')) {
                routeCoords = [...PANJIM_CALANGUTE_COORDS].reverse();
                sCoords = routeCoords[0];
                dCoords = routeCoords[routeCoords.length - 1];
            } else {
                // Interpolate 10 points between sCoords and dCoords to form a straight line path
                const steps = 10;
                for (let i = 0; i <= steps; i++) {
                    const factor = i / steps;
                    routeCoords.push({
                        latitude: sCoords.latitude + (dCoords.latitude - sCoords.latitude) * factor,
                        longitude: sCoords.longitude + (dCoords.longitude - sCoords.longitude) * factor
                    });
                }
            }

            const rideData = {
                source: { name: source, lat: sCoords.latitude, lng: sCoords.longitude },
                destination: { name: destination, lat: dCoords.latitude, lng: dCoords.longitude },
                date: rideDateTime.toISOString(),
                fare: Number(fare),
                seats: Number(seats),
                polyline: JSON.stringify(routeCoords),
                vehicle: selectedVehicle
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

    // Location Handlers
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
                setSourceCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
            } else {
                setSource('Unknown Location');
                setSourceCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
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
        if (pickedLocation) {
            try {
                const reverseGeocode = await Location.reverseGeocodeAsync(pickedLocation);
                let addressString = `${pickedLocation.latitude.toFixed(4)}, ${pickedLocation.longitude.toFixed(4)}`;
                if (reverseGeocode.length > 0) {
                    const addr = reverseGeocode[0];
                    addressString = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}`;
                }

                if (pickerMode === 'source') {
                    setSource(addressString.trim());
                    setSourceCoords(pickedLocation);
                } else {
                    setDestination(addressString.trim());
                    setDestCoords(pickedLocation);
                }
            } catch (error) {
                console.error(error);
            }
        }
        setShowMapPicker(false);
    };

    const handleDateChange = (event, selectedDate) => { const currentDate = selectedDate || date; setShowDatePicker(false); setDate(currentDate); };
    const handleTimeChange = (event, selectedTime) => { const currentTime = selectedTime || time; setShowTimePicker(false); setTime(currentTime); };

    // Initial Map Region
    const initialRegion = { latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.0922, longitudeDelta: 0.0421 };

    const renderVehicleItem = ({ item }) => {
        const isBike = item.type === 'bike';
        return (
            <TouchableOpacity
                style={[styles.vehicleCard, selectedVehicle?._id === item._id && styles.selectedVehicleCard]}
                onPress={() => setSelectedVehicle(item)}
            >
                <View style={styles.vehicleIconBg}>
                    <Ionicons name={isBike ? "bicycle" : "car-sport"} size={24} color="#005BEA" />
                </View>
                <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{item.make} {item.model}</Text>
                    <Text style={styles.vehicleDetail}>{item.color} • {item.year}</Text>
                    <Text style={styles.vehiclePlate}>{item.plate}</Text>
                </View>
                {selectedVehicle?._id === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#2ECC71" style={styles.checkIcon} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient colors={['#F5F7FA', '#B8C6DB']} style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Offer a Ride</Text>
                    <Text style={styles.headerSub}>Choose your vehicle and seats</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. Select Vehicle Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Select Vehicle</Text>
                    <TouchableOpacity onPress={() => setShowAddVehicleModal(true)}>
                        <Text style={styles.addNewText}>+ Add New</Text>
                    </TouchableOpacity>
                </View>

                {vehicles.length === 0 ? (
                    <TouchableOpacity style={styles.emptyVehicleCard} onPress={() => setShowAddVehicleModal(true)}>
                        <Ionicons name="add-circle-outline" size={40} color="#ccc" />
                        <Text style={styles.emptyVehicleText}>Add your first vehicle</Text>
                    </TouchableOpacity>
                ) : (
                    <FlatList
                        data={vehicles}
                        renderItem={renderVehicleItem}
                        keyExtractor={item => item._id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.vehicleList}
                    />
                )}

                {/* 2. Route Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Route & Schedule</Text>

                    {/* Source */}
                    <View style={styles.inputRow}>
                        <Ionicons name="navigate-circle" size={24} color="#2196F3" />
                        <TextInput
                            style={styles.input}
                            placeholder="Pickup Location"
                            value={source}
                            onChangeText={setSource}
                        />
                        <TouchableOpacity onPress={handleUseGPS} style={styles.iconBtn}>
                            <Ionicons name="locate" size={20} color="#2196F3" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openMapPicker('source')} style={styles.iconBtn}>
                            <Ionicons name="map-outline" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />
                    {/* Destination */}
                    <View style={styles.inputRow}>
                        <Ionicons name="location" size={24} color="#FF5252" />
                        <TextInput
                            style={styles.input}
                            placeholder="Destination"
                            value={destination}
                            onChangeText={setDestination}
                        />
                        <TouchableOpacity onPress={() => openMapPicker('destination')} style={styles.iconBtn}>
                            <Ionicons name="map-outline" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    {/* Date & Time */}
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={20} color="#555" />
                            <Text style={styles.pickerText}>{date.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowTimePicker(true)}>
                            <Ionicons name="time-outline" size={20} color="#555" />
                            <Text style={styles.pickerText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 3. Available Seats Visual Picker */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>How many seats to offer?</Text>
                    <Text style={styles.cardSub}>Max capacity: 4 passengers</Text>

                    <View style={styles.seatSelector}>
                        <TouchableOpacity onPress={() => setSeats(Math.max(1, seats - 1))} style={styles.circleBtn}>
                            <Ionicons name="remove" size={24} color="#333" />
                        </TouchableOpacity>

                        <View style={styles.seatDisplay}>
                            <Text style={styles.seatNumber}>{seats}</Text>
                            <Text style={styles.seatLabel}>seats</Text>
                        </View>

                        <TouchableOpacity onPress={() => setSeats(Math.min(8, seats + 1))} style={[styles.circleBtn, styles.activeCircleBtn]}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Seat Visuals */}
                    <View style={styles.seatIconsRow}>
                        {[...Array(4)].map((_, i) => (
                            <View key={i} style={[styles.seatIconBox, i < seats ? styles.activeSeatBox : null]}>
                                <Ionicons name="person" size={20} color={i < seats ? "#fff" : "#ccc"} />
                            </View>
                        ))}
                    </View>
                </View>

                {/* 4. Fare & Earnings */}
                <View style={styles.earningsCard}>
                    <View style={styles.earningsIconBg}>
                        <Text style={styles.currencySymbol}>₹</Text>
                    </View>
                    <View style={styles.earningsInfo}>
                        <Text style={styles.earningsTitle}>Set Fare per Seat</Text>
                        <TextInput
                            style={styles.fareInput}
                            placeholder="0"
                            keyboardType="numeric"
                            value={fare}
                            onChangeText={setFare}
                        />
                    </View>
                </View>

                {/* Submit Buttom */}
                <TouchableOpacity style={styles.continueButton} onPress={handleCreateRide} disabled={loading}>
                    <Text style={styles.continueText}>{loading ? "Publishing..." : "Continue"}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>

            </ScrollView>

            {/* Add Vehicle Modal */}
            <Modal visible={showAddVehicleModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Vehicle</Text>

                        {/* Type Selection */}
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeOption, newVehicle.type === 'sedan' && styles.selectedType]}
                                onPress={() => setNewVehicle({ ...newVehicle, type: 'sedan' })}
                            >
                                <Ionicons name="car-sport" size={24} color={newVehicle.type === 'sedan' ? '#fff' : '#666'} />
                                <Text style={[styles.typeText, newVehicle.type === 'sedan' && styles.selectedTypeText]}>Car</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeOption, newVehicle.type === 'bike' && styles.selectedType]}
                                onPress={() => setNewVehicle({ ...newVehicle, type: 'bike' })}
                            >
                                <Ionicons name="bicycle" size={24} color={newVehicle.type === 'bike' ? '#fff' : '#666'} />
                                <Text style={[styles.typeText, newVehicle.type === 'bike' && styles.selectedTypeText]}>Bike</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput style={styles.modalInput} placeholder="Make (e.g. Honda)" value={newVehicle.make} onChangeText={t => setNewVehicle({ ...newVehicle, make: t })} />
                        <TextInput style={styles.modalInput} placeholder="Model (e.g. Civic)" value={newVehicle.model} onChangeText={t => setNewVehicle({ ...newVehicle, model: t })} />
                        <View style={styles.row}>
                            <TextInput style={[styles.modalInput, { flex: 1, marginRight: 10 }]} placeholder="Year" keyboardType="numeric" value={newVehicle.year} onChangeText={t => setNewVehicle({ ...newVehicle, year: t })} />
                            <TextInput style={[styles.modalInput, { flex: 1 }]} placeholder="Color" value={newVehicle.color} onChangeText={t => setNewVehicle({ ...newVehicle, color: t })} />
                        </View>
                        <TextInput style={styles.modalInput} placeholder="License Plate" value={newVehicle.plate} onChangeText={t => setNewVehicle({ ...newVehicle, plate: t })} />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowAddVehicleModal(false)} style={styles.modalCancel}>
                                <Text style={{ color: '#666' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddVehicle} style={styles.modalAdd} disabled={addingVehicle}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{addingVehicle ? "Adding..." : "Add Vehicle"}</Text>
                            </TouchableOpacity>
                        </View>
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
                        region={pickedLocation ? {
                            latitude: pickedLocation.latitude,
                            longitude: pickedLocation.longitude,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        } : initialRegion}
                        onPress={(e) => setPickedLocation(e.nativeEvent.coordinate)}
                    >
                        {pickedLocation && <Marker coordinate={pickedLocation} pinColor="red" />}
                    </MapView>
                    <View style={styles.mapOverlay}>
                        <Text style={styles.mapInstruction}>
                            Tap to select {pickerMode === 'source' ? 'Pickup' : 'Destination'}
                        </Text>
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

            {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} minimumDate={new Date()} />}
            {showTimePicker && <DateTimePicker value={time} mode="time" display="default" onChange={handleTimeChange} />}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    headerSub: { fontSize: 12, color: '#666' },
    scrollContent: { padding: 20 },

    // Section Headers
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    addNewText: { color: '#00C6FB', fontWeight: 'bold' },

    // Vehicle Cards
    vehicleList: { paddingBottom: 10 },
    vehicleCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginRight: 15, width: 220, borderWidth: 1, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    selectedVehicleCard: { borderColor: '#2ECC71', borderWidth: 1, backgroundColor: '#F0FFF4' },
    vehicleIconBg: { width: 40, height: 40, backgroundColor: '#E3F2FD', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    vehicleName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    vehicleDetail: { fontSize: 12, color: '#666', marginTop: 2 },
    vehiclePlate: { fontSize: 12, color: '#999', marginTop: 5 },
    checkIcon: { position: 'absolute', top: 10, right: 10 },

    emptyVehicleCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc', marginBottom: 20 },
    emptyVehicleText: { color: '#999', marginTop: 10 },

    // Card Styles
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    cardSub: { fontSize: 12, color: '#999', marginBottom: 20 },

    // Inputs inside card
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 34 },
    dateTimeRow: { flexDirection: 'row', marginTop: 10 },
    datePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 10, marginRight: 10 },
    pickerText: { marginLeft: 8, color: '#333', fontSize: 14 },
    iconBtn: { padding: 5, marginLeft: 5 },

    // Seat Picker
    seatSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    activeCircleBtn: { backgroundColor: '#2ECC71' },
    seatDisplay: { alignItems: 'center', marginHorizontal: 20 },
    seatNumber: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    seatLabel: { fontSize: 12, color: '#666' },
    seatIconsRow: { flexDirection: 'row', justifyContent: 'center' },
    seatIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f9f9f9', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
    activeSeatBox: { backgroundColor: '#2ECC71' },

    // Earnings
    earningsCard: { backgroundColor: '#E3F2FD', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    earningsIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    currencySymbol: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
    earningsInfo: { flex: 1 },
    earningsTitle: { fontSize: 14, color: '#1565C0', marginBottom: 5 },
    fareInput: { fontSize: 24, fontWeight: 'bold', color: '#1565C0', height: 40 },

    // Button
    continueButton: { backgroundColor: '#005BEA', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    continueText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', padding: 20, borderRadius: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalInput: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginBottom: 10 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalCancel: { padding: 10 },
    modalAdd: { backgroundColor: '#005BEA', padding: 12, borderRadius: 10 },
    row: { flexDirection: 'row' },

    // Type Selector in Modal
    typeSelector: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
    typeOption: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: '#f0f0f0', width: '45%', justifyContent: 'center' },
    selectedType: { backgroundColor: '#005BEA' },
    typeText: { marginLeft: 8, fontWeight: 'bold', color: '#666' },
    selectedTypeText: { color: '#fff' },

    // Map Picker
    fullScreenMap: { flex: 1 },
    map: { flex: 1 },
    mapOverlay: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, elevation: 5 },
    mapInstruction: { fontSize: 16, marginBottom: 15, fontWeight: '500' },
    cancelMapBtn: { padding: 10, flex: 1, alignItems: 'center' },
    cancelMapText: { color: '#F44336', fontWeight: 'bold' },
    confirmMapBtn: { backgroundColor: '#2ECC71', padding: 10, borderRadius: 10, flex: 1, alignItems: 'center', marginLeft: 10 },
    confirmMapText: { color: '#fff', fontWeight: 'bold' }
});

export default CreateRideScreen;
