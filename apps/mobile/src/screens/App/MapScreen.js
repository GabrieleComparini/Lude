import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const MapScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    } else if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{getInitials()}</Text>
        </View>
      </TouchableOpacity>

      <Text>Map Screen Placeholder (App Main)</Text>
      <Text>(Profile icon top-left should work)</Text>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 10,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  profileAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MapScreen; 