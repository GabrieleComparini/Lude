import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Import Stack Navigator
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import MapScreen from '../screens/App/MapScreen';
import HistoryScreen from '../screens/App/HistoryScreen';
import StatsScreen from '../screens/App/StatsScreen';
import SettingsScreen from '../screens/App/SettingsScreen';
import ProfileScreen from '../screens/App/ProfileScreen'; // Import ProfileScreen
import EditProfileScreen from '../screens/App/EditProfileScreen'; // Import EditProfileScreen
// Import other screens needed in stacks (e.g., TripDetail, VehicleList etc later)

const Tab = createBottomTabNavigator();
const MapStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const StatsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Define Stack Navigators for each tab

function MapStackNavigator() {
  return (
    <MapStack.Navigator 
        // screenOptions={{ headerShown: false }} // Hide stack header if tab header is enough
        screenOptions={AppNavigatorScreenOptions.stack} // Apply consistent styles
    >
      <MapStack.Screen name="MapHome" component={MapScreen} options={{ title: 'Map'}} />
      {/* Add screens navigable from Map, like Profile */}
      <MapStack.Screen name="Profile" component={ProfileScreen} />
      <MapStack.Screen name="EditProfile" component={EditProfileScreen} />
      {/* Add Vehicle Navigator here if accessed from profile? */}
    </MapStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <HistoryStack.Screen name="HistoryList" component={HistoryScreen} options={{ title: 'Trip History'}} />
      {/* <HistoryStack.Screen name="TripDetail" component={TripDetailScreen} /> */}
    </HistoryStack.Navigator>
  );
}

function StatsStackNavigator() {
  return (
    <StatsStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <StatsStack.Screen name="StatsOverview" component={StatsScreen} options={{ title: 'Statistics'}} />
    </StatsStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <SettingsStack.Screen name="SettingsList" component={SettingsScreen} options={{ title: 'Settings'}} />
      {/* Add screens navigable from Settings */}
       <SettingsStack.Screen name="Profile" component={ProfileScreen} />
       <SettingsStack.Screen name="EditProfile" component={EditProfileScreen} />
       {/* Add Vehicle Navigator? PreferencesScreen? */}
    </SettingsStack.Navigator>
  );
}

// Consistent styling options
const AppNavigatorScreenOptions = {
    tab: {
        tabBarActiveTintColor: '#007AFF', 
        tabBarInactiveTintColor: 'gray', 
        tabBarStyle: { backgroundColor: '#1c1c1e' },
        headerShown: false, // Hide Tab Navigator header, use Stack headers instead
    },
    stack: {
         headerStyle: { backgroundColor: '#1c1c1e' },
         headerTintColor: '#ffffff',
         headerTitleStyle: { fontWeight: 'bold' },
    }
};

const AppNavigator = () => {
  return (
    <Tab.Navigator screenOptions={AppNavigatorScreenOptions.tab} >
       <Tab.Screen 
        name="MapTab" 
        component={MapStackNavigator} 
        options={{
          title: 'Map',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="HistoryTab" 
        component={HistoryStackNavigator} 
        options={{
          title: 'History',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
          ),
        }}
        />
      <Tab.Screen 
        name="StatsTab" 
        component={StatsStackNavigator} 
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStackNavigator} 
        options={{
          title: 'Settings',
           tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator; 