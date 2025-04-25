import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Import icons

// Import Screens
import MapScreen from '../screens/App/MapScreen';
import HistoryScreen from '../screens/App/HistoryScreen';
import StatsScreen from '../screens/App/StatsScreen';
import SettingsScreen from '../screens/App/SettingsScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => { // Function to set icons
          let iconName;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF', // Example active color (adapt to mockup)
        tabBarInactiveTintColor: 'gray', // Example inactive color (adapt to mockup)
        tabBarStyle: { backgroundColor: '#1c1c1e' }, // Example dark background (adapt to mockup)
        headerStyle: { backgroundColor: '#1c1c1e' }, // Example dark header (adapt to mockup)
        headerTintColor: '#ffffff' // Example light header text (adapt to mockup)
        // headerShown: false, // Optionally hide headers if custom headers are used in screens
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Trip History' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistics' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
};

export default AppNavigator; 