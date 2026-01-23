import React, { useContext } from 'react';
import { View, ActivityIndicator, Image, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/maps/HomeScreen';
import RidesScreen from '../screens/rides/RidesScreen';
import SearchResultsScreen from '../screens/rides/SearchResultsScreen';
import CreateRideScreen from '../screens/rides/CreateRideScreen';
import RideDetailsScreen from '../screens/rides/RideDetailsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MyVehiclesScreen from '../screens/profile/MyVehiclesScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Rides') {
                        iconName = focused ? 'car' : 'car-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6C63FF',
                tabBarInactiveTintColor: 'gray',
                headerShown: false
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Rides" component={RidesScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { user, splashLoading } = useContext(AuthContext);

    if (splashLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
                <Image
                    source={require('../../assets/logo.png')}
                    style={{ width: 160, height: 160, marginBottom: 20, resizeMode: 'contain' }}
                />
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#00E5FF', marginBottom: 40, letterSpacing: 2 }}>Swayaatra</Text>
                <ActivityIndicator size="large" color="#00E5FF" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ headerShown: true, title: 'Search Results' }} />
                        <Stack.Screen name="CreateRide" component={CreateRideScreen} options={{ headerShown: true, title: 'Offer a Ride' }} />
                        <Stack.Screen name="RideDetails" component={RideDetailsScreen} options={{ headerShown: true, title: 'Ride Details', headerBackTitle: 'Back' }} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: 'Chat' }} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
                        <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} options={{ headerShown: true, title: 'My Vehicles' }} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications' }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
