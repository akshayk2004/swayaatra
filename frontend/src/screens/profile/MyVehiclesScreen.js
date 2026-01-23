import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const MyVehiclesScreen = ({ navigation }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await api.getUserProfile();
            setVehicles(res.data.vehicles || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (vehicleId) => {
        Alert.alert(
            "Delete Vehicle",
            "Are you sure you want to remove this vehicle?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.deleteVehicle(vehicleId);
                            fetchVehicles(); // Refresh list
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete vehicle");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.iconBox}>
                <Ionicons name={item.type === 'bike' ? "bicycle" : "car-sport"} size={28} color="#005BEA" />
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.make} {item.model}</Text>
                <Text style={styles.detail}>{item.color} • {item.plate}</Text>
                <Text style={styles.year}>{item.year}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#FF5252" />
            </TouchableOpacity>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator color="#005BEA" /></View>;

    return (
        <View style={styles.container}>
            <FlatList
                data={vehicles}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 20 }}
                ListEmptyComponent={<Text style={styles.empty}>No vehicles added yet.</Text>}
            />
            {/* Reusing existing logic? Or just push to CreateRide style modal? 
                For now, we can reuse the "Add Vehicle" modal logic if we extract it, 
                but simpler to just rely on "Offer a Ride" flow for adding vehicles as per original design,
                OR add a quick button to go to a form. 
                For simplicity in this task, I'll assume users add vehicles via 'Offer Ride', 
                but let's add a button that could launch that flow or a new simple form.
                Let's stick to listing/deleting for now as requested.
            */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 15, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
    iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    detail: { fontSize: 13, color: '#666', marginTop: 2 },
    year: { fontSize: 12, color: '#999', marginTop: 2 },
    deleteBtn: { padding: 10 },
    empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default MyVehiclesScreen;
