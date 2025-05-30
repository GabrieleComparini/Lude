import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

// Placeholder screens and styles can be removed if not needed directly here
// const styles = StyleSheet.create({ ... });

// Customize dark theme
const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#1c1c1e',
    text: '#ffffff',
    border: '#2c2c2e',
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={MyDarkTheme}>
        <RootNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  );
}
