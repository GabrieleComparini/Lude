import React from 'react';
import { View, StyleSheet, StatusBar, Text, Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import FriendsFeedScreen from './FriendsFeedScreen';
import GlobalFeedScreen from './GlobalFeedScreen';
import { theme } from '../../../styles/theme';

const Tab = createMaterialTopTabNavigator();

const ExploreFeedScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with blur effect */}
      <View style={styles.header}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} tint="dark" style={styles.headerBlur}>
            <Text style={styles.headerTitle}>Explore</Text>
          </BlurView>
        ) : (
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Explore</Text>
          </LinearGradient>
        )}
      </View>
      
      {/* Tab Navigator with refined iOS-like styling */}
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarIndicatorStyle: {
            backgroundColor: theme.colors.primary,
            height: 3,
            borderRadius: 3,
          },
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            height: 48,
          },
          tabBarLabelStyle: {
            fontSize: 15,
            fontWeight: '600',
            textTransform: 'none',
            letterSpacing: 0.2,
          },
          tabBarItemStyle: {
            height: 48,
          },
          tabBarIconStyle: {
            width: 20,
            height: 20,
          },
          swipeEnabled: true,
          animationEnabled: true,
        }}
      >
        <Tab.Screen
          name="FriendsFeed"
          component={FriendsFeedScreen}
          options={{
            tabBarLabel: 'Friends',
            tabBarIcon: ({ color }) => (
              <Ionicons name="people" size={20} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="GlobalFeed"
          component={GlobalFeedScreen}
          options={{
            tabBarLabel: 'Discover',
            tabBarIcon: ({ color }) => (
              <Ionicons name="compass" size={20} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 60,
    width: '100%',
    overflow: 'hidden',
  },
  headerBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
});

export default ExploreFeedScreen; 