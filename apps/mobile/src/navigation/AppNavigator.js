import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Import Stack Navigator
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from 'react-native';

// Import Screens
import MapScreen from '../screens/App/MapScreen';
import SearchScreen from '../screens/App/SearchScreen';
import ExploreScreen from '../screens/App/ExploreScreen';
import ProfileScreen from '../screens/App/ProfileScreen';
import SettingsScreen from '../screens/App/SettingsScreen';
import EditProfileScreen from '../screens/App/EditProfileScreen';
import SaveTrackScreen from '../screens/App/SaveTrackScreen';
import TripDetailScreen from '../screens/App/TripDetailScreen';
import CommentsScreen from '../screens/App/CommentsScreen';
import PublicProfileScreen from '../screens/App/PublicProfileScreen';
// Import Vehicle screens
import VehicleListScreen from '../screens/App/VehicleListScreen';
import VehicleDetailScreen from '../screens/App/VehicleDetailScreen';
import AddVehicleScreen from '../screens/App/AddVehicleScreen';
import EditVehicleScreen from '../screens/App/EditVehicleScreen';

// Placeholder removing
// const PublicProfileScreen = () => <ProfileScreen isPublic={true} />;

const Tab = createBottomTabNavigator();
const MapStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const VehicleStack = createNativeStackNavigator();

// Define Stack Navigators for each tab

function MapStackNavigator() {
  return (
    <MapStack.Navigator 
        screenOptions={({ navigation }) => ({
          ...AppNavigatorScreenOptions.stack,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: 10 }}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
    >
      <MapStack.Screen name="MapHome" component={MapScreen} options={{ title: 'Map'}} />
      <MapStack.Screen 
          name="SaveTrack" 
          component={SaveTrackScreen} 
          options={{ title: 'Save Track' }}
      />
      <MapStack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }}
      />
      <MapStack.Screen 
          name="Vehicles" 
          component={VehicleStackNavigator} 
          options={{ 
            title: 'Veicoli',
            headerShown: false
          }}
      />
      <MapStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <MapStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <MapStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
    </MapStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <SearchStack.Screen name="SearchUsers" component={SearchScreen} options={{ title: 'Cerca' }} />
      <SearchStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <SearchStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <SearchStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
    </SearchStack.Navigator>
  );
}

function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <ExploreStack.Screen name="ExploreFeed" component={ExploreScreen} options={{ title: 'Explore', headerShown: false }} />
      <ExploreStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <ExploreStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <ExploreStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
    </ExploreStack.Navigator>
  );
}

// Vehicle Stack Navigator
function VehicleStackNavigator() {
  return (
    <VehicleStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <VehicleStack.Screen name="VehicleList" component={VehicleListScreen} options={{ title: 'I Tuoi Veicoli' }} />
      <VehicleStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Dettaglio Veicolo' }} />
      <VehicleStack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Aggiungi Veicolo' }} />
      <VehicleStack.Screen name="EditVehicle" component={EditVehicleScreen} options={{ title: 'Modifica Veicolo' }} />
    </VehicleStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profilo' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <ProfileStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <ProfileStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
      <ProfileStack.Screen 
          name="Vehicles" 
          component={VehicleStackNavigator} 
          options={{ 
            title: 'Veicoli',
            headerShown: false
          }}
      />
    </ProfileStack.Navigator>
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
        name="SearchTab" 
        component={SearchStackNavigator} 
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ExploreTab" 
        component={ExploreStackNavigator} 
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackNavigator} 
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator; 