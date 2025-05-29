import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const ProfileOnboardingScreen = () => {
  const { user, refreshUserProfile, completeOnboarding } = useAuth();
  const navigation = useNavigation();
  
  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Character limit for bio
  const BIO_CHAR_LIMIT = 160;

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
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    
    try {
      let profileData;
      let requestConfig = {};
      
      // Use FormData if uploading an image
      if (imageUri) {
        profileData = new FormData();
        
        // Add image file to form data
        const imageName = imageUri.split('/').pop();
        const imageType = 'image/' + (imageName.split('.').pop() === 'png' ? 'png' : 'jpeg');
        
        profileData.append('profileImage', {
          uri: imageUri,
          name: imageName,
          type: imageType
        });
        
        // Add other fields
        profileData.append('username', username.trim());
        profileData.append('name', name.trim());
        if (location) profileData.append('location', location.trim());
        if (bio) profileData.append('bio', bio.trim());
        
        requestConfig.headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        // Regular JSON data without image
        profileData = {
          username: username.trim(),
          name: name.trim(),
          location: location.trim() || undefined,
          bio: bio.trim() || undefined,
        };
      }
      
      await apiClient.put('/api/users/profile', profileData, requestConfig);
      
      // Refresh user profile data
      await refreshUserProfile();
      
      // Mark onboarding as completed in the auth context
      completeOnboarding();
      
      // Navigate to the next onboarding screen
      navigation.navigate('VehicleOnboarding');
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Handle specific API errors
      if (err.response && err.response.data && err.response.data.message) {
        Alert.alert('Error', err.response.data.message);
      } else {
        Alert.alert('Error', 'Unable to update profile. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate initials from name for avatar placeholder
  const getInitials = () => {
    if (name) {
      return name.charAt(0).toUpperCase();
    } else if (username) {
      return username.charAt(0).toUpperCase();
    }
    return 'L';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create profile</Text>

          {/* Profile Image */}
          <View style={styles.avatarContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <View style={[styles.inputContainer, errors.username && styles.inputError]}>
            <Text style={styles.inputPrefix}>@</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <View style={[styles.inputContainer, errors.name && styles.inputError]}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nome Cognome"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="words"
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* Location */}
          <Text style={styles.label}>Località</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Stato, Paese"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="words"
            />
          </View>

          {/* Bio */}
          <Text style={styles.label}>Bio</Text>
          <View style={[styles.bioInputContainer, bio.length > BIO_CHAR_LIMIT && styles.inputError]}>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Raccontaci qualcosa di te ......"
              placeholderTextColor="#A0A0A0"
              multiline
              maxLength={BIO_CHAR_LIMIT + 10} // Small buffer over the limit
            />
            <Text style={styles.charCount}>{bio.length}/{BIO_CHAR_LIMIT}</Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressIndicator} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#000',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 25,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#8E3AB9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8E3AB9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    height: 50,
  },
  inputPrefix: {
    color: '#666',
    fontSize: 18,
    marginRight: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  bioInputContainer: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingTop: 5,
    backgroundColor: '#fff',
    minHeight: 100,
    position: 'relative',
  },
  bioInput: {
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    paddingBottom: 25,
  },
  charCount: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    fontSize: 12,
    color: '#888',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  progressIndicator: {
    width: 100,
    height: 5,
    backgroundColor: '#000',
    borderRadius: 5,
  }
});

export default ProfileOnboardingScreen; 