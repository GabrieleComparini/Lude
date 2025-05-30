import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, RefreshControl, Alert, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getUserStatistics } from '../../api/services/userService';
import { getUserTracks } from '../../api/services/trackService';
import { getDefaultVehicle } from '../../api/services/vehicleService';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';
import VehicleCard from '../../components/VehicleCard';
import SpeedDistributionChart from '../../components/charts/SpeedDistributionChart';
import { theme } from '../../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Component for profile header with avatar and user info
const ProfileHeader = ({ user, onEditProfile, onManageConnections }) => {
  if (!user) return null;
  
  return (
    <View style={styles.profileHeaderContainer}>
      <LinearGradient
        colors={[theme.colors.primary + '40', 'transparent']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={onEditProfile}
            >
              <Ionicons name="camera" size={14} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{user.name || user.username}</Text>
            <Text style={styles.userUsername}>@{user.username}</Text>
            
            {user.bio ? (
              <Text style={styles.userBio} numberOfLines={2}>{user.bio}</Text>
            ) : null}
            
            <View style={styles.connectionStats}>
              <TouchableOpacity 
                style={styles.connectionStat}
                onPress={() => onManageConnections('following')}
              >
                <Text style={styles.connectionCount}>
                  {user.connectionsCount || 0}
                </Text>
                <Text style={styles.connectionLabel}>Following</Text>
              </TouchableOpacity>
              
              <View style={styles.connectionDivider} />
              
              <TouchableOpacity 
                style={styles.connectionStat}
                onPress={() => onManageConnections('followers')}
              >
                <Text style={styles.connectionCount}>
                  {user.followersCount || 0}
                </Text>
                <Text style={styles.connectionLabel}>Followers</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={onEditProfile}
          >
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

// Componente per le statistiche
const StatsSection = ({ userStats, loading, error }) => {
  if (loading) {
    return (
      <View style={[styles.statsContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.statsContainer, styles.errorContainer]}>
        <Ionicons name="warning-outline" size={30} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  // Log per debug
  console.log('UserStats received:', JSON.stringify(userStats, null, 2));
  
  // Definizione delle statistiche principali con formattazione e unità di misura
  const mainStats = [
    { 
      key: 'totalDistance', 
      label: 'Total km', 
      icon: 'map-outline',
      format: (val) => parseFloat(val).toFixed(1),
      unit: 'km'
    },
    { 
      key: 'totalTime', 
      label: 'Duration',
      icon: 'time-outline',
      format: (val) => (val / 3600).toFixed(1),
      unit: 'h'
    },
    { 
      key: 'topSpeed', 
      label: 'Max speed',
      icon: 'speedometer-outline',
      format: (val) => parseFloat(val).toFixed(1),
      unit: 'km/h'
    },
    { 
      key: 'avgSpeed', 
      label: 'Avg speed',
      icon: 'trending-up-outline',
      format: (val) => parseFloat(val).toFixed(1),
      unit: 'km/h'
    }
  ];
  
  // Ottieni tutte le proprietà dalle statistiche
  const statKeys = Object.keys(userStats);
  
  // Filtra per mostrare le statistiche disponibili
  const displayStats = mainStats.filter(stat => statKeys.includes(stat.key));
  
  // Aggiungi eventuali statistiche extra che non sono nelle principali
  const extraStats = statKeys
    .filter(key => !['totalDistance', 'totalTime', 'topSpeed', 'avgSpeed', 'total_distance', 'distance'].includes(key) && typeof userStats[key] === 'number')
    .map(key => {
      // Per le statistiche aggiuntive, cerchiamo di formattarle in base al nome
      let unit = '';
      let format = (val) => parseFloat(val).toFixed(1);
      let icon = 'stats-chart-outline';
      
      if (key.toLowerCase().includes('speed')) {
        unit = 'km/h';
        icon = 'speedometer-outline';
      } else if (key.toLowerCase().includes('distance')) {
        unit = 'km';
        icon = 'map-outline';
      } else if (key.toLowerCase().includes('time') || key.toLowerCase().includes('duration')) {
        unit = 'h';
        icon = 'time-outline';
        format = (val) => (val / 3600).toFixed(1);
      }
      
      return { 
        key, 
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        format,
        unit,
        icon
      };
    });
  
  const allStats = [...displayStats, ...extraStats];
  
  return (
    <View style={styles.statsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsGrid}>
        {allStats.slice(0, 4).map(stat => (
          <View key={stat.key} style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name={stat.icon} size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {userStats[stat.key] !== undefined ? stat.format(userStats[stat.key]) : '0'}
                <Text style={styles.statUnit}> {stat.unit}</Text>
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <SpeedDistributionChart />
    </View>
  );
};

// Enhanced vehicle card component
const EnhancedVehicleCard = ({ vehicle, onPress }) => {
  if (!vehicle) return null;
  
  return (
    <TouchableOpacity 
      style={styles.vehicleCardContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[theme.colors.surface, theme.colors.surface + '90']}
        style={styles.vehicleCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.vehicleIconContainer}>
          <Ionicons name="car-sport" size={28} color={theme.colors.primary} />
        </View>
        
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{vehicle.nickname || `${vehicle.make} ${vehicle.model}`}</Text>
          <Text style={styles.vehicleDetails}>{vehicle.make} {vehicle.model} {vehicle.year}</Text>
          
          {vehicle.licensePlate ? (
            <View style={styles.licensePlateTag}>
              <Text style={styles.licensePlateText}>{vehicle.licensePlate}</Text>
            </View>
          ) : null}
        </View>
        
        <View style={styles.vehicleActionContainer}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
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

const HistorySection = ({ tracks, onTrackPress, onShareTrack, loading, error, onViewAll }) => {
  if (loading) {
    return (
      <View style={[styles.historyContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading tracks...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.historyContainer, styles.errorContainer]}>
        <Ionicons name="warning-outline" size={30} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.historyContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Track History</Text>
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
              <Text style={styles.viewAllText}>View all ({tracks.length})</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.emptyHistory}>
          <Ionicons name="map-outline" size={50} color={theme.colors.textSecondary} style={styles.emptyIcon} />
          <Text style={styles.emptyHistoryText}>No tracks available</Text>
          <Text style={styles.emptyHistorySubtext}>Your tracks will appear here</Text>
        </View>
      )}
    </View>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, refreshUserProfile } = useAuth();
  const [userStats, setUserStats] = useState({});
  const [userTracks, setUserTracks] = useState([]);
  const [defaultVehicle, setDefaultVehicle] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [tracksError, setTracksError] = useState(null);
  const [vehicleError, setVehicleError] = useState(null);

  // Refresh user data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const refreshUserData = async () => {
        setLoadingUserData(true);
        try {
          await refreshUserProfile();
        } catch (err) {
          console.error('Error refreshing user data:', err);
        } finally {
          setLoadingUserData(false);
        }
      };
      
      refreshUserData();
    }, [])
  );

  // Fetch user stats and recent tracks
  const loadUserData = async () => {
    // Reset errors
    setStatsError(null);
    setTracksError(null);
    setVehicleError(null);
    
    // Fetch user statistics
    try {
      setLoadingStats(true);
      const stats = await getUserStatistics();
      console.log('Received user statistics from API:', JSON.stringify(stats, null, 2));
      
      // Assegna direttamente i dati ricevuti dall'API senza manipolazioni
      setUserStats(stats);
    } catch (err) {
      console.error('Error fetching user statistics:', err);
      setStatsError('Unable to load statistics. Please try again later.');
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
      } else {
        throw new Error('Invalid track data');
      }
    } catch (err) {
      console.error('Error fetching recent tracks:', err);
      setTracksError('Unable to load tracks. Please try again later.');
      setUserTracks([]);
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
      setVehicleError('Unable to load vehicle. Please try again later.');
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
    try {
      // Prima aggiorniamo i dati utente
      await refreshUserProfile();
      // Poi carichiamo gli altri dati
      await loadUserData();
    } catch (err) {
      console.error('Error during refresh:', err);
      Alert.alert('Error', 'An error occurred while refreshing data.');
    } finally {
      setRefreshing(false);
    }
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
        // Make sure we have the latest user data
        refreshUserProfile().then(() => {
            navigation.navigate('Connections', {
                username: user.username, // Pass own username
                initialTab: initialTab // 'followers' or 'following'
            });
        }).catch(err => {
            console.error('Failed to refresh user data before viewing connections:', err);
            // Navigate anyway even if refresh fails
            navigation.navigate('Connections', {
                username: user.username,
                initialTab: initialTab
            });
        });
    } else {
        console.warn("Cannot navigate to connections: username is missing.");
        Alert.alert("Error", "Unable to view connections. Username missing.");
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        <ProfileHeader 
          user={user} 
          onEditProfile={handleEditProfile}
          onManageConnections={handleNavigateToConnections}
        />
        
        <StatsSection 
          userStats={userStats}
          loading={loadingStats}
          error={statsError}
        />
        
        {loadingVehicle ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : vehicleError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{vehicleError}</Text>
          </View>
        ) : defaultVehicle ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Vehicle</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={handleVehiclePress}
              >
                <Text style={styles.seeAllText}>All vehicles</Text>
              </TouchableOpacity>
            </View>
            <EnhancedVehicleCard 
              vehicle={defaultVehicle} 
              onPress={handleVehiclePress} 
            />
          </>
        ) : (
          <TouchableOpacity 
            style={styles.addVehicleButton}
            onPress={handleVehiclePress}
          >
            <View style={styles.addVehicleContent}>
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.addVehicleText}>Add your first vehicle</Text>
            </View>
          </TouchableOpacity>
        )}
        
        <HistorySection
          tracks={userTracks}
          onTrackPress={handleTrackPress}
          onShareTrack={handleShareTrack}
          loading={loadingTracks}
          error={tracksError}
          onViewAll={handleViewAllTracks}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  // Profile Header styles
  profileHeaderContainer: {
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2, 
    borderColor: theme.colors.surface,
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  userBio: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 10,
  },
  connectionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionCount: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 4,
  },
  connectionLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  connectionDivider: {
    width: 1,
    height: 14,
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 16,
  },
  editProfileText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Section Header styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  seeAllButton: {
    paddingVertical: 5,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  // Stats Section styles
  statsContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  
  // Vehicle Card styles
  vehicleCardContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  licensePlateTag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  licensePlateText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  vehicleActionContainer: {
    padding: 8,
  },
  
  // Add Vehicle Button
  addVehicleButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    borderStyle: 'dashed',
  },
  addVehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVehicleText: {
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  // History styles remain mostly the same
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