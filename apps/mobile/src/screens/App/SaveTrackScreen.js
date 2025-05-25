import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ScrollView,
    Switch,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveTrack } from '../../api/services/trackService';
import { useAuth } from '../../context/AuthContext'; // To potentially get default settings or vehicles later
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters'; // Assuming we move helpers

const SaveTrackScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = useAuth(); // Get user context if needed

    // Extract route data passed from MapScreen
    const { routeCoordinates, distance, duration } = route.params;

    const [description, setDescription] = useState('');
    const [tags, setTags] = useState(''); // Comma-separated string
    const [isPublic, setIsPublic] = useState(false); // Default to private
    const [vehicleId, setVehicleId] = useState(null); // TODO: Implement Vehicle Selection
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Calculate summary statistics (avg speed, max speed)
    const summaryStats = React.useMemo(() => {
        if (!routeCoordinates || routeCoordinates.length === 0) {
            return { avgSpeed: 0, maxSpeed: 0 };
        }
        let maxS = 0;
        routeCoordinates.forEach(p => {
            if (p.speed != null && p.speed > maxS) maxS = p.speed;
        });
        // Avg speed = total distance / total time (if time > 0)
        const avgS = duration > 0 ? (distance / duration) : 0;
        return {
            avgSpeed: avgS, // m/s
            maxSpeed: maxS // m/s
        };
    }, [routeCoordinates, distance, duration]);


    useEffect(() => {
        // Set default privacy based on user preferences if available
        if (user?.preferences?.privacy?.trackVisibilityDefault === 'public') {
             setIsPublic(true);
        }
        // TODO: Set default vehicle if one exists?
    }, [user]);

    const handleSave = async () => {
        // Ensure we have at least two points for a valid start and end time
        if (!routeCoordinates || routeCoordinates.length < 2) {
            Alert.alert('Error', 'Not enough track data to save.');
            return;
        }

        setLoading(true);
        setError(null);

        // Check if we have valid timestamps in our route coordinates
        console.log("Checking timestamps in route coordinates...");
        let hasValidTimestamps = true;
        const now = new Date().getTime();
        routeCoordinates.forEach((point, index) => {
            if (!point.timestamp) {
                console.warn(`Missing timestamp at point ${index}`);
                hasValidTimestamps = false;
            }
        });

        // Generate timestamps if they're missing (based on duration)
        if (!hasValidTimestamps) {
            console.log("Generating timestamps for route points...");
            const startTime = now - (duration * 1000); // Calculate start time based on duration
            const intervalMs = duration * 1000 / Math.max(1, routeCoordinates.length - 1);
            
            routeCoordinates = routeCoordinates.map((point, index) => {
                return {
                    ...point,
                    timestamp: startTime + (index * intervalMs)
                };
            });
        }

        // Get startTime and endTime from the route data
        const startTime = new Date(routeCoordinates[0].timestamp || now - (duration * 1000));
        const endTime = new Date(routeCoordinates[routeCoordinates.length - 1].timestamp || now);

        console.log("Start time:", startTime.toISOString());
        console.log("End time:", endTime.toISOString());

        // Prepare data payload for the API
        const trackData = {
             // Ensure route points have valid, non-null values where required by backend
            route: routeCoordinates.map(p => ({
                lat: p.latitude,
                lng: p.longitude,
                altitude: p.altitude ?? null, // Send null if undefined/null
                speed: (p.speed !== undefined && p.speed >= 0) ? p.speed : 0, // Ensure speed is non-negative
                timestamp: p.timestamp ? new Date(p.timestamp).toISOString() : new Date().toISOString() // Ensure valid ISO string
            })),
            startTime: startTime.toISOString(), // Add startTime (ISO format)
            endTime: endTime.toISOString(),   // Add endTime (ISO format)
            distance: distance, // meters
            duration: Math.round(duration), // seconds (ensure integer)
            avgSpeed: summaryStats.avgSpeed, // m/s
            maxSpeed: summaryStats.maxSpeed, // m/s
            description: description.trim(),
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Array of strings
            isPublic: isPublic,
            // vehicleId: vehicleId, // Add when implemented
        };

        // Validate payload before sending (basic example)
        if (isNaN(trackData.distance) || isNaN(trackData.duration) || isNaN(trackData.avgSpeed) || isNaN(trackData.maxSpeed)) {
            console.error("Invalid calculated stats:", trackData);
            setError('Could not calculate track statistics correctly. Cannot save.');
            setLoading(false);
            Alert.alert('Save Failed', 'Invalid statistics calculated. Cannot save.');
            return;
        }

        try {
            console.log("Saving track data with route length:", trackData.route.length);
            console.log("First route point:", JSON.stringify(trackData.route[0]));
            console.log("Last route point:", JSON.stringify(trackData.route[trackData.route.length - 1]));
            
            const savedTrack = await saveTrack(trackData);
            console.log("Track saved successfully, response:", savedTrack);
            
            setLoading(false);
            Alert.alert('Success', 'Track saved successfully!');
            
            // Try to navigate to history tab, fall back to going back if it fails
            try {
                navigation.navigate('HistoryTab', { screen: 'HistoryList' });
            } catch (navError) {
                console.error('Navigation error:', navError);
                // Fall back to going back
                navigation.goBack();
            }
        } catch (err) {
            console.error('Error saving track:', err);
            console.error('Error response data:', err.response?.data);
            console.error('Error status:', err.response?.status);
            const message = err.response?.data?.message || 'Failed to save track. Please try again.';
            setError(message);
            setLoading(false);
            Alert.alert('Save Failed', message);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Save New Track</Text>

                {/* Display Summary Stats */}
                <View style={styles.summaryContainer}>
                     <Text style={styles.summaryTitle}>Track Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Distance:</Text>
                        <Text style={styles.summaryValue}>{formatDistance(distance)} km</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Duration:</Text>
                        <Text style={styles.summaryValue}>{formatTime(duration)}</Text>
                    </View>
                     <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Avg Speed:</Text>
                        <Text style={styles.summaryValue}>{formatSpeed(summaryStats.avgSpeed)} km/h</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Max Speed:</Text>
                        <Text style={styles.summaryValue}>{formatSpeed(summaryStats.maxSpeed)} km/h</Text>
                    </View>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="How was the ride?"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    maxLength={280} // Increased length
                    placeholderTextColor="#888"
                    editable={!loading}
                />

                <Text style={styles.label}>Tags (comma-separated)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., morning ride, city, fast"
                    value={tags}
                    onChangeText={setTags}
                    autoCapitalize="none"
                    placeholderTextColor="#888"
                    editable={!loading}
                />

                {/* TODO: Add Vehicle Picker Component Here */}
                <Text style={styles.label}>Vehicle: (TODO)</Text>

                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Make Public?</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isPublic ? "#007AFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={setIsPublic}
                        value={isPublic}
                        disabled={loading}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
                ) : (
                    <Button title="Save Track" onPress={handleSave} disabled={loading} />
                )}
            </ScrollView>
         </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    container: {
        padding: 20,
        // backgroundColor: '#1c1c1e', // Dark theme later
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        // color: 'white',
    },
    summaryContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryLabel: {
        fontSize: 15,
        color: '#555',
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 10,
        // color: '#ccc', // Dark theme later
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
        marginTop: 15,
    },
    errorText: {
        color: 'red',
        marginBottom: 15,
        textAlign: 'center'
    },
    loader: {
        marginTop: 20,
    }
});

export default SaveTrackScreen; 