import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getFollowingList, getFollowersList, followUser, unfollowUser } from '../../api/services/userService'; // Need these API functions
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

// Component for rendering each user in the list
const UserListItem = ({ user, currentUserId, onFollowToggle }) => {
  const navigation = useNavigation();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing); // Assuming API provides this
  const [loadingFollow, setLoadingFollow] = useState(false);

  const handleFollowToggle = async () => {
      if (loadingFollow) return;
      setLoadingFollow(true);
      try {
          if (isFollowing) {
              await unfollowUser(user.username);
              setIsFollowing(false);
          } else {
              await followUser(user.username);
              setIsFollowing(true);
          }
          onFollowToggle(user._id, !isFollowing); // Notify parent list if needed
      } catch (error) {
          console.error("Error toggling follow:", error);
          Alert.alert("Errore", "Impossibile aggiornare lo stato follow.");
          // Optionally revert UI state
          // setIsFollowing(!isFollowing);
      } finally {
          setLoadingFollow(false);
      }
  };

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
        source={user.profileImage ? { uri: user.profileImage } : require('../../assets/images/default_profile.png')}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name || user.username}</Text>
        <Text style={styles.userUsername}>@{user.username}</Text>
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
  const { username } = route.params; // Username of the profile being viewed
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add pagination state if needed: page, setPage, hasMore, setHasMore

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (listType === 'following') {
        response = await getFollowingList(username); // Fetch users the profile user is following
      } else { // listType === 'followers'
        response = await getFollowersList(username); // Fetch users following the profile user
      }
      // Assuming the API returns an array of users directly, or nested like { users: [...] }
      // Adjust according to your actual API response structure
      const fetchedUsers = response.users || response;
      // Optionally enrich with 'isFollowing' status relative to the *current* logged-in user
      // This might require another API call or backend logic modification
      setUsers(fetchedUsers || []);
    } catch (err) {
      console.error(`Error fetching ${listType}:`, err);
      setError(`Impossibile caricare la lista ${listType === 'following' ? 'following' : 'followers'}.`);
    } finally {
      setLoading(false);
    }
  }, [username, listType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    return <Text style={styles.errorText}>{error}</Text>;
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
      keyExtractor={(item) => item._id.toString()}
      style={styles.list}
      contentContainerStyle={users.length === 0 ? styles.emptyListContainer : {}}
      ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Nessun utente trovato.</Text>
      )}
      // Add onEndReached for pagination if implemented
    />
  );
};

// Main Connections Screen using Top Tabs
const ConnectionsScreen = ({ route }) => {
  const { username, initialTab } = route.params; // Get target username and optionally which tab to open first

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
  errorText: {
    textAlign: 'center',
    marginTop: 30,
    color: theme.colors.error,
    fontSize: 16,
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