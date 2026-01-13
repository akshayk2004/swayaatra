import React from 'react';
import { View, TextInput, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Input = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType }) => {
    return (
        <View style={styles.container}>
            {icon && <Ionicons name={icon} size={20} color="#666" style={styles.icon} />}
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginVertical: 10,
        width: width * 0.9,
        borderWidth: 1,
        borderColor: '#eee',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
});

export default Input;
