import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  Alert,
  Linking
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import POIReviewForm from '../../../components/poi/POIReviewForm';
import poiService from '../../../api/services/poiService';
import { useAuth } from '../../../context/AuthContext';

const { width } = Dimensions.get('window');

const POIDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { id } = route.params;
  const mapRef = useRef(null);
  
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewingImage, setViewingImage] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  // Fetch POI data and reviews on component mount
  useEffect(() => {
    fetchPOI();
    fetchReviews();
    getUserLocation();
  }, [id]);
  
  // Get user location for directions feature
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };
  
  // Fetch POI data
  const fetchPOI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await poiService.getPOIById(id);
      setPoi(data);
    } catch (err) {
      console.error('Error fetching POI details:', err);
      setError('Failed to load POI details');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch reviews for this POI
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      
      const data = await poiService.getPOIReviews(id, {
        limit: 10,
        page: 1
      });
      
      setReviews(data.data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      // Don't set error state - reviews are not critical
    } finally {
      setReviewsLoading(false);
    }
  };
  
  // Open directions in maps app
  const openDirections = () => {
    if (!poi || !poi.location || !poi.location.coordinates) {
      Alert.alert('Error', 'Cannot get directions to this location');
      return;
    }
    
    const lat = poi.location.coordinates[1];
    const lng = poi.location.coordinates[0];
    const label = poi.name;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };
  
  // Toggle review form visibility
  const toggleReviewForm = () => {
    if (!user) {
      // Prompt user to login first
      Alert.alert(
        'Login Required',
        'You need to be logged in to write reviews',
        [
          { text: 'Cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    setShowReviewForm(!showReviewForm);
  };
  
  // Handle review submission
  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    // Refresh POI details and reviews
    fetchPOI();
    fetchReviews();
  };
  
  // Open image in full screen
  const openImage = (index) => {
    setCurrentImageIndex(index);
    setViewingImage(true);
  };
  
  // Format address if available
  const getFormattedAddress = () => {
    if (!poi || !poi.address) return null;
    
    const { street, city, state, country, postalCode } = poi.address;
    const addressParts = [street, city, state, postalCode, country].filter(Boolean);
    
    return addressParts.join(', ');
  };

  // Navigate to POI edit screen
  const navigateToEdit = () => {
    navigation.navigate('EditPOI', { poi });
  };

  // Mark a review as helpful
  const markReviewHelpful = async (reviewId) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to mark reviews as helpful',
        [
          { text: 'Cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    try {
      await poiService.markReviewHelpful(id, reviewId);
      fetchReviews(); // Refresh reviews
    } catch (err) {
      console.error('Error marking review as helpful:', err);
      Alert.alert('Error', 'Could not mark review as helpful');
    }
  };
  
  // Show loading indicator
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }
  
  // Show error message
  if (error || !poi) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'POI not found'}</Text>
        <TouchableOpacity onPress={fetchPOI}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Images carousel */}
        {poi.images && poi.images.length > 0 ? (
          <View style={styles.imageContainer}>
            <FlatList
              data={poi.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `image-${index}`}
              onMomentumScrollEnd={(e) => {
                setCurrentImageIndex(
                  Math.floor(e.nativeEvent.contentOffset.x / width)
                );
              }}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  onPress={() => openImage(index)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: item.url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
            
            {/* Image pagination dots */}
            {poi.images.length > 1 && (
              <View style={styles.paginationContainer}>
                {poi.images.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={[
                      styles.paginationDot,
                      currentImageIndex === index && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.noImageContainer]}>
            <Ionicons name="image-outline" size={60} color="#ddd" />
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        )}
        
        {/* POI Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.name}>{poi.name}</Text>
          
          {poi.category && (
            <View style={styles.categoryContainer}>
              <Ionicons 
                name={poi.category.icon || 'location'} 
                size={18} 
                color={poi.category.color || '#555'} 
              />
              <Text style={styles.categoryText}>{poi.category.name}</Text>
            </View>
          )}
          
          {/* Rating summary */}
          <View style={styles.ratingContainer}>
            {poi.rating && poi.rating.count > 0 ? (
              <View style={styles.ratingRow}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={`star-${star}`}
                      name={star <= Math.round(poi.rating.average) ? 'star' : 'star-outline'}
                      size={18}
                      color="#FFD700"
                      style={styles.star}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {poi.rating.average.toFixed(1)} ({poi.rating.count} {poi.rating.count === 1 ? 'review' : 'reviews'})
                </Text>
              </View>
            ) : (
              <Text style={styles.noRatingText}>No ratings yet</Text>
            )}
          </View>
          
          {/* Action buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={openDirections}>
              <Ionicons name="navigate" size={20} color="#3498db" />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={toggleReviewForm}>
              <Ionicons name="star" size={20} color="#3498db" />
              <Text style={styles.actionText}>Rate</Text>
            </TouchableOpacity>
            
            {user && poi.createdBy && user._id === poi.createdBy._id && (
              <TouchableOpacity style={styles.actionButton} onPress={navigateToEdit}>
                <Ionicons name="create" size={20} color="#3498db" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapWrapper}>
            <Mapbox.MapView
              ref={mapRef}
              style={styles.map}
              styleURL={Mapbox.StyleURL.Dark}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Mapbox.Camera
                zoomLevel={15}
                centerCoordinate={poi.location.coordinates}
                animationMode="none"
              />
              <Mapbox.PointAnnotation
                id="poi-location"
                coordinate={poi.location.coordinates}
              >
                <View style={styles.markerContainer}>
                  <Ionicons 
                    name={poi.category?.icon || 'location'} 
                    size={24} 
                    color={poi.category?.color || '#3498db'} 
                  />
                </View>
              </Mapbox.PointAnnotation>
            </Mapbox.MapView>
            <TouchableOpacity 
              style={styles.openFullMapButton}
              onPress={() => navigation.navigate('POIMap', { 
                initialCenter: poi.location.coordinates,
                poiId: poi._id
              })}
            >
              <Text style={styles.openFullMapText}>Open Full Map</Text>
            </TouchableOpacity>
          </View>
          
          {/* Address */}
          {getFormattedAddress() && (
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={18} color="#555" />
              <Text style={styles.addressText}>{getFormattedAddress()}</Text>
            </View>
          )}
          
          {/* Contact */}
          {poi.phoneNumber && (
            <TouchableOpacity 
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${poi.phoneNumber}`)}
            >
              <Ionicons name="call-outline" size={18} color="#555" />
              <Text style={styles.contactText}>{poi.phoneNumber}</Text>
            </TouchableOpacity>
          )}
          
          {poi.website && (
            <TouchableOpacity 
              style={styles.contactRow}
              onPress={() => Linking.openURL(poi.website)}
            >
              <Ionicons name="globe-outline" size={18} color="#555" />
              <Text style={styles.contactText}>{poi.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        {poi.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{poi.description}</Text>
          </View>
        )}
        
        {/* Reviews section */}
        <View style={styles.reviewsContainer}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity onPress={toggleReviewForm}>
              <Text style={styles.writeReviewText}>Write a review</Text>
            </TouchableOpacity>
          </View>
          
          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#3498db" style={styles.reviewsLoading} />
          ) : reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map(review => (
                <View key={review._id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUser}>
                      <Image 
                        source={{ 
                          uri: review.userId.profileImage || 'https://via.placeholder.com/40'
                        }} 
                        style={styles.reviewUserImage} 
                      />
                      <View>
                        <Text style={styles.reviewUserName}>{review.userId.name || review.userId.username}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                          key={`review-star-${review._id}-${star}`}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={14}
                          color="#FFD700"
                          style={styles.reviewStar}
                        />
                      ))}
                    </View>
                  </View>
                  
                  {review.visitDate && (
                    <Text style={styles.visitDate}>
                      Visited on {new Date(review.visitDate).toLocaleDateString()}
                    </Text>
                  )}
                  
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                  
                  {review.images && review.images.length > 0 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.reviewImagesScroll}
                    >
                      {review.images.map((image, index) => (
                        <TouchableOpacity 
                          key={`review-img-${index}`}
                          onPress={() => openImage(index)}
                        >
                          <Image 
                            source={{ uri: image.url }} 
                            style={styles.reviewImage} 
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  
                  {review.tags && review.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {review.tags.map(tag => (
                        <View key={`tag-${tag}`} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <View style={styles.reviewActions}>
                    <TouchableOpacity 
                      style={styles.helpfulButton}
                      onPress={() => markReviewHelpful(review._id)}
                    >
                      <Ionicons name="thumbs-up-outline" size={16} color="#555" />
                      <Text style={styles.helpfulText}>
                        Helpful {review.helpfulCount > 0 ? `(${review.helpfulCount})` : ''}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {/* View all reviews button */}
              {reviews.length >= 3 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('POIReviews', { poiId: id })}
                >
                  <Text style={styles.viewAllText}>View all reviews</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsText}>No reviews yet</Text>
              <TouchableOpacity onPress={toggleReviewForm}>
                <Text style={styles.beFirstText}>Be the first to review!</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Who added this POI */}
        {poi.createdBy && (
          <View style={styles.addedByContainer}>
            <Text style={styles.addedByText}>
              Added by {poi.createdBy.name || poi.createdBy.username}
            </Text>
            {poi.createdAt && (
              <Text style={styles.addedDateText}>
                on {new Date(poi.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Review form modal */}
      <Modal
        visible={showReviewForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <POIReviewForm
              poiId={id}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
            />
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Full image viewer modal */}
      <Modal
        visible={viewingImage}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewingImage(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setViewingImage(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          <FlatList
            data={poi.images}
            horizontal
            pagingEnabled
            initialScrollIndex={currentImageIndex}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index
            })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `fullscreen-image-${index}`}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          />
          
          <View style={styles.imageCaption}>
            <Text style={styles.imageCaptionText}>
              {poi.images[currentImageIndex]?.caption || ''}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15
  },
  retryText: {
    fontSize: 16,
    color: '#3498db',
    textDecorationLine: 'underline'
  },
  imageContainer: {
    width: width,
    height: 250,
    backgroundColor: '#f0f0f0'
  },
  image: {
    width,
    height: 250
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  noImageText: {
    marginTop: 10,
    color: '#999'
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center'
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4
  },
  paginationDotActive: {
    backgroundColor: '#fff'
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  categoryText: {
    marginLeft: 6,
    color: '#555',
    fontSize: 14
  },
  ratingContainer: {
    marginBottom: 16
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8
  },
  star: {
    marginRight: 2
  },
  ratingText: {
    color: '#555',
    fontSize: 14
  },
  noRatingText: {
    color: '#999',
    fontSize: 14
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#3498db'
  },
  mapContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  mapWrapper: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative'
  },
  map: {
    flex: 1
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  openFullMapButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  openFullMapText: {
    color: '#fff',
    fontSize: 12
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  addressText: {
    marginLeft: 8,
    color: '#555',
    flex: 1,
    flexWrap: 'wrap'
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  contactText: {
    marginLeft: 8,
    color: '#3498db'
  },
  descriptionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  description: {
    color: '#555',
    lineHeight: 22
  },
  reviewsContainer: {
    padding: 16
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  writeReviewText: {
    color: '#3498db',
    fontSize: 14
  },
  reviewsLoading: {
    marginVertical: 20
  },
  reviewsList: {
    marginBottom: 10
  },
  reviewItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reviewUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  reviewUserName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333'
  },
  reviewDate: {
    fontSize: 12,
    color: '#999'
  },
  reviewRating: {
    flexDirection: 'row'
  },
  reviewStar: {
    marginRight: 1
  },
  visitDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic'
  },
  reviewComment: {
    color: '#555',
    marginBottom: 10,
    lineHeight: 20
  },
  reviewImagesScroll: {
    flexGrow: 0,
    marginBottom: 10
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6
  },
  tagText: {
    fontSize: 12,
    color: '#666'
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  helpfulText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#555'
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 10
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 14
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 20
  },
  noReviewsText: {
    color: '#999',
    marginBottom: 8
  },
  beFirstText: {
    color: '#3498db'
  },
  addedByContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  addedByText: {
    color: '#999',
    fontSize: 12
  },
  addedDateText: {
    color: '#999',
    fontSize: 12
  },
  bottomPadding: {
    height: 30
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center'
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullscreenImage: {
    width,
    height: '80%'
  },
  imageCaption: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20
  },
  imageCaptionText: {
    color: '#fff',
    textAlign: 'center'
  }
});

export default POIDetailScreen; 