import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to add logout
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const SettingsScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation(); // Get navigation object

  return (
    <View style={styles.container}>
      <Text>Settings Screen Placeholder</Text>
      
      {/* Example: Button to navigate to profile */}
      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => navigation.navigate('Profile')} 
      >
         <Text style={styles.linkText}>View Profile</Text>
      </TouchableOpacity>

       {/* TODO: Add links to Edit Profile, Vehicles, Preferences etc. */}

      <View style={styles.logoutButtonContainer}>
        <Button title="Logout" onPress={logout} color="red"/>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: 'center', // Align items top
        alignItems: 'center',
        paddingTop: 20,
    },
    linkButton: {
        backgroundColor: '#e7e7e7',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 15,
        width: '90%'
    },
    linkText: {
         fontSize: 16,
         textAlign: 'center'
    },
    logoutButtonContainer: {
        marginTop: 30,
        width: '90%'
    }
});

export default SettingsScreen; 