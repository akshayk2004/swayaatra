import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList, RefreshControl, Dimensions } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(null);
    const [rides, setRides] = useState({ upcoming: [], past: [] });
    const [activeTab, setActiveTab] = useState('offered'); // 'offered' | 'taken'
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchProfileData();
        fetchMyRides();
    }, []);

    const fetchProfileData = async () => {
        try {
            const res = await api.get('/users/profile');
            setProfileData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMyRides = async () => {
        try {
            const res = await api.get('/rides/my-rides');
            const sorted = {
                upcoming: res.data.upcoming || [],
                past: res.data.past || [],
                all: [...(res.data.upcoming || []), ...(res.data.past || [])]
            };
            setRides(sorted);
        } catch (error) {
            console.error(error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchProfileData(), fetchMyRides()]);
        setRefreshing(false);
    };

    const filterRides = () => {
        if (!rides.all) return [];
        // 'offered' -> I am the driver
        // 'taken' -> I am a passenger
        return rides.all.filter(r => {
            if (activeTab === 'offered') return r.userRole === 'driver';
            return r.userRole === 'passenger';
        });
    };

    const renderAchievement = ({ item }) => (
        <View style={[styles.achievementCard, !item.earned && styles.achievementLocked]}>
            <View style={[styles.achievementIconBox, { backgroundColor: item.earned ? '#E8F5E9' : '#F5F5F5' }]}>
                <Ionicons name={item.earned ? item.icon : 'lock-closed'} size={24} color={item.earned ? '#4CAF50' : '#BDBDBD'} />
            </View>
            <Text style={styles.achievementName}>{item.name}</Text>
            <Text style={styles.achievementStatus}>{item.earned ? 'Earned' : 'Locked'}</Text>
        </View>
    );

    const renderRideItem = (item) => (
        <View key={item._id} style={styles.rideCard}>
            <View style={styles.rideRow}>
                <View style={styles.dateBox}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.ridePrice}>₹{item.fare}</Text>
            </View>

            <View style={styles.routeContainer}>
                <View style={styles.routeDot} />
                <Text style={styles.locationText} numberOfLines={1}>{item.source?.name}</Text>
            </View>
            <View style={[styles.routeContainer, { marginTop: 5 }]}>
                <View style={[styles.routeDot, { backgroundColor: '#FF5252' }]} />
                <Text style={styles.locationText} numberOfLines={1}>{item.destination?.name}</Text>
            </View>

            <View style={styles.rideFooter}>
                <View style={styles.userRow}>
                    <Image source={item.driver?.profileImage ? { uri: item.driver.profileImage } : { uri: 'https://via.placeholder.com/30' }} style={styles.smallAvatar} />
                    <Text style={styles.smallName}>{item.driver?.name}</Text>
                    {activeTab === 'taken' && (
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={10} color="#fff" />
                            <Text style={styles.ratingBadgeText}>4.9</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('RideDetails', { rideId: item._id })}>
                    <Text style={styles.viewDetailsText}>View Details ›</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderReview = ({ item }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />
                <View>
                    <Text style={styles.reviewName}>{item.name}</Text>
                    <Text style={styles.reviewDate}>{item.date}</Text>
                </View>
                <View style={[styles.roleTag, { backgroundColor: item.role === 'Driver' ? '#E3F2FD' : '#E8F5E9' }]}>
                    <Text style={[styles.roleTagText, { color: item.role === 'Driver' ? '#1E88E5' : '#43A047' }]}>{item.role}</Text>
                </View>
            </View>
            <View style={styles.starsRow}>
                {[...Array(5)].map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color="#FFD700" />
                ))}
            </View>
            <Text style={styles.reviewText}>{item.text}</Text>
        </View>
    );

    // Mock Reviews from screenshot
    const reviews = [
        { id: 1, name: 'Sarah Miller', date: 'Nov 7, 2026', role: 'Driver', text: 'Akshay is an excellent driver! Very professional and the car was spotless.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { id: 2, name: 'Michael Chen', date: 'Nov 5, 2026', role: 'Passenger', text: 'Great conversation and very punctual. Would definitely ride again!', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' }
    ];

    if (!profileData) return <View style={styles.center}><Image source={require('../../../assets/splash-icon.png')} style={{ width: 50, height: 50 }} /></View>;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar style="light" />

            {/* 1. Header Section */}
            <LinearGradient colors={['#00C6FB', '#005BEA']} style={styles.headerGradient}>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Image source={profileData.profileImage ? { uri: profileData.profileImage } : { uri: 'https://via.placeholder.com/100' }} style={styles.avatar} />
                    {profileData.achievements?.find(a => a.id === 'verified') && (
                        <View style={styles.onlineBadge} />
                    )}
                </View>
                <Text style={styles.name}>{profileData.name}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{profileData.rating.toFixed(1)} (48 reviews)</Text>
                </View>
                <View style={styles.tagsRow}>
                    <View style={styles.tag}><Text style={styles.tagText}>Verified</Text></View>
                    <View style={[styles.tag, { backgroundColor: '#E3F2FD' }]}><Text style={[styles.tagText, { color: '#005BEA' }]}>Pro Driver</Text></View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>{profileData.ridesOffered}</Text>
                        <Text style={styles.statLabel}>Rides Offered</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>{profileData.ridesTaken}</Text>
                        <Text style={styles.statLabel}>Rides Taken</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>₹{profileData.totalEarnings}</Text>
                        <Text style={styles.statLabel}>Earned</Text>
                    </View>
                </View>
            </View>

            {/* 2. Achievements */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Achievements</Text>
                    <Text style={styles.sectionSub}>{profileData.achievements?.length || 0}/6 earned</Text>
                </View>
                <FlatList
                    data={profileData.achievements}
                    renderItem={renderAchievement}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: 20 }}
                />
            </View>

            {/* 3. Dashboard Card */}
            <View style={styles.paddingContainer}>
                <LinearGradient colors={['#009688', '#00796B']} style={styles.dashboardCard}>
                    <View style={styles.dashHeader}>
                        <Ionicons name="analytics-outline" size={20} color="#fff" />
                        <Text style={styles.dashTitle}>This Month</Text>
                    </View>

                    <View style={styles.dashRow}>
                        <View>
                            <Text style={styles.dashLabel}>Rides Completed</Text>
                            <Text style={styles.dashValLarge}>{profileData.dashboard?.ridesCompleted || 0}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.dashLabel}>Total Earnings</Text>
                            <Text style={styles.dashValLarge}>₹{profileData.dashboard?.totalEarnings || 0}</Text>
                        </View>
                    </View>

                    <View style={[styles.dashRow, { marginTop: 15 }]}>
                        <View>
                            <Text style={styles.dashLabel}>Avg. Rating</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="star" size={16} color="#fff" />
                                <Text style={styles.dashValSmall}>{profileData.dashboard?.avgRating.toFixed(1)}</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.dashLabel}>CO₂ Saved</Text>
                            <Text style={styles.dashValSmall}>{profileData.dashboard?.co2Saved} kg</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* 4. Ride History */}
            <View style={styles.paddingContainer}>
                <Text style={styles.sectionTitle}>Ride History</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'offered' && styles.activeTabBtn]}
                        onPress={() => setActiveTab('offered')}
                    >
                        <Text style={[styles.tabText, activeTab === 'offered' && styles.activeTabText]}>Offered</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'taken' && styles.activeTabBtn]}
                        onPress={() => setActiveTab('taken')}
                    >
                        <Text style={[styles.tabText, activeTab === 'taken' && styles.activeTabText]}>Taken</Text>
                    </TouchableOpacity>
                </View>

                {filterRides().length > 0 ? (
                    filterRides().slice(0, 3).map(renderRideItem)
                ) : (
                    <Text style={styles.emptyText}>No rides found in this category.</Text>
                )}
            </View>

            {/* 5. Recent Reviews */}
            <View style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
                    <Text style={styles.sectionTitle}>Recent Reviews</Text>
                    <Text style={styles.viewAllText}>View All</Text>
                </View>
                <FlatList
                    data={reviews}
                    renderItem={renderReview}
                    keyExtractor={item => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingLeft: 20 }}
                />
            </View>

            {/* 6. Settings Menu */}
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
                    <Text style={styles.menuText}>Edit Profile</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MyVehicles')}>
                    <Text style={styles.menuText}>My Vehicles</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
                {['Payment Methods', 'Privacy & Security', 'Help & Support'].map((item, index) => (
                    <TouchableOpacity key={index} style={styles.menuItem}>
                        <Text style={styles.menuText}>{item}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.menuItem} onPress={logout}>
                    <Text style={[styles.menuText, { color: '#FF5252' }]}>Log Out</Text>
                    <Ionicons name="log-out-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerGradient: { height: 160, width: '100%', paddingTop: 50, paddingHorizontal: 20, alignItems: 'flex-end' },
    settingsBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },

    // Profile Card
    profileCard: { marginHorizontal: 20, marginTop: -80, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    avatarContainer: { marginBottom: 10 },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#fff' },
    onlineBadge: { width: 18, height: 18, backgroundColor: '#2ECC71', borderRadius: 9, position: 'absolute', bottom: 5, right: 5, borderWidth: 2, borderColor: '#fff' },
    name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    ratingText: { marginLeft: 5, color: '#666', fontSize: 13 },
    tagsRow: { flexDirection: 'row', marginTop: 15 },
    tag: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginHorizontal: 5 },
    tagText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' },

    statsRow: { flexDirection: 'row', marginTop: 25, width: '100%', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statVal: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 11, color: '#999', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#eee', height: '80%' },

    // Achievements
    sectionContainer: { marginTop: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
    sectionSub: { fontSize: 12, color: '#999' },
    viewAllText: { color: '#00C6FB', fontSize: 13, fontWeight: 'bold' },

    achievementCard: { backgroundColor: '#fff', width: 110, height: 130, padding: 15, borderRadius: 15, marginRight: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f0f0f0' },
    achievementLocked: { opacity: 0.6 },
    achievementIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    achievementName: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#333' },
    achievementStatus: { fontSize: 10, color: '#999', marginTop: 4 },

    // Dashboard
    paddingContainer: { paddingHorizontal: 20, marginTop: 25 },
    dashboardCard: { borderRadius: 20, padding: 25 },
    dashHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dashTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    dashRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dashLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 5 },
    dashValLarge: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    dashValSmall: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 5 },

    // Tabbed History
    tabContainer: { flexDirection: 'row', marginTop: 15, marginBottom: 15, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    activeTabBtn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    tabText: { color: '#999', fontWeight: 'bold' },
    activeTabText: { color: '#333' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontStyle: 'italic' },

    // Ride Item
    rideCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
    rideRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    dateBox: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 12, color: '#666', marginLeft: 5, fontWeight: '500' },
    ridePrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    routeContainer: { flexDirection: 'row', alignItems: 'center' },
    routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2196F3', marginRight: 10 },
    locationText: { fontSize: 14, color: '#333', flex: 1 },
    rideFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f5f5f5', alignItems: 'center' },
    userRow: { flexDirection: 'row', alignItems: 'center' },
    smallAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
    smallName: { fontSize: 12, fontWeight: 'bold', color: '#555' },
    ratingBadge: { backgroundColor: '#FFD700', borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 1, marginLeft: 8 },
    ratingBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
    viewDetailsText: { color: '#00C6FB', fontSize: 12, fontWeight: 'bold' },

    // Review Item
    reviewCard: { backgroundColor: '#fff', width: 280, padding: 20, borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: '#f0f0f0' },
    reviewHeader: { flexDirection: 'row', marginBottom: 10 },
    reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    reviewName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    reviewDate: { fontSize: 11, color: '#999' },
    roleTag: { position: 'absolute', right: 0, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    roleTagText: { fontSize: 10, fontWeight: 'bold' },
    starsRow: { flexDirection: 'row', marginBottom: 10 },
    reviewText: { fontSize: 13, color: '#555', lineHeight: 18 },

    // Menu
    menuContainer: { paddingHorizontal: 20, marginTop: 10, backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, paddingVertical: 10 },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    menuText: { fontSize: 15, fontWeight: '500', color: '#333' },
});

export default ProfileScreen;
