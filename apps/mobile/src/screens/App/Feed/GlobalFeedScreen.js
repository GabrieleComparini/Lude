import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import TrackCard from '../../../components/TrackCard';
import { getGlobalFeed } from '../../../api/services/feedService';
import { useFocusEffect } from '@react-navigation/native';

const GlobalFeedScreen = () => {
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch feed data from API
  const fetchFeeds = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setPage(1);
      } else if (!refresh && !hasMoreData) {
        return;
      } else {
        setIsLoading(true);
      }
      
      setError(null);
      
      const currentPage = refresh ? 1 : page;
      const response = await getGlobalFeed({ page: currentPage, limit: 10, sortBy: 'popular' });
      
      if (response && Array.isArray(response.data)) {
        if (refresh) {
          setFeeds(response.data);
        } else {
          setFeeds(prevFeeds => [...prevFeeds, ...response.data]);
        }
        
        // Check if we have more data to load
        setHasMoreData(response.data.length === 10); // Assuming backend returns 10 items per page
        
        if (!refresh) {
          setPage(currentPage + 1);
        }
      } else {
        setError('Formato dati non valido');
      }
    } catch (err) {
      console.error('Error fetching global feed:', err);
      setError('Impossibile caricare i feed. Riprova più tardi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [page, hasMoreData]);

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
      </View>
    );
  }

  if (!isLoading && feeds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessun feed disponibile</Text>
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
    backgroundColor: '#121212',
  },
  listContainer: {
    padding: 12,
    backgroundColor: '#121212',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
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
  },
});

export default GlobalFeedScreen; 