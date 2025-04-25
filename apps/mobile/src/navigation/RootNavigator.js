import React from 'react';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/Common/SplashScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show loading indicator while checking auth state
    return <SplashScreen />;
  }

  // If user is authenticated (user object exists from our backend sync),
  // show the main app navigator.
  // Otherwise, show the authentication navigator.
  return user ? <AppNavigator /> : <AuthNavigator />;
};

export default RootNavigator; 