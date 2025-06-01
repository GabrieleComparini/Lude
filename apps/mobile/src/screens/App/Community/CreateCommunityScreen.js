import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../styles/theme';
import { useAuth } from '../../../context/authContext';
import communityService from '../../../api/services/communityService';

const CreateCommunityScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    tags: [],
    rules: []
  });
  
  const [avatarImage, setAvatarImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [currentRule, setCurrentRule] = useState({ title: '', description: '' });
  
  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  // Add a tag to the community
  const handleAddTag = () => {
    if (currentTag.trim() && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };
  
  // Remove a tag from the community
  const handleRemoveTag = (index) => {
    const updatedTags = [...formData.tags];
    updatedTags.splice(index, 1);
    setFormData({
      ...formData,
      tags: updatedTags
    });
  };
  
  // Add a rule to the community
  const handleAddRule = () => {
    if (currentRule.title.trim() && formData.rules.length < 10) {
      setFormData({
        ...formData,
        rules: [...formData.rules, { ...currentRule }]
      });
      setCurrentRule({ title: '', description: '' });
    }
  };
  
  // Remove a rule from the community
  const handleRemoveRule = (index) => {
    const updatedRules = [...formData.rules];
    updatedRules.splice(index, 1);
    setFormData({
      ...formData,
      rules: updatedRules
    });
  };
  
  // Pick an image from the device library
  const pickImage = async (type) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant permission to access your photos.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8
    });
    
    if (!result.canceled) {
      if (type === 'avatar') {
        setAvatarImage(result.assets[0].uri);
      } else {
        setCoverImage(result.assets[0].uri);
      }
    }
  };
  
  // Create the community
  const handleCreateCommunity = async () => {
    // Validate form data
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Community name is required');
      return;
    }
    
    if (formData.name.length < 3) {
      Alert.alert('Error', 'Community name must be at least 3 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare form data for API request
      const apiFormData = new FormData();
      apiFormData.append('name', formData.name);
      apiFormData.append('description', formData.description);
      apiFormData.append('isPublic', formData.isPublic);
      
      // Add tags and rules as JSON strings
      apiFormData.append('tags', JSON.stringify(formData.tags));
      apiFormData.append('rules', JSON.stringify(formData.rules));
      
      // Add images if selected
      if (avatarImage) {
        const filename = avatarImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        apiFormData.append('avatar', {
          uri: avatarImage,
          name: filename,
          type
        });
      }
      
      if (coverImage) {
        const filename = coverImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        apiFormData.append('coverImage', {
          uri: coverImage,
          name: filename,
          type
        });
      }
      
      // Send request to API
      const response = await communityService.createCommunity(apiFormData, user.token);
      
      // Navigate to the new community
      navigation.replace('CommunityDetails', { communityId: response.community._id });
      
    } catch (error) {
      console.error('Error creating community:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Community</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Cover Image */}
        <TouchableOpacity
          style={styles.coverImageContainer}
          onPress={() => pickImage('cover')}
        >
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <MaterialIcons name="add-photo-alternate" size={40} color={theme.colors.gray} />
              <Text style={styles.placeholderText}>Add Cover Image</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => pickImage('avatar')}
        >
          {avatarImage ? (
            <Image source={{ uri: avatarImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="add-a-photo" size={24} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.formContainer}>
          {/* Community Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Community Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter community name"
              maxLength={50}
            />
            <Text style={styles.charCount}>{formData.name.length}/50</Text>
          </View>
          
          {/* Community Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              placeholder="Describe your community"
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{formData.description.length}/500</Text>
          </View>
          
          {/* Privacy Setting */}
          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.label}>Public Community</Text>
              <Text style={styles.switchDescription}>
                {formData.isPublic
                  ? 'Anyone can view and join this community'
                  : 'Members need approval to join this community'}
              </Text>
            </View>
            <Switch
              value={formData.isPublic}
              onValueChange={(value) => handleInputChange('isPublic', value)}
              trackColor={{ false: theme.colors.gray, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
          
          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags <Text style={styles.optional}>(Optional, max 5)</Text></Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={currentTag}
                onChangeText={setCurrentTag}
                placeholder="Add a tag"
                maxLength={30}
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (!currentTag.trim() || formData.tags.length >= 5) && styles.disabledButton
                ]}
                onPress={handleAddTag}
                disabled={!currentTag.trim() || formData.tags.length >= 5}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveTag(index)}
                    >
                      <Ionicons name="close-circle" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* Rules */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Community Rules <Text style={styles.optional}>(Optional)</Text></Text>
            
            <View style={styles.ruleInputContainer}>
              <TextInput
                style={styles.ruleInput}
                value={currentRule.title}
                onChangeText={(text) => setCurrentRule({ ...currentRule, title: text })}
                placeholder="Rule title"
                maxLength={100}
              />
              <TextInput
                style={[styles.ruleInput, styles.textArea]}
                value={currentRule.description}
                onChangeText={(text) => setCurrentRule({ ...currentRule, description: text })}
                placeholder="Rule description (optional)"
                multiline
                numberOfLines={2}
                maxLength={500}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (!currentRule.title.trim() || formData.rules.length >= 10) && styles.disabledButton
                ]}
                onPress={handleAddRule}
                disabled={!currentRule.title.trim() || formData.rules.length >= 10}
              >
                <Text style={styles.addButtonText}>Add Rule</Text>
              </TouchableOpacity>
            </View>
            
            {formData.rules.length > 0 && (
              <View style={styles.rulesContainer}>
                {formData.rules.map((rule, index) => (
                  <View key={index} style={styles.rule}>
                    <View style={styles.ruleHeader}>
                      <Text style={styles.ruleNumber}>{index + 1}</Text>
                      <Text style={styles.ruleTitle}>{rule.title}</Text>
                      <TouchableOpacity
                        style={styles.removeRuleButton}
                        onPress={() => handleRemoveRule(index)}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                    {rule.description && (
                      <Text style={styles.ruleDescription}>{rule.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              !formData.name.trim() && styles.disabledButton
            ]}
            onPress={handleCreateCommunity}
            disabled={!formData.name.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.createButtonText}>Create Community</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  coverImageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: theme.colors.lightGray,
    marginBottom: 40,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: theme.colors.gray,
    fontSize: 14,
  },
  avatarContainer: {
    position: 'absolute',
    top: 170,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.lightGray,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    zIndex: 1,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  formContainer: {
    padding: 16,
    paddingTop: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.gray,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  switchDescription: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: theme.colors.lightGray,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    marginRight: 4,
  },
  removeButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optional: {
    fontWeight: 'normal',
    fontSize: 12,
    color: theme.colors.gray,
  },
  ruleInputContainer: {
    marginBottom: 12,
  },
  ruleInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  rulesContainer: {
    marginTop: 12,
  },
  rule: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 8,
    fontWeight: 'bold',
  },
  ruleTitle: {
    flex: 1,
    fontWeight: 'bold',
  },
  removeRuleButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleDescription: {
    marginTop: 4,
    marginLeft: 32,
    color: theme.colors.gray,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateCommunityScreen; 