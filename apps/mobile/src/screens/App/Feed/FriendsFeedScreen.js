import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getFriendsFeed } from '../../../api/services/feedService';
import TrackCard from '../../../components/TrackCard';
import { useNavigation } from '@react-navigation/native';

const FriendsFeedScreen = () => {
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  const navigation = useNavigation();

  const fetchFeeds = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setCurrentPage(1);
        setError(null);
      }

      const page = refresh ? 1 : currentPage;

      const feedData = await getFriendsFeed({ page, limit: 10 });
      
      if (refresh) {
        setFeeds(feedData.tracks || []);
      } else {
        setFeeds(prev => [...prev, ...(feedData.tracks || [])]);
      }
      
      setHasMoreData(feedData.currentPage < feedData.totalPages);
      
      if (!refresh) {
        setCurrentPage(prevPage => prevPage + 1);
      }
    } catch (err) {
      console.error('Error fetching friends feed:', err);
      setError('Si è verificato un errore nel caricamento dei feed. Riprova più tardi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [currentPage]);

  // Initial load
  useEffect(() => {
    fetchFeeds();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchFeeds(true);
  }, [fetchFeeds]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isRefreshing && !isLoadingMore && hasMoreData) {
      setIsLoadingMore(true);
      fetchFeeds();
    }
  }, [fetchFeeds, isLoading, isRefreshing, isLoadingMore, hasMoreData]);

  // Reload data when the screen gets focus
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh])
  );

  const handleSearchFriends = () => {
    navigation.navigate('SearchScreen');
  };

  if (isLoading && !isRefreshing && !isLoadingMore) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error && feeds.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLoading && feeds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people" size={60} color="#999" />
        <Text style={styles.emptyText}>Non ci sono Feed da Visualizzare</Text>
        <Text style={styles.secondaryText}>Segui più amici per vedere i loro tracciati qui.</Text>
        <TouchableOpacity 
          style={styles.findFriendsButton} 
          onPress={handleSearchFriends}
        >
          <Text style={styles.findFriendsText}>Trova Amici</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={feeds}
      renderItem={({ item }) => <TrackCard track={item} />}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#007AFF"
          colors={["#007AFF"]}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  secondaryText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  findFriendsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  findFriendsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 10,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  }
});

export default FriendsFeedScreen; 