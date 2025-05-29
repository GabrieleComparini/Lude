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
  Switch,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const VehicleDetailsOnboardingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleData } = route.params || {};
  const { completeOnboarding } = useAuth();
  
  const [engine, setEngine] = useState('');
  const [power, setPower] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [isStock, setIsStock] = useState(false);
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateInputs = () => {
    // For this screen, all fields are optional
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Combine data from both screens
      const completeVehicleData = {
        ...vehicleData,
        engine: engine.trim() || undefined,
        power: power.trim() || undefined,
        weight: weight.trim() || undefined,
        description: description.trim() || undefined,
        isStock,
        isDefault,
      };
      
      // Check if we have an image
      if (completeVehicleData.imageUri) {
        // Create FormData for image upload
        const formData = new FormData();
        
        // Add image to form data
        const imageName = completeVehicleData.imageUri.split('/').pop();
        const imageType = 'image/' + (imageName.split('.').pop() === 'png' ? 'png' : 'jpeg');
        
        formData.append('vehicleImage', {
          uri: completeVehicleData.imageUri,
          name: imageName,
          type: imageType,
        });
        
        // Add other vehicle data to form data
        Object.keys(completeVehicleData).forEach(key => {
          if (key !== 'imageUri' && completeVehicleData[key] !== undefined) {
            if (typeof completeVehicleData[key] === 'boolean') {
              formData.append(key, completeVehicleData[key].toString());
            } else {
              formData.append(key, completeVehicleData[key]);
            }
          }
        });
        
        await apiClient.post('/api/vehicles', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // No image, send JSON data
        const dataToSend = { ...completeVehicleData };
        delete dataToSend.imageUri;
        
        await apiClient.post('/api/vehicles', dataToSend);
      }
      
      // Ensure onboarding is completed in the auth context
      completeOnboarding();
      
      // Show success message and navigate to main app
      Alert.alert(
        'Veicolo Aggiunto',
        'Il tuo veicolo è stato aggiunto con successo!',
        [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'MainApp' }],
            })
          }
        ]
      );
      
    } catch (err) {
      console.error('Error adding vehicle:', err);
      
      let errorMessage = 'Si è verificato un errore. Riprova più tardi.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      
      Alert.alert('Errore', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Skip this step
  const handleSkip = () => {
    // Navigate directly to main app or show an alert to confirm
    Alert.alert(
      'Saltare questo passaggio?',
      'Vuoi continuare senza completare i dettagli del veicolo?',
      [
        {
          text: 'Annulla',
          style: 'cancel'
        },
        {
          text: 'Sì, continua',
          onPress: () => {
            // Ensure onboarding is completed in the auth context
            completeOnboarding();
            
            // Submit with just the basic info from the previous screen
            handleSubmit();
          }
        }
      ]
    );
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
          
          {/* Engine */}
          <Text style={styles.label}>Motore</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={engine}
              onChangeText={setEngine}
              placeholder="Motore del Veicolo"
              placeholderTextColor="#A0A0A0"
            />
          </View>
          
          {/* Power */}
          <Text style={styles.label}>Potenza</Text>
          <View style={styles.inputWithUnitContainer}>
            <TextInput
              style={styles.inputWithUnit}
              value={power}
              onChangeText={setPower}
              placeholder="Potenza del veicolo"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>Hp</Text>
          </View>
          
          {/* Weight */}
          <Text style={styles.label}>Peso</Text>
          <View style={styles.inputWithUnitContainer}>
            <TextInput
              style={styles.inputWithUnit}
              value={weight}
              onChangeText={setWeight}
              placeholder="Peso del veicolo"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>Kg</Text>
          </View>
          
          {/* Description */}
          <Text style={styles.label}>Descrizione</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Descrizione del Veicolo..."
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Stock Toggle */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Stock</Text>
            <Switch
              value={isStock}
              onValueChange={setIsStock}
              trackColor={{ false: "#D1D1D6", true: "#8E3AB9" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D1D6"
            />
          </View>
          
          {/* Default Vehicle Toggle */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Veicolo Predefinito</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: "#D1D1D6", true: "#8E3AB9" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D1D6"
            />
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
          
          {/* Skip Button (optional) */}
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
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
  inputWithUnitContainer: {
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
  inputWithUnit: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
    fontWeight: '500',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
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
  },
});

export default VehicleDetailsOnboardingScreen; 