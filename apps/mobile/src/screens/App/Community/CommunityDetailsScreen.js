import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../../styles/theme';
import { API_URL } from '../../../config/apiConfig';
import { useAuth } from '../../../context/authContext';
import PostCard from '../../../components/community/PostCard';

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 75;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const CommunityDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { communityId } = route.params;
  
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch community details
  const fetchCommunityDetails = async () => {
    try {
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const response = await axios.get(`${API_URL}/communities/${communityId}`, { headers });
      setCommunity(response.data);
      
      // Check if user is a member
      if (user?._id) {
        const userIsMember = response.data.members.some(
          (memberId) => memberId === user._id
        );
        setIsMember(userIsMember);
        
        // Check if user has a pending request
        const hasPendingRequest = response.data.pendingRequests?.some(
          (request) => request.userId === user._id
        );
        setIsPendingRequest(hasPendingRequest);
      }
    } catch (error) {
      console.error('Error fetching community details:', error);
    }
  };

  // Fetch community posts
  const fetchCommunityPosts = async (page = 1, refresh = false) => {
    if (refresh) {
      setPostsPage(1);
      setPosts([]);
      setHasMorePosts(true);
    }
    
    if (!hasMorePosts && page > 1) return;
    
    try {
      setPostsLoading(true);
      const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
      const response = await axios.get(
        `${API_URL}/communities/${communityId}/posts?page=${page}&limit=10`,
        { headers }
      );
      
      const newPosts = response.data.posts;
      
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }
      
      // Check if we have more posts to load
      setHasMorePosts(newPosts.length > 0 && response.data.pagination.pages > page);
      setPostsPage(page);
    } catch (error) {
      console.error('Error fetching community posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCommunityDetails();
      await fetchCommunityPosts(1);
      setLoading(false);
    };
    
    loadData();
  }, [communityId]);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCommunityDetails();
    if (activeTab === 'posts') {
      await fetchCommunityPosts(1, true);
    }
    setRefreshing(false);
  };

  // Load more posts when reaching end of list
  const handleLoadMore = () => {
    if (!postsLoading && hasMorePosts) {
      fetchCommunityPosts(postsPage + 1);
    }
  };

  // Join or leave community
  const handleJoinCommunity = async () => {
    try {
      await axios.post(
        `${API_URL}/communities/${communityId}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.token}`
          }
        }
      );
      
      // If community is public, refresh immediately to update UI
      // If private, mark as pending
      if (community?.isPublic) {
        fetchCommunityDetails();
      } else {
        setIsPendingRequest(true);
      }
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };
  
  const handleLeaveCommunity = async () => {
    try {
      await axios.post(
        `${API_URL}/communities/${communityId}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.token}`
          }
        }
      );
      setIsMember(false);
      fetchCommunityDetails();
    } catch (error) {
      console.error('Error leaving community:', error);
    }
  };

  // Share community
  const handleShareCommunity = async () => {
    try {
      await Share.share({
        message: `Check out this community: ${community.name}`,
        // In a real app, include a dynamic link to the community
        url: `yourapp://community/${communityId}`
      });
    } catch (error) {
      console.error('Error sharing community:', error);
    }
  };

  // Create a new post
  const handleCreatePost = () => {
    navigation.navigate('CreateCommunityPost', { communityId });
  };

  // Navigate to members list
  const handleViewMembers = () => {
    navigation.navigate('CommunityMembers', { communityId });
  };

  // View post details
  const handleViewPost = (post) => {
    navigation.navigate('CommunityPostDetails', {
      communityId,
      postId: post._id
    });
  };

  // Wait for community data to load
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }

  // Render header with animation
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });
  
  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });
  
  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp',
  });
  
  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -8, -16],
    extrapolate: 'clamp',
  });
  
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Render the community's posts
  const renderPosts = () => {
    if (posts.length === 0 && !postsLoading) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="post-outline" size={70} color={theme.colors.gray} />
          <Text style={styles.emptyText}>No posts in this community yet</Text>
          {isMember && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePost}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create the First Post</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => handleViewPost(item)}
            communityId={communityId}
          />
        )}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          postsLoading && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingMoreText}>Loading more posts...</Text>
            </View>
          )
        }
      />
    );
  };

  // Render about section (community info)
  const renderAbout = () => (
    <ScrollView
      style={styles.aboutContainer}
      contentContainerStyle={styles.aboutContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.descriptionText}>
        {community?.description || 'No description provided.'}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
          <Text style={styles.statValue}>{community?.membersCount || 0}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="text-box-multiple" size={20} color={theme.colors.primary} />
          <Text style={styles.statValue}>{community?.postsCount || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons 
            name={community?.isPublic ? "earth" : "shield-lock"} 
            size={20} 
            color={theme.colors.primary} 
          />
          <Text style={styles.statLabel}>
            {community?.isPublic ? 'Public' : 'Private'}
          </Text>
        </View>
      </View>

      {community?.ownerId && (
        <View style={styles.ownerContainer}>
          <Text style={styles.sectionTitle}>Owner</Text>
          <TouchableOpacity style={styles.userItem}>
            <Image
              source={
                community.ownerId.profileImage
                  ? { uri: community.ownerId.profileImage }
                  : require('../../../assets/images/default-avatar.png')
              }
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{community.ownerId.name}</Text>
              <Text style={styles.userUsername}>@{community.ownerId.username}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {community?.rules && community.rules.length > 0 && (
        <View style={styles.rulesContainer}>
          <Text style={styles.sectionTitle}>Community Rules</Text>
          {community.rules.map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <Text style={styles.ruleNumber}>{index + 1}.</Text>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>{rule.title}</Text>
                {rule.description && <Text style={styles.ruleDescription}>{rule.description}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {community?.tags && community.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagList}>
            {community.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  // Get action button label based on membership status
  const getActionButtonLabel = () => {
    if (isMember) return 'Leave Community';
    if (isPendingRequest) return 'Request Pending';
    return community?.isPublic ? 'Join Community' : 'Request to Join';
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.Image
          source={
            community?.coverImage
              ? { uri: community.coverImage }
              : require('../../../assets/images/default-cover.png')
          }
          style={[
            styles.coverImage,
            {
              opacity: headerOpacity,
              transform: [{ translateY: imageTranslateY }]
            }
          ]}
        />
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareCommunity}
        >
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: headerOpacity,
              transform: [
                { scale: titleScale },
                { translateY: titleTranslateY }
              ]
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={
                community?.avatar
                  ? { uri: community.avatar }
                  : require('../../../assets/images/default-avatar.png')
              }
              style={styles.avatar}
            />
          </View>
          <Text style={styles.communityName}>{community?.name}</Text>
          {!community?.isPublic && (
            <View style={styles.privateTag}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
              <Text style={styles.privateTagText}>Private</Text>
            </View>
          )}
        </Animated.View>
        
        <Animated.View
          style={[
            styles.headerTitleContainer,
            { opacity: headerTitleOpacity }
          ]}
        >
          <Text style={styles.headerTitle}>{community?.name}</Text>
        </Animated.View>
      </Animated.View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.mainActionButton,
            isMember ? styles.leaveButton : styles.joinButton,
            isPendingRequest && styles.pendingButton
          ]}
          onPress={isMember ? handleLeaveCommunity : handleJoinCommunity}
          disabled={isPendingRequest}
        >
          <Text
            style={[
              styles.actionButtonText,
              isMember ? styles.leaveButtonText : styles.joinButtonText
            ]}
          >
            {getActionButtonLabel()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.membersButton}
          onPress={handleViewMembers}
        >
          <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        
        {isMember && (
          <TouchableOpacity
            style={styles.newPostButton}
            onPress={handleCreatePost}
          >
            <Feather name="edit" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="newspaper"
            size={20}
            color={activeTab === 'posts' ? theme.colors.primary : theme.colors.gray}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'posts' && styles.activeTabText
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={activeTab === 'about' ? theme.colors.primary : theme.colors.gray}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'about' && styles.activeTabText
            ]}
          >
            About
          </Text>
        </TouchableOpacity>
      </View>
      
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={activeTab === 'posts'}
      >
        {/* Spacer to push content below the header */}
        <View style={{ height: HEADER_MAX_HEIGHT + 80 }} />
        
        {/* Content based on active tab */}
        {activeTab === 'posts' ? renderPosts() : renderAbout()}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    overflow: 'hidden',
    zIndex: 10,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: HEADER_MAX_HEIGHT,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  shareButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  communityName: {
    marginLeft: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 10,
    marginLeft: 5,
  },
  privateTagText: {
    marginLeft: 3,
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT - 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 15,
    zIndex: 20,
  },
  mainActionButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    marginRight: 10,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
  },
  leaveButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  pendingButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontWeight: 'bold',
  },
  joinButtonText: {
    color: '#fff',
  },
  leaveButtonText: {
    color: theme.colors.danger,
  },
  membersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    marginRight: 10,
  },
  newPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  tabContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
    zIndex: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    marginLeft: 5,
    fontSize: 16,
    color: theme.colors.gray,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 17,
    color: theme.colors.gray,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
  },
  createButtonText: {
    marginLeft: 5,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: theme.colors.gray,
  },
  aboutContainer: {
    flex: 1,
    marginTop: 20,
  },
  aboutContent: {
    padding: 15,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 10,
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 2,
  },
  ownerContainer: {
    marginTop: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userUsername: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  rulesContainer: {
    marginTop: 20,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  ruleNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 10,
    width: 20,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  ruleDescription: {
    fontSize: 14,
    color: theme.colors.gray,
    lineHeight: 20,
  },
  tagsContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: theme.colors.primary,
  }
});

export default CommunityDetailsScreen; 