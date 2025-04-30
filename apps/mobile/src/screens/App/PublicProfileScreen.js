import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getUserProfile, followUser, unfollowUser } from '../../api/services/userService';
import { getUserTracks } from '../../api/services/trackService';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';
import VehicleCard from '../../components/VehicleCard';

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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profileData?.name ? profileData.name.charAt(0).toUpperCase() : username.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{profileData?.name || username}</Text>
            <Text style={styles.username}>@{username}</Text>
            
            {profileData?.bio && (
              <Text style={styles.bio}>{profileData.bio}</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.followButton, 
            isFollowing ? styles.followingButton : styles.notFollowingButton
          ]}
          onPress={handleFollowToggle}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.followButtonText}>
              {isFollowing ? 'Segui già' : 'Segui'}
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.followStats}>
          <View style={styles.followStat}>
            <Text style={styles.followCount}>{profileData?.following || 0}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </View>
          
          <View style={styles.followStat}>
            <Text style={styles.followCount}>{profileData?.followers || 0}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </View>
        </View>
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
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingSectionContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
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
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
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
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  followButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#444',
  },
  notFollowingButton: {
    backgroundColor: '#007AFF',
  },
  followButtonText: {
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
    backgroundColor: '#1c1c1e',
    marginTop: 12,
    marginBottom: 12,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
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
    textAlign: 'center',
  },
  vehicleContainer: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginTop: 12,
  },
});

export default PublicProfileScreen; 