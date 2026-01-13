import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import api from '../../services/api';

const ChatScreen = ({ route }) => {
    const { rideId } = route.params;
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const flatListRef = useRef();

    useEffect(() => {
        fetchMessages();

        if (socket) {
            socket.emit('joinRoom', rideId);

            socket.on('chatMessage', (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
                scrollToBottom();
            });
        }

        return () => {
            if (socket) {
                socket.off('chatMessage');
            }
        };
    }, [rideId, socket]);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/chat/${rideId}`);
            setMessages(response.data);
            scrollToBottom();
        } catch (error) {
            console.error(error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const msgContent = newMessage;
            setNewMessage(''); // Optimistic clear

            // Emit to socket immediately for instant UI update (optional, relying on server echo here)
            // socket.emit('chatMessage', { rideId, message: msgContent, user }); 
            // Better to wait for server confirmation or use simplified flow:

            // 1. Send via API (Persistence)
            const response = await api.post(`/chat/${rideId}`, { message: msgContent });

            // 2. Emit via socket (Real-time propagation)
            // The server API call could trigger the socket emit to others, 
            // OR we emit from client. 
            // In our backend design `socketHandler.js`, `socket.on('chatMessage')` broadcasts.
            // But `chatController` just saves. 
            // Let's emit from client for now to match backend socket handler expectations if we used that flow.
            // Wait, backend `socketHandler` listens to `chatMessage` and emits `chatMessage`.
            // So we can just emit. 

            if (socket) {
                socket.emit('chatMessage', { rideId, message: msgContent, user });
            }

        } catch (error) {
            console.error('Send error', error);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderItem = ({ item }) => {
        // Handle both API (sender) and Socket (user) data structures
        const sender = item.sender || item.user;
        const isMe = sender?._id === user._id;

        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                {!isMe && <Text style={styles.senderName}>{sender?.name || 'Unknown'}</Text>}
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.message}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.container}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item._id || index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                    <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    list: {
        padding: 15,
    },
    messageContainer: {
        maxWidth: '80%',
        marginVertical: 5,
        padding: 10,
        borderRadius: 15,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#6C63FF',
        borderBottomRightRadius: 2,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 2,
    },
    senderName: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 16,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    input: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#6C63FF',
        padding: 10,
        borderRadius: 50,
    },
});

export default ChatScreen;
