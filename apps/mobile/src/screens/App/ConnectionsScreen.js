import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getFollowingList, getFollowersList, followUser, unfollowUser } from '../../api/services/userService'; // Need these API functions
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

// Component for rendering each user in the list
const UserListItem = ({ user, currentUserId, onFollowToggle }) => {
  const navigation = useNavigation();
  const { refreshUserProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing); // Assuming API provides this
  const [loadingFollow, setLoadingFollow] = useState(false);

  const handleFollowToggle = async () => {
      if (loadingFollow) return;
      setLoadingFollow(true);
      try {
          let response;
          if (isFollowing) {
              response = await unfollowUser(user.username || user._id);
              setIsFollowing(false);
          } else {
              response = await followUser(user.username || user._id);
              setIsFollowing(true);
          }
          
          // Notify parent list to update local UI
          onFollowToggle(user._id, !isFollowing);
          
          // Get latest follower/following counts by refreshing the user profile
          try {
              await refreshUserProfile();
              console.log('User profile refreshed after follow/unfollow action');
          } catch (refreshError) {
              console.error("Errore nell'aggiornare il profilo utente:", refreshError);
              // No need to show an error to the user for this operation
          }
      } catch (error) {
          console.error("Error toggling follow:", error);
          // Show friendly error message and don't change UI state
          Alert.alert(
              "Errore", 
              "Impossibile aggiornare lo stato follow. Verifica la connessione e riprova."
          );
          // Don't change the isFollowing state since the operation failed
      } finally {
          setLoadingFollow(false);
      }
  };

  // Keep isFollowing state in sync with props
  useEffect(() => {
    setIsFollowing(user.isFollowing);
  }, [user.isFollowing]);

  const navigateToProfile = () => {
    if (user._id === currentUserId) {
      navigation.navigate('ProfileTab', { screen: 'ProfileHome' });
    } else {
      navigation.push('PublicProfile', { username: user.username }); // Use push to allow stacking profiles
    }
  };

  return (
    <TouchableOpacity style={styles.userItemContainer} onPress={navigateToProfile}>
      <Image
        source={
          user.profileImage && user.profileImage !== '' 
            ? { uri: user.profileImage } 
            : require('../../assets/images/default_profile.png')
        }
        style={styles.userAvatar}
        defaultSource={require('../../assets/images/default_profile.png')}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name || user.username || 'Utente'}</Text>
        <Text style={styles.userUsername}>@{user.username || 'username'}</Text>
      </View>
      {user._id !== currentUserId && (
        <TouchableOpacity onPress={handleFollowToggle} style={[styles.followButton, isFollowing ? styles.unfollowButton : {}]} disabled={loadingFollow}>
            {loadingFollow ? (
                <ActivityIndicator size="small" color={isFollowing ? theme.colors.text : theme.colors.white} />
            ) : (
                <Text style={[styles.followButtonText, isFollowing ? styles.unfollowButtonText : {}]}>
                    {isFollowing ? 'Seguito' : 'Segui'}
                </Text>
            )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// Screen component for Following/Followers list
const ConnectionList = ({ listType }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { username } = route.params || {}; // Username of the profile being viewed
  const { user: currentUser, refreshUserProfile } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add pagination state if needed: page, setPage, hasMore, setHasMore

  const fetchData = useCallback(async () => {
    // Verifica che username sia definito
    if (!username) {
      setError('Nome utente non specificato');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let response;
      if (listType === 'following') {
        response = await getFollowingList(username); // Fetch users the profile user is following
      } else { // listType === 'followers'
        response = await getFollowersList(username); // Fetch users following the profile user
      }
      
      // Process response data, ensuring it's in the right format
      if (response) {
        let fetchedUsers = [];
        
        // Handle different response formats
        if (Array.isArray(response)) {
          fetchedUsers = response;
        } else if (response.users && Array.isArray(response.users)) {
          fetchedUsers = response.users;
        } else if (response.connections && Array.isArray(response.connections)) {
          fetchedUsers = response.connections;
        } else if (response.followers && Array.isArray(response.followers)) {
          fetchedUsers = response.followers;
        }
        
        // Ensure each user has the isFollowing property set
        if (currentUser && currentUser.connections) {
          fetchedUsers = fetchedUsers.map(user => ({
            ...user,
            isFollowing: currentUser.connections.some(id => 
              id === user._id || id === user.username
            )
          }));
        }
        
        setUsers(fetchedUsers);
        console.log(`Loaded ${fetchedUsers.length} ${listType}`);
      } else {
        // Handle empty response
        console.log(`Empty response for ${listType}`);
        setUsers([]);
      }
    } catch (err) {
      console.error(`Error fetching ${listType}:`, err);
      setError(`Impossibile caricare la lista ${listType === 'following' ? 'following' : 'followers'}.`);
      setUsers([]); // Imposta un array vuoto in caso di errore
    } finally {
      setLoading(false);
    }
  }, [username, listType, currentUser]);

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data when the component is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      return () => {}; // Cleanup function
    }, [fetchData])
  );

  // Handle follow state updates from child components if needed
  const handleFollowStateChange = (targetUserId, newFollowState) => {
      // Update the local state if necessary, e.g., to reflect immediate UI changes
      setUsers(currentUsers =>
          currentUsers.map(u =>
              u._id === targetUserId ? { ...u, isFollowing: newFollowState } : u
          )
      );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      renderItem={({ item }) => (
        <UserListItem
            user={item}
            currentUserId={currentUser?._id}
            onFollowToggle={handleFollowStateChange}
        />
      )}
      keyExtractor={(item, index) => {
        // Use a combination of ID and index to ensure uniqueness
        if (item._id) {
          return `user-${item._id}-${index}`;
        } else if (item.username) {
          return `user-${item.username}-${index}`;
        } else {
          return `user-index-${index}`;
        }
      }}
      style={styles.list}
      contentContainerStyle={users.length === 0 ? styles.emptyListContainer : {}}
      ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            {listType === 'following' ? 'Questo utente non segue nessuno.' : 'Questo utente non ha follower.'}
          </Text>
      )}
      // Add onEndReached for pagination if implemented
    />
  );
};

// Main Connections Screen using Top Tabs
const ConnectionsScreen = () => {
  const route = useRoute();
  const { username, initialTab } = route.params || {}; // Get target username and optionally which tab to open first
  const navigation = useNavigation();

  // Se username non è definito, mostra un errore e ritorna alla schermata precedente
  useEffect(() => {
    if (!username) {
      Alert.alert(
        "Errore",
        "Username non specificato. Impossibile visualizzare le connessioni.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  }, [username, navigation]);

  if (!username) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.errorText}>Caricamento in corso...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      initialRouteName={initialTab === 'followers' ? 'Followers' : 'Following'} // Set initial tab
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
        tabBarStyle: { backgroundColor: theme.colors.surface },
        tabBarLabelStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen name="Following">
        {(props) => <ConnectionList {...props} listType="following" />}
      </Tab.Screen>
      <Tab.Screen name="Followers">
        {(props) => <ConnectionList {...props} listType="followers" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loader: {
    marginTop: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 15,
    color: theme.colors.error,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 50,
    textAlign: 'center'
  },
  userItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background, // Ensure items have background
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: theme.colors.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userUsername: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  followButton: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  unfollowButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unfollowButtonText: {
    color: theme.colors.text,
  },
});

export default ConnectionsScreen; 