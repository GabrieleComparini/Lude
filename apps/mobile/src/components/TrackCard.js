import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { likeTrack, unlikeTrack } from '../api/services/feedService';

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
  const { user, track, likes: initialLikes, comments: initialComments, isLiked: initialIsLiked = false } = feed;
  
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikes || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigateToTrackDetail = () => {
    navigation.navigate('TripDetail', { trackId: track.id });
  };

  const navigateToUserProfile = () => {
    navigation.navigate('PublicProfile', { username: user.username });
  };

  const navigateToComments = () => {
    navigation.navigate('Comments', { trackId: track.id });
  };

  const handleLikePress = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (isLiked) {
        await unlikeTrack(track.id);
        setLikesCount(prev => Math.max(prev - 1, 0));
        setIsLiked(false);
      } else {
        await likeTrack(track.id);
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert(
        'Errore',
        'Impossibile aggiornare il like. Riprova più tardi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSharePress = () => {
    Alert.alert(
      'Condivisione',
      'Funzionalità di condivisione non ancora implementata.'
    );
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
          <Text style={styles.avatarText}>
            {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name || user.username}</Text>
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
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleLikePress}
          disabled={isSubmitting}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={isLiked ? "#FF3B30" : "#999"} 
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={navigateToComments}>
          <Ionicons name="chatbubble-outline" size={22} color="#999" />
          <Text style={styles.actionText}>{initialComments || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
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
  likedText: {
    color: '#FF3B30',
  },
});

export default TrackCard; 