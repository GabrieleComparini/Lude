import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ProfileOnboardingScreen from '../screens/Auth/ProfileOnboardingScreen';
import VehicleOnboardingScreen from '../screens/Auth/VehicleOnboardingScreen';
import VehicleDetailsOnboardingScreen from '../screens/Auth/VehicleDetailsOnboardingScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ProfileOnboarding" component={ProfileOnboardingScreen} />
      <Stack.Screen name="VehicleOnboarding" component={VehicleOnboardingScreen} />
      <Stack.Screen name="VehicleDetailsOnboarding" component={VehicleDetailsOnboardingScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 