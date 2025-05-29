import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, followUser, unfollowUser } from '../../../api/services/userService';
import { getUserTracks } from '../../../api/services/trackService';
import TrackCard from '../../../components/TrackCard';
import { useAuth } from '../../../context/AuthContext';

const PublicProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { username } = route.params;
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user profile and check if current user is following
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfile(username);
      setUser(userData);
      setFollowersCount(userData.followerCount || 0);
      
      // Check if current user is following this user
      // Ideally the API should return this info, but we'll handle it client-side for now
      setIsFollowing(userData.isFollowedByMe || false);
      
      // Fetch user's public tracks
      const tracksData = await getUserTracks(userData._id, { isPublic: true });
      setTracks(tracksData.tracks || []);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Impossibile caricare il profilo. Riprova più tardi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUserProfile();
  };

  const handleFollowToggle = async () => {
    if (isLoadingAction) return;
    
    try {
      setIsLoadingAction(true);
      
      if (isFollowing) {
        await unfollowUser(user._id);
        setFollowersCount(prev => Math.max(prev - 1, 0));
      } else {
        await followUser(user._id);
        setFollowersCount(prev => prev + 1);
      }
      
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Error toggling follow status:', err);
      Alert.alert('Errore', 'Impossibile aggiornare lo stato di follow. Riprova più tardi.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Utente non trovato</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCurrentUser = currentUser && currentUser._id === user._id;

  return (
    <View style={styles.container}>
      {/* Header with user info */}
      <View style={styles.headerContainer}>
        <View style={styles.profileHeader}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || user.username}</Text>
            <Text style={styles.userUsername}>@{user.username}</Text>
          </View>
        </View>

        {/* Bio if available */}
        {user.bio && (
          <Text style={styles.userBio}>{user.bio}</Text>
        )}
        
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tracks.length}</Text>
            <Text style={styles.statLabel}>Tracciati</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Seguiti</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>
        
        {/* Follow button (only if not viewing own profile) */}
        {!isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing ? styles.unfollowButton : styles.followButton
            ]}
            onPress={handleFollowToggle}
            disabled={isLoadingAction}
          >
            {isLoadingAction ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.followButtonText}>
                {isFollowing ? 'Non seguire più' : 'Segui'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Public tracks */}
      <Text style={styles.sectionTitle}>Tracciati pubblici</Text>
      
      {isRefreshing ? (
        <ActivityIndicator style={styles.refreshLoader} color="#007AFF" />
      ) : tracks.length === 0 ? (
        <View style={styles.emptyTracksContainer}>
          <Ionicons name="map-outline" size={50} color="#999" />
          <Text style={styles.emptyTracksText}>Nessun tracciato pubblico</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          renderItem={({ item }) => <TrackCard track={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.tracksContainer}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#666',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userUsername: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  userBio: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  unfollowButton: {
    backgroundColor: '#FF3B30',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  tracksContainer: {
    padding: 16,
  },
  emptyTracksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTracksText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  refreshLoader: {
    padding: 20,
  },
});

export default PublicProfileScreen; 