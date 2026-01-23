import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const RidesScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [upcomingRides, setUpcomingRides] = useState([]);
    const [pastRides, setPastRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyRides = async () => {
        try {
            const response = await api.get('/rides/my-rides');
            setUpcomingRides(response.data.upcoming);
            setPastRides(response.data.past);
        } catch (error) {
            console.error('Error fetching my rides:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyRides();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyRides();
    };

    const renderRideItem = ({ item }) => {
        const isDriver = item.userRole === 'driver';
        const date = new Date(item.date);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('RideDetails', { rideId: item._id })}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.roleBadge, { backgroundColor: isDriver ? '#E3F2FD' : '#E8F5E9' }]}>
                        <Ionicons
                            name={isDriver ? "car-sport" : "person"}
                            size={14}
                            color={isDriver ? "#1565C0" : "#2E7D32"}
                        />
                        <Text style={[styles.roleText, { color: isDriver ? "#1565C0" : "#2E7D32" }]}>
                            {isDriver ? "Driving" : "Passenger"}
                        </Text>
                    </View>
                    <Text style={styles.fareText}>₹{item.fare}</Text>
                </View>

                <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.timeText}>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <View style={styles.routeContainer}>
                    <View style={styles.routeLeft}>
                        <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
                        <View style={styles.line} />
                        <View style={[styles.dot, { backgroundColor: '#FF5252' }]} />
                    </View>
                    <View style={styles.routeRight}>
                        <Text style={styles.locationText}>{item.source.name.split(',')[0].trim()}</Text>
                        <View style={{ height: 16 }} />
                        <Text style={styles.locationText}>{item.destination.name.split(',')[0].trim()}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                    <View style={styles.driverInfo}>
                        {isDriver ? (
                            <>
                                <Ionicons name="people-outline" size={18} color="#666" />
                                <Text style={styles.passengerCount}>
                                    {item.passengers.length} passengers
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{item.driver?.name?.charAt(0) || 'D'}</Text>
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.driverName}>{item.driver?.name || "Driver"}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="star" size={12} color="#FFD700" />
                                        <Text style={styles.ratingText}>{item.driver?.rating || "4.5"}</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    <View style={styles.detailsBtn}>
                        <Text style={styles.detailsText}>{activeTab === 'upcoming' ? 'View Details' : 'View Receipt'}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#00C6FB" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No rides yet</Text>
            <Text style={styles.emptyText}>
                {activeTab === 'upcoming'
                    ? "You don't have any upcoming trips planned."
                    : "You haven't completed any rides yet."}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Rides</Text>
            </View>

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                        Upcoming ({upcomingRides.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                        Past ({pastRides.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00C6FB" />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'upcoming' ? upcomingRides : pastRides}
                    renderItem={renderRideItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyList}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },

    tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#eee', borderRadius: 10, marginRight: 10 },
    activeTab: { backgroundColor: '#D1F2EB' }, // Light Teal for active
    tabText: { fontWeight: '600', color: '#666' },
    activeTabText: { color: '#00695C' },

    listContent: { padding: 20 },

    // Card
    card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    roleText: { fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
    fareText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    timeText: { marginLeft: 8, color: '#555', fontSize: 14, fontWeight: '500' },

    routeContainer: { flexDirection: 'row', marginBottom: 15 },
    routeLeft: { alignItems: 'center', marginRight: 15, paddingTop: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    line: { width: 2, height: 18, backgroundColor: '#ddd', marginVertical: 4 },
    routeRight: { flex: 1 },
    locationText: { fontSize: 14, color: '#333', fontWeight: '500' },

    divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 15 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    driverInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: 'bold' },
    driverName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    ratingText: { fontSize: 12, color: '#666', marginLeft: 3 },
    passengerCount: { fontSize: 14, color: '#666', marginLeft: 5 },

    detailsBtn: { flexDirection: 'row', alignItems: 'center' },
    detailsText: { color: '#00C6FB', fontWeight: '600', fontSize: 14, marginRight: 2 },

    // Empty
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15 },
    emptyText: { color: '#999', marginTop: 5, textAlign: 'center' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default RidesScreen;
