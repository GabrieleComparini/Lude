import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to add logout
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for vehicle icon

const SettingsScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation(); // Get navigation object

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Impostazioni</Text>
      
      {/* Button to navigate to profile */}
      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => navigation.navigate('Profile')} 
      >
        <Ionicons name="person-outline" size={24} color="#007AFF" style={styles.linkIcon} />
        <Text style={styles.linkText}>Profilo</Text>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>

      {/* Button to navigate to vehicles */}
      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => navigation.navigate('Vehicles')} 
      >
        <Ionicons name="car-outline" size={24} color="#007AFF" style={styles.linkIcon} />
        <Text style={styles.linkText}>I Tuoi Veicoli</Text>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>

      <View style={styles.logoutButtonContainer}>
        <Button title="Logout" onPress={logout} color="#FF3B30"/>
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
        backgroundColor: '#F8F8F8',
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        alignSelf: 'flex-start',
        marginLeft: 16,
    },
    linkButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 15,
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    linkIcon: {
        marginRight: 12,
    },
    linkText: {
         fontSize: 16,
        flex: 1,
    },
    logoutButtonContainer: {
        marginTop: 30,
        width: '90%'
    }
});

export default SettingsScreen; 