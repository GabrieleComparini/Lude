import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Utility function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', { 
    day: 'numeric', 
    month: 'short', 
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
  });
};

// Utility function to format duration
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const TrackCard = ({ feed }) => {
  const navigation = useNavigation();
  const { user, track, likes, comments } = feed;

  const navigateToTrackDetail = () => {
    navigation.navigate('TripDetail', { trackId: track.id });
  };

  const navigateToUserProfile = () => {
    console.log('Navigate to profile for:', user.username);
    // In future: navigation.navigate('PublicProfile', { username: user.username });
  };

  // Placeholder for Map Preview
  const MapPreview = () => (
    <View style={styles.mapPreview}>
      <Text style={styles.mapPlaceholder}>Map Preview</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with user info */}
      <TouchableOpacity 
        style={styles.header}
        onPress={navigateToUserProfile}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.date}>{formatDate(track.createdAt)}</Text>
        </View>
      </TouchableOpacity>
      
      {/* Track title */}
      <Text style={styles.trackTitle}>{track.title}</Text>
      
      {/* Map preview - clickable */}
      <TouchableOpacity onPress={navigateToTrackDetail}>
        <MapPreview />
      </TouchableOpacity>
      
      {/* Track stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={16} color="#999" />
          <Text style={styles.statValue}>{track.avgSpeed.toFixed(1)} km/h</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#999" />
          <Text style={styles.statValue}>{formatDuration(track.duration)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="resize-outline" size={16} color="#999" />
          <Text style={styles.statValue}>{track.distance.toFixed(1)} km</Text>
        </View>
      </View>
      
      {/* Interaction buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={22} color="#999" />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color="#999" />
          <Text style={styles.actionText}>{comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={22} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 10,
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  date: {
    color: '#999',
    fontSize: 12,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mapPreview: {
    height: 180,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapPlaceholder: {
    color: '#666',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    color: '#999',
    fontSize: 14,
    marginLeft: 5,
  },
});

export default TrackCard; 