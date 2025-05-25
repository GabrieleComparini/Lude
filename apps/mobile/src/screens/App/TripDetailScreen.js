import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getTrackById, updateTrack } from '../../api/services/trackService';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const TripDetailScreen = () => {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const route = useRoute();
  const navigation = useNavigation();
  const { trackId } = route.params;
  
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
  
  // Renderizza indicatori di velocità
  const renderSpeedLegend = () => {
    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Velocità</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>0-30 km/h</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
            <Text style={styles.legendText}>31-60 km/h</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF5722' }]} />
            <Text style={styles.legendText}>61+ km/h</Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Determina il colore di un segmento in base alla velocità
  const getSpeedColor = (speed) => {
    const speedKmh = speed * 3.6; // Converte m/s in km/h
    if (speedKmh <= 30) return '#4CAF50';
    if (speedKmh <= 60) return '#FFC107';
    return '#FF5722';
  };
  
  // Renderizza le statistiche del tracciato
  const renderStats = () => {
    if (!track) return null;
    
    return (
      <View style={styles.statsContainer}>
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
        'Success', 
        `Track is now ${updatedTrack.isPublic ? 'public' : 'private'}.`
      );
    } catch (err) {
      console.error('Error updating track visibility:', err);
      Alert.alert('Error', 'Failed to update track visibility. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  // Add public/private toggle button in the info section
  const renderPublicToggle = () => {
    if (!track) return null;
    
    return (
      <View style={styles.shareContainer}>
        <Text style={styles.shareText}>
          This track is currently <Text style={styles.visibilityText}>{track.isPublic ? 'public' : 'private'}</Text>
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
            {updating ? 'Updating...' : (track.isPublic ? 'Make Private' : 'Make Public')}
          </Text>
        </TouchableOpacity>
      </View>
    );
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Mappa con percorso */}
      <View style={styles.mapContainer}>
        {mapRegion ? (
          <MapView
            style={styles.map}
            initialRegion={mapRegion}
          >
            {/* Punti di inizio e fine */}
            {track.route && track.route.length > 0 && (
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
              </>
            )}
          </MapView>
        ) : (
          <View style={[styles.map, styles.centered]}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </View>
      
      {/* Legenda velocità */}
      {renderSpeedLegend()}
      
      {/* Statistiche principali */}
      {renderStats()}
      
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
        
        {track.vehicleId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Veicolo</Text>
            <Text style={styles.infoValue}>
              {track.vehicleId.make} {track.vehicleId.model}
              {track.vehicleId.nickname && ` (${track.vehicleId.nickname})`}
            </Text>
          </View>
        )}
      </View>
      
      {/* Add this after the info container */}
      {renderPublicToggle()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    width: '100%',
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  legendContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 10,
  },
  statCard: {
    width: (width - 40) / 2, // 2 colonne con un po' di padding
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    margin: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e1f5fe',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#0277bd',
  },
  shareContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  shareText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  visibilityText: {
    fontWeight: 'bold',
    color: '#007AFF',
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
    backgroundColor: '#4CAF50',
  },
  makePrivateButton: {
    backgroundColor: '#FF5722',
  },
  shareButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default TripDetailScreen; 