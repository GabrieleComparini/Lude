import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FriendsFeedScreen from './Feed/FriendsFeedScreen';
import GlobalFeedScreen from './Feed/GlobalFeedScreen';

const Tab = createMaterialTopTabNavigator();

const ExploreScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#1c1c1e',
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarIndicatorStyle: {
            backgroundColor: '#007AFF',
          },
          tabBarLabelStyle: {
            fontWeight: 'bold',
            textTransform: 'none',
          },
        }}
      >
        <Tab.Screen 
          name="Friends" 
          component={FriendsFeedScreen} 
          options={{ title: 'Friends' }}
        />
        <Tab.Screen 
          name="Global" 
          component={GlobalFeedScreen} 
          options={{ title: 'Global' }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});

export default ExploreScreen; 