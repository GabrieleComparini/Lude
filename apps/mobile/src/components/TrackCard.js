import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Animated,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addReaction } from '../api/services/trackService';
import { BlurView } from 'expo-blur';
import { theme } from '../styles/theme';
import MapView, { Marker, Polyline } from 'react-native-maps';

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

// Create map style for dark mode
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#333333" }, { "visibility": "simplified" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#373737" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];

const TrackCard = ({ track }) => {
  const navigation = useNavigation();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(track?.reactions?.like || 0);
  const [commentsCount, setCommentsCount] = useState(track?.commentsCount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const likeScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  
  // Check for location data with GeoJSON support
  const hasStartLocation = track && (
    (track.startLocation && (
      (track.startLocation.type === 'Point' && Array.isArray(track.startLocation.coordinates)) ||
      track.startLocation.latitude || 
      track.startLocation.lat
    )) ||
    (track.location && (
      (track.location.type === 'Point' && Array.isArray(track.location.coordinates)) ||
      track.location.latitude || 
      track.location.lat
    ))
  );
  
  // Get start location coordinates
  const getStartLocation = () => {
    // Handle GeoJSON Point format (MongoDB standard format)
    if (track.startLocation && track.startLocation.type === 'Point' && 
        Array.isArray(track.startLocation.coordinates) && 
        track.startLocation.coordinates.length >= 2) {
      // GeoJSON format is [longitude, latitude]
      return {
        latitude: track.startLocation.coordinates[1],
        longitude: track.startLocation.coordinates[0]
      };
    }
    
    if (track.location && track.location.type === 'Point' && 
        Array.isArray(track.location.coordinates) && 
        track.location.coordinates.length >= 2) {
      return {
        latitude: track.location.coordinates[1],
        longitude: track.location.coordinates[0]
      };
    }
    
    // Handle other possible formats
    if (track.startLocation) {
      return {
        latitude: track.startLocation.latitude || track.startLocation.lat || 0,
        longitude: track.startLocation.longitude || track.startLocation.lng || track.startLocation.long || 0
      };
    } else if (track.location) {
      return {
        latitude: track.location.latitude || track.location.lat || 0,
        longitude: track.location.longitude || track.location.lng || track.location.long || 0
      };
    }
    
    // Default location if none available
    return null;
  };
  
  // Get end location coordinates
  const getEndLocation = () => {
    if (track.endLocation && track.endLocation.type === 'Point' && 
        Array.isArray(track.endLocation.coordinates) && 
        track.endLocation.coordinates.length >= 2) {
      return {
        latitude: track.endLocation.coordinates[1],
        longitude: track.endLocation.coordinates[0]
      };
    }
    
    if (track.endLocation) {
      return {
        latitude: track.endLocation.latitude || track.endLocation.lat || 0,
        longitude: track.endLocation.longitude || track.endLocation.lng || track.endLocation.long || 0
      };
    }
    
    return null;
  };
  
  // Get track coordinates for polyline
  const getTrackCoordinates = () => {
    // Usa l'array route se disponibile (formato nel database)
    if (track.route && Array.isArray(track.route) && track.route.length > 1) {
      return track.route.map(point => ({
        latitude: point.lat,
        longitude: point.lng
      }));
    }
    
    // Altre opzioni per ottenere le coordinate
    if (track.coordinates && Array.isArray(track.coordinates) && track.coordinates.length > 1) {
      return track.coordinates.map(point => {
        if (Array.isArray(point) && point.length >= 2) {
          // GeoJSON format [longitude, latitude]
          return {
            latitude: point[1],
            longitude: point[0]
          };
        } else if (typeof point === 'object') {
          return {
            latitude: point.latitude || point.lat || 0,
            longitude: point.longitude || point.lng || point.long || 0
          };
        }
        return null;
      }).filter(Boolean);
    }
    
    // Se ci sono start e end location, creiamo una traccia fittizia basata sulla distanza
    const start = getStartLocation();
    const end = getEndLocation();
    
    if (start && end) {
      // Crea un percorso semplificato con 3 punti (inizio, centro, fine)
      const midPoint = {
        latitude: (start.latitude + end.latitude) / 2,
        longitude: (start.longitude + end.longitude) / 2
      };
      
      // Aggiungi un leggero spostamento al punto centrale per creare una curva
      const offsetDistance = 0.002; // circa 200 metri di offset
      midPoint.latitude += offsetDistance;
      
      return [start, midPoint, end];
    } else if (start) {
      // Se abbiamo solo il punto di partenza, creiamo un piccolo cerchio intorno ad esso
      const radius = 0.001; // circa 100 metri
      return [
        start,
        { latitude: start.latitude + radius, longitude: start.longitude },
        { latitude: start.latitude, longitude: start.longitude + radius },
        { latitude: start.latitude - radius, longitude: start.longitude },
        { latitude: start.latitude, longitude: start.longitude - radius },
        start
      ];
    }
    
    return [];
  };
  
  const startLocation = getStartLocation();
  const endLocation = getEndLocation();
  const trackCoordinates = getTrackCoordinates();
  
  // Calcola la regione ottimale per mostrare l'intero percorso
  const calculateOptimalRegion = () => {
    if (!trackCoordinates.length) {
      return startLocation ? {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        latitudeDelta: 0.01, // Zoom più ravvicinato
        longitudeDelta: 0.01
      } : null;
    }
    
    // Trova i limiti min e max di lat e long
    let minLat = Number.MAX_VALUE;
    let maxLat = Number.MIN_VALUE;
    let minLng = Number.MAX_VALUE;
    let maxLng = Number.MIN_VALUE;
    
    trackCoordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });
    
    // Calcola il centro
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calcola i delta con un po' di padding (15%)
    const latDelta = (maxLat - minLat) * 1.15 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.15 || 0.01;
    
    // Assicura che lo zoom non sia troppo stretto o troppo ampio
    const finalLatDelta = Math.max(0.005, Math.min(latDelta, 0.1));
    const finalLngDelta = Math.max(0.005, Math.min(lngDelta, 0.1));
    
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: finalLatDelta,
      longitudeDelta: finalLngDelta
    };
  };
  
  // Usa la regione ottimale
  const mapRegion = calculateOptimalRegion();
  
  const navigateToTrackDetail = () => {
    // Animate card press
    Animated.sequence([
      Animated.timing(cardScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start(() => {
      navigation.navigate('TripDetail', { trackId: track._id });
    });
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
      
      // Optimistic UI update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : Math.max(prev - 1, 0));
      
      // Animate heart icon
      Animated.sequence([
        Animated.timing(likeScale, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(likeScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
      
      // API call
      await addReaction(track._id, {
        type: 'like',
        add: newIsLiked
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Revert previous state if error
      setIsLiked(!isLiked);
      setLikesCount(prev => !isLiked ? prev - 1 : prev + 1);
      Alert.alert(
        'Error',
        'Could not update reaction. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWowPress = async () => {
    Alert.alert(
      'Wow!',
      'This feature will be available soon!'
    );
  };

  const handleSharePress = () => {
    Alert.alert(
      'Share',
      'Sharing functionality not yet implemented.'
    );
  };

  if (!track || !track.userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid track data</Text>
      </View>
    );
  }

  const BlurComponent = Platform.OS === 'ios' ? BlurView : View;
  const blurProps = Platform.OS === 'ios' ? { intensity: 40, tint: 'dark' } : {};

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: cardScale }] }]}>
      {/* Header with user info */}
      <TouchableOpacity 
        style={styles.header}
        onPress={navigateToUserProfile}
        activeOpacity={0.8}
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
        
        <TouchableOpacity style={styles.moreButton} hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
      
      {/* Track description if available */}
      {track.description && (
        <Text style={styles.trackDescription}>{track.description}</Text>
      )}
      
      {/* Map preview - clickable with blur overlay for stats */}
      <TouchableOpacity 
        onPress={navigateToTrackDetail}
        style={styles.mapContainer}
        activeOpacity={0.95}
      >
        {hasStartLocation && mapRegion ? (
          <MapView
            style={styles.mapPreview}
            region={mapRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            customMapStyle={darkMapStyle}
            mapType="standard"
            userInterfaceStyle="dark"
            liteMode={Platform.OS === 'android'}
            minZoomLevel={14}
          >
            {trackCoordinates.length > 1 && (
              <Polyline
                coordinates={trackCoordinates}
                strokeWidth={5}
                strokeColor={theme.colors.primary}
                lineCap="round"
                lineJoin="round"
              />
            )}
            
            {startLocation && (
              <Marker
                coordinate={startLocation}
                pinColor={theme.colors.primary}
              />
            )}
            
            {endLocation && endLocation !== startLocation && (
              <Marker
                coordinate={endLocation}
                pinColor={theme.colors.error}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPreview}>
            <Ionicons name="map-outline" size={40} color={theme.colors.primary} style={{opacity: 0.5}} />
            {track.city && (
              <Text style={styles.locationText}>{track.city}</Text>
            )}
          </View>
        )}
        
        <View style={styles.mapOverlay}>
          <BlurComponent {...blurProps} style={styles.statsOverlayContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statItemOverlay}>
                <Ionicons name="speedometer-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.statValueOverlay}>{(track.avgSpeed * 3.6).toFixed(1)} km/h</Text>
                <Text style={styles.statLabelOverlay}>Avg speed</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItemOverlay}>
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.statValueOverlay}>{formatDuration(track.duration)}</Text>
                <Text style={styles.statLabelOverlay}>Duration</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItemOverlay}>
                <Ionicons name="resize-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.statValueOverlay}>{(track.distance / 1000).toFixed(1)} km</Text>
                <Text style={styles.statLabelOverlay}>Distance</Text>
              </View>
            </View>
          </BlurComponent>
        </View>
      </TouchableOpacity>
      
      {/* Interaction buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleLikePress}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={22} 
              color={isLiked ? theme.colors.error : theme.colors.textSecondary} 
            />
          </Animated.View>
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={navigateToComments}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme.colors.textSecondary} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleWowPress}
          activeOpacity={0.7}
        >
          <Ionicons name="star-outline" size={22} color={theme.colors.textSecondary} />
          <Text style={styles.actionText}>
            {track.reactions?.wow || 0}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.actionSpacer} />
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.shareButton]} 
          onPress={handleSharePress}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  date: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  moreButton: {
    padding: 4,
  },
  trackDescription: {
    color: theme.colors.text,
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  mapContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapPreview: {
    height: 240,
    backgroundColor: theme.colors.background + '80',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  locationText: {
    color: theme.colors.text,
    opacity: 0.8,
    fontSize: 14,
    marginTop: 10,
    fontWeight: '500',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  statsOverlayContainer: {
    padding: 16,
    backgroundColor: Platform.OS === 'android' ? 'rgba(28, 28, 30, 0.9)' : undefined,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItemOverlay: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueOverlay: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 2,
  },
  statLabelOverlay: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  statDivider: {
    height: 36,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    padding: 4,
  },
  shareButton: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  actionText: {
    color: theme.colors.textSecondary,
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  likedText: {
    color: theme.colors.error,
  },
  actionSpacer: {
    flex: 1,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    padding: 20,
  },
});

export default TrackCard; 