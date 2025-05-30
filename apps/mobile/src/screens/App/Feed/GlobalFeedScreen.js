import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getGlobalFeed } from '../../../api/services/feedService';
import TrackCard from '../../../components/TrackCard';
import { theme } from '../../../styles/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const GlobalFeedScreen = () => {
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'recent', 'comments'
  
  // Animation value for tab selection
  const [tabIndicatorPosition] = useState(new Animated.Value(0));

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
      setError('Something went wrong. Please try again later.');
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
      
      // Animate tab indicator
      const positions = { popular: 0, recent: 1, comments: 2 };
      Animated.spring(tabIndicatorPosition, {
        toValue: positions[newSortBy],
        tension: 300,
        friction: 20,
        useNativeDriver: true
      }).start();
    }
  };

  const BlurComponent = Platform.OS === 'ios' ? BlurView : View;
  const blurProps = Platform.OS === 'ios' ? { intensity: 30, tint: 'dark' } : {};

  const renderSortOptions = () => {
    const tabWidth = 100; // approximate tab width
    
    return (
      <View style={styles.sortOptionsWrapper}>
        <BlurComponent {...blurProps} style={styles.sortOptionsContainer}>
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => handleChangeSortBy('popular')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="flame" 
              size={16} 
              color={sortBy === 'popular' ? theme.colors.primary : theme.colors.textSecondary} 
              style={styles.sortOptionIcon}
            />
            <Text style={[styles.sortOptionText, sortBy === 'popular' && styles.activeSortOptionText]}>
              Popular
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => handleChangeSortBy('recent')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="time" 
              size={16} 
              color={sortBy === 'recent' ? theme.colors.primary : theme.colors.textSecondary} 
              style={styles.sortOptionIcon}
            />
            <Text style={[styles.sortOptionText, sortBy === 'recent' && styles.activeSortOptionText]}>
              Recent
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => handleChangeSortBy('comments')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chatbubble" 
              size={16} 
              color={sortBy === 'comments' ? theme.colors.primary : theme.colors.textSecondary} 
              style={styles.sortOptionIcon}
            />
            <Text style={[styles.sortOptionText, sortBy === 'comments' && styles.activeSortOptionText]}>
              Discussed
            </Text>
          </TouchableOpacity>
          
          {/* Animated indicator */}
          <Animated.View 
            style={[
              styles.sortIndicator,
              {
                transform: [{ 
                  translateX: tabIndicatorPosition.interpolate({
                    inputRange: [0, 1, 2], 
                    outputRange: [0, tabWidth, tabWidth * 2]
                  })
                }],
              }
            ]}
          />
        </BlurComponent>
      </View>
    );
  };

  if (isLoading && !isRefreshing && !isLoadingMore) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && feeds.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color={theme.colors.error} style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLoading && feeds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {renderSortOptions()}
        <View style={styles.emptyContent}>
          <Ionicons name="compass-outline" size={80} color={theme.colors.primary} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No Tracks Available</Text>
          <Text style={styles.secondaryText}>Be the first to share a track in this category!</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
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
    backgroundColor: theme.colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: theme.colors.background,
  },
  errorIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 17,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.9,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    color: theme.colors.text,
  },
  secondaryText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 40,
    lineHeight: 22,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 30,
  },
  refreshButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sortOptionsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    zIndex: 10,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'android' ? theme.colors.surface + 'CC' : undefined,
    position: 'relative',
    height: 46,
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    zIndex: 1,
  },
  sortOptionIcon: {
    marginRight: 6,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeSortOptionText: {
    color: theme.colors.primary,
  },
  sortIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '33.33%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 1.5,
    zIndex: 0,
  },
});

export default GlobalFeedScreen; 