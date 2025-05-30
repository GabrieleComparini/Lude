import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator, 
  Alert, 
  Platform,
  Animated,
  BlurView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { calculateDistance, formatTime, formatDistance, formatSpeed } from '../../utils/formatters';
import { theme } from '../../styles/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView as ExpoBlurView } from 'expo-blur';

// Create map style for dark mode
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

const MapScreen = () => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [initialRegion, setInitialRegion] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [locationSubscription, setLocationSubscription] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [distanceTravelled, setDistanceTravelled] = useState(0.0);
    const [currentSpeed, setCurrentSpeed] = useState(0.0);
    const [mapType, setMapType] = useState('standard');
    
    // Animation values
    const trackingButtonScale = useRef(new Animated.Value(1)).current;
    const statsOpacity = useRef(new Animated.Value(0)).current;

    const mapViewRef = useRef(null);
    const navigation = useNavigation();

    useEffect(() => {
        // Function to get permissions and initial location
        const setupLocation = async () => {
            setLoading(true);
            setErrorMsg(null);
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    Alert.alert('Permission Denied', 'Please grant location permission to use the map feature.');
                    setLoading(false);
                    return;
                }

                // Get initial location to center the map
                let location = await Location.getLastKnownPositionAsync();
                if (!location) {
                    console.log("No last known position, getting current position...");
                    location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                }

                if (!location) {
                     throw new Error("Could not get any location.");
                }

                const { latitude, longitude } = location.coords;
                setCurrentLocation({ latitude, longitude });
                setInitialRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
                setErrorMsg(null);
            } catch (error) {
                 console.error("Error getting location:", error);
                 setErrorMsg('Error fetching location. Please ensure location services are enabled.');
                 Alert.alert('Location Error', 'Could not fetch your location. Please ensure location services are enabled and try again.');
            } finally {
                setLoading(false);
            }
        };

        setupLocation();

        // Cleanup function: remove subscription if component unmounts
        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
                console.log("Location subscription removed on unmount.");
            }
        };
    }, []);

    useEffect(() => {
        let timerInterval = null;
        if (isTracking) {
            setElapsedTime(0);
            setDistanceTravelled(0.0);
            setCurrentSpeed(0.0);
            timerInterval = setInterval(() => {
                setElapsedTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        }

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                console.log("Elapsed time timer cleared.");
            }
        };
    }, [isTracking]);

    const startTracking = async () => {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Location permission is needed to start tracking.');
            return;
        }

        setIsTracking(true);
        setRouteCoordinates([]);

        console.log("Starting location tracking...");

        try {
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                    distanceInterval: 5,
                },
                (location) => {
                    const { latitude, longitude, speed, altitude } = location.coords;
                    const timestamp = location.timestamp;
                    // Ensure we never store negative speed values
                    const validSpeed = (speed !== undefined && speed >= 0) ? speed : 0;
                    const newPoint = { latitude, longitude, speed: validSpeed, altitude, timestamp };

                    setCurrentSpeed(validSpeed);

                    setRouteCoordinates(prevCoords => {
                        const updatedCoords = [...prevCoords, newPoint];

                        if (updatedCoords.length >= 2) {
                            const prevPoint = updatedCoords[updatedCoords.length - 2];
                            const distanceIncrement = calculateDistance(
                                prevPoint.latitude, prevPoint.longitude,
                                newPoint.latitude, newPoint.longitude
                            );
                            if (distanceIncrement > 0 && distanceIncrement < 1000) {
                                 setDistanceTravelled(prevDistance => prevDistance + distanceIncrement);
                            }
                        }

                        return updatedCoords;
                    });

                    if (mapViewRef.current) {
                        mapViewRef.current.animateToRegion({
                            latitude,
                            longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }, 500);
                    }
                }
            );
            setLocationSubscription(subscription);
            console.log("Location tracking started.");
        } catch (error) {
             console.error("Error starting location tracking:", error);
             Alert.alert("Tracking Error", "Could not start location tracking.");
             setIsTracking(false);
        }
    };

    const stopTracking = () => {
        if (locationSubscription) {
            locationSubscription.remove();
            setLocationSubscription(null);
            console.log("Location tracking stopped.");
        }
        setIsTracking(false);
        
        // Log more detailed coordinates info
        console.log(`Final Route Coordinates (${routeCoordinates.length} points):`);
        routeCoordinates.forEach((point, idx) => {
            console.log(`Point ${idx}: lat=${point.latitude}, lng=${point.longitude}, speed=${point.speed}, timestamp=${point.timestamp}`);
        });
        
        const finalDistance = distanceTravelled;
        const finalTime = elapsedTime;

        if (routeCoordinates.length > 1) {
             navigation.navigate('SaveTrack', {
                routeCoordinates: routeCoordinates,
                distance: finalDistance,
                duration: finalTime
             });
        } else {
             Alert.alert("Track Too Short", "Not enough data recorded for a track.");
             setElapsedTime(0);
             setDistanceTravelled(0.0);
             setCurrentSpeed(0.0);
        }
    };

    const toggleMapType = () => {
        setMapType(prevType => prevType === 'standard' ? 'satellite' : 'standard');
    };
    
    // Button press animation
    const animatePress = () => {
        Animated.sequence([
            Animated.timing(trackingButtonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(trackingButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };
    
    // Stats visibility animation when tracking starts/stops
    useEffect(() => {
        Animated.timing(statsOpacity, {
            toValue: isTracking ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isTracking]);
    
    const handleStartTracking = () => {
        animatePress();
        startTracking();
    };
    
    const handleStopTracking = () => {
        animatePress();
        stopTracking();
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading Map...</Text>
            </View>
        );
    }

    if (errorMsg && !initialRegion) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle" size={50} color={theme.colors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
        );
    }

    const BlurComponent = Platform.OS === 'ios' ? ExpoBlurView : View;
    const blurProps = Platform.OS === 'ios' 
        ? { intensity: 50, tint: 'dark' } 
        : {};

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {initialRegion ? (
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapViewRef}
                        style={styles.map}
                        initialRegion={initialRegion}
                        showsUserLocation={true}
                        customMapStyle={darkMapStyle}
                        mapType={mapType}
                        userInterfaceStyle="dark"
                        showsCompass={true}
                        showsScale={true}
                    >
                        {routeCoordinates.length > 0 && (
                            <Polyline
                                coordinates={routeCoordinates.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
                                strokeColor={theme.colors.primary}
                                strokeWidth={5}
                                strokeColors={['#007AFF', '#34C759']}
                                lineCap="round"
                                lineJoin="round"
                            />
                        )}
                    </MapView>
                    
                    {/* Map type selector */}
                    <TouchableOpacity 
                        style={styles.mapTypeButton} 
                        onPress={toggleMapType}
                        activeOpacity={0.8}
                    >
                        <BlurComponent {...blurProps} style={styles.blurBackground}>
                            <Ionicons 
                                name={mapType === 'standard' ? 'map' : 'earth'} 
                                size={20} 
                                color="white" 
                            />
                            <Text style={styles.mapTypeText}>
                                {mapType === 'standard' ? 'Satellite' : 'Standard'}
                            </Text>
                        </BlurComponent>
                    </TouchableOpacity>
                    
                    {/* Stats Panel */}
                    <Animated.View 
                        style={[
                            styles.statsPanel,
                            { opacity: statsOpacity }
                        ]}
                    >
                        <BlurComponent {...blurProps} style={styles.statsPanelBlur}>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                                    <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                                    <Text style={styles.statLabel}>Duration</Text>
                                </View>
                                
                                <View style={styles.statDivider} />
                                
                                <View style={styles.statItem}>
                                    <Ionicons name="speedometer-outline" size={18} color={theme.colors.primary} />
                                    <Text style={styles.statValue}>{formatSpeed(currentSpeed)}</Text>
                                    <Text style={styles.statLabel}>Speed (km/h)</Text>
                                </View>
                                
                                <View style={styles.statDivider} />
                                
                                <View style={styles.statItem}>
                                    <Ionicons name="map-outline" size={18} color={theme.colors.primary} />
                                    <Text style={styles.statValue}>{formatDistance(distanceTravelled)}</Text>
                                    <Text style={styles.statLabel}>Distance (km)</Text>
                                </View>
                            </View>
                        </BlurComponent>
                    </Animated.View>
                    
                    {/* Tracking Button */}
                    <Animated.View 
                        style={[
                            styles.trackingButtonContainer,
                            { transform: [{ scale: trackingButtonScale }] }
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                styles.trackingButton,
                                isTracking ? styles.stopButton : styles.startButton
                            ]}
                            onPress={isTracking ? handleStopTracking : handleStartTracking}
                            activeOpacity={0.9}
                        >
                            <BlurComponent {...blurProps} style={styles.trackingButtonBlur}>
                                <Ionicons 
                                    name={isTracking ? "stop" : "play"} 
                                    size={28} 
                                    color={isTracking ? theme.colors.error : theme.colors.success}
                                />
                                <Text style={[
                                    styles.trackingButtonText, 
                                    isTracking ? styles.stopButtonText : styles.startButtonText
                                ]}>
                                    {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                                </Text>
                            </BlurComponent>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            ) : (
                <View style={styles.centered}>
                    <Text style={{color: theme.colors.text}}>Waiting for map region...</Text>
                    {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: theme.colors.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.colors.text,
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: theme.colors.error,
        textAlign: 'center',
    },
    mapTypeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 16,
        zIndex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    blurBackground: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: Platform.OS === 'android' ? 'rgba(30, 30, 30, 0.75)' : 'transparent',
        borderRadius: 20,
    },
    mapTypeText: {
        color: 'white',
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    },
    // Stats Panel
    statsPanel: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 110 : 80,
        left: 16,
        right: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    statsPanelBlur: {
        padding: 16,
        backgroundColor: Platform.OS === 'android' ? 'rgba(30, 30, 30, 0.8)' : 'transparent',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginTop: 6,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    // Tracking Button
    trackingButtonContainer: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    trackingButton: {
        borderRadius: 28,
        overflow: 'hidden',
    },
    trackingButtonBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: Platform.OS === 'android' ? 'rgba(30, 30, 30, 0.9)' : 'transparent',
    },
    trackingButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    startButton: {
        borderWidth: Platform.OS === 'ios' ? 0 : 1,
        borderColor: theme.colors.success,
    },
    stopButton: {
        borderWidth: Platform.OS === 'ios' ? 0 : 1,
        borderColor: theme.colors.error,
    },
    startButtonText: {
        color: theme.colors.success,
    },
    stopButtonText: {
        color: theme.colors.error,
    },
});

export default MapScreen; 