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
import SpeedDistributionChart from '../../components/charts/SpeedDistributionChart';
import { theme } from '../../styles/theme';

// Placeholder components for section content
const StatsSection = ({ userStats, loading }) => {
  if (loading) {
    return (
      <View style={[styles.statsContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

      <SpeedDistributionChart />
    </View>
  );
};

const HistoryItem = ({ track, onPress, onShare }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress}>
      {/* Map Preview (could be implemented with a static map if available) */}
      <View style={styles.historyPreview}>
        <Ionicons name="map-outline" size={30} color={theme.colors.primary} />
        {track.isPublic ? (
          <View style={styles.visibilityBadge}>
            <Ionicons name="globe-outline" size={12} color={theme.colors.white} />
          </View>
        ) : (
          <View style={[styles.visibilityBadge, styles.privateBadge]}>
            <Ionicons name="lock-closed-outline" size={12} color={theme.colors.white} />
          </View>
        )}
      </View>
      
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle}>
          {track.description || 'Tracciato senza titolo'}
        </Text>
        <Text style={styles.historyDate}>{formatDate(track.startTime)}</Text>
        
        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.historyStatText}>{formatTime(track.duration)}</Text>
          </View>
          
          <View style={styles.historyStat}>
            <Ionicons name="resize-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.historyStatText}>{formatDistance(track.distance)} km</Text>
          </View>
          
          <View style={styles.historyStat}>
            <Ionicons name="speedometer-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.historyStatText}>{formatSpeed(track.avgSpeed)} km/h</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.historyActions}>
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={() => onShare(track)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={track.isPublic ? "share-social-outline" : "share-outline"} 
            size={20} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const HistorySection = ({ tracks, onTrackPress, onShareTrack, loading, onViewAll }) => {
  if (loading) {
    return (
      <View style={[styles.historyContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
      
      {tracks.length > 0 ? (
        <>
          {tracks.slice(0, 3).map((track) => (
            <HistoryItem 
              key={track._id} 
              track={track} 
              onPress={() => onTrackPress(track._id)}
              onShare={onShareTrack}
            />
          ))}
          
          {tracks.length > 3 && (
            <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
              <Text style={styles.viewAllText}>Vedi tutti ({tracks.length})</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.emptyHistory}>
          <Ionicons name="map-outline" size={50} color={theme.colors.textSecondary} style={styles.emptyIcon} />
          <Text style={styles.emptyHistoryText}>Nessun tracciato disponibile</Text>
          <Text style={styles.emptyHistorySubtext}>I tuoi percorsi appariranno qui</Text>
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

  const handleVehiclePress = () => {
    navigation.navigate('Vehicles');
  };

  const handleNavigateToConnections = (initialTab) => {
    if (user?.username) {
        navigation.navigate('Connections', {
            username: user.username, // Pass own username
            initialTab: initialTab // 'followers' or 'following'
        });
    } else {
        console.warn("Cannot navigate to connections: username is missing.");
        // Optionally show an alert to the user
    }
  };

  const handleShareTrack = (track) => {
    navigation.navigate('TripDetail', { 
      trackId: track._id,
      showShareOptions: true
    });
  };

  const handleViewAllTracks = () => {
    // Navigate to a screen that shows all tracks
    navigation.navigate('TripDetail', { screen: 'HistoryList' });
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image 
            source={user?.profileImage ? { uri: user.profileImage } : require('../../assets/images/default_profile.png')}
            style={styles.avatar}
          />
          <View style={styles.profileText}>
            <Text style={styles.name}>{user?.name || user?.username || 'User Name'}</Text>
            <Text style={styles.username}>@{user?.username || 'username'}</Text>
            {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <TouchableOpacity onPress={() => handleNavigateToConnections('following')} style={styles.statItem}>
            <Text style={styles.statCount}>{user?.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNavigateToConnections('followers')} style={styles.statItem}>
            <Text style={styles.statCount}>{user?.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Modifica Profilo</Text>
        </TouchableOpacity>
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
              onPress={() => navigation.navigate('Vehicles', { screen: 'AddEditVehicle' })}
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
        onShareTrack={handleShareTrack}
        onViewAll={handleViewAllTracks}
        loading={loadingTracks} 
      />
      
      {/* Error Display */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Example Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileInfo: {
    flexDirection: 'row',
        alignItems: 'center',
    marginBottom: 15,
    },
    avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
        marginRight: 15,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    },
    profileText: {
    flex: 1,
  },
  name: {
    fontSize: 22,
        fontWeight: 'bold',
    color: theme.colors.text,
    },
    username: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  bio: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    marginTop: 5,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statCount: {
    fontSize: 18,
        fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    },
  sectionTitle: {
        fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  // Stats section styles
  statsContainer: {
    padding: 15,
    backgroundColor: theme.colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
        marginBottom: 10,
    },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 5,
  },
  garageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleContainer: {
    padding: 15,
    backgroundColor: theme.colors.background,
    marginTop: 12,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  addVehicleText: {
    color: theme.colors.primary,
        fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    margin: 15,
  },
  logoutButtonText: {
    color: theme.colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // History section styles
  historyContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 15,
    paddingVertical: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  visibilityBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  privateBadge: {
    backgroundColor: theme.colors.textSecondary,
  },
  historyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  historyStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 2,
  },
  historyStatText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  shareButton: {
    padding: 6,
    marginRight: 6,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    marginBottom: 15,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    },
});

export default ProfileScreen; 