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
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/client';

// Vehicle types for picker
const vehicleTypes = [
  { label: 'Auto', value: 'auto' },
  { label: 'Moto', value: 'moto' },
  { label: 'Bici', value: 'bici' },
  { label: 'Altro', value: 'altro' },
];

const VehicleOnboardingScreen = () => {
  const navigation = useNavigation();

  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('auto');
  const [manufacturer, setManufacturer] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTypePicker, setShowTypePicker] = useState(false);

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
        aspect: [16, 9],
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
    
    if (!vehicleName.trim()) {
      newErrors.vehicleName = 'Il nome del veicolo è obbligatorio';
    }
    
    if (!manufacturer.trim()) {
      newErrors.manufacturer = 'Il produttore è obbligatorio';
    }
    
    if (year && !/^\d{4}$/.test(year.trim())) {
      newErrors.year = 'L\'anno deve essere un numero di 4 cifre';
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
      // Store the first step data in local state or storage to be combined with second step
      const vehicleData = {
        name: vehicleName.trim(),
        type: vehicleType,
        manufacturer: manufacturer.trim(),
        year: year.trim() || undefined,
        color: color.trim() || undefined,
        imageUri: imageUri,
      };
      
      // Navigate to the second vehicle onboarding screen with the collected data
      navigation.navigate('VehicleDetailsOnboarding', { vehicleData });
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get the currently selected type label
  const getSelectedTypeLabel = () => {
    const selectedType = vehicleTypes.find(type => type.value === vehicleType);
    return selectedType ? selectedType.label : 'Seleziona tipo';
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
          <Text style={styles.title}>Add Vehicle</Text>
          
          {/* Vehicle Image */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.vehicleImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#888" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={22} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Vehicle Name */}
          <Text style={styles.label}>Nome Veicolo</Text>
          <View style={[styles.inputContainer, errors.vehicleName && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={vehicleName}
              onChangeText={setVehicleName}
              placeholder="Inserisci nome Veicolo"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          {errors.vehicleName && <Text style={styles.errorText}>{errors.vehicleName}</Text>}
          
          {/* Vehicle Type */}
          <Text style={styles.label}>Tipo</Text>
          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={styles.pickerButtonText}>{getSelectedTypeLabel()}</Text>
            <Ionicons name="chevron-down" color="#666" size={20} />
          </TouchableOpacity>
          
          {/* Type Picker Modal */}
          <Modal
            visible={showTypePicker}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowTypePicker(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={() => setShowTypePicker(false)}
            >
              <View style={styles.modalContent}>
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.modalItem, 
                      vehicleType === type.value && styles.selectedItem
                    ]}
                    onPress={() => {
                      setVehicleType(type.value);
                      setShowTypePicker(false);
                    }}
                  >
                    <Text 
                      style={[
                        styles.modalItemText,
                        vehicleType === type.value && styles.selectedItemText
                      ]}
                    >
                      {type.label}
                    </Text>
                    {vehicleType === type.value && (
                      <Ionicons name="checkmark" size={20} color="#8E3AB9" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
          
          {/* Manufacturer */}
          <Text style={styles.label}>Produttore</Text>
          <View style={[styles.inputContainer, errors.manufacturer && styles.inputError]}>
            <TextInput
              style={styles.input}
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholder="Inserisci produttore"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          {errors.manufacturer && <Text style={styles.errorText}>{errors.manufacturer}</Text>}
          
          <View style={styles.rowContainer}>
            {/* Year */}
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Anno</Text>
              <View style={[styles.inputContainer, errors.year && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  value={year}
                  onChangeText={setYear}
                  placeholder="Anno produzione"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
            </View>
            
            {/* Color */}
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Colore</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={color}
                  onChangeText={setColor}
                  placeholder="Colore Auto"
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>
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
  imagePickerContainer: {
    width: '100%',
    height: 180,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F6F6F6',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#8E3AB9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    height: 50,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f9f2ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItemText: {
    color: '#8E3AB9',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
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

export default VehicleOnboardingScreen; 