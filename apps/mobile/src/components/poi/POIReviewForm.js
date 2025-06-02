import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import poiService from '../../api/services/poiService';

/**
 * Review form component for POIs
 * @param {string} poiId - ID of the POI
 * @param {Function} onReviewSubmitted - Callback when a review is submitted
 * @param {Function} onCancel - Callback when form is cancelled
 */
const POIReviewForm = ({ poiId, onReviewSubmitted, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [visitDate, setVisitDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle star rating selection
  const handleRatingPress = (selectedRating) => {
    setRating(selectedRating);
  };

  // Handle image selection
  const handleAddImage = async () => {
    // Request permission
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to add images.');
        return;
      }
    }

    // Maximum 5 images
    if (images.length >= 5) {
      Alert.alert('Limit reached', 'You can upload a maximum of 5 images.');
      return;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets[0]) {
      // In a real app, you would upload the image to a server and get a URL
      // For this example, we'll use the local URI and pretend it's a URL
      setImages([
        ...images, 
        { url: result.assets[0].uri, caption: '' }
      ]);
    }
  };

  // Handle image removal
  const handleRemoveImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Handle image caption update
  const handleUpdateCaption = (index, caption) => {
    const newImages = [...images];
    newImages[index].caption = caption;
    setImages(newImages);
  };

  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setVisitDate(selectedDate);
    }
  };

  // Submit review
  const handleSubmit = async () => {
    // Validate input
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you would handle image uploads separately
      // For now we just pass the image data as is
      
      // Parse tags into array
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
      
      const reviewData = {
        rating,
        comment,
        images,
        visitDate: visitDate.toISOString(),
        tags: tagArray
      };
      
      await poiService.createReview(poiId, reviewData);
      
      // Reset form
      setRating(0);
      setComment('');
      setImages([]);
      setVisitDate(new Date());
      setTags('');
      
      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render stars for rating
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleRatingPress(i)}
          style={styles.starContainer}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={30}
            color={i <= rating ? '#FFD700' : '#aaa'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Write a Review</Text>
      
      {/* Rating selector */}
      <View style={styles.ratingContainer}>
        <Text style={styles.label}>Rate your experience:</Text>
        <View style={styles.starsContainer}>{renderStars()}</View>
      </View>
      
      {/* Comment input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your review:</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience..."
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={500}
        />
      </View>
      
      {/* Visit date picker */}
      <View style={styles.dateContainer}>
        <Text style={styles.label}>Visit date:</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{visitDate.toLocaleDateString()}</Text>
          <Ionicons name="calendar-outline" size={20} color="#555" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={visitDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
      
      {/* Tags input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tags (comma separated):</Text>
        <TextInput
          style={styles.tagsInput}
          placeholder="e.g. scenic, family-friendly, parking"
          value={tags}
          onChangeText={setTags}
          maxLength={100}
        />
      </View>
      
      {/* Image upload */}
      <View style={styles.imageSection}>
        <Text style={styles.label}>Photos (optional):</Text>
        
        <View style={styles.imagesContainer}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageItem}>
              <Image source={{ uri: image.url }} style={styles.imagePreview} />
              <TextInput
                style={styles.captionInput}
                placeholder="Add caption..."
                value={image.caption}
                onChangeText={(text) => handleUpdateCaption(index, text)}
                maxLength={100}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ))}
          
          {images.length < 5 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImage}
            >
              <Ionicons name="add" size={30} color="#555" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333'
  },
  ratingContainer: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555'
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8
  },
  starContainer: {
    padding: 5
  },
  inputContainer: {
    marginBottom: 16
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top'
  },
  tagsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12
  },
  dateContainer: {
    marginBottom: 16
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12
  },
  imageSection: {
    marginBottom: 16
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  imageItem: {
    width: '45%',
    marginBottom: 12,
    marginRight: '5%',
    position: 'relative'
  },
  imagePreview: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 4
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    fontSize: 12
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12
  },
  addImageButton: {
    width: '45%',
    height: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#aaa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addImageText: {
    color: '#555',
    marginTop: 4
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8
  },
  cancelButtonText: {
    color: '#555'
  },
  submitButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  disabledButton: {
    backgroundColor: '#bdc3c7'
  }
});

export default POIReviewForm; 