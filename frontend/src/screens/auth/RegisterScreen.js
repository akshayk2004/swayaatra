import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { StatusBar } from 'expo-status-bar';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('passenger'); // Default role
    const { register, isLoading } = useContext(AuthContext);

    const handleRegister = async () => {
        if (!name || !email || !phone || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await register(name, email, phone, password, role);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join Swayaatra today</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        placeholder="Full Name"
                        icon="person-outline"
                        value={name}
                        onChangeText={setName}
                    />
                    <Input
                        placeholder="Email"
                        icon="mail-outline"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <Input
                        placeholder="Phone Number"
                        icon="call-outline"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <Input
                        placeholder="Password"
                        icon="lock-closed-outline"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {/* Simple Role Toggle for Demo */}
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'passenger' && styles.roleButtonActive]}
                            onPress={() => setRole('passenger')}
                        >
                            <Text style={[styles.roleText, role === 'passenger' && styles.roleTextActive]}>Passenger</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'driver' && styles.roleButtonActive]}
                            onPress={() => setRole('driver')} // Note: In real app, mapper to 'rider' or 'driver'
                        >
                            <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Driver</Text>
                        </TouchableOpacity>
                    </View>

                    <Button
                        title={isLoading ? "Creating Account..." : "Sign Up"}
                        onPress={handleRegister}
                    />

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 50,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        alignItems: 'center',
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        width: '100%',
        justifyContent: 'space-around',
    },
    roleButton: {
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    roleButtonActive: {
        backgroundColor: '#6C63FF',
        borderColor: '#6C63FF',
    },
    roleText: {
        color: '#666',
        fontSize: 16,
    },
    roleTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    link: {
        marginTop: 20,
        color: '#6C63FF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default RegisterScreen;
