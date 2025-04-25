import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/client'; // Import apiClient

const EditProfileScreen = () => {
    const { user, setUser } = useAuth(); // Get user and a way to update it locally
    const navigation = useNavigation();

    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Update state if user context changes (e.g., after initial load)
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setUsername(user.username || '');
            setBio(user.bio || '');
        }
    }, [user]);

    const handleUpdate = async () => {
        setLoading(true);
        setError(null);

        const updateData = {};
        if (name !== user?.name) updateData.name = name;
        if (username !== user?.username) updateData.username = username;
        if (bio !== user?.bio) updateData.bio = bio;
        // Add preferences later if needed

        if (Object.keys(updateData).length === 0) {
            setLoading(false);
            Alert.alert("No Changes", "You haven't made any changes.");
            return;
        }

        // Basic username validation (frontend)
        if (updateData.username && !/^[a-zA-Z0-9_]{3,30}$/.test(updateData.username)){
             setError("Invalid username format (3-30 chars, letters, numbers, underscore).");
             setLoading(false);
             return;
        }

        try {
            const response = await apiClient.put('/api/users/profile', updateData);
            // Update user data in context immediately for responsiveness
            setUser(response.data); 
            Alert.alert("Success", "Profile updated successfully!");
            navigation.goBack(); // Go back to the profile screen
        } catch (err) {
            console.error('Error updating profile:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.flexContainer}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Edit Profile</Text>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Add Image Picker component here later */}
                <Text style={styles.label}>Username</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholderTextColor="#888"
                    editable={!loading} // Disable during loading
                />

                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name (Optional)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    placeholderTextColor="#888"
                     editable={!loading}
                />

                <Text style={styles.label}>Bio</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    maxLength={160}
                    placeholderTextColor="#888"
                    editable={!loading}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
                ) : (
                    <Button title="Save Changes" onPress={handleUpdate} disabled={loading} />
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
    },
    container: {
        // flex: 1,
        alignItems: 'center',
        padding: 20,
        // backgroundColor: '#1c1c1e', // Dark theme later
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        // color: 'white',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        alignSelf: 'flex-start',
        // color: '#ccc', // Dark theme later
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    textArea: {
        height: 100, // Taller for bio
        textAlignVertical: 'top', // Align text to top for multiline
        paddingTop: 10,
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

export default EditProfileScreen; 