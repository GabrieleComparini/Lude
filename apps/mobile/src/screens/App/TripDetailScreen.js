import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
  StatusBar,
  Platform,
  Image,
  Share,
  Easing,
  Pressable
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import MapView, { Polyline, Marker, Callout } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getTrackById, updateTrack } from '../../api/services/trackService';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';
import { theme } from '../../styles/theme';
import { LineChart } from 'react-native-chart-kit';

// Dark mode map style
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

const { width, height } = Dimensions.get('window');
const BOTTOM_SHEET_MIN_HEIGHT = 170; // Height of collapsed bottom sheet
const BOTTOM_SHEET_MAX_HEIGHT = height * 0.8; // Height of expanded bottom sheet
const SNAP_POINT_THRESHOLD = (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT) / 2;
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || (Platform.OS === 'ios' ? 44 : 0);
const IS_IOS = Platform.OS === 'ios';

const TripDetailScreen = () => {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [activeStat, setActiveStat] = useState(null);
  const [showElevationChart, setShowElevationChart] = useState(false);
  
  // Animation values
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const mapScaleValue = useRef(new Animated.Value(1)).current;
  const mapBlurValue = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const actionButtonScale = useRef(new Animated.Value(1)).current;
  const chartTranslateY = useRef(new Animated.Value(50)).current;
  const chartOpacity = useRef(new Animated.Value(0)).current;
  
  const mapRef = useRef(null);
  
  const route = useRoute();
  const navigation = useNavigation();
  const { trackId } = route.params;
  
  // Nascondi l'header di navigazione quando questo schermo è a fuoco
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);
  
  // Prepare data for charts
  const speedData = useMemo(() => {
    if (!track || !track.route || track.route.length < 2) return [];
    
    // Extract speed data, sample at regular intervals if there are too many points
    const sampleInterval = Math.max(1, Math.floor(track.route.length / 20));
    return track.route
      .filter((_, i) => i % sampleInterval === 0)
      .map(point => (point.speed * 3.6)); // Convert m/s to km/h
  }, [track]);
  
  const elevationData = useMemo(() => {
    if (!track || !track.route || track.route.length < 2) return [];
    
    // Extract elevation data, sample at regular intervals if there are too many points
    const sampleInterval = Math.max(1, Math.floor(track.route.length / 20));
    return track.route
      .filter((_, i) => i % sampleInterval === 0)
      .map(point => point.altitude || 0);
  }, [track]);
  
  // Focus effect for animations when screen becomes active
  useFocusEffect(
    React.useCallback(() => {
      // Subtle animation when the screen comes into focus
      Animated.sequence([
        Animated.timing(mapScaleValue, {
          toValue: 1.05,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(mapScaleValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ]).start();
      
      return () => {
        // Cleanup if needed
      };
    }, [])
  );
  
  // Riferimento allo scrollView per gestire lo scrolling
  const scrollViewRef = useRef(null);
  const isScrollEnabled = useRef(true);
  const scrollOffset = useRef(0);
  const isDraggingSheet = useRef(false);
  
  // Configure pan responder for swipe gestures - versione migliorata
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Make sure gestureState exists
      if (!gestureState) return false;
      
      // Permettiamo di scorrere il contenuto solo se il bottom sheet è espanso
      // e non stiamo già trascinando il bottom sheet dall'handle
      if (isExpanded && !isDraggingSheet.current) {
        const { dy } = gestureState;
        
        // Se siamo in cima allo scroll e scorrendo verso il basso, allora gestiamo il gesto
        if (scrollOffset.current <= 0 && dy > 10) {
          isScrollEnabled.current = false;
          return true;
        }
        
        // Altrimenti lasciamo che lo ScrollView gestisca lo scrolling
        isScrollEnabled.current = true;
        return false;
      }
      
      // Se il bottom sheet è collassato o stiamo già trascinando, gestiamo il gesto
      return gestureState && Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: () => {
      if (IS_IOS) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onPanResponderMove: (_, gestureState) => {
      // Make sure gestureState exists
      if (!gestureState) return;
      
      // Se lo scrolling è disabilitato o il bottom sheet non è espanso, gestiamo il trascinamento
      if (!isScrollEnabled.current || !isExpanded) {
      let newHeight = isExpanded 
        ? BOTTOM_SHEET_MAX_HEIGHT - gestureState.dy 
        : BOTTOM_SHEET_MIN_HEIGHT - gestureState.dy;
        
      newHeight = Math.max(BOTTOM_SHEET_MIN_HEIGHT, Math.min(newHeight, BOTTOM_SHEET_MAX_HEIGHT));
      bottomSheetHeight.setValue(newHeight);
        
        // Calculate progress ratio for other animations
        const progress = (newHeight - BOTTOM_SHEET_MIN_HEIGHT) / (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT);
        
        // Scale map slightly as sheet expands
        const mapScale = 1 - (progress * 0.05);
        mapScaleValue.setValue(mapScale);
        
        // Adjust header opacity as sheet expands
        headerOpacity.setValue(1 - (progress * 0.5));
        
        // Add slight blur to map as sheet expands
        mapBlurValue.setValue(progress * 2);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      // Make sure gestureState exists
      if (!gestureState) return;
      
      // Se lo scrolling è disabilitato o il bottom sheet non è espanso, gestiamo il rilascio
      if (!isScrollEnabled.current || !isExpanded) {
      const currentHeight = bottomSheetHeight._value;
      const midPoint = BOTTOM_SHEET_MIN_HEIGHT + SNAP_POINT_THRESHOLD;
      
      if (isExpanded && gestureState.dy > 0) {
          // Swiping down when expanded - solo se siamo in cima allo scroll
          if (scrollOffset.current <= 0) {
        if (currentHeight < midPoint) {
          snapToBottom();
        } else {
              snapToTop();
            }
          } else {
            // Se non siamo in cima, ritorna alla posizione espansa
          snapToTop();
        }
      } else if (!isExpanded && gestureState.dy < 0) {
        // Swiping up when collapsed
        if (currentHeight > midPoint) {
          snapToTop();
        } else {
          snapToBottom();
        }
      } else {
        // Handle edge cases
        if (currentHeight > midPoint) {
            snapToTop();
          } else {
            // Chiudi solo se siamo in cima allo scroll
            if (isExpanded && scrollOffset.current > 0) {
          snapToTop();
        } else {
          snapToBottom();
        }
      }
        }
      }
      
      // Resettiamo lo stato dopo il rilascio
      isScrollEnabled.current = isExpanded;
      isDraggingSheet.current = false;
    }
  });

  // Handler per il solo drag handle (barra superiore)
  const handleDragHandleResponder = {
    onStartShouldSetResponder: () => true,
    onResponderGrant: () => {
      // Indichiamo che stiamo trascinando dall'handle
      isDraggingSheet.current = true;
      if (IS_IOS) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onResponderMove: (evt, gestureState) => {
      // Make sure gestureState exists
      if (!gestureState || gestureState.dy === undefined) return;
      
      // Gestiamo il trascinamento dal drag handle
      let newHeight = isExpanded 
        ? BOTTOM_SHEET_MAX_HEIGHT - gestureState.dy 
        : BOTTOM_SHEET_MIN_HEIGHT - gestureState.dy;
      
      newHeight = Math.max(BOTTOM_SHEET_MIN_HEIGHT, Math.min(newHeight, BOTTOM_SHEET_MAX_HEIGHT));
      bottomSheetHeight.setValue(newHeight);
      
      // Aggiorna le altre animazioni
      const progress = (newHeight - BOTTOM_SHEET_MIN_HEIGHT) / (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT);
      mapScaleValue.setValue(1 - (progress * 0.05));
      headerOpacity.setValue(1 - (progress * 0.5));
      mapBlurValue.setValue(progress * 2);
    },
    onResponderRelease: (evt, gestureState) => {
      // Make sure gestureState exists
      if (!gestureState || gestureState.dy === undefined) {
        // If no gestureState, just stay at current position
        const currentHeight = bottomSheetHeight._value;
        const midPoint = BOTTOM_SHEET_MIN_HEIGHT + SNAP_POINT_THRESHOLD;
        
        if (currentHeight > midPoint) {
          snapToTop();
        } else {
          snapToBottom();
        }
        
        isDraggingSheet.current = false;
        return;
      }
      
      const currentHeight = bottomSheetHeight._value;
      const midPoint = BOTTOM_SHEET_MIN_HEIGHT + SNAP_POINT_THRESHOLD;
      
      if (Math.abs(gestureState.dy) < 10) {
        // È un tap sul drag handle - toggle tra aperto e chiuso
        if (isExpanded) {
          // Se è espanso, verifica la posizione di scroll prima di chiudere
          if (scrollOffset.current <= 0) {
            snapToBottom();
          } else {
            // Mostra un feedback che l'utente deve scorrere in cima
            if (IS_IOS) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            
            // Scroller automaticamente in cima
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }
          }
        } else {
          snapToTop();
        }
      } else if (isExpanded && gestureState.dy > 0) {
        // Swipe verso il basso quando espanso
        if (scrollOffset.current <= 0) {
          // Solo se siamo in cima allo scroll
          if (currentHeight < midPoint) {
            snapToBottom();
          } else {
            snapToTop();
          }
        } else {
          // Non siamo in cima, rimaniamo espansi
          snapToTop();
          
          // Feedback aptico per indicare che deve prima tornare in cima
          if (IS_IOS) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }
      } else if (!isExpanded && gestureState.dy < 0) {
        // Swipe verso l'alto quando collassato
        if (currentHeight > midPoint) {
          snapToTop();
        } else {
          snapToBottom();
        }
      } else {
        // Casi limite
        if (currentHeight > midPoint) {
          snapToTop();
        } else {
          // Chiudi solo se siamo in cima allo scroll
          if (isExpanded && scrollOffset.current > 0) {
            snapToTop();
          } else {
            snapToBottom();
          }
        }
      }
      
      // Reset dello stato
      isDraggingSheet.current = false;
    }
  };

  // Gestore dello scroll per tracciare la posizione
  const handleScroll = (event) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
    
    // Se siamo vicini alla cima, possiamo fornire feedback tattile per indicare che ora è possibile chiudere
    if (scrollOffset.current < 10 && scrollOffset.current > 0 && IS_IOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Load track details
  useEffect(() => {
    const fetchTrackDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const trackData = await getTrackById(trackId);
        setTrack(trackData);
        
        // Calculate map region to show the entire route
        if (trackData.route && trackData.route.length > 0) {
          calculateMapRegion(trackData.route);
        }
      } catch (err) {
        console.error('Error fetching track details:', err);
        setError('Unable to load track details. Please try again later.');
        Alert.alert('Error', 'Unable to load track details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrackDetails();
  }, [trackId]);
  
  // Calculate map region
  const calculateMapRegion = (route) => {
    if (!route || route.length === 0) return;
    
    let minLat = route[0].lat;
    let maxLat = route[0].lat;
    let minLng = route[0].lng;
    let maxLng = route[0].lng;
    
    route.forEach(point => {
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
      minLng = Math.min(minLng, point.lng);
      maxLng = Math.max(maxLng, point.lng);
    });
    
    const paddingFactor = 0.2; // More padding for aesthetics
    const latDelta = (maxLat - minLat) * (1 + paddingFactor);
    const lngDelta = (maxLng - minLng) * (1 + paddingFactor);
    
    setMapRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01)
    });
  };
  
  // Determine segment color based on speed
  const getSpeedColor = (speed) => {
    const speedKmh = speed * 3.6; // Convert m/s to km/h
    
    // Apple-like gradient of blues
    if (speedKmh <= 20) return 'rgba(10, 132, 255, 0.8)';  // Light iOS blue
    if (speedKmh <= 40) return 'rgba(0, 122, 255, 0.85)';  // Standard iOS blue
    if (speedKmh <= 60) return 'rgba(0, 64, 221, 0.9)';    // Deeper blue
    if (speedKmh <= 80) return 'rgba(10, 0, 190, 0.95)';   // Royal blue
    if (speedKmh <= 100) return 'rgba(94, 92, 230, 1)';    // Purple blue
    return 'rgba(191, 90, 242, 1)';                        // Purple
  };
  
  // Find closest point on track based on touch coordinates
  const findClosestPoint = (touchCoords) => {
    if (!track || !track.route || track.route.length === 0) return null;
    
    let closestPoint = null;
    let minDistance = Infinity;
    
    track.route.forEach(point => {
      // Calculate distance between touched point and track point (simplified Haversine formula)
      const distance = Math.sqrt(
        Math.pow(point.lat - touchCoords.latitude, 2) + 
        Math.pow(point.lng - touchCoords.longitude, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    // Ensure point is close enough to touch (avoid distant touches)
    if (minDistance < 0.005) {
      return closestPoint;
    }
    
    return null;
  };
  
  // Handle map press
  const handleMapPress = (event) => {
    // Ignore if it's a marker press
    if (event.nativeEvent.action === 'marker-press') return;
    
    const touchCoords = event.nativeEvent.coordinate;
    const closest = findClosestPoint(touchCoords);
    
    if (closest) {
      setSelectedPoint(closest);
      
      // Haptic feedback
      if (IS_IOS) {
        Haptics.selectionAsync();
      }
      
      // Zoom to the selected point
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: closest.lat,
          longitude: closest.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005
        }, 800);
      }
    } else {
      setSelectedPoint(null);
    }
  };
  
  // Animate to full route view
  const animateToFullRoute = () => {
    if (mapRef.current && mapRegion) {
      mapRef.current.animateToRegion(mapRegion, 1000);
      setSelectedPoint(null);
      
      // Haptic feedback
      if (IS_IOS) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  // Share track
  const handleShareTrack = async () => {
    animateButtonPress(async () => {
      try {
        const result = await Share.share({
          message: `Check out my trip: ${track.name || 'My Trip'} - Distance: ${formatDistance(track.distance)}, Duration: ${formatTime(track.duration)}`,
          url: `trackmaster://track/${track._id}`,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to share trip');
      }
    });
  };
  
  // Toggle public/private status
  const togglePublicStatus = async () => {
    if (!track) return;
    
    animateButtonPress(async () => {
      setUpdating(true);
      try {
        const updatedTrack = await updateTrack(trackId, { 
          isPublic: !track.isPublic 
        });
        
        setTrack(updatedTrack);
        
        // Haptic success feedback
        if (IS_IOS) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert(
          'Success', 
          `Track is now ${updatedTrack.isPublic ? 'public' : 'private'}.`
        );
      } catch (err) {
        console.error('Error updating track visibility:', err);
        
        // Haptic error feedback
        if (IS_IOS) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        
        Alert.alert('Error', 'Unable to update track visibility. Please try again later.');
      } finally {
        setUpdating(false);
      }
    });
  };
  
  // Toggle map type between standard and satellite
  const toggleMapType = () => {
    animateButtonPress(() => {
      setMapType(prevType => prevType === 'standard' ? 'satellite' : 'standard');
    });
  };
  
  const handleBackPress = () => {
    animateButtonPress(() => {
      navigation.goBack();
    });
  };
  
  // Render minimal stats (collapsed view)
  const renderMinStats = () => {
    if (!track) return null;
    
    return (
      <View style={styles.minStatsContainer}>
        <View style={styles.headerContainer} {...handleDragHandleResponder}>
          <View style={styles.dragHandle} />
          <Text style={styles.trackTitle} numberOfLines={1}>
            {track.name || `Trip on ${new Date(track.startTime).toLocaleDateString()}`}
          </Text>
        </View>
        
        <View style={styles.minStatRowsContainer}>
          <View style={styles.minStatRow}>
            <Pressable 
              style={styles.minStat}
              onPress={() => highlightStat('duration')}
            >
              <View style={[
                styles.minStatIconContainer, 
                activeStat === 'duration' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="time-outline" 
                  size={18} 
                  color={activeStat === 'duration' ? 'white' : theme.colors.primary} 
                />
            </View>
              <Text style={styles.minStatValue}>{formatTime(track.duration)}</Text>
              <Text style={styles.minStatLabel}>Duration</Text>
            </Pressable>
            
            <Pressable 
              style={styles.minStat}
              onPress={() => highlightStat('distance')}
            >
              <View style={[
                styles.minStatIconContainer,
                activeStat === 'distance' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="map-outline" 
                  size={18} 
                  color={activeStat === 'distance' ? 'white' : theme.colors.primary} 
                />
            </View>
              <Text style={styles.minStatValue}>{formatDistance(track.distance)}</Text>
              <Text style={styles.minStatLabel}>Distance</Text>
            </Pressable>
            
            <Pressable 
              style={styles.minStat}
              onPress={() => highlightStat('speed')}
            >
              <View style={[
                styles.minStatIconContainer,
                activeStat === 'speed' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="speedometer-outline" 
                  size={18} 
                  color={activeStat === 'speed' ? 'white' : theme.colors.primary} 
                />
              </View>
              <Text style={styles.minStatValue}>{formatSpeed(track.avgSpeed)}</Text>
              <Text style={styles.minStatLabel}>Avg Speed</Text>
            </Pressable>
          </View>
          
          {track.vehicleId && (
            <TouchableOpacity 
              style={styles.vehicleBadgeContainer}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: track.vehicleId._id })}
              activeOpacity={0.7}
            >
              <View style={styles.vehicleBadge}>
                <Ionicons name="car-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.vehicleBadgeText}>
                  {track.vehicleId.make} {track.vehicleId.model}
                  {track.vehicleId.nickname && ` (${track.vehicleId.nickname})`}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={theme.colors.primary} style={{marginLeft: 4}} />
          </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  // Render elevation profile chart
  const renderElevationChart = () => {
    if (!elevationData.length) return null;
    
    // Calculate min, max, and mid elevation for Y axis
    const minElevation = Math.min(...elevationData);
    const maxElevation = Math.max(...elevationData);
    const midElevation = Math.round((minElevation + maxElevation) / 2);
    
    const chartConfig = {
      backgroundGradientFrom: 'rgba(0, 0, 0, 0)',
      backgroundGradientTo: 'rgba(0, 0, 0, 0)',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: '0',
      }
    };
    
    const data = {
      labels: [],  // Empty labels for cleaner look
      datasets: [
        {
          data: elevationData,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
    
    return (
      <Animated.View 
        style={[
          styles.chartContainer,
          {
            opacity: chartOpacity,
            transform: [{ translateY: chartTranslateY }]
          }
        ]}
      >
        <Text style={styles.chartTitle}>Elevation Profile</Text>
        <View style={styles.chartContent}>
          <View style={styles.yAxisContainer}>
            <Text style={styles.yAxisLabel}>{Math.round(maxElevation)}m</Text>
            <Text style={styles.yAxisLabel}>{Math.round(midElevation)}m</Text>
            <Text style={styles.yAxisLabel}>{Math.round(minElevation)}m</Text>
          </View>
          
          <LineChart
            data={data}
            width={width - 60} // Reduced to make space for Y axis
            height={140}
            chartConfig={chartConfig}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={false}
            withVerticalLabels={false}
            withHorizontalLabels={false}
            style={{
              borderRadius: 16,
            }}
          />
        </View>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>Start</Text>
          <Text style={styles.chartLabel}>End</Text>
        </View>
      </Animated.View>
    );
  };
  
  // Render full stats (expanded view)
  const renderFullStats = () => {
    if (!track) return null;
    
    // Find peak speed point
    const peakSpeedPoint = track.route ? 
      track.route.reduce((max, point) => point.speed > max.speed ? point : max, {speed: 0}) : 
      null;
    
    return (
      <View style={styles.fullStatsContainer}>
        {/* Show elevation chart if data is available */}
        {showElevationChart && renderElevationChart()}
        
        {/* Advanced stats */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <TouchableOpacity 
              style={styles.fullRouteButton}
              onPress={animateToFullRoute}
            >
              <Ionicons name="expand-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.fullRouteButtonText}>Full Route</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            <Pressable 
              style={[
                styles.statCard,
                activeStat === 'distance' && styles.activeStatCard
              ]}
              onPress={() => highlightStat('distance')}
            >
              <View style={[
                styles.statIconContainer,
                activeStat === 'distance' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="map" 
                  size={24} 
                  color={activeStat === 'distance' ? 'white' : theme.colors.primary} 
                />
        </View>
              <Text style={[
                styles.statValue,
                activeStat === 'distance' && styles.activeStatText
              ]}>
                {formatDistance(track.distance)}
              </Text>
              <Text style={[
                styles.unitText,
                activeStat === 'distance' && styles.activeUnitText
              ]}>
                km
              </Text>
              <Text style={[
                styles.statLabel,
                activeStat === 'distance' && styles.activeStatLabel
              ]}>
                Distance
              </Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.statCard,
                activeStat === 'duration' && styles.activeStatCard
              ]}
              onPress={() => highlightStat('duration')}
            >
              <View style={[
                styles.statIconContainer,
                activeStat === 'duration' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="time" 
                  size={24} 
                  color={activeStat === 'duration' ? 'white' : theme.colors.primary} 
                />
        </View>
              <Text style={[
                styles.statValue,
                activeStat === 'duration' && styles.activeStatText
              ]}>
                {formatTime(track.duration)}
              </Text>
              <Text style={[
                styles.unitText,
                activeStat === 'duration' && styles.activeUnitText
              ]}>
                hh:mm:ss
              </Text>
              <Text style={[
                styles.statLabel,
                activeStat === 'duration' && styles.activeStatLabel
              ]}>
                Duration
              </Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.statCard,
                activeStat === 'speed' && styles.activeStatCard
              ]}
              onPress={() => highlightStat('speed')}
            >
              <View style={[
                styles.statIconContainer,
                activeStat === 'speed' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="speedometer" 
                  size={24} 
                  color={activeStat === 'speed' ? 'white' : theme.colors.primary} 
                />
        </View>
              <Text style={[
                styles.statValue,
                activeStat === 'speed' && styles.activeStatText
              ]}>
                {formatSpeed(track.avgSpeed)}
              </Text>
              <Text style={[
                styles.unitText,
                activeStat === 'speed' && styles.activeUnitText
              ]}>
                km/h
              </Text>
              <Text style={[
                styles.statLabel,
                activeStat === 'speed' && styles.activeStatLabel
              ]}>
                Avg Speed
              </Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.statCard,
                activeStat === 'maxSpeed' && styles.activeStatCard
              ]}
              onPress={() => highlightStat('maxSpeed')}
            >
              <View style={[
                styles.statIconContainer,
                activeStat === 'maxSpeed' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="trending-up" 
                  size={24} 
                  color={activeStat === 'maxSpeed' ? 'white' : theme.colors.primary} 
                />
            </View>
              <Text style={[
                styles.statValue,
                activeStat === 'maxSpeed' && styles.activeStatText
              ]}>
                {formatSpeed(track.maxSpeed)}
              </Text>
              <Text style={[
                styles.unitText,
                activeStat === 'maxSpeed' && styles.activeUnitText
              ]}>
                km/h
              </Text>
              <Text style={[
                styles.statLabel,
                activeStat === 'maxSpeed' && styles.activeStatLabel
              ]}>
                Max Speed
              </Text>
              {peakSpeedPoint && (
                <TouchableOpacity
                  style={styles.viewOnMapButton}
                  onPress={() => {
                    setSelectedPoint(peakSpeedPoint);
                    if (mapRef.current) {
                      mapRef.current.animateToRegion({
                        latitude: peakSpeedPoint.lat,
                        longitude: peakSpeedPoint.lng,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005
                      }, 800);
                    }
                    // Haptic feedback
                    if (IS_IOS) {
                      Haptics.selectionAsync();
                    }
                  }}
                >
                  <Text style={styles.viewOnMapText}>View on map</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          </View>
        </View>
        
        {/* Speed legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.sectionTitle}>Speed Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(10, 132, 255, 0.8)' }]} />
              <Text style={styles.legendText}>0-20 km/h</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(0, 122, 255, 0.85)' }]} />
              <Text style={styles.legendText}>21-40 km/h</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(0, 64, 221, 0.9)' }]} />
              <Text style={styles.legendText}>41-60 km/h</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(10, 0, 190, 0.95)' }]} />
              <Text style={styles.legendText}>61-80 km/h</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(94, 92, 230, 1)' }]} />
              <Text style={styles.legendText}>81-100 km/h</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'rgba(191, 90, 242, 1)' }]} />
              <Text style={styles.legendText}>100+ km/h</Text>
            </View>
          </View>
        </View>
        
        {/* Track info */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Track Information</Text>
          
          <View style={styles.infoCard}>
          <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
                {new Date(track.startTime).toLocaleDateString(undefined, {day: 'numeric', month: 'long', year: 'numeric'})}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {new Date(track.startTime).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
          
          {track.description && (
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{track.description}</Text>
            </View>
          )}
          
          {track.tags && track.tags.length > 0 && (
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {track.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          </View>
        </View>

        {/* Vehicle */}
        {track.vehicleId && (
          <View style={styles.vehicleContainer}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <TouchableOpacity 
              style={styles.vehicleCard}
              onPress={() => {
                // Haptic feedback
                if (IS_IOS) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                navigation.navigate('VehicleDetail', { vehicleId: track.vehicleId._id });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.vehicleIconContainer}>
                <Ionicons name="car" size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{track.vehicleId.nickname}</Text>
                <Text style={styles.vehicleModel}>
                  {track.vehicleId.make} {track.vehicleId.model} {track.vehicleId.year}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Action buttons */}
        <View style={styles.actionContainer}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionRow}>
          <TouchableOpacity 
              style={styles.actionButton}
            onPress={togglePublicStatus}
            disabled={updating}
              activeOpacity={0.8}
          >
              <View style={[
                styles.actionIconContainer,
                track.isPublic && styles.activeActionIconContainer
              ]}>
            <Ionicons 
                  name={track.isPublic ? 'eye' : 'eye-off'} 
                  size={22} 
                  color={track.isPublic ? 'white' : theme.colors.textSecondary} 
                />
              </View>
              <Text style={[
                styles.actionButtonText,
                track.isPublic && styles.activeActionButtonText
              ]}>
                {updating ? 'Updating...' : (track.isPublic ? 'Public' : 'Private')}
            </Text>
          </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShareTrack}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="share-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  
  // Ripristino le funzioni che sono state rimosse
  const snapToTop = () => {
    // Haptic feedback
    if (IS_IOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Animate bottom sheet
    Animated.spring(bottomSheetHeight, {
      toValue: BOTTOM_SHEET_MAX_HEIGHT,
      useNativeDriver: false,
      damping: 15,
      mass: 1,
      stiffness: 150,
      overshootClamping: false,
      restSpeedThreshold: 0.1,
      restDisplacementThreshold: 0.1
    }).start();
    
    // Animate map scale (subtle zoom out effect)
    Animated.timing(mapScaleValue, {
      toValue: 0.95,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
    
    // Animate header opacity
    Animated.timing(headerOpacity, {
      toValue: 0.5,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Animate map blur
    Animated.timing(mapBlurValue, {
      toValue: 2,
      duration: 300,
      useNativeDriver: false
    }).start();
    
    setIsExpanded(true);
    isScrollEnabled.current = true; // Abilita lo scrolling quando è espanso
    
    // Animate chart entrance if elevation data available
    if (elevationData.length > 0) {
      setTimeout(() => {
        setShowElevationChart(true);
        Animated.parallel([
          Animated.timing(chartOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(chartTranslateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5))
          })
        ]).start();
      }, 100);
    }
  };

  const snapToBottom = () => {
    // Haptic feedback
    if (IS_IOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Animate bottom sheet
    Animated.spring(bottomSheetHeight, {
      toValue: BOTTOM_SHEET_MIN_HEIGHT,
      useNativeDriver: false,
      damping: 15,
      mass: 1,
      stiffness: 150,
      overshootClamping: false,
      restSpeedThreshold: 0.1,
      restDisplacementThreshold: 0.1
    }).start();
    
    // Animate map scale (reset zoom)
    Animated.timing(mapScaleValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
    
    // Animate header opacity
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Animate map blur
    Animated.timing(mapBlurValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false
    }).start();
    
    setIsExpanded(false);
    isScrollEnabled.current = false; // Disabilita lo scrolling quando è chiuso
    
    // Hide elevation chart with animation
    if (showElevationChart) {
      Animated.parallel([
        Animated.timing(chartOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(chartTranslateY, {
          toValue: 30,
          duration: 250,
          useNativeDriver: true
        })
      ]).start(() => {
        setShowElevationChart(false);
        // Reset animation values
        chartTranslateY.setValue(50);
      });
    }
  };

  // Animate button press
  const animateButtonPress = (callback) => {
    Animated.sequence([
      Animated.timing(actionButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(actionButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      })
    ]).start(() => {
      // Haptic feedback
      if (IS_IOS) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      if (callback) callback();
    });
  };

  // Highlight a specific stat
  const highlightStat = (statName) => {
    if (activeStat === statName) {
      setActiveStat(null);
    } else {
      setActiveStat(statName);
      
      // Haptic feedback
      if (IS_IOS) {
        Haptics.selectionAsync();
      }
    }
  };
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  if (!track) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>Track not found</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Status bar - make transparent */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Full-screen map with animation */}
      <Animated.View style={{flex: 1, transform: [{scale: mapScaleValue}]}}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
        onPress={handleMapPress}
        customMapStyle={darkMapStyle}
        mapType={mapType}
        userInterfaceStyle="dark"
          showsCompass={false}
          showsScale={true}
          rotateEnabled={true}
          pitchEnabled={true}
          provider={Platform.OS === 'android' ? 'google' : undefined}
      >
          {/* Start and end points */}
        {track?.route && track.route.length > 0 && (
          <>
            <Marker
              coordinate={{
                latitude: track.route[0].lat,
                longitude: track.route[0].lng
              }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.startMarker}>
                  <Ionicons name="flag" size={20} color="#ffffff" />
                </View>
              </Marker>
              
            <Marker
              coordinate={{
                latitude: track.route[track.route.length - 1].lat,
                longitude: track.route[track.route.length - 1].lng
              }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.endMarker}>
                  <Ionicons name="flag-outline" size={20} color="#ffffff" />
                </View>
              </Marker>
              
              {/* Route segments with speed-based coloring */}
            {track.route.map((point, index) => {
              if (index === 0) return null;
              
              const prevPoint = track.route[index - 1];
              const color = getSpeedColor(point.speed);
              
              return (
                <Polyline
                  key={`segment-${index}`}
                  coordinates={[
                    { latitude: prevPoint.lat, longitude: prevPoint.lng },
                    { latitude: point.lat, longitude: point.lng }
                  ]}
                  strokeColor={color}
                    strokeWidth={5}
                    lineCap="round"
                    lineJoin="round"
                />
              );
            })}
        
              {/* Selected point marker */}
            {selectedPoint && (
              <Marker
                coordinate={{
                  latitude: selectedPoint.lat,
                  longitude: selectedPoint.lng
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.selectedPointMarker}>
                  <View style={styles.selectedPointInner} />
                </View>
                <Callout tooltip>
                  <View style={styles.speedCallout}>
                      <Text style={styles.speedCalloutTitle}>Speed</Text>
                    <Text style={styles.speedCalloutValue}>
                      {formatSpeed(selectedPoint.speed)}
                    </Text>
                    <Text style={styles.speedCalloutTimestamp}>
                      {new Date(selectedPoint.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            )}
          </>
        )}
      </MapView>
      </Animated.View>

      {/* Conditional blur overlay for map */}
      {Platform.OS === 'ios' && (
        <Animated.View 
          style={[
            styles.blurOverlay,
            {opacity: mapBlurValue}
          ]}
          pointerEvents="none"
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}

      {/* Header gradient overlay */}
      <Animated.View style={[styles.headerGradient, {opacity: headerOpacity}]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Map controls */}
      <View style={styles.mapControlsContainer}>
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        {/* Map type toggle */}
      <TouchableOpacity 
        style={styles.mapTypeButton} 
        onPress={toggleMapType}
          activeOpacity={0.8}
      >
        <Ionicons 
          name={mapType === 'standard' ? 'map' : 'earth'} 
          size={22} 
          color="white" 
        />
      </TouchableOpacity>
      </View>
  
      {/* Bottom sheet con statistiche */}
      <Animated.View 
        style={[styles.bottomSheet, { height: bottomSheetHeight }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.headerContainer} {...handleDragHandleResponder}>
          <View style={styles.dragHandle} />
          <Text style={styles.trackTitle} numberOfLines={1}>
            {track?.name || `Trip on ${new Date(track?.startTime || Date.now()).toLocaleDateString()}`}
          </Text>
        </View>
        
        <View style={styles.minStatRowsContainer}>
          <View style={styles.minStatRow}>
            <Pressable 
              style={styles.minStat}
              onPress={() => highlightStat('duration')}
            >
              <View style={[
                styles.minStatIconContainer, 
                activeStat === 'duration' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="time-outline" 
                  size={18} 
                  color={activeStat === 'duration' ? 'white' : theme.colors.primary} 
                />
              </View>
              <Text style={styles.minStatValue}>{formatTime(track?.duration || 0)}</Text>
              <Text style={styles.minStatLabel}>Duration</Text>
            </Pressable>
            
            <Pressable 
              style={styles.minStat}
              onPress={() => highlightStat('distance')}
            >
              <View style={[
                styles.minStatIconContainer,
                activeStat === 'distance' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="map-outline" 
                  size={18} 
                  color={activeStat === 'distance' ? 'white' : theme.colors.primary} 
                />
              </View>
              <Text style={styles.minStatValue}>{formatDistance(track?.distance || 0)}</Text>
              <Text style={styles.minStatLabel}>Distance</Text>
            </Pressable>
            
            <Pressable 
              style={styles.minStat}
              onPress={() => highlightStat('speed')}
            >
              <View style={[
                styles.minStatIconContainer,
                activeStat === 'speed' && styles.activeStatIconContainer
              ]}>
                <Ionicons 
                  name="speedometer-outline" 
                  size={18} 
                  color={activeStat === 'speed' ? 'white' : theme.colors.primary} 
                />
              </View>
              <Text style={styles.minStatValue}>{formatSpeed(track?.avgSpeed || 0)}</Text>
              <Text style={styles.minStatLabel}>Avg Speed</Text>
            </Pressable>
          </View>
          
          {track?.vehicleId && (
            <TouchableOpacity 
              style={styles.vehicleBadgeContainer}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: track.vehicleId._id })}
              activeOpacity={0.7}
            >
              <View style={styles.vehicleBadge}>
                <Ionicons name="car-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.vehicleBadgeText}>
                  {track.vehicleId.make} {track.vehicleId.model}
                  {track.vehicleId.nickname && ` (${track.vehicleId.nickname})`}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={theme.colors.primary} style={{marginLeft: 4}} />
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Contenuto completo visibile solo quando espanso */}
        <Animated.ScrollView 
          ref={scrollViewRef}
          style={[
            styles.scrollContent, 
            { 
              opacity: bottomSheetHeight.interpolate({
                inputRange: [BOTTOM_SHEET_MIN_HEIGHT, BOTTOM_SHEET_MIN_HEIGHT + 50, BOTTOM_SHEET_MAX_HEIGHT],
                outputRange: [0, 0.7, 1]
              }) 
            }
          ]}
          scrollEnabled={isExpanded}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          {renderFullStats()}
        </Animated.ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 2,
  },
  mapControlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT + 10 : 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 3,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  mapTypeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContainer: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(150, 150, 150, 0.5)',
    marginBottom: 10,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  minStatsContainer: {
    width: '100%',
  },
  minStatRowsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  minStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  minStat: {
    alignItems: 'center',
    width: '30%',
  },
  minStatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStatIconContainer: {
    backgroundColor: theme.colors.primary,
  },
  minStatValue: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
    marginVertical: 4,
  },
  minStatLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  vehicleBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  vehicleBadgeText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 30,
  },
  fullStatsContainer: {
    paddingBottom: 30,
  },
  statsSection: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.colors.text,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 30, 32, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 70, 0.5)',
  },
  activeStatCard: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 2,
    color: theme.colors.text,
  },
  activeStatText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  unitText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  activeUnitText: {
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeStatLabel: {
    color: theme.colors.primary,
  },
  legendContainer: {
    paddingVertical: 15,
    marginTop: 5,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  legendColor: {
    width: 24,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoContainer: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(60, 60, 70, 0.5)',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: 'rgba(30, 30, 32, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 70, 0.5)',
    padding: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  vehicleContainer: {
    paddingVertical: 15,
    borderTopWidth: 1, 
    borderTopColor: 'rgba(60, 60, 70, 0.5)',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 32, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 70, 0.5)',
  },
  vehicleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  vehicleModel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  actionContainer: {
    marginTop: 15,
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(60, 60, 70, 0.5)',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 4,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '48%',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 30, 32, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 70, 0.5)',
  },
  activeActionIconContainer: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  actionButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  activeActionButtonText: {
    color: theme.colors.success,
    fontWeight: '500',
  },
  startMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  endMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedPointMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  selectedPointInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
  },
  speedCallout: {
    width: 130,
    padding: 14,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 70, 0.7)',
  },
  speedCalloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  speedCalloutValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  speedCalloutTimestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 10,
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  chartContent: {
    backgroundColor: 'rgba(30, 30, 32, 0.7)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 70, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisContainer: {
    height: 140,
    justifyContent: 'space-between',
    paddingVertical: 10,
    width: 40,
  },
  yAxisLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginLeft: 40, // Align with chart after Y axis
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  fullRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  fullRouteButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 5,
    fontWeight: '500',
  },
  viewOnMapButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 10,
    marginTop: 6,
  },
  viewOnMapText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
    textAlign: 'center',
  },
});

export default TripDetailScreen; 