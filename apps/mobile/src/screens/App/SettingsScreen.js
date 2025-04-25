import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to add logout

const SettingsScreen = () => {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text>Settings Screen Placeholder</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
export default SettingsScreen; 