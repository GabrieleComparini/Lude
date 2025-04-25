import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../screens/App/MapScreen'; // Placeholder for now
// Later, this will likely be a Tab Navigator

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainApp" 
        component={MapScreen} 
        options={{ title: 'Lude App' }} // Placeholder title 
      />
      {/* Add other main app screens/navigators here later */}
    </Stack.Navigator>
  );
};

export default AppNavigator; 