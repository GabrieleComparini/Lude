import React, { useState, useEffect, useRef } from 'react';
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
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Polyline, Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getTrackById, updateTrack } from '../../api/services/trackService';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';
import { theme } from '../../styles/theme';

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

const TripDetailScreen = () => {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapType, setMapType] = useState('standard');
  
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const mapRef = useRef(null);
  
  const route = useRoute();
  const navigation = useNavigation();
  const { trackId } = route.params;
  
  // Configure pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      let newHeight = isExpanded 
        ? BOTTOM_SHEET_MAX_HEIGHT - gestureState.dy 
        : BOTTOM_SHEET_MIN_HEIGHT - gestureState.dy;
        
      newHeight = Math.max(BOTTOM_SHEET_MIN_HEIGHT, Math.min(newHeight, BOTTOM_SHEET_MAX_HEIGHT));
      bottomSheetHeight.setValue(newHeight);
    },
    onPanResponderRelease: (_, gestureState) => {
      const currentHeight = bottomSheetHeight._value;
      const midPoint = BOTTOM_SHEET_MIN_HEIGHT + SNAP_POINT_THRESHOLD;
      
      if (isExpanded && gestureState.dy > 0) {
        // Swiping down when expanded
        if (currentHeight < midPoint) {
          snapToBottom();
        } else {
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
          snapToBottom();
        }
      }
    }
  });
  
  const snapToTop = () => {
    Animated.spring(bottomSheetHeight, {
      toValue: BOTTOM_SHEET_MAX_HEIGHT,
      useNativeDriver: false,
      bounciness: 8
    }).start();
    setIsExpanded(true);
  };
  
  const snapToBottom = () => {
    Animated.spring(bottomSheetHeight, {
      toValue: BOTTOM_SHEET_MIN_HEIGHT,
      useNativeDriver: false,
      bounciness: 8
    }).start();
    setIsExpanded(false);
  };
  
  // Carica i dettagli del tracciato
  useEffect(() => {
    const fetchTrackDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const trackData = await getTrackById(trackId);
        setTrack(trackData);
        
        // Calcola la regione della mappa per mostrare l'intero percorso
        if (trackData.route && trackData.route.length > 0) {
          calculateMapRegion(trackData.route);
        }
      } catch (err) {
        console.error('Error fetching track details:', err);
        setError('Impossibile caricare i dettagli del tracciato. Riprova più tardi.');
        Alert.alert('Errore', 'Impossibile caricare i dettagli del tracciato.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrackDetails();
  }, [trackId]);
  
  // Calcola la regione della mappa per mostrare l'intero percorso
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
    
    const paddingFactor = 0.1; // Aggiunge un po' di spazio intorno al percorso
    const latDelta = (maxLat - minLat) * (1 + paddingFactor);
    const lngDelta = (maxLng - minLng) * (1 + paddingFactor);
    
    setMapRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01)
    });
  };
  
  // Determina il colore di un segmento in base alla velocità
  const getSpeedColor = (speed) => {
    const speedKmh = speed * 3.6; // Converte m/s in km/h
    if (speedKmh <= 40) return '#00B3FF';
    if (speedKmh <= 80) return '#2432FF';
    if (speedKmh <= 120) return '#7700FF';
    return '#E600FF';
  };
  
  // Trova il punto più vicino sulla traccia in base alle coordinate del tocco
  const findClosestPoint = (touchCoords) => {
    if (!track || !track.route || track.route.length === 0) return null;
    
    let closestPoint = null;
    let minDistance = Infinity;
    
    track.route.forEach(point => {
      // Calcola la distanza tra il punto toccato e il punto della traccia (formula di Haversine semplificata)
      const distance = Math.sqrt(
        Math.pow(point.lat - touchCoords.latitude, 2) + 
        Math.pow(point.lng - touchCoords.longitude, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    // Verifica che il punto sia abbastanza vicino al tocco (per evitare tocchi lontani dalla traccia)
    if (minDistance < 0.005) { // Valore empirico, da regolare in base alla sensibilità desiderata
      return closestPoint;
    }
    
    return null;
  };
  
  // Gestisce il tocco sulla mappa
  const handleMapPress = (event) => {
    // Ignora il tocco se proviene dal bottom sheet
    if (event.nativeEvent.action === 'marker-press') return;
    
    const touchCoords = event.nativeEvent.coordinate;
    const closest = findClosestPoint(touchCoords);
    
    if (closest) {
      setSelectedPoint(closest);
    } else {
      setSelectedPoint(null);
    }
  };
  
  // Renderizza le statistiche minime (parte inferiore)
  const renderMinStats = () => {
    if (!track) return null;
    
    return (
      <View style={styles.minStatsContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {track.name || `Tracciato ${new Date(track.startTime).toLocaleDateString()}`}
          </Text>
          
          <View style={styles.dragHandle} />
        </View>
        
        <View style={styles.minStatRowsContainer}>
          <View style={styles.minStatRow}>
            <View style={styles.minStat}>
              <Ionicons name="time-outline" size={18} color="#007AFF" />
              <Text style={styles.minStatValue}>{formatTime(track.duration)}</Text>
              <Text style={styles.minStatLabel}>Durata</Text>
            </View>
            
            <View style={styles.minStat}>
              <Ionicons name="map-outline" size={18} color="#007AFF" />
              <Text style={styles.minStatValue}>{formatDistance(track.distance)}</Text>
              <Text style={styles.minStatLabel}>Distanza</Text>
            </View>
            
            <View style={styles.minStat}>
              <Ionicons name="speedometer-outline" size={18} color="#007AFF" />
              <Text style={styles.minStatValue}>{formatSpeed(track.avgSpeed)}</Text>
              <Text style={styles.minStatLabel}>Vel. Media</Text>
            </View>
          </View>
          
          {track.vehicleId && (
            <View style={styles.vehicleBadgeContainer}>
              <View style={styles.vehicleBadge}>
                <Ionicons name="car-outline" size={16} color="#007AFF" />
                <Text style={styles.vehicleBadgeText}>
                  {track.vehicleId.make} {track.vehicleId.model}
                  {track.vehicleId.nickname && ` (${track.vehicleId.nickname})`}
                </Text>
          </View>
          </View>
          )}
        </View>
      </View>
    );
  };
  
  // Renderizza le statistiche complete (parte espansa)
  const renderFullStats = () => {
    if (!track) return null;
    
    return (
      <View style={styles.fullStatsContainer}>
        {/* Statistiche avanzate */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiche</Text>
          <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="map" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{formatDistance(track.distance)}</Text>
          <Text style={styles.statLabel}>Distanza (km)</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{formatTime(track.duration)}</Text>
          <Text style={styles.statLabel}>Durata</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="speedometer" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{formatSpeed(track.avgSpeed)}</Text>
          <Text style={styles.statLabel}>Vel. Media (km/h)</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{formatSpeed(track.maxSpeed)}</Text>
          <Text style={styles.statLabel}>Vel. Max (km/h)</Text>
            </View>
          </View>
        </View>
        
        {/* Legenda velocità */}
        <View style={styles.legendContainer}>
          <Text style={styles.sectionTitle}>Legenda velocità</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#00B3FF' }]} />
              <Text style={styles.legendText}>0-40 km/h</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2432FF' }]} />
              <Text style={styles.legendText}>41-80 km/h</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#7700FF' }]} />
              <Text style={styles.legendText}>81-120 km/h</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#E600FF' }]} />
              <Text style={styles.legendText}>120+ km/h</Text>
            </View>
          </View>
        </View>
        
        {/* Informazioni sul tracciato */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Informazioni sul tracciato</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data</Text>
            <Text style={styles.infoValue}>
              {new Date(track.startTime).toLocaleDateString()} {new Date(track.startTime).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
          
          {track.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Descrizione</Text>
              <Text style={styles.infoValue}>{track.description}</Text>
            </View>
          )}
          
          {track.tags && track.tags.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tag</Text>
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

        {/* Veicolo */}
        {track.vehicleId && (
          <View style={styles.vehicleContainer}>
            <Text style={styles.sectionTitle}>Veicolo</Text>
            <TouchableOpacity 
              style={styles.vehicleCard}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: track.vehicleId._id })}
            >
              <View style={styles.vehicleIconContainer}>
                <Ionicons name="car" size={32} color="#007AFF" />
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{track.vehicleId.nickname}</Text>
                <Text style={styles.vehicleModel}>{track.vehicleId.make} {track.vehicleId.model} {track.vehicleId.year}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Toggle visibilità */}
        <View style={styles.shareContainer}>
          <Text style={styles.shareText}>
            Questo tracciato è <Text style={styles.visibilityText}>{track.isPublic ? 'pubblico' : 'privato'}</Text>
          </Text>
          <TouchableOpacity 
            style={[
              styles.shareButton, 
              track.isPublic ? styles.makePrivateButton : styles.makePublicButton
            ]}
            onPress={togglePublicStatus}
            disabled={updating}
          >
            <Ionicons 
              name={track.isPublic ? 'eye-off' : 'eye'} 
              size={18} 
              color="white" 
            />
            <Text style={styles.shareButtonText}>
              {updating ? 'Aggiornamento...' : (track.isPublic ? 'Rendi privato' : 'Rendi pubblico')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Toggle public/private status
  const togglePublicStatus = async () => {
    if (!track) return;
    
    setUpdating(true);
    try {
      const updatedTrack = await updateTrack(trackId, { 
        isPublic: !track.isPublic 
      });
      
      setTrack(updatedTrack);
      Alert.alert(
        'Successo', 
        `Il tracciato ora è ${updatedTrack.isPublic ? 'pubblico' : 'privato'}.`
      );
    } catch (err) {
      console.error('Error updating track visibility:', err);
      Alert.alert('Errore', 'Impossibile aggiornare la visibilità del tracciato. Riprova più tardi.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Toggle map type between standard and satellite
  const toggleMapType = () => {
    setMapType(prevType => prevType === 'standard' ? 'satellite' : 'standard');
  };
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento dettagli...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  if (!track) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>Tracciato non trovato</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Mappa a schermo intero */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
        onPress={handleMapPress}
        customMapStyle={darkMapStyle}
        mapType={mapType}
        userInterfaceStyle="dark"
      >
        {/* Punti di inizio e fine */}
        {track?.route && track.route.length > 0 && (
          <>
            <Marker
              coordinate={{
                latitude: track.route[0].lat,
                longitude: track.route[0].lng
              }}
              pinColor="green"
              title="Inizio"
            />
            <Marker
              coordinate={{
                latitude: track.route[track.route.length - 1].lat,
                longitude: track.route[track.route.length - 1].lng
              }}
              pinColor="red"
              title="Fine"
            />
            
            {/* Percorso con colori basati sulla velocità */}
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
                  strokeWidth={4}
                />
              );
            })}
        
            {/* Marker per il punto selezionato */}
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
                    <Text style={styles.speedCalloutTitle}>Velocità</Text>
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

      {/* Controllo tipo mappa */}
      <TouchableOpacity 
        style={styles.mapTypeButton} 
        onPress={toggleMapType}
      >
        <Ionicons 
          name={mapType === 'standard' ? 'map' : 'earth'} 
          size={22} 
          color="white" 
        />
        <Text style={styles.mapTypeText}>
          {mapType === 'standard' ? 'Satellite' : 'Standard'}
        </Text>
      </TouchableOpacity>
  
      {/* Pulsante indietro */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
  
      {/* Bottom sheet con statistiche */}
      <Animated.View 
        style={[styles.bottomSheet, { height: bottomSheetHeight }]}
        {...panResponder.panHandlers}
      >
        {renderMinStats()}
        
        {/* Contenuto completo visibile solo quando espanso */}
        <Animated.ScrollView 
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
          showsVerticalScrollIndicator={true}
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
  mapContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapStyle: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 10,
  },
  bottomSheetDragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  date: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT + 10 : 10,
    left: 10,
    padding: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text,
    paddingHorizontal: 16,
  },
  mapLegend: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    marginBottom: 15,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statsSection: {
    paddingVertical: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoContainer: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  infoRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: theme.colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 15,
    paddingVertical: 4,
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
    borderTopColor: theme.colors.border,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vehicleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  vehicleModel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  shareContainer: {
    marginTop: 15,
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  shareText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: theme.colors.text,
  },
  visibilityText: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    width: 200,
  },
  makePublicButton: {
    backgroundColor: theme.colors.success,
  },
  makePrivateButton: {
    backgroundColor: theme.colors.error,
  },
  shareButtonText: {
    color: theme.colors.white,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  selectedPointMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 2,
    borderColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPointInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF00FF',
  },
  speedCallout: {
    width: 120,
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  speedCalloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 3,
  },
  speedCalloutValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 3,
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
  map: {
    ...StyleSheet.absoluteFillObject,
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
  minStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 4,
  },
  minStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  vehicleBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  vehicleBadgeText: {
    marginLeft: 6,
    fontSize: 13,
    color: theme.colors.primary,
  },
  scrollContent: {
    flex: 1,
  },
  fullStatsContainer: {
    paddingBottom: 30,
  },
  headerContainer: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 0,
    borderBottomColor: theme.colors.border,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
    alignSelf: 'center',
  },
  mapTypeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? STATUS_BAR_HEIGHT + 10 : 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  mapTypeText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TripDetailScreen; 