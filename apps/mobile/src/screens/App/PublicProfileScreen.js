import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl, 
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getUserProfile, followUser, unfollowUser } from '../../api/services/userService';
import { getUserTracks } from '../../api/services/trackService';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';
import VehicleCard from '../../components/VehicleCard';
import { theme } from '../../styles/theme';

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

// Componente per le statistiche dell'utente
const StatisticsSection = ({ profileData }) => {
  // Assicuriamoci che le statistiche siano sempre definite, anche se mancanti
  const stats = profileData?.statistics || {
    totalDistance: 0,
    totalTime: 0,
    topSpeed: 0,
    avgSpeed: 0
  };

  // Funzione helper per controllare i valori numeri e gestire undefined/null/NaN
  const safeNumber = (value, defaultValue = 0) => {
    return (value !== undefined && value !== null && !isNaN(value)) ? value : defaultValue;
  };

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Statistiche</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatDistance(safeNumber(stats.totalDistance))}</Text>
          <Text style={styles.statLabel}>Km totali</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.floor(safeNumber(stats.totalTime) / 3600)}</Text>
          <Text style={styles.statLabel}>Ore totali</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatSpeed(safeNumber(stats.topSpeed))}</Text>
          <Text style={styles.statLabel}>Km/h max</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatSpeed(safeNumber(stats.avgSpeed))}</Text>
          <Text style={styles.statLabel}>Km/h media</Text>
        </View>
      </View>
    </View>
  );
};

const PublicProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { username } = route.params;
  
  const [profileData, setProfileData] = useState(null);
  const [userTracks, setUserTracks] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [tracksError, setTracksError] = useState(null);

  // Carica il profilo dell'utente e i suoi tracciati pubblici
  const loadUserData = async () => {
    setProfileError(null);
    setTracksError(null);
    
    // Step 1: Carica informazioni del profilo
    try {
      setLoadingProfile(true);
      const userData = await getUserProfile(username);
      setProfileData(userData);
      setIsFollowing(userData.isFollowing || false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setProfileError('Impossibile caricare il profilo utente.');
    } finally {
      setLoadingProfile(false);
    }
    
    // Step 2: Carica tracciati pubblici dell'utente
    try {
      setLoadingTracks(true);
      const response = await getUserTracks(1, 5, username);
      
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
      console.error('Error fetching user tracks:', err);
      setTracksError('Impossibile caricare i tracciati pubblici.');
      // Imposta un array vuoto in caso di errore
      setUserTracks([]);
    } finally {
      setLoadingTracks(false);
    }
  };

  // Carica i dati al mount
  useEffect(() => {
    loadUserData();
  }, [username]);

  // Gestione pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  // Gestione follow/unfollow 
  const handleFollowToggle = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        await unfollowUser(username);
        setIsFollowing(false);
        Alert.alert('Successo', `Hai smesso di seguire @${username}`);
      } else {
        await followUser(username);
        setIsFollowing(true);
        Alert.alert('Successo', `Hai iniziato a seguire @${username}`);
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
      Alert.alert('Errore', 'Si è verificato un errore. Riprova più tardi.');
    } finally {
      setFollowLoading(false);
    }
  };

  // Naviga a dettaglio tracciato
  const handleTrackPress = (trackId) => {
    navigation.navigate('TripDetail', { trackId });
  };

  const handleNavigateToConnections = (initialTab) => {
    navigation.navigate('Connections', {
        username: username, // Pass the viewed profile's username
        initialTab: initialTab
    });
  };

  if (loadingProfile && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento profilo...</Text>
      </View>
    );
  }

  if (profileError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>{profileError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      {/* Intestazione Profilo */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image 
            source={profileData?.profileImage ? { uri: profileData.profileImage } : require('../../assets/images/default_profile.png')}
            style={styles.avatar}
          />
          <View style={styles.profileText}>
            <Text style={styles.name}>{profileData?.name || username}</Text>
            <Text style={styles.username}>@{username}</Text>
            {profileData?.bio && (
              <Text style={styles.bio}>{profileData.bio}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <TouchableOpacity onPress={() => handleNavigateToConnections('following')} style={styles.statItem}>
            <Text style={styles.statCount}>{profileData?.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNavigateToConnections('followers')} style={styles.statItem}>
            <Text style={styles.statCount}>{profileData?.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.followButton, isFollowing ? styles.unfollowButton : {}]} 
          onPress={handleFollowToggle}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? theme.colors.text : theme.colors.white} />
          ) : (
            <Text style={[styles.followButtonText, isFollowing ? styles.unfollowButtonText : {}]}>
              {isFollowing ? 'Seguito' : 'Segui'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Sezione Veicolo Predefinito */}
      {profileData?.defaultVehicle && (
        <View style={styles.vehicleContainer}>
          <Text style={styles.sectionTitle}>Veicolo Predefinito</Text>
          <VehicleCard 
            vehicle={profileData.defaultVehicle} 
            showDefault={false}
          />
        </View>
      )}
      
      {/* Sezione Statistiche */}
      <StatisticsSection profileData={profileData} />
      
      {/* Sezione Tracciati */}
      <View style={styles.historyContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tracciati pubblici</Text>
          {profileData && (
            <Text style={styles.trackCount}>{profileData.publicTracksCount || 0}</Text>
          )}
        </View>
        
        {tracksError && (
          <View style={styles.errorMessageContainer}>
            <Text style={styles.errorMessageText}>{tracksError}</Text>
          </View>
        )}
        
        {loadingTracks && !refreshing ? (
          <View style={styles.loadingSectionContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Caricamento tracciati...</Text>
          </View>
        ) : userTracks && userTracks.length > 0 ? (
          userTracks.map((track) => (
            <HistoryItem 
              key={track._id} 
              track={track} 
              onPress={() => handleTrackPress(track._id)}
            />
          ))
        ) : (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>
              {`${username} non ha ancora pubblicato tracciati pubblici`}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingSectionContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  errorMessageContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorMessageText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    paddingBottom: 15,
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
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
  followButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 0,
    height: 40,
    justifyContent: 'center',
  },
  followButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  unfollowButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unfollowButtonText: {
    color: theme.colors.text,
  },
  vehicleContainer: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginTop: 12,
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
    marginBottom: 16,
  },
  trackCount: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  historyContainer: {
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
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
  historyItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    marginRight: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  historyDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  historyStatText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: 4,
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  vehicleSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
});

export default PublicProfileScreen; 