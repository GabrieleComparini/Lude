import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  // Function to get initials from name or username
  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    } else if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return '??'; // Fallback
  };

  return (
    <View style={styles.container}>
        <View style={styles.avatar}>
             <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>
        <Text style={styles.username}>{user?.username || 'Loading...'}</Text>
        <Text style={styles.name}>{user?.name || ''}</Text>
        <Text style={styles.bio}>{user?.bio || 'No bio yet.'}</Text>
      
        {/* Add placeholder for stats grid later */}
        <Text style={{marginVertical: 20}}>Stats Placeholder</Text>

        <Button 
            title="Edit Profile" 
            onPress={() => navigation.navigate('EditProfile')}
        />
         {/* Add placeholder for Vehicle List button/link later */}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        // backgroundColor: '#1c1c1e', // Dark theme later
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#007AFF', // Example color
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 22,
        fontWeight: 'bold',
        // color: 'white',
        marginBottom: 5,
    },
    name: {
        fontSize: 18,
        color: 'gray',
        marginBottom: 10,
    },
    bio: {
        fontSize: 16,
        color: '#555', // Dark theme later
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default ProfileScreen; 