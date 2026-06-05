import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RideCard = ({ ride, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.driverInfo}>
                    <Image
                        source={ride.driver.profileImage ? { uri: ride.driver.profileImage } : { uri: 'https://via.placeholder.com/50' }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.driverName}>{ride.driver.name}</Text>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.rating}>{ride.driver.rating ? ride.driver.rating.toFixed(1) : 'New'}</Text>
                        </View>
                    </View>
                </View>
                <Text style={styles.fare}>₹{ride.fare}</Text>
            </View>

            <View style={styles.routeContainer}>
                <View style={styles.locationRow}>
                    <Ionicons name="radio-button-on" size={16} color="#6C63FF" />
                    <Text style={styles.location}>{ride.source.name}</Text>
                </View>
                <View style={styles.connector} />
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color="#FF6B6B" />
                    <Text style={styles.location}>{ride.destination.name}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{new Date(ride.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{ride.seatsAvailable} seats left</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        marginLeft: 4,
        color: '#666',
        fontSize: 12,
    },
    fare: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4ca1af',
    },
    routeContainer: {
        marginBottom: 15,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    location: {
        marginLeft: 10,
        fontSize: 14,
        color: '#444',
    },
    connector: {
        height: 15,
        borderLeftWidth: 1,
        borderLeftColor: '#ddd',
        marginLeft: 7,
        marginVertical: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: 5,
        color: '#666',
        fontSize: 12,
    },
});

export default RideCard;
