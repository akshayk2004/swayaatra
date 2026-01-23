import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api, { updateProfile } from '../../services/api';
import Button from '../../components/Button';
import * as SecureStore from 'expo-secure-store';

const EditProfileScreen = ({ navigation }) => {
    const { user, register } = useContext(AuthContext); // Re-using register might handle state, but better to update local state manully
    // AuthContext usually needs an 'updateUser' method to reflect changes immediately without relogin.
    // For now, we will update the context manually if possible or just rely on the API response.

    // We need a way to update the global user object. 
    // Let's assume we can just modify the user in context or refetch profile. 
    // Ideally, AuthContext should expose a `updateUser` function. 
    // Since it doesn't, we'll implement a workaround or add it later. 
    // We will just fetch profile again on the ProfileScreen which is fine.

    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [image, setImage] = useState(user?.profileImage || null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "You need to allow access to photos to change your profile picture.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await updateProfile({
                name,
                phone,
                profileImage: image
            });

            // Update SecureStore so next app launch has new data
            const updatedUser = { ...user, ...res.data };
            await SecureStore.setItemAsync('userInfo', JSON.stringify(updatedUser));

            // Note: AuthContext state won't update automatically unless we expose a setter or reload app.
            // For now, alerting user.
            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image source={image ? { uri: image } : { uri: 'https://via.placeholder.com/150' }} style={styles.avatar} />
                <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                    <Ionicons name="camera" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                />
            </View>

            <Button
                title={loading ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                colors={['#00C6FB', '#005BEA']}
                disabled={loading}
                style={{ marginTop: 30 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    imageContainer: { alignItems: 'center', marginVertical: 30 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#eee' },
    cameraBtn: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: '#005BEA', padding: 8, borderRadius: 20 },
    form: { marginTop: 20 },
    label: { fontSize: 14, color: '#666', marginBottom: 5, marginLeft: 5, fontWeight: '500' },
    input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16 },
});

export default EditProfileScreen;
