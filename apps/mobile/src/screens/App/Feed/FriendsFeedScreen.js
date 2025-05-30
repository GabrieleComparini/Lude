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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getFriendsFeed } from '../../../api/services/feedService';
import TrackCard from '../../../components/TrackCard';
import { theme } from '../../../styles/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const FriendsFeedScreen = () => {
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  
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
      
      // Animate the content in
      if (feeds.length === 0 && (feedData.tracks || []).length > 0) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          })
        ]).start();
      }
      
    } catch (err) {
      console.error('Error fetching friends feed:', err);
      setError('Unable to load feed. Please try again later.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [currentPage, fadeAnim, scaleAnim, feeds.length]);

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

  const BlurComponent = Platform.OS === 'ios' ? BlurView : View;
  const blurProps = Platform.OS === 'ios' ? { intensity: 30, tint: 'dark' } : {};

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
        <Ionicons name="warning" size={70} color={theme.colors.error} style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isLoading && feeds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={[theme.colors.primary + '30', 'transparent']}
          style={styles.emptyGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
        />
        
        <Ionicons name="people" size={80} color={theme.colors.primary} style={styles.emptyIcon} />
        <Text style={styles.emptyText}>No Friend Activity</Text>
        <Text style={styles.secondaryText}>Follow friends to see their tracks here.</Text>
        
        <View style={styles.emptyActionButtons}>
          <TouchableOpacity 
            style={styles.findFriendsButton} 
            onPress={handleSearchFriends}
            activeOpacity={0.8}
          >
            <BlurComponent {...blurProps} style={styles.buttonBlur}>
              <Ionicons name="search" size={20} color={theme.colors.primary} style={styles.buttonIcon} />
              <Text style={styles.findFriendsText}>Find Friends</Text>
            </BlurComponent>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <BlurComponent {...blurProps} style={styles.buttonBlur}>
              <Ionicons name="refresh" size={20} color={theme.colors.text} style={styles.buttonIcon} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </BlurComponent>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
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
    </Animated.View>
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
    marginBottom: 20,
    opacity: 0.8,
  },
  errorText: {
    fontSize: 17,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    maxWidth: '80%',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: theme.colors.background,
  },
  emptyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.9,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  secondaryText: {
    fontSize: 17,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 36,
    maxWidth: '80%',
    lineHeight: 24,
  },
  emptyActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  findFriendsButton: {
    flex: 1,
    maxWidth: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: Platform.OS === 'android' ? theme.colors.primary + '15' : undefined,
  },
  buttonIcon: {
    marginRight: 8,
  },
  findFriendsText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    flex: 1,
    maxWidth: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  }
});

export default FriendsFeedScreen; 