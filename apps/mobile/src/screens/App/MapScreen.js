import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, Button } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';

const MapScreen = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      console.log('[MapScreen] Requesting location permissions...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied. Map functionality requires location.');
        Alert.alert('Permission Denied', 'Map functionality requires location permissions. Please enable them in settings.');
        setLoading(false);
        return;
      }
      console.log('[MapScreen] Permissions granted. Getting current location...');

      try {
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log('[MapScreen] Current location received:', currentLocation);
        setLocation(currentLocation);
        
        if (mapRef.current && currentLocation) {
          mapRef.current.animateToRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }

      } catch (error) {
        console.error("[MapScreen] Error getting location:", error);
        setErrorMsg('Failed to get current location.');
        Alert.alert('Location Error', 'Could not retrieve your current location. Please ensure location services are enabled.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStartTracking = () => {
    console.log("Start Tracking Pressed");
    setTrackingStatus('tracking');
  };

  const handleStopTracking = () => {
    console.log("Stop Tracking Pressed");
    setTrackingStatus('stopped');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading Map & Location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : null}
        showsUserLocation={true}
        followsUserLocation={trackingStatus === 'tracking'}
        showsMyLocationButton={false}
        initialRegion={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
      >
      </MapView>

      <View style={styles.overlay}>
        {trackingStatus === 'idle' && (
          <Button title="Start Tracking" onPress={handleStartTracking} />
        )}
        {trackingStatus === 'tracking' && (
          <>
            <Text>Tracking...</Text>
            <Button title="Stop Tracking" onPress={handleStopTracking} color="red" />
          </>
        )}
        {trackingStatus === 'stopped' && (
          <>
            <Text>Tracking Stopped</Text>
            <Button title="Start New Track" onPress={() => setTrackingStatus('idle')} />
          </>
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
  overlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default MapScreen; 