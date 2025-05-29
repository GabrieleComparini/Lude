import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getGlobalFeed } from '../../../api/services/feedService';
import TrackCard from '../../../components/TrackCard';

const GlobalFeedScreen = () => {
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'recent', 'comments'

  const fetchFeeds = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setCurrentPage(1);
        setError(null);
      }

      const page = refresh ? 1 : currentPage;

      const feedData = await getGlobalFeed({ page, limit: 10, sortBy });
      
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
      console.error('Error fetching global feed:', err);
      setError('Si è verificato un errore nel caricamento dei feed. Riprova più tardi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [currentPage, sortBy]);

  // Initial load
  useEffect(() => {
    fetchFeeds();
  }, [sortBy]);

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
  
  const handleChangeSortBy = (newSortBy) => {
    if (sortBy !== newSortBy) {
      setSortBy(newSortBy);
      setCurrentPage(1);
      setFeeds([]);
      setIsLoading(true);
    }
  };

  const renderSortOptions = () => (
    <View style={styles.sortOptionsContainer}>
      <Pressable
        style={[styles.sortOption, sortBy === 'popular' && styles.activeSortOption]}
        onPress={() => handleChangeSortBy('popular')}
      >
        <Text style={[styles.sortOptionText, sortBy === 'popular' && styles.activeSortOptionText]}>
          Popolari
        </Text>
      </Pressable>
      <Pressable
        style={[styles.sortOption, sortBy === 'recent' && styles.activeSortOption]}
        onPress={() => handleChangeSortBy('recent')}
      >
        <Text style={[styles.sortOptionText, sortBy === 'recent' && styles.activeSortOptionText]}>
          Recenti
        </Text>
      </Pressable>
      <Pressable
        style={[styles.sortOption, sortBy === 'comments' && styles.activeSortOption]}
        onPress={() => handleChangeSortBy('comments')}
      >
        <Text style={[styles.sortOptionText, sortBy === 'comments' && styles.activeSortOptionText]}>
          Commenti
        </Text>
      </Pressable>
    </View>
  );

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
        <Ionicons name="compass-outline" size={60} color="#999" />
        <Text style={styles.emptyText}>Non ci sono Feed da Visualizzare</Text>
        <Text style={styles.secondaryText}>Nessun tracciato pubblico disponibile al momento.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderSortOptions()}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  },
  listContainer: {
    padding: 10,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeSortOption: {
    backgroundColor: '#e0f2fe',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeSortOptionText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default GlobalFeedScreen; 