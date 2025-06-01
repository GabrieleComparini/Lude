import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = (width - 60) / 2; // For 2 columns

const PostCard = ({ post, onPress, communityId }) => {
  // Format the post date for display
  const formatPostDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy • h:mm a");
  };

  // Render the post content based on post type
  const renderContent = () => {
    switch (post.type) {
      case 'text':
        return (
          <Text style={styles.postText} numberOfLines={5}>
            {post.content.text}
          </Text>
        );
      
      case 'image':
        return (
          <View style={styles.imagesContainer}>
            <FlatList
              data={post.content.images || []}
              keyExtractor={(item, index) => `image-${index}`}
              numColumns={post.content.images?.length === 1 ? 1 : 2}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[
                    styles.postImage,
                    post.content.images?.length === 1 && styles.singleImage
                  ]}
                />
              )}
            />
          </View>
        );
      
      case 'track':
        return (
          <View style={styles.trackContainer}>
            <MaterialCommunityIcons 
              name="map-marker-path" 
              size={32} 
              color={theme.colors.primary} 
            />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>Shared Track</Text>
              <Text style={styles.trackDescription}>
                View the shared track details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.gray} />
          </View>
        );
      
      case 'route':
        return (
          <View style={styles.trackContainer}>
            <MaterialCommunityIcons 
              name="routes" 
              size={32} 
              color={theme.colors.primary} 
            />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>Shared Route</Text>
              <Text style={styles.trackDescription}>
                View the shared route details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.gray} />
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={
            post.userProfileImage
              ? { uri: post.userProfileImage }
              : require('../../assets/images/default_profile.png')
          }
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>
            {post.username}
            {post.isPinned && (
              <View style={styles.pinnedContainer}>
                <Ionicons name="pin" size={12} color={theme.colors.primary} />
                <Text style={styles.pinnedText}> Pinned</Text>
              </View>
            )}
          </Text>
          <Text style={styles.timestamp}>{formatPostDate(post.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-horizontal" size={20} color={theme.colors.gray} />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="heart-outline" size={20} color={theme.colors.gray} />
          <Text style={styles.footerButtonText}>{post.likesCount || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.gray} />
          <Text style={styles.footerButtonText}>{post.commentsCount || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="share-social-outline" size={20} color={theme.colors.gray} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  username: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 2,
  },
  moreButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  pinnedText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  contentContainer: {
    padding: 12,
    paddingTop: 0,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  postImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH,
    margin: 5,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  singleImage: {
    width: width - 54,
    height: 200,
  },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginTop: 8,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  trackDescription: {
    fontSize: 13,
    color: theme.colors.gray,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 8,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  footerButtonText: {
    fontSize: 14,
    color: theme.colors.gray,
    marginLeft: 5,
  },
});

export default PostCard; 