import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  Animated
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import POIMarker from '../../../components/poi/POIMarker';
import POICategoryFilter from '../../../components/poi/POICategoryFilter';
import poiService from '../../../api/services/poiService';

const { width, height } = Dimensions.get('window');
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Initialize MapBox
Mapbox.setAccessToken(MAPBOX_TOKEN);

const POIMapScreen = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const mapRef = useRef(null);
  const panelAnimation = useRef(new Animated.Value(0)).current;
  
  // Get user location and POIs on component mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        // Load POIs without user location
        fetchPOIs();
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      
      // Load POIs with user location
      fetchPOIs(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        10000 // 10km radius
      );
    })();
  }, []);

  // Fetch POIs from API
  const fetchPOIs = async (lat = null, lng = null, radius = 10000) => {
    try {
      setLoading(true);
      
      const params = { 
        limit: 50,
        category: selectedCategory 
      };
      
      // Add location parameters if available
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
        params.radius = radius;
      }
      
      const data = await poiService.getPOIs(params);
      setPois(data.data || []);
    } catch (error) {
      console.error('Error fetching POIs:', error);
      setErrorMsg('Failed to load POIs');
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    // Re-fetch POIs with the new category
    if (location) {
      fetchPOIs(location.latitude, location.longitude, 10000);
    } else {
      fetchPOIs();
    }
  };

  // Handle POI selection
  const handlePOISelect = (poi) => {
    setSelectedPOI(poi);
    
    // Animate to selected POI
    if (mapRef.current) {
      mapRef.current.flyTo([poi.location.coordinates[0], poi.location.coordinates[1]], 200);
    }
    
    // Show the detail panel
    Animated.timing(panelAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  // Close the detail panel
  const handleClosePanel = () => {
    Animated.timing(panelAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false
    }).start(() => setSelectedPOI(null));
  };

  // Navigate to POI detail screen
  const navigateToPOIDetail = () => {
    if (selectedPOI) {
      navigation.navigate('POIDetail', { id: selectedPOI._id });
    }
  };

  // Navigate to Add POI screen
  const navigateToAddPOI = () => {
    if (location) {
      navigation.navigate('AddPOI', {
        initialLocation: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });
    } else {
      navigation.navigate('AddPOI');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Mapbox component */}
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Dark}
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled={false} // Disable 3D view for performance
      >
        {/* Camera (map view center) */}
        {location && (
          <Mapbox.Camera
            zoomLevel={13}
            centerCoordinate={[location.longitude, location.latitude]}
            animationMode="flyTo"
            animationDuration={1000}
          />
        )}

        {/* User location indicator */}
        {location && (
          <Mapbox.PointAnnotation
            id="user-location"
            coordinate={[location.longitude, location.latitude]}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationMarkerInner} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* POI markers */}
        {pois.map(poi => (
          <POIMarker
            key={poi._id}
            poi={poi}
            onSelect={handlePOISelect}
          />
        ))}
      </Mapbox.MapView>

      {/* Category filter */}
      <View style={styles.filterContainer}>
        <POICategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          showAllOption={true}
          style={styles.filter}
        />
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}

      {/* Error message */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => fetchPOIs()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add POI button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={navigateToAddPOI}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* POI detail panel (animated) */}
      {selectedPOI && (
        <Animated.View
          style={[
            styles.detailPanel,
            {
              transform: [
                {
                  translateY: panelAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                  })
                }
              ]
            }
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClosePanel}
          >
            <Ionicons name="close" size={24} color="#555" />
          </TouchableOpacity>

          {/* POI details */}
          <View style={styles.detailContent}>
            <Text style={styles.poiTitle}>{selectedPOI.name}</Text>
            
            {selectedPOI.category && (
              <View style={styles.categoryTag}>
                <Ionicons 
                  name={selectedPOI.category.icon || 'location'} 
                  size={16} 
                  color={selectedPOI.category.color || '#555'} 
                />
                <Text style={styles.categoryText}>
                  {selectedPOI.category.name}
                </Text>
              </View>
            )}
            
            {selectedPOI.description && (
              <Text style={styles.poiDescription}>
                {selectedPOI.description.length > 100
                  ? selectedPOI.description.substring(0, 100) + '...'
                  : selectedPOI.description}
              </Text>
            )}

            {/* Rating display */}
            {selectedPOI.rating && selectedPOI.rating.count > 0 ? (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {selectedPOI.rating.average.toFixed(1)}
                </Text>
                <Text style={styles.ratingCount}>
                  ({selectedPOI.rating.count} reviews)
                </Text>
              </View>
            ) : (
              <Text style={styles.noRatingText}>No ratings yet</Text>
            )}

            {/* View details button */}
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={navigateToPOIDetail}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  filterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  filter: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  userLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3498db',
    borderWidth: 2,
    borderColor: '#fff',
  },
  detailPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    minHeight: 200,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    alignItems: 'center',
  },
  poiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  poiDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingCount: {
    marginLeft: 4,
    fontSize: 14,
    color: '#777',
  },
  noRatingText: {
    color: '#999',
    marginBottom: 20,
  },
  viewDetailsButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default POIMapScreen; 