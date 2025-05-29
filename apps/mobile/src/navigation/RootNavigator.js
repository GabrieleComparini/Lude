import React from 'react';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/Common/SplashScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

const RootNavigator = () => {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) {
    // Show loading indicator while checking auth state
    return <SplashScreen />;
  }

  // Se l'utente non è autenticato, mostra il navigatore di autenticazione
  if (!user) {
    return <AuthNavigator />;
  }
  
  // Se l'utente è autenticato ma ha bisogno dell'onboarding, mostra comunque
  // l'AuthNavigator (che includerà le schermate di onboarding)
  if (needsOnboarding) {
    return <AuthNavigator />;
  }
  
  // Altrimenti, mostra il navigatore principale dell'app
  return <AppNavigator />;
};

export default RootNavigator; 