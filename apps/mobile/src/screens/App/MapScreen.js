import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import MapboxGL from '@rnmapbox/maps';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { useIsFocused } from '@react-navigation/native';

// Retrieve Mapbox Access Token from environment variables
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Configure Mapbox SDK (needs to be done once)
if (MAPBOX_ACCESS_TOKEN) {
  MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
} else {
  console.error("Mapbox Access Token is missing! Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.");
  // Optionally, you could throw an error or display a message to the user
}

const MapScreen = () => {
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [distance, setDistance] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);

  const locationSubscription = useRef(null);
  const mapRef = useRef(null);
  const cameraRef = useRef(null);

  // --- Permission Request ---
  useEffect(() => {
    (async () => {
      console.log("Requesting location permissions...");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied. Tracking requires location access.');
        setPermissionStatus(status);
        Alert.alert(
          "Permission Required",
          "Location permission is needed to track your activity. Please enable it in your device settings.",
          [{ text: "OK" }]
        );
        return;
      }
      console.log("Foreground permission granted.");
      setPermissionStatus(status);

      // Optionally request background permission if needed later
      // let backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      // if (backgroundStatus.status !== 'granted') {
      //     console.warn('Background location permission denied.');
      // }

      // Get initial location to center map
      try {
        let initialLocation = await Location.getCurrentPositionAsync({});
         console.log("Initial location fetched:", initialLocation.coords);
        setLocation(initialLocation.coords);
         // Center camera on initial location
         if (cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: [initialLocation.coords.longitude, initialLocation.coords.latitude],
                zoomLevel: 15, // Adjust zoom level as needed
                animationDuration: 1000,
            });
         }
      } catch (error) {
        console.error("Error getting initial location:", error);
        setErrorMsg('Could not fetch initial location.');
      }
    })();
  }, []);

  // --- Location Tracking ---
  const startTracking = async () => {
    if (permissionStatus !== 'granted') {
        Alert.alert("Permission Required", "Cannot start tracking without location permission.");
        return;
    }
    if (isTracking) return;

    console.log("Starting location tracking...");
    setErrorMsg(null);
    setRouteCoordinates([]);
    setDistance(0);
    setStartTime(Date.now());
    setIsTracking(true);

    try {
        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 5,
            },
            (newLocation) => {
                setLocation(newLocation.coords);
                setRouteCoordinates((prevCoords) => [...prevCoords, [newLocation.coords.longitude, newLocation.coords.latitude]]);
                if (cameraRef.current) {
                    cameraRef.current.flyTo([newLocation.coords.longitude, newLocation.coords.latitude], 1000);
                }
            }
        );
         console.log("Location tracking started successfully.");
    } catch (error) {
         console.error("Error starting location tracking:", error);
         setErrorMsg("Failed to start location tracking.");
         setIsTracking(false);
         setStartTime(null);
    }
  };

  const stopTracking = () => {
    if (!isTracking) return;
    console.log("Stopping location tracking...");

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
      console.log("Location subscription removed.");
    }
    setIsTracking(false);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`Tracking stopped. Duration: ${duration}s, Points: ${routeCoordinates.length}, Distance: ${distance}m`);
    
    setStartTime(null); 

    if (routeCoordinates.length > 1 && distance > 10) {
         Alert.alert(
            "Track Complete", 
            `Duration: ${Math.round(duration)}s\nDistance: ${distance.toFixed(1)}m\nPoints: ${routeCoordinates.length}`,
            [{ text: "OK" }]
         );
    } else {
         Alert.alert("Track Too Short", "Track was too short to be saved.", [{ text: "OK" }]);
         setRouteCoordinates([]);
    }
  };

  let text = 'Waiting for location permission...';
  if (errorMsg) {
    text = errorMsg;
  } else if (permissionStatus === 'granted' && !location) {
    text = 'Getting location...';
  }

  return (
    <View style={styles.container}>
      {permissionStatus === 'granted' && MAPBOX_ACCESS_TOKEN ? (
        <MapboxGL.MapView
            ref={mapRef}
            style={styles.map}
            styleURL={MapboxGL.StyleURL.Dark}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            centerCoordinate={[-74.0060, 40.7128]}
            zoomLevel={10}
            followUserLocation={isTracking}
          />
          
          <MapboxGL.UserLocation 
              visible={true} 
              showsUserHeadingIndicator={true}
          />

          {routeCoordinates.length > 1 && (
            <MapboxGL.ShapeSource id="routeSource" shape={{ type: 'LineString', coordinates: routeCoordinates }}>
              <MapboxGL.LineLayer 
                  id="routeLine" 
                  style={{ lineColor: '#FF0000', lineWidth: 4, lineOpacity: 0.8 }}
              />
            </MapboxGL.ShapeSource>
          )}

        </MapboxGL.MapView>
      ) : (
        <Text style={styles.infoText}>{text}</Text>
      )}

      <View style={styles.controls}>
          <Text style={styles.statusText}>
              {isTracking ? `Tracking... (${routeCoordinates.length} points)` : 'Not Tracking'}
          </Text>

          <Button 
              title={isTracking ? "Stop Tracking" : "Start Tracking"} 
              onPress={isTracking ? stopTracking : startTracking} 
              disabled={permissionStatus !== 'granted'}
              color={isTracking ? "#FF6347" : "#32CD32"}
          />
      </View>
    </View>
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
  infoText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'white',
    padding: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
   statusText: {
     color: 'white',
     marginBottom: 10,
     fontSize: 16,
   }
});

export default MapScreen; 