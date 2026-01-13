import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { StatusBar } from 'expo-status-bar';

const ProfileScreen = () => {
    const { user, logout } = useContext(AuthContext);

    const badges = [
        { id: 1, name: 'Newbie', icon: 'leaf', color: '#4CAF50' },
        { id: 2, name: 'Verified', icon: 'checkmark-circle', color: '#2196F3' },
        // Mock data
    ];

    return (
        <ScrollView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <Image
                    source={user?.profileImage ? { uri: user.profileImage } : { uri: 'https://via.placeholder.com/100' }}
                    style={styles.avatar}
                />
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.role}>{user?.role === 'driver' ? 'Driver' : 'Passenger'}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user?.rating || '5.0'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user?.ridesTaken || 0}</Text>
                    <Text style={styles.statLabel}>Rides</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user?.points || 0}</Text>
                    <Text style={styles.statLabel}>Points</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Badges</Text>
                <View style={styles.badgesRow}>
                    {badges.map(badge => (
                        <View key={badge.id} style={[styles.badge, { backgroundColor: badge.color }]}>
                            <Ionicons name={badge.icon} size={16} color="#fff" />
                            <Text style={styles.badgeText}>{badge.name}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Button title="Logout" onPress={logout} colors={['#FF6B6B', '#FF8E53']} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#f8f9fa',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    role: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
        textTransform: 'capitalize',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        borderBottomWidth: 10,
        borderBottomColor: '#f5f5f5',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 14,
        color: '#999',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#eee',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 5,
    },
});

export default ProfileScreen;
