import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getUserStatistics } from '../../api/services/userService';
import { getUserTracks } from '../../api/services/trackService';
import { getDefaultVehicle } from '../../api/services/vehicleService';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';
import VehicleCard from '../../components/VehicleCard';

// Placeholder components for section content
const StatsSection = ({ userStats, loading }) => {
  if (loading) {
    return (
      <View style={[styles.statsContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento statistiche...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Le mie statistiche</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats.totalDistance ? formatDistance(userStats.totalDistance) : '0'}</Text>
          <Text style={styles.statLabel}>Km totali</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats.totalTime ? Math.floor(userStats.totalTime / 3600) : '0'}</Text>
          <Text style={styles.statLabel}>Ore totali</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats.topSpeed ? formatSpeed(userStats.topSpeed) : '0'}</Text>
          <Text style={styles.statLabel}>Km/h max</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats.avgSpeed ? formatSpeed(userStats.avgSpeed) : '0'}</Text>
          <Text style={styles.statLabel}>Km/h media</Text>
        </View>
      </View>

      {/* Placeholder for speed distribution chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Distribuzione velocità</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Grafico distribuzione velocità</Text>
        </View>
      </View>
    </View>
  );
};

const HistoryItem = ({ track, onPress }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle}>{track.description || 'No title'}</Text>
        <Text style={styles.historyDate}>{formatDate(track.startTime)}</Text>
        
        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <Ionicons name="time-outline" size={14} color="#999" />
            <Text style={styles.historyStatText}>{formatTime(track.duration)}</Text>
          </View>
          
          <View style={styles.historyStat}>
            <Ionicons name="resize-outline" size={14} color="#999" />
            <Text style={styles.historyStatText}>{formatDistance(track.distance)} km</Text>
          </View>
          
          <View style={styles.historyStat}>
            <Ionicons name="speedometer-outline" size={14} color="#999" />
            <Text style={styles.historyStatText}>{formatSpeed(track.avgSpeed)} km/h</Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={22} color="#999" />
    </TouchableOpacity>
  );
};

const HistorySection = ({ tracks, onTrackPress, loading }) => {
  if (loading) {
    return (
      <View style={[styles.historyContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento tracciati...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.historyContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>I miei tracciati</Text>
        <Text style={styles.trackCount}>{tracks.length}</Text>
      </View>
      
      {tracks.map((track) => (
        <HistoryItem 
          key={track._id} 
          track={track} 
          onPress={() => onTrackPress(track._id)}
        />
      ))}
      
      {tracks.length === 0 && (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryText}>Nessun tracciato disponibile</Text>
        </View>
      )}
    </View>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [userStats, setUserStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    topSpeed: 0,
    avgSpeed: 0
  });
  const [userTracks, setUserTracks] = useState([]);
  const [defaultVehicle, setDefaultVehicle] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user stats and recent tracks
  const loadUserData = async () => {
    setError(null);
    
    // Fetch user statistics
    try {
      setLoadingStats(true);
      const stats = await getUserStatistics();
      setUserStats(stats);
    } catch (err) {
      console.error('Error fetching user statistics:', err);
      setError('Failed to load user statistics');
    } finally {
      setLoadingStats(false);
    }
    
    // Fetch recent tracks
    try {
      setLoadingTracks(true);
      const response = await getUserTracks(1, 5); // Get first page with 5 tracks
      
      // Assicuriamoci che tracks sia sempre un array
      if (response && Array.isArray(response.tracks)) {
        setUserTracks(response.tracks);
      } else if (response && typeof response.tracks === 'undefined') {
        // Se tracks è undefined, imposta un array vuoto
        setUserTracks([]);
        console.warn("La risposta non contiene un array tracks:", response);
      } else {
        // Se la risposta è malformata, imposta un array vuoto
        setUserTracks([]);
        console.warn("Risposta malformata dal server:", response);
      }
    } catch (err) {
      console.error('Error fetching recent tracks:', err);
      setError('Failed to load recent tracks');
    } finally {
      setLoadingTracks(false);
    }
    
    // Fetch default vehicle
    try {
      setLoadingVehicle(true);
      const vehicle = await getDefaultVehicle();
      setDefaultVehicle(vehicle);
    } catch (err) {
      console.error('Error fetching default vehicle:', err);
      // Non mostriamo errore per il veicolo
    } finally {
      setLoadingVehicle(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleTrackPress = (trackId) => {
    navigation.navigate('TripDetail', { trackId });
  };

  const handleViewAllTracks = () => {
    navigation.navigate('HistoryTab');
  };
  
  const handleVehiclePress = () => {
    if (defaultVehicle) {
      navigation.navigate('Vehicles', { screen: 'VehicleDetail', params: { vehicleId: defaultVehicle._id } });
    } else {
      navigation.navigate('Vehicles', { screen: 'VehicleList' });
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#007AFF']}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user?.name || 'User Name'}</Text>
            <Text style={styles.username}>@{user?.username || 'username'}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Modifica Profilo</Text>
        </TouchableOpacity>
        
        <View style={styles.followStats}>
          <View style={styles.followStat}>
            <Text style={styles.followCount}>{user?.following || 0}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </View>
          
          <View style={styles.followStat}>
            <Text style={styles.followCount}>{user?.followers || 0}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </View>
        </View>
      </View>
      
      {/* Sezione Veicolo Predefinito */}
      {!loadingVehicle && (
        <View style={styles.vehicleContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Il mio veicolo</Text>
            <TouchableOpacity 
              style={styles.garageButton} 
              onPress={() => navigation.navigate('Vehicles')}
            >
              <Ionicons name="car-sport" size={16} color="#007AFF" />
              <Text style={styles.viewAllText}>Garage</Text>
            </TouchableOpacity>
          </View>
          
          {defaultVehicle ? (
            <VehicleCard 
              vehicle={defaultVehicle} 
              onPress={handleVehiclePress}
            />
          ) : (
            <TouchableOpacity 
              style={styles.addVehicleButton}
              onPress={() => navigation.navigate('Vehicles', { screen: 'AddVehicle' })}
            >
              <Ionicons name="add-circle" size={28} color="#007AFF" />
              <Text style={styles.addVehicleText}>Aggiungi un veicolo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Statistics Section */}
      <StatsSection userStats={userStats} loading={loadingStats} />
      
      {/* Track History Section */}
      <HistorySection 
        tracks={userTracks} 
        onTrackPress={handleTrackPress} 
        loading={loadingTracks} 
      />
      
      {/* View All Tracks Button */}
      {userTracks.length > 0 && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllTracks}>
          <Text style={styles.viewAllText}>Vedi tutti i tracciati</Text>
          <Ionicons name="arrow-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  nameContainer: {
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 16,
    color: '#999',
  },
  editButton: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  followStats: {
    flexDirection: 'row',
  },
  followStat: {
    marginRight: 24,
  },
  followCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  followLabel: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackCount: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  // Stats section styles
  statsContainer: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginTop: 12,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  chartContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#666',
  },
  // History section styles
  historyContainer: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  historyStatText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: '#666',
    fontSize: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginBottom: 30,
  },
  viewAllText: {
    color: '#007AFF',
    fontSize: 16,
    marginRight: 5,
  },
  garageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleContainer: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginTop: 12,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c2c2e',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addVehicleText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProfileScreen; 