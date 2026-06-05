import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, TextInput, Image, ScrollView, Alert, Modal, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const GOAN_ROUTES = [
    {
        id: 'route-1',
        name: 'Mapusa Bus Stand ➔ Panjim KTC',
        sourceName: 'Mapusa Bus Stand',
        destName: 'Panjim KTC',
        coords: MAPUSA_PANJIM_COORDS,
        distance: '13.5 km',
        duration: '25 mins'
    },
    {
        id: 'route-2',
        name: 'Mapusa Bus Stand ➔ Calangute beach',
        sourceName: 'Mapusa Bus Stand',
        destName: 'Calangute beach',
        coords: MAPUSA_CALANGUTE_COORDS,
        distance: '9.2 km',
        duration: '18 mins'
    },
    {
        id: 'route-3',
        name: 'Panjim KTC ➔ Calangute beach',
        sourceName: 'Panjim KTC',
        destName: 'Calangute beach',
        coords: PANJIM_CALANGUTE_COORDS,
        distance: '15.8 km',
        duration: '30 mins'
    }
];

const MOCK_DRIVERS = {
    pilot: { name: 'Rajesh Gadekar', rating: 4.8, vehicle: 'Goa Pilot (Bike)', plate: 'GA-03-B-8821', phone: '+91 9876543210' },
    auto: { name: 'Sanjay Sawant', rating: 4.7, vehicle: 'Swayaatra Auto', plate: 'GA-03-T-4592', phone: '+91 9988776655' },
    cab: { name: 'Anil Fernandes', rating: 4.9, vehicle: 'Swayaatra Cab', plate: 'GA-03-A-5692', phone: '+91 9123456789' }
};

const HomeScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [hasNotifications, setHasNotifications] = useState(false);
    const [activeTab, setActiveTab] = useState(user?.role === 'passenger' ? 'request_live' : 'offer');
    
    useFocusEffect(
        useCallback(() => {
            setActiveTab('request_live');
        }, [])
    );

    // Simulated live request state variables
    const mapRef = useRef(null);
    const [liveRideState, setLiveRideState] = useState('IDLE'); // 'IDLE', 'SELECT_ROUTE', 'SELECT_VEHICLE', 'FINDING_DRIVER', 'DRIVER_ON_WAY', 'DRIVER_ARRIVED', 'RIDE_IN_PROGRESS', 'COMPLETED'
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState('pilot'); // 'pilot', 'auto', 'cab'
    const [activeCoords, setActiveCoords] = useState([]);
    const [activeCoordIndex, setActiveCoordIndex] = useState(0);
    const [showDriverOtpModal, setShowDriverOtpModal] = useState(false);
    const [driverOtpInput, setDriverOtpInput] = useState('');
    const [otpCode] = useState('4592');
    const [passengerRating, setPassengerRating] = useState(5);
    const [selectedPayment, setSelectedPayment] = useState('upi');
    const [assignedDriver, setAssignedDriver] = useState(null);

    // Simulated Finding Driver matching timeout & Socket emission
    useEffect(() => {
        let timeout;
        if (liveRideState === 'FINDING_DRIVER') {
            if (socket) {
                socket.emit('liveRideRequest', {
                    passengerId: user._id,
                    passengerName: user.name || 'Rahul Sharma',
                    sourceName: selectedRoute ? selectedRoute.sourceName : fromLocation,
                    destName: selectedRoute ? selectedRoute.destName : toLocation,
                    vehicle: selectedVehicle,
                    price: selectedVehicle === 'pilot' ? '₹80' : selectedVehicle === 'auto' ? '₹150' : '₹300'
                });
            }

            // Fallback to normal procedure (mock matching Rajesh/Sanjay/Anil) after 15 seconds if no response
            timeout = setTimeout(() => {
                setAssignedDriver(null);
                setLiveRideState('DRIVER_ON_WAY');
            }, 15000);
        }
        return () => clearTimeout(timeout);
    }, [liveRideState, socket, user, selectedRoute, selectedVehicle, fromLocation, toLocation]);

    // Socket response listener for matching (Passenger side)
    useEffect(() => {
        if (socket && user && liveRideState === 'FINDING_DRIVER') {
            const handleResponse = (data) => {
                if (data.passengerId === user._id) {
                    if (data.accepted) {
                        setAssignedDriver({
                            driverName: data.driverName,
                            driverRating: data.driverRating,
                            vehicleName: data.vehicle === 'pilot' ? 'Goa Pilot (Bike)' : data.vehicle === 'auto' ? 'Swayaatra Auto' : 'Swayaatra Cab',
                            plate: data.plate || (data.vehicle === 'pilot' ? 'GA-03-B-8821' : data.vehicle === 'auto' ? 'GA-03-T-4592' : 'GA-03-A-5692'),
                        });
                        setLiveRideState('DRIVER_ON_WAY');
                    } else {
                        // Immediately fallback to normal procedure on decline
                        setAssignedDriver(null);
                        setLiveRideState('DRIVER_ON_WAY');
                    }
                }
            };

            socket.on('liveRideResponse', handleResponse);
            return () => {
                socket.off('liveRideResponse', handleResponse);
            };
        }
    }, [socket, user, liveRideState]);

    // Socket request listener (Driver side)
    useEffect(() => {
        if (socket && user && user.role !== 'passenger') {
            const handleIncomingRequest = (data) => {
                if (data.passengerId !== user._id) {
                    setIncomingRequest({
                        passengerId: data.passengerId,
                        passengerName: data.passengerName,
                        source: data.sourceName,
                        destination: data.destName,
                        eta: "2 mins away",
                        price: data.price,
                        vehicle: data.vehicle,
                        isReal: true
                    });
                    setTimer(60);
                }
            };

            socket.on('liveRideRequest', handleIncomingRequest);
            return () => {
                socket.off('liveRideRequest', handleIncomingRequest);
            };
        }
    }, [socket, user]);

    // Driver Action Handlers
    const handleAcceptRequest = () => {
        if (incomingRequest && incomingRequest.isReal && socket) {
            socket.emit('liveRideResponse', {
                passengerId: incomingRequest.passengerId,
                driverId: user._id,
                driverName: user.name || 'Vikram Malhotra',
                driverRating: user.rating || 4.8,
                vehicle: incomingRequest.vehicle || 'auto',
                plate: 'GA-03-R-1234',
                accepted: true
            });
        }
        setIncomingRequest(null);
        Alert.alert('Ride Accepted!', 'Head to pickup point.');
    };

    const handleDeclineRequest = () => {
        if (incomingRequest && incomingRequest.isReal && socket) {
            socket.emit('liveRideResponse', {
                passengerId: incomingRequest.passengerId,
                accepted: false
            });
        }
        setIncomingRequest(null);
    };

    // Simulated Driver Transit timeout
    useEffect(() => {
        let timeout;
        if (liveRideState === 'DRIVER_ON_WAY') {
            timeout = setTimeout(() => {
                setLiveRideState('DRIVER_ARRIVED');
            }, 4000);
        }
        return () => clearTimeout(timeout);
    }, [liveRideState]);

    // Simulated Ride Progress coordinate ticking interval
    useEffect(() => {
        let interval;
        if (liveRideState === 'RIDE_IN_PROGRESS') {
            interval = setInterval(() => {
                setActiveCoordIndex(prevIndex => {
                    if (prevIndex < activeCoords.length - 1) {
                        return prevIndex + 1;
                    } else {
                        clearInterval(interval);
                        setLiveRideState('COMPLETED');
                        return prevIndex;
                    }
                });
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [liveRideState, activeCoords]);

    // Pan map to moving vehicle position
    useEffect(() => {
        if (liveRideState === 'RIDE_IN_PROGRESS' && activeCoords.length > 0 && mapRef.current) {
            const currentPosition = activeCoords[activeCoordIndex];
            mapRef.current.animateToRegion({
                latitude: currentPosition.latitude,
                longitude: currentPosition.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
            }, 1000);
        }
    }, [activeCoordIndex, liveRideState, activeCoords]);

    const handleRouteSelect = (routeItem) => {
        setSelectedRoute(routeItem);
        setActiveCoords(routeItem.coords);
        setActiveCoordIndex(0);
        setFromLocation(routeItem.sourceName);
        setToLocation(routeItem.destName);
        setLiveRideState('SELECT_VEHICLE');

        // Animate map to route bounds or source location
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: routeItem.coords[0].latitude,
                longitude: routeItem.coords[0].longitude,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15,
            }, 1000);
        }
    };

    // Mock incoming request state
    const [incomingRequest, setIncomingRequest] = useState({
        passengerName: "Rahul Sharma",
        source: "Panaji Bus Stand",
        destination: "Margao Railway Station",
        eta: "15 mins away",
        price: "₹150",
    });
    const [timer, setTimer] = useState(60);

    // Timer countdown effect
    useEffect(() => {
        let interval;
        if (activeTab === 'request_live' && user?.role !== 'passenger' && incomingRequest && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0 && incomingRequest) {
            if (incomingRequest.isReal && socket) {
                socket.emit('liveRideResponse', {
                    passengerId: incomingRequest.passengerId,
                    accepted: false
                });
            }
            setIncomingRequest(null);
            setTimer(60);
        }
        return () => clearInterval(interval);
    }, [activeTab, incomingRequest, timer, user, socket]);

    // Search State
    const [fromLocation, setFromLocation] = useState('Current location');
    const [toLocation, setToLocation] = useState('');
    const [date, setDate] = useState(new Date());
    const [seats, setSeats] = useState(1);
    const [sourceCoords, setSourceCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);

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
            setSourceCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
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
                setSourceCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
            } else {
                setFromLocation('Unknown Location');
                setSourceCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
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
            setDestCoords(pickedLocation);
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
        navigation.navigate('SearchResults', {
            source: fromLocation,
            destination: toLocation,
            date: date.toISOString(),
            seats,
            sourceLat: sourceCoords ? sourceCoords.latitude : null,
            sourceLng: sourceCoords ? sourceCoords.longitude : null,
            destLat: destCoords ? destCoords.latitude : null,
            destLng: destCoords ? destCoords.longitude : null
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
                            <Image 
                                source={require('../../../assets/logo.png')} 
                                style={{ width: 24, height: 24, resizeMode: 'contain' }} 
                            />
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

                {/* Toggle Bar */}
                <View style={styles.toggleBar}>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, activeTab === 'request_live' && styles.toggleBtnActive]}
                        onPress={() => setActiveTab('request_live')}
                    >
                        <Ionicons name="flash" size={16} color={activeTab === 'request_live' ? "#005BEA" : "#fff"} />
                        <Text style={activeTab === 'request_live' ? styles.toggleTextActive : styles.toggleText}>Live Request</Text>
                    </TouchableOpacity>
                    
                    {user?.role === 'passenger' ? (
                        <TouchableOpacity 
                            style={[styles.toggleBtn, activeTab === 'search_ride' && styles.toggleBtnActive]}
                            onPress={() => setActiveTab('search_ride')}
                        >
                            <Ionicons name="search" size={16} color={activeTab === 'search_ride' ? "#005BEA" : "#fff"} />
                            <Text style={activeTab === 'search_ride' ? styles.toggleTextActive : styles.toggleText}>Search Ride</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.toggleBtn, activeTab === 'offer' && styles.toggleBtnActive]}
                            onPress={() => {
                                setActiveTab('offer');
                                navigation.navigate('CreateRide');
                            }}
                        >
                            <Ionicons name="calendar" size={16} color={activeTab === 'offer' ? "#005BEA" : "#fff"} />
                            <Text style={activeTab === 'offer' ? styles.toggleTextActive : styles.toggleText}>Offer a Ride</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Panel Area */}
                {user?.role === 'passenger' && activeTab === 'request_live' ? (
                    <View style={styles.searchPanel}>
                        {liveRideState === 'IDLE' && (
                            <>
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
                                    <TouchableOpacity style={styles.iconBtn} onPress={handleUseGPS}>
                                        <Ionicons name="locate" size={20} color="#2196F3" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.divider} />

                                {/* To Input */}
                                <View style={styles.inputRow}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#FF5252' }]}>
                                        <Ionicons name="location-outline" size={16} color="#fff" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={toLocation}
                                        onChangeText={setToLocation}
                                        placeholder="To: Where are you going?"
                                        placeholderTextColor="#ccc"
                                    />
                                    <TouchableOpacity onPress={() => setShowMapPicker(true)} style={styles.iconBtn}>
                                        <Ionicons name="map-outline" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.requestButton}
                                    onPress={() => setLiveRideState('SELECT_ROUTE')}
                                >
                                    <Text style={styles.requestButtonText}>Request Ride Now</Text>
                                    <Ionicons name="radio-outline" size={20} color="#fff" style={{ marginLeft: 10 }} />
                                </TouchableOpacity>
                            </>
                        )}

                        {liveRideState === 'SELECT_ROUTE' && (
                            <View>
                                <Text style={styles.panelTitle}>Select Goa Route</Text>
                                <ScrollView style={styles.routeList} nestedScrollEnabled={true}>
                                    {(() => {
                                        const fromText = fromLocation.toLowerCase();
                                        const toText = toLocation.toLowerCase();
                                        
                                        let filtered = GOAN_ROUTES.filter(route => {
                                            const matchesSource = route.sourceName.toLowerCase().includes(fromText) || fromText.includes(route.sourceName.toLowerCase());
                                            const matchesDest = route.destName.toLowerCase().includes(toText) || toText.includes(route.destName.toLowerCase());
                                            return matchesSource && matchesDest;
                                        });

                                        // If no route matches, fallback to showing all three, or just show all if search fields were empty
                                        if (filtered.length === 0) {
                                            filtered = GOAN_ROUTES;
                                        }

                                        return filtered.map((routeItem) => (
                                            <TouchableOpacity
                                                key={routeItem.id}
                                                style={styles.routeCard}
                                                onPress={() => handleRouteSelect(routeItem)}
                                            >
                                                <View style={styles.routeCardHeader}>
                                                    <Text style={styles.routeCardName}>{routeItem.name}</Text>
                                                </View>
                                                <View style={styles.routeCardDetails}>
                                                    <Text style={styles.routeDetailText}>
                                                        <Ionicons name="resize-outline" size={14} /> {routeItem.distance}
                                                    </Text>
                                                    <Text style={styles.routeDetailText}>
                                                        <Ionicons name="time-outline" size={14} /> {routeItem.duration}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ));
                                    })()}
                                </ScrollView>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setLiveRideState('IDLE')}
                                >
                                    <Text style={styles.cancelBtnText}>Back</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {liveRideState === 'SELECT_VEHICLE' && (
                            <View>
                                <Text style={styles.panelTitle}>Select Vehicle</Text>
                                <View style={styles.vehicleList}>
                                    {Object.keys(MOCK_DRIVERS).map((key) => {
                                        const v = MOCK_DRIVERS[key];
                                        const isSelected = selectedVehicle === key;
                                        let price = '₹80';
                                        let icon = 'bicycle';
                                        if (key === 'auto') {
                                            price = '₹150';
                                            icon = 'car-sport-outline';
                                        } else if (key === 'cab') {
                                            price = '₹300';
                                            icon = 'car';
                                        }
                                        return (
                                            <TouchableOpacity
                                                key={key}
                                                style={[styles.vehicleChoiceCard, isSelected && styles.vehicleCardSelected]}
                                                onPress={() => setSelectedVehicle(key)}
                                            >
                                                <Ionicons name={icon} size={32} color={isSelected ? '#6C63FF' : '#555'} />
                                                <View style={styles.vehicleInfo}>
                                                    <Text style={[styles.vehicleName, isSelected && styles.vehicleTextSelected]}>{v.vehicle}</Text>
                                                    <Text style={styles.vehicleRating}>★ {v.rating}</Text>
                                                </View>
                                                <Text style={[styles.vehiclePrice, isSelected && styles.vehicleTextSelected]}>{price}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.declineBtn]}
                                        onPress={() => setLiveRideState('SELECT_ROUTE')}
                                    >
                                        <Text style={styles.declineBtnText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.confirmBtn]}
                                        onPress={() => setLiveRideState('FINDING_DRIVER')}
                                    >
                                        <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {liveRideState === 'FINDING_DRIVER' && (
                            <View style={styles.radarContainer}>
                                <Ionicons name="radio" size={64} color="#6C63FF" />
                                <Text style={styles.radarText}>Finding nearby drivers...</Text>
                                <Text style={styles.radarSub}>Looking for the best ride for you</Text>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setLiveRideState('SELECT_VEHICLE')}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(liveRideState === 'DRIVER_ON_WAY' || liveRideState === 'DRIVER_ARRIVED') && (
                            <View>
                                <Text style={styles.panelTitle}>
                                    {liveRideState === 'DRIVER_ON_WAY' ? 'Driver is on the way...' : 'Driver has arrived!'}
                                </Text>
                                <View style={styles.driverCard}>
                                    <Ionicons name="person-circle" size={50} color="#6C63FF" />
                                    <View style={styles.driverDetails}>
                                        <Text style={styles.driverName}>
                                            {assignedDriver ? assignedDriver.driverName : MOCK_DRIVERS[selectedVehicle].name}
                                        </Text>
                                        <Text style={styles.driverVehicle}>
                                            {assignedDriver ? assignedDriver.vehicleName : MOCK_DRIVERS[selectedVehicle].vehicle}
                                        </Text>
                                        <Text style={styles.driverPlate}>
                                            {assignedDriver ? assignedDriver.plate : MOCK_DRIVERS[selectedVehicle].plate}
                                        </Text>
                                    </View>
                                    <View style={styles.driverRight}>
                                        <Text style={styles.driverRating}>
                                            ★ {assignedDriver ? assignedDriver.driverRating : MOCK_DRIVERS[selectedVehicle].rating}
                                        </Text>
                                        <View style={styles.otpBadge}>
                                            <Text style={styles.otpBadgeText}>OTP: {otpCode}</Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.handshakeBtn}
                                    onPress={() => setShowDriverOtpModal(true)}
                                >
                                    <Text style={styles.handshakeBtnText}>Enter Start OTP ({otpCode})</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {liveRideState === 'RIDE_IN_PROGRESS' && (
                            <View>
                                <Text style={styles.panelTitle}>Trip in Progress</Text>
                                <View style={styles.progressRow}>
                                    <Text style={styles.progressText}>Heading to {selectedRoute?.destName}</Text>
                                    <Text style={styles.progressPercent}>
                                        {Math.round(((activeCoordIndex + 1) / activeCoords.length) * 100)}%
                                    </Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View 
                                        style={[
                                            styles.progressBarActive, 
                                            { width: `${((activeCoordIndex + 1) / activeCoords.length) * 100}%` }
                                        ]} 
                                    />
                                </View>
                                <Text style={styles.progressSub}>Vehicle speed: ~45 km/h</Text>
                            </View>
                        )}

                        {liveRideState === 'COMPLETED' && (
                            <View style={styles.completedContainer}>
                                <Ionicons name="checkmark-circle" size={64} color="#2ECC71" />
                                <Text style={styles.completedTitle}>Ride Completed!</Text>
                                <Text style={styles.paymentText}>Select Payment Method</Text>
                                
                                <View style={styles.paymentOptions}>
                                    <TouchableOpacity 
                                        style={[styles.paymentOptionCard, selectedPayment === 'upi' && styles.paymentOptionSelected]} 
                                        onPress={() => setSelectedPayment('upi')}
                                    >
                                        <Ionicons name="logo-google" size={24} color="#6C63FF" />
                                        <Text style={styles.paymentOptionText}>UPI (GPay / PhonePe)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.paymentOptionCard, selectedPayment === 'cash' && styles.paymentOptionSelected]} 
                                        onPress={() => setSelectedPayment('cash')}
                                    >
                                        <Ionicons name="cash-outline" size={24} color="#2ECC71" />
                                        <Text style={styles.paymentOptionText}>Cash to Driver</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.paymentOptionCard, selectedPayment === 'wallet' && styles.paymentOptionSelected]} 
                                        onPress={() => setSelectedPayment('wallet')}
                                    >
                                        <Ionicons name="wallet-outline" size={24} color="#00C6FB" />
                                        <Text style={styles.paymentOptionText}>Swayaatra Wallet</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.divider} />
                                
                                <Text style={styles.ratingTitle}>Rate your ride</Text>
                                <View style={styles.starsRowCentered}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setPassengerRating(star)}
                                        >
                                            <Ionicons 
                                                name={passengerRating >= star ? "star" : "star-outline"} 
                                                size={36} 
                                                color="#FFD700" 
                                                style={{ marginHorizontal: 5 }}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={styles.doneBtn}
                                    onPress={() => {
                                        setLiveRideState('IDLE');
                                        setSelectedRoute(null);
                                        setActiveCoords([]);
                                        setActiveCoordIndex(0);
                                        setPassengerRating(5);
                                        setAssignedDriver(null);
                                    }}
                                >
                                    <Text style={styles.doneBtnText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ) : (
                    activeTab === 'search_ride' ? (
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
                                <TouchableOpacity style={styles.iconBtn} onPress={handleUseGPS}>
                                    <Ionicons name="locate" size={20} color="#2196F3" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.swapContainer}>
                                <View style={styles.swapButton}>
                                    <Ionicons name="swap-vertical" size={20} color="#333" />
                                </View>
                            </View>

                            {/* To Input */}
                            <View style={styles.inputRow}>
                                <View style={[styles.iconCircle, { backgroundColor: '#FF5252' }]}>
                                    <Ionicons name="location-outline" size={16} color="#fff" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={toLocation}
                                    onChangeText={setToLocation}
                                    placeholder="To: Where are you going?"
                                    placeholderTextColor="#ccc"
                                />
                                <TouchableOpacity onPress={() => setShowMapPicker(true)} style={styles.iconBtn}>
                                    <Ionicons name="map-outline" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

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

                            <TouchableOpacity
                                style={styles.searchButton}
                                onPress={handleSearch}
                            >
                                <Ionicons name="search" size={20} color="#2ECC71" />
                                <Text style={styles.searchButtonText}>Search Rides</Text>
                                <Ionicons name="sparkles-outline" size={16} color="#2ECC71" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Driver Live Request View
                        <View style={styles.searchPanel}>
                            {incomingRequest ? (
                                <View>
                                    <View style={styles.incomingHeader}>
                                        <Ionicons name="person-circle" size={40} color="#005BEA" />
                                        <View style={styles.incomingInfo}>
                                            <Text style={styles.passengerName}>{incomingRequest.passengerName}</Text>
                                            <Text style={styles.etaText}>{incomingRequest.eta}</Text>
                                        </View>
                                        <Text style={styles.priceText}>{incomingRequest.price}</Text>
                                    </View>
                                    
                                    <View style={styles.divider} />
                                    
                                    <View style={styles.routeInfo}>
                                        <View style={styles.routePoint}>
                                            <Ionicons name="location" size={16} color="#2196F3" />
                                            <Text style={styles.routeText}>{incomingRequest.source}</Text>
                                        </View>
                                        <View style={styles.routeLine} />
                                        <View style={styles.routePoint}>
                                            <Ionicons name="location" size={16} color="#FF5252" />
                                            <Text style={styles.routeText}>{incomingRequest.destination}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.timerContainer}>
                                        <View style={styles.timerCircle}>
                                            <Text style={styles.timerText}>{timer}s</Text>
                                        </View>
                                        <Text style={styles.timerSub}>to accept</Text>
                                    </View>

                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDeclineRequest}>
                                            <Text style={styles.declineBtnText}>Decline</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAcceptRequest}>
                                            <Text style={styles.acceptBtnText}>Accept Ride</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.waitingContainer}>
                                    <Ionicons name="radio" size={48} color="#00C6FB" />
                                    <Text style={styles.waitingText}>Scanning for nearby passengers...</Text>
                                </View>
                            )}
                        </View>
                    )
                )}
            </LinearGradient>

            {/* Map Section */}
            <View style={styles.mapSection}>
                <MapView
                    ref={mapRef}
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
                    {location && !selectedRoute && (
                        <Marker
                            coordinate={{
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            }}
                            title="You"
                        />
                    )}

                    {activeCoords.length > 0 && (
                        <>
                            <Polyline
                                coordinates={activeCoords}
                                strokeWidth={4}
                                strokeColor="#6C63FF"
                            />
                            <Marker
                                coordinate={activeCoords[0]}
                                title="Pickup"
                                description={selectedRoute?.sourceName}
                                pinColor="green"
                            />
                            <Marker
                                coordinate={activeCoords[activeCoords.length - 1]}
                                title="Destination"
                                description={selectedRoute?.destName}
                                pinColor="red"
                            />
                        </>
                    )}

                    {(liveRideState === 'DRIVER_ON_WAY' || liveRideState === 'DRIVER_ARRIVED' || liveRideState === 'RIDE_IN_PROGRESS') && activeCoords.length > 0 && (
                        <Marker
                            coordinate={
                                liveRideState === 'RIDE_IN_PROGRESS' 
                                    ? activeCoords[activeCoordIndex] 
                                    : activeCoords[0]
                            }
                            title="Your Ride"
                            description={assignedDriver ? assignedDriver.driverName : MOCK_DRIVERS[selectedVehicle].name}
                        >
                            <View style={styles.customVehicleMarker}>
                                <Ionicons 
                                    name={selectedVehicle === 'pilot' ? 'bicycle' : selectedVehicle === 'auto' ? 'car-sport' : 'car'} 
                                    size={24} 
                                    color="#fff" 
                                />
                            </View>
                        </Marker>
                    )}
                </MapView>
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

            {/* Driver OTP Verification Modal */}
            <Modal visible={showDriverOtpModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.otpModalContent}>
                        <TouchableOpacity 
                            style={styles.closeOtpModal} 
                            onPress={() => {
                                setShowDriverOtpModal(false);
                                setDriverOtpInput('');
                            }}
                        >
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        
                        <Ionicons name="shield-checkmark" size={48} color="#6C63FF" style={{ marginBottom: 15 }} />
                        <Text style={styles.otpModalTitle}>Start Trip Verification</Text>
                        <Text style={styles.otpModalSub}>Please enter the 4-digit OTP shown on your screen to start the ride.</Text>
                        
                        <Text style={styles.otpDisplay}>Start OTP: {otpCode}</Text>
                        
                        <TextInput
                            style={styles.otpInput}
                            placeholder="Enter 4-digit OTP"
                            placeholderTextColor="#aaa"
                            keyboardType="number-pad"
                            maxLength={4}
                            value={driverOtpInput}
                            onChangeText={(val) => {
                                setDriverOtpInput(val);
                                if (val === otpCode) {
                                    setShowDriverOtpModal(false);
                                    setDriverOtpInput('');
                                    setLiveRideState('RIDE_IN_PROGRESS');
                                    Alert.alert('Trip Started', 'Have a safe journey!');
                                }
                            }}
                        />
                        
                        <TouchableOpacity 
                            style={styles.otpSubmitBtn}
                            onPress={() => {
                                if (driverOtpInput === otpCode) {
                                    setShowDriverOtpModal(false);
                                    setDriverOtpInput('');
                                    setLiveRideState('RIDE_IN_PROGRESS');
                                    Alert.alert('Trip Started', 'Have a safe journey!');
                                } else {
                                    Alert.alert('Invalid OTP', 'Please enter the correct OTP to start the trip.');
                                }
                            }}
                        >
                            <Text style={styles.otpSubmitBtnText}>Verify & Start Trip</Text>
                        </TouchableOpacity>
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
    iconBtn: {
        padding: 5,
        marginLeft: 5,
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
    panelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    routeList: {
        maxHeight: 180,
        marginBottom: 10,
    },
    routeCard: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    routeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    routeCardName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    routeCardDetails: {
        flexDirection: 'row',
        gap: 15,
    },
    routeDetailText: {
        fontSize: 12,
        color: '#666',
    },
    cancelBtn: {
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 5,
    },
    cancelBtnText: {
        color: '#777',
        fontSize: 14,
        fontWeight: 'bold',
    },
    vehicleList: {
        gap: 8,
        marginBottom: 15,
    },
    vehicleChoiceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 12,
        padding: 12,
    },
    vehicleCardSelected: {
        borderColor: '#6C63FF',
        backgroundColor: '#F0EEFF',
    },
    vehicleInfo: {
        flex: 1,
        marginLeft: 12,
    },
    vehicleName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    vehicleRating: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    vehiclePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    vehicleTextSelected: {
        color: '#6C63FF',
    },
    radarContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    radarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6C63FF',
        marginTop: 15,
    },
    radarSub: {
        fontSize: 12,
        color: '#777',
        marginTop: 5,
        marginBottom: 15,
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
    },
    driverDetails: {
        flex: 1,
        marginLeft: 12,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    driverVehicle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    driverPlate: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
        marginTop: 2,
    },
    driverRight: {
        alignItems: 'flex-end',
    },
    driverRating: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 6,
    },
    otpBadge: {
        backgroundColor: '#F0EEFF',
        borderWidth: 1,
        borderColor: '#6C63FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    otpBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6C63FF',
    },
    handshakeBtn: {
        backgroundColor: '#6C63FF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    handshakeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6C63FF',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#EAEAEA',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBarActive: {
        height: '100%',
        backgroundColor: '#6C63FF',
        borderRadius: 4,
    },
    progressSub: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    completedContainer: {
        alignItems: 'center',
        paddingVertical: 15,
        width: '100%',
    },
    completedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2ECC71',
        marginTop: 10,
        marginBottom: 5,
    },
    paymentText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        marginTop: 5,
    },
    paymentOptions: {
        width: '100%',
        gap: 8,
        marginBottom: 15,
    },
    paymentOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 12,
        padding: 12,
    },
    paymentOptionSelected: {
        borderColor: '#6C63FF',
        backgroundColor: '#F0EEFF',
    },
    paymentOptionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444',
        marginLeft: 12,
    },
    ratingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
    },
    starsRowCentered: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 15,
    },
    doneBtn: {
        backgroundColor: '#2ECC71',
        paddingVertical: 14,
        width: '100%',
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    otpModalContent: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 20,
        width: '85%',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 8,
    },
    closeOtpModal: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 5,
    },
    otpModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    otpModalSub: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 15,
    },
    otpDisplay: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#6C63FF',
        backgroundColor: '#F0EEFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        letterSpacing: 2,
        marginBottom: 20,
    },
    otpInput: {
        borderWidth: 1.5,
        borderColor: '#ddd',
        borderRadius: 12,
        width: '100%',
        height: 50,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        letterSpacing: 8,
        backgroundColor: '#FAFAFA',
        marginBottom: 15,
    },
    otpSubmitBtn: {
        backgroundColor: '#6C63FF',
        paddingVertical: 14,
        width: '100%',
        borderRadius: 12,
        alignItems: 'center',
    },
    otpSubmitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    customVehicleMarker: {
        backgroundColor: '#6C63FF',
        borderRadius: 20,
        padding: 8,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
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
    toggleBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        padding: 5,
        marginTop: 5,
        marginBottom: 20,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleBtnActive: {
        backgroundColor: '#fff',
    },
    toggleText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 15,
    },
    toggleTextActive: {
        color: '#005BEA',
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 15,
    },
    requestButton: {
        flexDirection: 'row',
        backgroundColor: '#E74C3C',
        borderRadius: 15,
        paddingVertical: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
    },
    requestButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 10,
        marginHorizontal: 10,
    },
    // Incoming Request Styles
    incomingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    incomingInfo: {
        flex: 1,
        marginLeft: 10,
    },
    passengerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    etaText: {
        fontSize: 14,
        color: '#666',
    },
    priceText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2ECC71',
    },
    routeInfo: {
        marginVertical: 15,
        paddingLeft: 5,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#444',
    },
    routeLine: {
        height: 20,
        width: 2,
        backgroundColor: '#ddd',
        marginLeft: 7,
        marginVertical: 2,
    },
    timerContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    timerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#E74C3C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E74C3C',
    },
    timerSub: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    declineBtn: {
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    declineBtnText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 16,
    },
    acceptBtn: {
        backgroundColor: '#2ECC71',
        marginLeft: 10,
    },
    acceptBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    waitingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    waitingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
});

export default HomeScreen;
