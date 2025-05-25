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
    Alert,
    Image,
    TouchableOpacity
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/client'; // Import apiClient
import { updateUserProfile } from '../../api/services/userService'; // Assuming this function exists/will exist
import { theme } from '../../styles/theme'; // Corrected path

const EditProfileScreen = () => {
    const { user, setUser } = useAuth(); // Get user and a way to update it locally
    const navigation = useNavigation();

    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [profileImage, setProfileImage] = useState(user?.profileImage || null);
    const [newImageUri, setNewImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Update state if user context changes (e.g., after initial load)
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setUsername(user.username || '');
            setBio(user.bio || '');
            setProfileImage(user.profileImage || null);
        }
    }, [user]);

    // Request permissions for image picker
    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
                }
            }
        })();
    }, []);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setNewImageUri(result.assets[0].uri);
                setProfileImage(result.assets[0].uri);
            }
        } catch (err) {
            console.error('Error picking image:', err);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        setError(null);
        setUploadingImage(true);

        try {
            let formData = null;
            
            // Use FormData for image upload
            if (newImageUri) {
                formData = new FormData();
                
                // Add image file to form data
                const imageName = newImageUri.split('/').pop();
                const imageType = 'image/' + (imageName.split('.').pop() === 'png' ? 'png' : 'jpeg');
                
                formData.append('profileImage', {
                    uri: newImageUri,
                    name: imageName,
                    type: imageType
                });
                
                // Add other fields
                if (name !== user?.name) formData.append('name', name);
                if (username !== user?.username) formData.append('username', username);
                if (bio !== user?.bio) formData.append('bio', bio);
            } else {
                // Regular JSON data without image
        const updateData = {};
        if (name !== user?.name) updateData.name = name;
        if (username !== user?.username) updateData.username = username;
        if (bio !== user?.bio) updateData.bio = bio;

        if (Object.keys(updateData).length === 0) {
            setLoading(false);
            setUploadingImage(false);
            Alert.alert("No Changes", "You haven't made any changes.");
            return;
        }

        // Basic username validation (frontend)
        if (updateData.username && !/^[a-zA-Z0-9_]{3,30}$/.test(updateData.username)){
             setError("Invalid username format (3-30 chars, letters, numbers, underscore).");
             setLoading(false);
             setUploadingImage(false);
             return;
        }
            }

            // Use different request based on whether we're uploading an image
            const response = newImageUri 
                ? await apiClient.put('/api/users/profile', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                  })
                : await apiClient.put('/api/users/profile', formData || {});
            
            // Update user data in context immediately for responsiveness
            setUser(response.data); 
            Alert.alert("Success", "Profile updated successfully!");
            navigation.goBack(); // Go back to the profile screen
        } catch (err) {
            console.error('Error updating profile:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
            setUploadingImage(false);
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

                {/* Profile Image Picker */}
                <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage} disabled={loading}>
                    {newImageUri ? (
                        <Image source={{ uri: newImageUri }} style={styles.profileImage} />
                    ) : profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person" size={60} color="#CCCCCC" />
                        </View>
                    )}
                    <View style={styles.editIconContainer}>
                        <Ionicons name="camera" size={24} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>

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

                {uploadingImage && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Caricamento immagine...</Text>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
                ) : (
                    <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={handleUpdate} 
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    container: {
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333333',
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
        position: 'relative',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        backgroundColor: '#E5E5E5',
    },
    profileImagePlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        backgroundColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        alignSelf: 'flex-start',
        color: '#333333',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
        color: '#333333',
    },
    textArea: {
        height: 100, // Taller for bio
        textAlignVertical: 'top', // Align text to top for multiline
        paddingTop: 10,
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 15,
        textAlign: 'center'
    },
    loader: {
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject, // Cover the whole screen? Or just the button area? Adjust as needed.
        // For covering just the container part:
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        // End container cover part
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10, // Make sure it's above other elements
    },
    loadingText: {
        marginTop: 10,
        color: theme.colors.white,
        fontSize: 16,
    },
});

export default EditProfileScreen; 