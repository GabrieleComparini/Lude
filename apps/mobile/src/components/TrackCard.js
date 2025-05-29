import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addReaction } from '../api/services/trackService';

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

const TrackCard = ({ track }) => {
  const navigation = useNavigation();
  
  const [isLiked, setIsLiked] = useState(false); // Idealmente, questo valore dovrebbe arrivare dall'API
  const [likesCount, setLikesCount] = useState(track?.reactions?.like || 0);
  const [commentsCount, setCommentsCount] = useState(track?.commentsCount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigateToTrackDetail = () => {
    navigation.navigate('TripDetail', { trackId: track._id });
  };

  const navigateToUserProfile = () => {
    navigation.navigate('PublicProfile', { username: track.userId.username });
  };

  const navigateToComments = () => {
    navigation.navigate('Comments', { trackId: track._id });
  };

  const handleLikePress = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // Ottimistico UI update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : Math.max(prev - 1, 0));
      
      // API call
      await addReaction(track._id, {
        type: 'like',
        add: newIsLiked
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Ripristino stato precedente in caso di errore
      setIsLiked(!isLiked);
      setLikesCount(prev => !isLiked ? prev - 1 : prev + 1);
      Alert.alert(
        'Errore',
        'Impossibile aggiornare la reazione. Riprova più tardi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWowPress = async () => {
    Alert.alert(
      'Wow!',
      'Questa funzionalità sarà disponibile presto!'
    );
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
      <Text style={styles.mapPlaceholder}>Anteprima Mappa</Text>
    </View>
  );

  if (!track || !track.userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Dati tracciato non validi</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with user info */}
      <TouchableOpacity 
        style={styles.header}
        onPress={navigateToUserProfile}
      >
        {track.userId.profileImage ? (
          <Image source={{ uri: track.userId.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {track.userId.name 
                ? track.userId.name.charAt(0).toUpperCase() 
                : track.userId.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{track.userId.name || track.userId.username}</Text>
          <Text style={styles.date}>{formatDate(track.startTime || track.createdAt)}</Text>
        </View>
      </TouchableOpacity>
      
      {/* Track description if available */}
      {track.description && (
        <Text style={styles.trackDescription}>{track.description}</Text>
      )}
      
      {/* Map preview - clickable */}
      <TouchableOpacity onPress={navigateToTrackDetail}>
        <MapPreview />
      </TouchableOpacity>
      
      {/* Track stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={16} color="#666" />
          <Text style={styles.statValue}>{(track.avgSpeed * 3.6).toFixed(1)} km/h</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statValue}>{formatDuration(track.duration)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="resize-outline" size={16} color="#666" />
          <Text style={styles.statValue}>{(track.distance / 1000).toFixed(1)} km</Text>
        </View>
        {track.vehicleId && (
          <View style={styles.statItem}>
            <Ionicons name="car-outline" size={16} color="#666" />
            <Text style={styles.statValue}>{track.vehicleId.nickname}</Text>
          </View>
        )}
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
            color={isLiked ? "#FF3B30" : "#666"} 
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleWowPress}
        >
          <Ionicons name="star-outline" size={22} color="#666" />
          <Text style={styles.actionText}>
            {track.reactions?.wow || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={navigateToComments}>
          <Ionicons name="chatbubble-outline" size={22} color="#666" />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
          <Ionicons name="share-social-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
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
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 10,
  },
  userName: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
  date: {
    color: '#999',
    fontSize: 13,
  },
  trackDescription: {
    color: '#333',
    fontSize: 15,
    marginBottom: 12,
  },
  mapPreview: {
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapPlaceholder: {
    color: '#999',
    fontSize: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  statValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 5,
  },
  likedText: {
    color: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  }
});

export default TrackCard; 