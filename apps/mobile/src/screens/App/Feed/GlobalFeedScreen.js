import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import TrackCard from '../../../components/TrackCard';

// Placeholder data for global feed
const DUMMY_GLOBAL_FEEDS = [
  { 
    id: '1', 
    user: { id: 'u5', username: 'speedster', name: 'Alex Speed' },
    track: { 
      id: 't5', 
      title: 'Mountain Pass', 
      createdAt: new Date().toISOString(),
      distance: 42.3,
      duration: 5400, // in seconds
      avgSpeed: 35.8,
      maxSpeed: 85.2,
      polyline: 'placeholder', 
    },
    likes: 253,
    comments: 47,
  },
  { 
    id: '2', 
    user: { id: 'u6', username: 'racer123', name: 'Tom Racer' },
    track: { 
      id: 't6', 
      title: 'Coastal Route', 
      createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      distance: 65.7,
      duration: 8100, // in seconds
      avgSpeed: 42.6,
      maxSpeed: 95.3,
      polyline: 'placeholder', 
    },
    likes: 189,
    comments: 32,
  },
  { 
    id: '3', 
    user: { id: 'u7', username: 'rider88', name: 'Sara Rider' },
    track: { 
      id: 't7', 
      title: 'Canyon Road', 
      createdAt: new Date(Date.now() - 129600000).toISOString(), // 36 hours ago
      distance: 38.2,
      duration: 4500, // in seconds
      avgSpeed: 38.4,
      maxSpeed: 78.9,
      polyline: 'placeholder', 
    },
    likes: 142,
    comments: 25,
  },
  { 
    id: '4', 
    user: { id: 'u8', username: 'moto_king', name: 'Mike King' },
    track: { 
      id: 't8', 
      title: 'Highway Sprint', 
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      distance: 53.1,
      duration: 3600, // in seconds
      avgSpeed: 56.7,
      maxSpeed: 110.5,
      polyline: 'placeholder', 
    },
    likes: 321,
    comments: 64,
  },
];

const GlobalFeedScreen = () => {
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate fetching feeds
  const fetchFeeds = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setFeeds(DUMMY_GLOBAL_FEEDS);
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setFeeds(DUMMY_GLOBAL_FEEDS);
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
});

export default GlobalFeedScreen; 