import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Import Stack Navigator
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import { theme } from '../styles/theme';

// Import Screens
import MapScreen from '../screens/App/MapScreen';
import SearchScreen from '../screens/App/SearchScreen';
import ProfileScreen from '../screens/App/ProfileScreen';
import SettingsScreen from '../screens/App/SettingsScreen';
import EditProfileScreen from '../screens/App/EditProfileScreen';
import SaveTrackScreen from '../screens/App/SaveTrackScreen';
import TripDetailScreen from '../screens/App/TripDetailScreen';
import CommentsScreen from '../screens/App/Feed/CommentsScreen';
import PublicProfileScreen from '../screens/App/Feed/PublicProfileScreen';
import ExploreFeedScreen from '../screens/App/Feed/ExploreFeedScreen';
import ConnectionsScreen from '../screens/App/ConnectionsScreen';
// Community Screen
import CommunityScreen from '../screens/App/Community/CommunityScreen';
import CommunityDetailsScreen from '../screens/App/Community/CommunityDetailsScreen';
import CreateCommunityScreen from '../screens/App/Community/CreateCommunityScreen';
import CreateCommunityPostScreen from '../screens/App/Community/CreateCommunityPostScreen';
// Gamification Screens
import AchievementsScreen from '../screens/App/Gamification/AchievementsScreen';
import LeaderboardsScreen from '../screens/App/Gamification/LeaderboardsScreen';
import ChallengesScreen from '../screens/App/Gamification/ChallengesScreen';
// Import Vehicle screens
import VehicleListScreen from '../screens/App/VehicleListScreen';
import AddEditVehicleScreen from '../screens/App/VehicleForms/AddEditVehicleScreen';

// Placeholder removing
// const PublicProfileScreen = () => <ProfileScreen isPublic={true} />;

const Tab = createBottomTabNavigator();
const ExploreStack = createNativeStackNavigator();
const MapStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator(); // Add Community Stack
const ProfileStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const VehicleStack = createNativeStackNavigator();

// Note: The App Navigator is completely separate from the Auth Navigator.
// Onboarding screens (ProfileOnboarding, VehicleOnboarding, VehicleDetailsOnboarding)
// are only accessible through the Auth Navigator and not from the main app flow.
// This separation ensures users can't accidentally return to onboarding screens.

// Replace HomeStackNavigator with ExploreStackNavigator
function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <ExploreStack.Screen name="ExploreFeed" component={ExploreFeedScreen} options={{ title: 'Explore', headerShown: false }} />
      <ExploreStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <ExploreStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <ExploreStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
    </ExploreStack.Navigator>
  );
}

// Define Stack Navigators for each tab

function MapStackNavigator() {
  return (
    <MapStack.Navigator 
        screenOptions={AppNavigatorScreenOptions.stack}
    >
      <MapStack.Screen name="MapHome" component={MapScreen} options={{ title: 'Map', headerShown: false }} />
      <MapStack.Screen 
          name="SaveTrack" 
          component={SaveTrackScreen} 
          options={{ title: 'Save Track' }}
      />
      {/* Settings stack accessible from Map header */}
      <MapStack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
      />
       {/* Gamification screens accessible from Settings */}
      <MapStack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{ title: 'Obiettivi' }}
      />
      <MapStack.Screen
          name="Leaderboards"
          component={LeaderboardsScreen}
          options={{ title: 'Classifiche' }}
      />
       <MapStack.Screen
          name="Challenges"
          component={ChallengesScreen}
          options={{ title: 'Sfide' }}
      />
       {/* Vehicle stack accessible from Settings */}
      <MapStack.Screen
          name="Vehicles"
          component={VehicleStackNavigator}
          options={{
            title: 'Garage',
            headerShown: false
          }}
      />
      {/* Other screens accessible globally or through other flows */}
      <MapStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <MapStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <MapStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
      <MapStack.Screen name="Connections" component={ConnectionsScreen} options={{ title: 'Connessioni' }} />
      <MapStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Modifica Profilo'}} />

    </MapStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <SearchStack.Screen name="SearchUsers" component={SearchScreen} options={{ title: 'Cerca', headerShown: false }} />
      <SearchStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <SearchStack.Screen name="Connections" component={ConnectionsScreen} options={{ title: 'Connessioni' }} />
      <SearchStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <SearchStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
    </SearchStack.Navigator>
  );
}

// Add Community Stack Navigator
function CommunityStackNavigator() {
  return (
    <CommunityStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <CommunityStack.Screen name="CommunityHome" component={CommunityScreen} options={{ title: 'Community', headerShown: false }} />
      <CommunityStack.Screen 
        name="CommunityDetails" 
        component={CommunityDetailsScreen} 
        options={{ 
          title: 'Community Details',
          headerShown: false // Header is handled within the component for animation
        }} 
      />
      <CommunityStack.Screen 
        name="CreateCommunity" 
        component={CreateCommunityScreen} 
        options={{ 
          title: 'Create Community',
          headerShown: false // Header is handled within the component
        }} 
      />
      <CommunityStack.Screen 
        name="CreateCommunityPost" 
        component={CreateCommunityPostScreen} 
        options={{ 
          title: 'Create Post',
          headerShown: false // Header is handled within the component
        }} 
      />
      <CommunityStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <CommunityStack.Screen name="Connections" component={ConnectionsScreen} options={{ title: 'Connessioni' }} />
      <CommunityStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <CommunityStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
      {/* Track selection for community posts */}
      <CommunityStack.Screen 
        name="TrackSelection" 
        component={TripDetailScreen} 
        options={{ title: 'Select Track' }} 
      />
      {/* Route selection for community posts - placeholder using TripDetail for now */}
      <CommunityStack.Screen 
        name="RouteSelection" 
        component={TripDetailScreen} 
        options={{ title: 'Select Route' }} 
      />
    </CommunityStack.Navigator>
  );
}

// Vehicle Stack Navigator
function VehicleStackNavigator() {
  return (
    <VehicleStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <VehicleStack.Screen name="VehicleList" component={VehicleListScreen} options={{ title: 'Garage' }} />
      <VehicleStack.Screen
        name="AddEditVehicle"
        component={AddEditVehicleScreen}
        options={({ route }) => ({
          title: route.params?.vehicleId ? 'Modifica Veicolo' : 'Aggiungi Veicolo',
        })}
      />
    </VehicleStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={AppNavigatorScreenOptions.stack}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profilo' }} />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Modifica Profilo' }}
      />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Impostazioni' }} />
      <ProfileStack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Obiettivi' }} />
      <ProfileStack.Screen name="Leaderboards" component={LeaderboardsScreen} options={{ title: 'Classifiche' }} />
      <ProfileStack.Screen name="Challenges" component={ChallengesScreen} options={{ title: 'Sfide' }} />
      <ProfileStack.Screen name="Connections" component={ConnectionsScreen} options={{ title: 'Connessioni' }} />
      <ProfileStack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Dettaglio Tracciato' }} />
      <ProfileStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ title: 'Profilo Utente' }} />
      <ProfileStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Commenti' }} />
      <ProfileStack.Screen
          name="Vehicles" 
          component={VehicleStackNavigator} 
          options={{ 
            title: 'Garage',
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
    <Tab.Navigator 
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: Platform.OS === 'ios' ? 25 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 90 : 60,
        }
      }}
    >
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
        name="CommunityTab" 
        component={CommunityStackNavigator} 
        options={{
          title: 'Community',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
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