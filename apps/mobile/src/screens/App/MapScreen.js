import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { calculateDistance, formatTime, formatDistance, formatSpeed } from '../../utils/formatters';

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
                    const { latitude, longitude, speed, altitude, timestamp } = location.coords;
                    const newPoint = { latitude, longitude, speed, altitude, timestamp };

                    setCurrentSpeed(speed && speed > 0 ? speed : 0);

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
        console.log("Final Route Coordinates:", routeCoordinates);
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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text>Loading Map...</Text>
            </View>
        );
    }

    if (errorMsg && !initialRegion) {
         return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            {initialRegion ? (
                 <MapView
                    ref={mapViewRef}
                    style={styles.map}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                >
                    {routeCoordinates.length > 0 && (
                        <Polyline
                            coordinates={routeCoordinates.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
                            strokeColor="#007AFF"
                            strokeWidth={4}
                        />
                    )}
                </MapView>
            ) : (
                <View style={styles.centered}>
                     <Text>Waiting for map region...</Text>
                     {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
                </View>
            )}


            <View style={styles.controlsOverlay}>
                {isTracking ? (
                     <View style={styles.statsContainer}>
                         <View style={styles.statBox}>
                            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                            <Text style={styles.statLabel}>Time</Text>
                         </View>
                         <View style={styles.statBox}>
                            <Text style={styles.statValue}>{formatDistance(distanceTravelled)}</Text>
                            <Text style={styles.statLabel}>Km</Text>
                         </View>
                          <View style={styles.statBox}>
                            <Text style={styles.statValue}>{formatSpeed(currentSpeed)}</Text>
                            <Text style={styles.statLabel}>Km/h</Text>
                         </View>
                     </View>
                ) : (
                     <Text style={styles.startMessage}>Press Start to begin tracking</Text>
                )}

                {!isTracking ? (
                    <Button title="Start Tracking" onPress={startTracking} disabled={loading || !initialRegion} />
                ) : (
                    <Button title="Stop Tracking" onPress={stopTracking} color="red" />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
     errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    controlsOverlay: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        flex: 1,
        marginRight: 15,
    },
    statBox: {
        alignItems: 'center',
        marginHorizontal: 10,
        minWidth: 50,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
    },
    statLabel: {
        fontSize: 12,
        color: '#444',
    },
     startMessage: {
        flex: 1,
        fontSize: 16,
        color: '#555',
        fontStyle: 'italic',
        marginRight: 15,
        textAlign: 'left',
    }
});

export default MapScreen; 