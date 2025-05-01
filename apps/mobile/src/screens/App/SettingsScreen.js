import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';

const SettingsOption = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.option} onPress={onPress}>
    <Ionicons name={icon} size={24} color={theme.colors.primary} style={styles.icon} />
    <Text style={styles.optionText}>{title}</Text>
    <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { logout } = useAuth();
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Impostazioni</Text>
      
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsOption 
            icon="person-circle-outline" 
            title="Profilo" 
            onPress={() => navigation.navigate('ProfileTab', { screen: 'EditProfile' })} 
        />
        <SettingsOption 
            icon="lock-closed-outline" 
            title="Sicurezza" 
            onPress={() => alert('Naviga a Sicurezza')} 
        />
        <SettingsOption 
            icon="notifications-outline" 
            title="Notifiche" 
            onPress={() => alert('Naviga a Notifiche')} 
        />
      </View>

      {/* Garage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Garage</Text>
        <SettingsOption 
            icon="car-sport-outline" 
            title="I Miei Veicoli" 
        onPress={() => navigation.navigate('Vehicles')} 
        />
      </View>
      
      {/* Gamification Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gamification</Text>
        <SettingsOption 
            icon="trophy-outline" 
            title="Obiettivi" 
            onPress={() => navigation.navigate('Achievements')} 
        />
         <SettingsOption 
            icon="stats-chart-outline" 
            title="Classifiche" 
            onPress={() => navigation.navigate('Leaderboards')} 
        />
         <SettingsOption 
            icon="flame-outline" 
            title="Sfide" 
            onPress={() => navigation.navigate('Challenges')} 
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferenze</Text>
        <SettingsOption 
            icon="options-outline" 
            title="Unità di Misura" 
            onPress={() => alert('Naviga a Preferenze Unità')} 
        />
         <SettingsOption 
            icon="shield-checkmark-outline" 
            title="Privacy" 
            onPress={() => alert('Naviga a Preferenze Privacy')} 
        />
    </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      paddingHorizontal: 15,
        paddingTop: 20,
      paddingBottom: 10,
    },
  section: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  option: {
        flexDirection: 'row',
        alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    },
  icon: {
    marginRight: 15,
    },
  optionText: {
    flex: 1,
         fontSize: 16,
    color: theme.colors.text,
    },
  logoutButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    margin: 15,
        marginTop: 30,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  logoutButtonText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen; 