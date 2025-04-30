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
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../api/client';

const EditVehicleScreen = () => {
  const [nickname, setNickname] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [newImageUri, setNewImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [errors, setErrors] = useState({});
  
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleId } = route.params;
  
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
  
  // Carica i dati del veicolo
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoadingVehicle(true);
        const response = await apiClient.get(`/api/vehicles/${vehicleId}`);
        const vehicle = response.data;
        
        setNickname(vehicle.nickname || '');
        setMake(vehicle.make || '');
        setModel(vehicle.model || '');
        setYear(vehicle.year ? vehicle.year.toString() : '');
        setIsDefault(vehicle.isDefault || false);
        setVehicleImage(vehicle.imageUrl || null);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        Alert.alert('Errore', 'Impossibile caricare i dati del veicolo');
        navigation.goBack();
      } finally {
        setLoadingVehicle(false);
      }
    };
    
    fetchVehicleData();
  }, [vehicleId]);
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Valida i campi di input
  const validateInputs = () => {
    const newErrors = {};
    
    if (!nickname.trim()) {
      newErrors.nickname = 'Il nome del veicolo è obbligatorio';
    }
    
    if (!make.trim()) {
      newErrors.make = 'La marca è obbligatoria';
    }
    
    if (!model.trim()) {
      newErrors.model = 'Il modello è obbligatorio';
    }
    
    if (year && !/^\d{4}$/.test(year.trim())) {
      newErrors.year = 'L\'anno deve essere un numero di 4 cifre';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Gestisce l'aggiornamento del veicolo
  const handleUpdate = async () => {
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    
    try {
      let updateData;
      let requestConfig = {};
      
      // Use FormData if uploading an image
      if (newImageUri) {
        updateData = new FormData();
        
        // Add image file to form data
        const imageName = newImageUri.split('/').pop();
        const imageType = 'image/' + (imageName.split('.').pop() === 'png' ? 'png' : 'jpeg');
        
        updateData.append('vehicleImage', {
          uri: newImageUri,
          name: imageName,
          type: imageType
        });
        
        // Add other fields
        updateData.append('nickname', nickname.trim());
        updateData.append('make', make.trim());
        updateData.append('model', model.trim());
        if (year.trim()) updateData.append('year', year.trim());
        updateData.append('isDefault', isDefault.toString());
        
        requestConfig.headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        // Regular JSON data without image
        updateData = {
          nickname: nickname.trim(),
          make: make.trim(),
          model: model.trim(),
          year: year.trim() ? parseInt(year.trim(), 10) : undefined,
          isDefault
        };
      }
      
      await apiClient.put(`/api/vehicles/${vehicleId}`, updateData, requestConfig);
      
      Alert.alert(
        'Successo',
        'Veicolo aggiornato con successo',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error updating vehicle:', err);
      
      // Gestisci errori specifici dall'API
      if (err.response && err.response.data && err.response.data.message) {
        Alert.alert('Errore', err.response.data.message);
      } else {
        Alert.alert('Errore', 'Impossibile aggiornare il veicolo. Riprova più tardi.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Mostra un indicatore di caricamento mentre si caricano i dati del veicolo
  if (loadingVehicle) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento in corso...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Modifica Veicolo</Text>
          <Text style={styles.headerSubtitle}>Aggiorna i dettagli del tuo veicolo</Text>
        </View>
        
        {/* Vehicle Image Picker */}
        <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage} disabled={loading}>
          {newImageUri ? (
            <Image source={{ uri: newImageUri }} style={styles.vehicleImage} />
          ) : vehicleImage ? (
            <Image source={{ uri: vehicleImage }} style={styles.vehicleImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="car" size={60} color="#CCCCCC" />
              <Text style={styles.placeholderText}>Tocca per aggiungere un'immagine</Text>
            </View>
          )}
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.form}>
          {/* Nickname */}
          <View style={styles.formField}>
            <Text style={styles.label}>Nome Veicolo *</Text>
            <TextInput
              style={[styles.input, errors.nickname && styles.inputError]}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Es. La mia auto"
              placeholderTextColor="#999999"
              autoCapitalize="words"
            />
            {errors.nickname && <Text style={styles.errorText}>{errors.nickname}</Text>}
          </View>
          
          {/* Marca */}
          <View style={styles.formField}>
            <Text style={styles.label}>Marca *</Text>
            <TextInput
              style={[styles.input, errors.make && styles.inputError]}
              value={make}
              onChangeText={setMake}
              placeholder="Es. Toyota"
              placeholderTextColor="#999999"
              autoCapitalize="words"
            />
            {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
          </View>
          
          {/* Modello */}
          <View style={styles.formField}>
            <Text style={styles.label}>Modello *</Text>
            <TextInput
              style={[styles.input, errors.model && styles.inputError]}
              value={model}
              onChangeText={setModel}
              placeholder="Es. Corolla"
              placeholderTextColor="#999999"
              autoCapitalize="words"
            />
            {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
          </View>
          
          {/* Anno */}
          <View style={styles.formField}>
            <Text style={styles.label}>Anno</Text>
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              value={year}
              onChangeText={setYear}
              placeholder="Es. 2020"
              placeholderTextColor="#999999"
              keyboardType="number-pad"
              maxLength={4}
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          </View>
          
          {/* Default Switch */}
          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Veicolo predefinito</Text>
              <Text style={styles.switchDescription}>
                Usa questo veicolo per impostazione predefinita durante le registrazioni
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D1D6"
            />
          </View>
          
          {/* Pulsanti azioni */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annulla</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Aggiorna</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  imagePickerContainer: {
    height: 180,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E5E5',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999999',
    marginTop: 8,
    fontSize: 14,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666666',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default EditVehicleScreen; 