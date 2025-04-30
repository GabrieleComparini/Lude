import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import TrackCard from '../../../components/TrackCard';

// Placeholder data for friends' feed
const DUMMY_FRIEND_FEEDS = [
  { 
    id: '1', 
    user: { id: 'u1', username: 'user1', name: 'John Doe' },
    track: { 
      id: 't1', 
      title: 'Morning Ride', 
      createdAt: new Date().toISOString(),
      distance: 12.5,
      duration: 3600, // in seconds
      avgSpeed: 25.3,
      maxSpeed: 45.8,
      polyline: 'placeholder', 
    },
    likes: 15,
    comments: 5,
  },
  { 
    id: '2', 
    user: { id: 'u2', username: 'user2', name: 'Jane Smith' },
    track: { 
      id: 't2', 
      title: 'Mountain Route', 
      createdAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
      distance: 28.3,
      duration: 7200, // in seconds
      avgSpeed: 22.1,
      maxSpeed: 55.2,
      polyline: 'placeholder', 
    },
    likes: 32,
    comments: 12,
  },
  { 
    id: '3', 
    user: { id: 'u3', username: 'user3', name: 'Mike Johnson' },
    track: { 
      id: 't3', 
      title: 'City Tour', 
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      distance: 8.7,
      duration: 2400, // in seconds
      avgSpeed: 15.5,
      maxSpeed: 32.1,
      polyline: 'placeholder', 
    },
    likes: 8,
    comments: 2,
  },
];

const FriendsFeedScreen = () => {
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate fetching feeds
  const fetchFeeds = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setFeeds(DUMMY_FRIEND_FEEDS);
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setFeeds(DUMMY_FRIEND_FEEDS);
      setIsRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (feeds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessun feed disponibile</Text>
        <Text style={styles.secondaryText}>Segui più amici per vedere i loro tracciati qui.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={feeds}
      renderItem={({ item }) => <TrackCard feed={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#007AFF"
          colors={["#007AFF"]}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  listContainer: {
    padding: 12,
    backgroundColor: '#121212',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  secondaryText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  }
});

export default FriendsFeedScreen; 