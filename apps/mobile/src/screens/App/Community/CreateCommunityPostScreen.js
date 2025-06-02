import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../../styles/theme';
import { useAuth } from '../../../context/AuthContext';
import communityService from '../../../api/services/communityService';

const CreateCommunityPostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { communityId } = route.params;
  
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postType, setPostType] = useState('text');
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [visibility, setVisibility] = useState('community-only');
  
  // Fetch community details
  useEffect(() => {
    const fetchCommunityDetails = async () => {
      try {
        setLoading(true);
        const data = await communityService.getCommunityById(communityId, user.token);
        setCommunity(data);
      } catch (error) {
        console.error('Error fetching community details:', error);
        Alert.alert('Error', 'Failed to load community details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityDetails();
  }, [communityId]);
  
  // Pick images from the device library
  const pickImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant permission to access your photos.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - selectedImages.length
    });
    
    if (!result.canceled) {
      // Limit to 10 images total
      const newImages = result.assets.map(asset => asset.uri);
      const combinedImages = [...selectedImages, ...newImages];
      
      if (combinedImages.length > 10) {
        Alert.alert('Limit Exceeded', 'You can select up to 10 images.');
        setSelectedImages(combinedImages.slice(0, 10));
      } else {
        setSelectedImages(combinedImages);
      }
    }
  };
  
  // Remove an image from the selection
  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };
  
  // Navigate to track selection screen
  const navigateToTrackSelection = () => {
    navigation.navigate('TrackSelection', {
      onSelect: (track) => {
        setSelectedTrack(track);
        setPostType('track');
      }
    });
  };
  
  // Navigate to route selection screen
  const navigateToRouteSelection = () => {
    navigation.navigate('RouteSelection', {
      onSelect: (route) => {
        setSelectedRoute(route);
        setPostType('route');
      }
    });
  };
  
  // Create the post
  const handleCreatePost = async () => {
    // Validate post data
    if (postType === 'text' && !postText.trim()) {
      Alert.alert('Error', 'Please enter some text for your post');
      return;
    }
    
    if (postType === 'image' && selectedImages.length === 0) {
      Alert.alert('Error', 'Please select at least one image');
      return;
    }
    
    if (postType === 'track' && !selectedTrack) {
      Alert.alert('Error', 'Please select a track');
      return;
    }
    
    if (postType === 'route' && !selectedRoute) {
      Alert.alert('Error', 'Please select a route');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare form data for API request
      const formData = new FormData();
      formData.append('type', postType);
      formData.append('visibility', visibility);
      
      // Add content based on post type
      if (postType === 'text') {
        formData.append('content[text]', postText);
      } else if (postType === 'image') {
        formData.append('content[text]', postText);
        
        // Add images
        selectedImages.forEach((uri, index) => {
          const filename = uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image';
          
          formData.append('images', {
            uri,
            name: filename,
            type
          });
        });
      } else if (postType === 'track') {
        formData.append('content[text]', postText);
        formData.append('content[trackId]', selectedTrack._id);
      } else if (postType === 'route') {
        formData.append('content[text]', postText);
        formData.append('content[routeId]', selectedRoute._id);
      }
      
      // Send request to API
      await communityService.createPost(communityId, formData, user.token);
      
      // Navigate back to the community screen
      navigation.navigate('CommunityDetails', { communityId });
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render content based on selected post type
  const renderPostTypeContent = () => {
    switch (postType) {
      case 'text':
        return null;
      
      case 'image':
        return (
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={styles.addImagesButton}
              onPress={pickImages}
              disabled={selectedImages.length >= 10}
            >
              <MaterialIcons name="add-photo-alternate" size={24} color={theme.colors.primary} />
              <Text style={styles.addImagesText}>
                {selectedImages.length === 0
                  ? 'Add Images'
                  : `Add More Images (${selectedImages.length}/10)`}
              </Text>
            </TouchableOpacity>
            
            {selectedImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesScrollView}
              >
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        );
      
      case 'track':
        return (
          <View style={styles.trackSection}>
            {selectedTrack ? (
              <View style={styles.selectedTrackContainer}>
                <View style={styles.trackInfo}>
                  <MaterialCommunityIcons name="map-marker-path" size={32} color={theme.colors.primary} />
                  <View style={styles.trackDetails}>
                    <Text style={styles.trackName}>{selectedTrack.name}</Text>
                    <Text style={styles.trackStats}>
                      {selectedTrack.distance.toFixed(2)} km • {selectedTrack.duration}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeTrackButton}
                  onPress={navigateToTrackSelection}
                >
                  <Text style={styles.changeTrackText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectTrackButton}
                onPress={navigateToTrackSelection}
              >
                <MaterialCommunityIcons name="map-marker-path" size={32} color={theme.colors.primary} />
                <Text style={styles.selectTrackText}>Select a Track</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      
      case 'route':
        return (
          <View style={styles.trackSection}>
            {selectedRoute ? (
              <View style={styles.selectedTrackContainer}>
                <View style={styles.trackInfo}>
                  <MaterialCommunityIcons name="routes" size={32} color={theme.colors.primary} />
                  <View style={styles.trackDetails}>
                    <Text style={styles.trackName}>{selectedRoute.name}</Text>
                    <Text style={styles.trackStats}>
                      {selectedRoute.distance.toFixed(2)} km • {selectedRoute.estimatedTime}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeTrackButton}
                  onPress={navigateToRouteSelection}
                >
                  <Text style={styles.changeTrackText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selectTrackButton}
                onPress={navigateToRouteSelection}
              >
                <MaterialCommunityIcons name="routes" size={32} color={theme.colors.primary} />
                <Text style={styles.selectTrackText}>Select a Route</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={[
              styles.postButton,
              submitting && styles.disabledButton
            ]}
            onPress={handleCreatePost}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Community Info */}
          {community && (
            <View style={styles.communityInfo}>
              <Image
                source={
                  community.avatar
                    ? { uri: community.avatar }
                    : require('../../../assets/images/default-avatar.png')
                }
                style={styles.communityAvatar}
              />
              <Text style={styles.communityName}>
                Posting in {community.name}
              </Text>
            </View>
          )}
          
          {/* Post Type Selector */}
          <View style={styles.postTypeSelector}>
            <TouchableOpacity
              style={[
                styles.postTypeButton,
                postType === 'text' && styles.activePostTypeButton
              ]}
              onPress={() => setPostType('text')}
            >
              <Ionicons
                name="text"
                size={24}
                color={postType === 'text' ? theme.colors.primary : theme.colors.gray}
              />
              <Text
                style={[
                  styles.postTypeText,
                  postType === 'text' && styles.activePostTypeText
                ]}
              >
                Text
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.postTypeButton,
                postType === 'image' && styles.activePostTypeButton
              ]}
              onPress={() => setPostType('image')}
            >
              <Ionicons
                name="images"
                size={24}
                color={postType === 'image' ? theme.colors.primary : theme.colors.gray}
              />
              <Text
                style={[
                  styles.postTypeText,
                  postType === 'image' && styles.activePostTypeText
                ]}
              >
                Image
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.postTypeButton,
                postType === 'track' && styles.activePostTypeButton
              ]}
              onPress={() => {
                if (selectedTrack) {
                  setPostType('track');
                } else {
                  navigateToTrackSelection();
                }
              }}
            >
              <MaterialCommunityIcons
                name="map-marker-path"
                size={24}
                color={postType === 'track' ? theme.colors.primary : theme.colors.gray}
              />
              <Text
                style={[
                  styles.postTypeText,
                  postType === 'track' && styles.activePostTypeText
                ]}
              >
                Track
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.postTypeButton,
                postType === 'route' && styles.activePostTypeButton
              ]}
              onPress={() => {
                if (selectedRoute) {
                  setPostType('route');
                } else {
                  navigateToRouteSelection();
                }
              }}
            >
              <MaterialCommunityIcons
                name="routes"
                size={24}
                color={postType === 'route' ? theme.colors.primary : theme.colors.gray}
              />
              <Text
                style={[
                  styles.postTypeText,
                  postType === 'route' && styles.activePostTypeText
                ]}
              >
                Route
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Post Content */}
          <TextInput
            style={styles.postInput}
            value={postText}
            onChangeText={setPostText}
            placeholder={
              postType === 'text'
                ? "What's on your mind?"
                : "Add a caption (optional)"
            }
            multiline
            textAlignVertical="top"
          />
          
          {/* Post Type Specific Content */}
          {renderPostTypeContent()}
          
          {/* Visibility Selector */}
          <View style={styles.visibilityContainer}>
            <Text style={styles.visibilityLabel}>Post Visibility:</Text>
            <View style={styles.visibilityOptions}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === 'community-only' && styles.activeVisibilityOption
                ]}
                onPress={() => setVisibility('community-only')}
              >
                <Ionicons
                  name="people"
                  size={18}
                  color={
                    visibility === 'community-only'
                      ? theme.colors.primary
                      : theme.colors.gray
                  }
                />
                <Text
                  style={[
                    styles.visibilityText,
                    visibility === 'community-only' && styles.activeVisibilityText
                  ]}
                >
                  Community Only
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === 'public' && styles.activeVisibilityOption
                ]}
                onPress={() => setVisibility('public')}
              >
                <Ionicons
                  name="globe"
                  size={18}
                  color={
                    visibility === 'public'
                      ? theme.colors.primary
                      : theme.colors.gray
                  }
                />
                <Text
                  style={[
                    styles.visibilityText,
                    visibility === 'public' && styles.activeVisibilityText
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  postButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: theme.colors.lightGray,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  communityAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  communityName: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  postTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
  },
  postTypeButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activePostTypeButton: {
    backgroundColor: theme.colors.lightPrimary,
  },
  postTypeText: {
    fontSize: 12,
    marginTop: 4,
    color: theme.colors.gray,
  },
  activePostTypeText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  postInput: {
    minHeight: 120,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  addImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    marginBottom: 12,
  },
  addImagesText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  imagesScrollView: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackSection: {
    marginBottom: 16,
  },
  selectTrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
  },
  selectTrackText: {
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  selectedTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackDetails: {
    marginLeft: 12,
  },
  trackName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  trackStats: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 2,
  },
  changeTrackButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  changeTrackText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  visibilityContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.text,
  },
  visibilityOptions: {
    flexDirection: 'row',
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    marginRight: 12,
  },
  activeVisibilityOption: {
    backgroundColor: theme.colors.lightPrimary,
  },
  visibilityText: {
    marginLeft: 6,
    color: theme.colors.gray,
  },
  activeVisibilityText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default CreateCommunityPostScreen; 