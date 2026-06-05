import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    Image,
    ActivityIndicator,
    SafeAreaView,
    Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Dummy/Mock data for a rich initial experience and fallback
const DUMMY_CONVERSATIONS = [
    {
        _id: 'dummy-1',
        isDummy: true,
        ride: {
            _id: 'dummy-ride-1',
            status: 'active',
            source: { name: 'Koramangala, Bengaluru' },
            destination: { name: 'Whitefield, Bengaluru' },
            driver: { _id: 'driver-1', name: 'Vikram Malhotra', rating: 4.8, profileImage: 'https://randomuser.me/api/portraits/men/4.jpg' },
            passengers: [
                { _id: 'passenger-1', name: 'Rohan Sharma' },
                { _id: 'passenger-2', name: 'Priya Patel' }
            ],
            date: new Date(Date.now() + 7200000).toISOString()
        },
        lastMessage: {
            message: 'I have reached the pickup point. Let me know when you are downstairs!',
            sender: { _id: 'driver-1', name: 'Vikram Malhotra' },
            createdAt: new Date(Date.now() - 5 * 60000).toISOString() // 5 mins ago
        }
    },
    {
        _id: 'dummy-2',
        isDummy: true,
        ride: {
            _id: 'dummy-ride-2',
            status: 'scheduled',
            source: { name: 'Indiranagar, Bengaluru' },
            destination: { name: 'Kempegowda International Airport' },
            driver: { _id: 'driver-2', name: 'Anjali Deshmukh', rating: 4.9, profileImage: 'https://randomuser.me/api/portraits/women/12.jpg' },
            passengers: [],
            date: new Date(Date.now() + 86400000).toISOString()
        },
        lastMessage: {
            message: 'Sure, we can share the airport toll fare equally.',
            sender: { _id: 'driver-2', name: 'Anjali Deshmukh' },
            createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        }
    },
    {
        _id: 'dummy-3',
        isDummy: true,
        ride: {
            _id: 'dummy-ride-3',
            status: 'completed',
            source: { name: 'HSR Layout, Bengaluru' },
            destination: { name: 'Electronic City, Bengaluru' },
            driver: { _id: 'user_id', name: 'Akshay' }, // Represents current user
            passengers: [
                { _id: 'passenger-3', name: 'Suresh Kumar', rating: 4.6, profileImage: 'https://randomuser.me/api/portraits/men/8.jpg' }
            ],
            date: new Date(Date.now() - 86400000).toISOString()
        },
        lastMessage: {
            message: 'Thanks for the ride! Had a great chat.',
            sender: { _id: 'passenger-3', name: 'Suresh Kumar' },
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
    }
];

const ChatListScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);

    const [conversations, setConversations] = useState([]);
    const [pinnedIds, setPinnedIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch conversations from API
    const fetchConversations = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const response = await api.get('/chat/conversations');
            setConversations(response.data);
            
            // Join socket rooms for real-time updates
            if (socket && response.data) {
                response.data.forEach(conv => {
                    socket.emit('joinRoom', conv._id);
                });
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Re-fetch on focus
    useFocusEffect(
        useCallback(() => {
            fetchConversations(conversations.length === 0);
        }, [socket])
    );

    // Socket message handler for live updates
    useEffect(() => {
        if (!socket) return;

        const handleIncomingMessage = (msg) => {
            setConversations(prevConvs => {
                const index = prevConvs.findIndex(c => c._id === msg.rideId);
                if (index !== -1) {
                    const updated = [...prevConvs];
                    const existing = updated[index];

                    const updatedConv = {
                        ...existing,
                        lastMessage: {
                            message: msg.message,
                            sender: msg.user,
                            createdAt: msg.createdAt
                        }
                    };

                    // Remove from old position and insert at front
                    updated.splice(index, 1);
                    updated.unshift(updatedConv);
                    return updated;
                } else {
                    // Fetch conversations again if it's a new room message we are not listening to yet
                    fetchConversations(false);
                    return prevConvs;
                }
            });
        };

        socket.on('chatMessage', handleIncomingMessage);

        return () => {
            socket.off('chatMessage', handleIncomingMessage);
        };
    }, [socket]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations(false);
    };

    // Toggle pin status of a conversation
    const togglePin = (id) => {
        setPinnedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(pId => pId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Handle Join Chat / Join Ride action
    const handleJoinAction = (item) => {
        if (item.isDummy) {
            Alert.alert(
                "Joined Demo Chat",
                `You have successfully joined the demo ride chat from ${item.ride.source.name.split(',')[0]} to ${item.ride.destination.name.split(',')[0]}!`,
                [
                    { 
                        text: "Enter Chat", 
                        onPress: () => navigation.navigate('Chat', { rideId: item._id, ride: item.ride }) 
                    },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        } else {
            // Real Chat Navigation
            navigation.navigate('Chat', { rideId: item._id, ride: item.ride });
        }
    };

    // Helper to format date/time
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();

        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        return date.toLocaleDateString([], { year: '2-digit', month: 'short', day: 'numeric' });
    };

    // Determine active list: if real conversations are empty, fallback to DUMMY list
    const activeConversations = conversations.length === 0 ? DUMMY_CONVERSATIONS : conversations;

    // Filter conversations based on query (source/destination names or participant names)
    const filteredConversations = activeConversations.filter(item => {
        const query = searchQuery.toLowerCase();
        const sourceName = item.ride.source.name.toLowerCase();
        const destName = item.ride.destination.name.toLowerCase();
        
        const matchesRoute = sourceName.includes(query) || destName.includes(query);
        const matchesDriver = item.ride.driver?.name?.toLowerCase().includes(query);
        const matchesPassengers = item.ride.passengers?.some(p => p.name?.toLowerCase().includes(query));

        return matchesRoute || matchesDriver || matchesPassengers;
    });

    // Sort by Pin status first, then by last message timestamp
    const sortedConversations = [...filteredConversations].sort((a, b) => {
        const isAPinned = pinnedIds.includes(a._id);
        const isBPinned = pinnedIds.includes(b._id);

        if (isAPinned && !isBPinned) return -1;
        if (!isAPinned && isBPinned) return 1;

        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.ride.date);
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.ride.date);
        return timeB - timeA;
    });

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    const getAvatarBg = (name) => {
        if (!name) return '#6C63FF';
        const colors = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#9B5DE5', '#F15BB5', '#00F5D4'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const renderChatItem = ({ item }) => {
        const isDriver = item.ride.driver?._id === user?._id || item.ride.driver?.name === 'Akshay';
        const mainContact = isDriver 
            ? (item.ride.passengers[0] || { name: 'No passengers yet' }) 
            : item.ride.driver;

        const routeText = `${item.ride.source.name.split(',')[0].trim()} ➔ ${item.ride.destination.name.split(',')[0].trim()}`;
        const lastMsgText = item.lastMessage
            ? `${item.lastMessage.sender?._id === user?._id || item.lastMessage.sender?.name === 'Akshay' ? 'You: ' : `${item.lastMessage.sender?.name?.split(' ')[0]}: `}${item.lastMessage.message}`
            : 'No messages yet';

        const lastMsgTime = formatTime(item.lastMessage?.createdAt || item.ride.date);
        const isPinned = pinnedIds.includes(item._id);
        
        return (
            <TouchableOpacity
                style={[styles.chatRow, isPinned && styles.pinnedRow]}
                onPress={() => navigation.navigate('Chat', { rideId: item._id, ride: item.ride })}
                activeOpacity={0.7}
            >
                {/* Profile Image / Initials Avatar */}
                <View style={styles.avatarContainer}>
                    {mainContact.profileImage ? (
                        <Image source={{ uri: mainContact.profileImage }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.initialsAvatar, { backgroundColor: getAvatarBg(mainContact.name) }]}>
                            <Text style={styles.initialsText}>{getInitials(mainContact.name)}</Text>
                        </View>
                    )}
                    {/* Small overlay badge indicating user's role */}
                    <View style={[styles.roleIndicator, { backgroundColor: isDriver ? '#4D96FF' : '#6BCB77' }]}>
                        <Ionicons name={isDriver ? "car" : "person"} size={8} color="#fff" />
                    </View>
                </View>

                {/* Chat details */}
                <View style={styles.chatInfo}>
                    <View style={styles.infoTop}>
                        <View style={styles.routeHeader}>
                            {isPinned && <Ionicons name="pin" size={12} color="#6C63FF" style={styles.pinSmallIcon} />}
                            <Text style={styles.routeName} numberOfLines={1}>
                                {routeText}
                            </Text>
                        </View>
                        <Text style={styles.timeText}>{lastMsgTime}</Text>
                    </View>

                    <Text style={styles.contactName} numberOfLines={1}>
                        {isDriver ? `With Passengers (${item.ride.passengers.length})` : `Driver: ${mainContact.name}`}
                    </Text>

                    <View style={styles.infoBottom}>
                        <Text style={styles.lastMessageText} numberOfLines={1}>
                            {lastMsgText}
                        </Text>
                        {item.ride.status === 'active' && (
                            <View style={styles.activeRideBadge}>
                                <Text style={styles.activeRideBadgeText}>LIVE</Text>
                            </View>
                        )}
                        {item.isDummy && (
                            <View style={styles.demoBadge}>
                                <Text style={styles.demoBadgeText}>DEMO</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Pin & Join Actions Panel */}
                <View style={styles.actionsPanel}>
                    <TouchableOpacity
                        onPress={() => togglePin(item._id)}
                        style={styles.actionIconBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons 
                            name={isPinned ? "pin" : "pin-outline"} 
                            size={18} 
                            color={isPinned ? "#6C63FF" : "#8E8E93"} 
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleJoinAction(item)}
                        style={styles.joinBadgeBtn}
                    >
                        <Text style={styles.joinBadgeBtnText}>{item.isDummy ? "Join" : "Open"}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={80} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>Your Inbox is Empty</Text>
            <Text style={styles.emptySubtitle}>
                Chats will appear here once you offer or join a ride.
            </Text>
            <TouchableOpacity
                style={styles.findRideButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.findRideButtonText}>Find or Offer a Ride</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header section */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                {conversations.length === 0 && (
                    <Text style={[styles.headerSubtitle, { color: '#FF9500', fontWeight: '500' }]}>
                        Showing Demo Chats (No active server chats)
                    </Text>
                )}
                {conversations.length > 0 && (
                    <Text style={styles.headerSubtitle}>Connect with your travel buddies</Text>
                )}
            </View>

            {/* Premium Search Bar */}
            <View style={styles.searchSection}>
                <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search chats, locations or contacts..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#8E8E93"
                    clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                        <Ionicons name="close-circle" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Chat List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C63FF" />
                </View>
            ) : (
                <FlatList
                    data={sortedConversations}
                    renderItem={renderChatItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#6C63FF']}
                            tintColor="#6C63FF"
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1C1C1E',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        marginHorizontal: 20,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1C1C1E',
    },
    clearIcon: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    chatRow: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        alignItems: 'center',
    },
    pinnedRow: {
        backgroundColor: '#F9F9FF',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginHorizontal: -8,
        borderBottomColor: '#EBEBF0',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    initialsAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    roleIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatInfo: {
        flex: 1,
        justifyContent: 'center',
        marginRight: 8,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    pinSmallIcon: {
        marginRight: 4,
    },
    infoTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    routeName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
        flex: 1,
    },
    timeText: {
        fontSize: 11,
        color: '#8E8E93',
    },
    contactName: {
        fontSize: 13,
        color: '#3A3A3C',
        marginBottom: 4,
        fontWeight: '500',
    },
    infoBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessageText: {
        fontSize: 13,
        color: '#8E8E93',
        flex: 1,
        marginRight: 5,
    },
    activeRideBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 4,
    },
    activeRideBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    demoBadge: {
        backgroundColor: '#5856D6',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
    },
    demoBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    actionsPanel: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
    },
    actionIconBtn: {
        padding: 6,
        marginBottom: 4,
    },
    joinBadgeBtn: {
        backgroundColor: '#6C63FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    joinBadgeBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 30,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    findRideButton: {
        backgroundColor: '#6C63FF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    findRideButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ChatListScreen;
