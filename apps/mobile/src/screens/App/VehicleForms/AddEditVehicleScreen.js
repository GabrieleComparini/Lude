import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../context/AuthContext'; // Adjust path if needed
import { addVehicle, updateVehicle, getVehicleById } from '../../../api/services/vehicleService'; // Assuming these functions exist/will exist
import { theme } from '../../../styles/theme'; // Assuming theme exists

// Screen can operate in 'add' or 'edit' mode
const AddEditVehicleScreen = ({ route, navigation }) => {
  const { vehicleId } = route.params || {}; // Get vehicleId if passed for editing
  const isEditMode = !!vehicleId;

  const { user } = useAuth();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [nickname, setNickname] = useState('');
  const [horsepower, setHorsepower] = useState('');
  const [modifications, setModifications] = useState(''); // Simple text for now
  const [isDefault, setIsDefault] = useState(false);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [newImageUri, setNewImageUri] = useState(null); // For previewing new image

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchVehicleData = async () => {
        setIsFetching(true);
        try {
          const vehicle = await getVehicleById(vehicleId);
          setMake(vehicle.make);
          setModel(vehicle.model);
          setYear(vehicle.year?.toString() || '');
          setNickname(vehicle.nickname || '');
          setHorsepower(vehicle.horsepower?.toString() || '');
          setModifications(vehicle.modifications || ''); // Assuming modifications is a string for now
          setIsDefault(vehicle.isDefault || false);
          setVehicleImage(vehicle.imageUrl || null);
        } catch (error) {
          Alert.alert('Errore', 'Impossibile caricare i dati del veicolo.');
          console.error("Error fetching vehicle:", error);
          navigation.goBack();
        } finally {
          setIsFetching(false);
        }
      };
      fetchVehicleData();
    }
  }, [vehicleId, isEditMode, navigation]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso Negato', 'È necessario il permesso per accedere alla galleria.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Wider aspect ratio for vehicles
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewImageUri(result.assets[0].uri);
      setVehicleImage(result.assets[0].uri); // Show preview
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setUploadingImage(false);
    let imageUrl = vehicleImage; // Keep old/current image URL

    // --- Placeholder for Image Upload Logic ---
    if (newImageUri && newImageUri !== vehicleImage) { // Only upload if a *new* image was selected
        setUploadingImage(true);
        // 1. Call backend to upload image (newImageUri)
        // const uploadResponse = await uploadVehicleImageApi(newImageUri); // Fictional API call
        // if (uploadResponse.success) {
        //   imageUrl = uploadResponse.url;
        // } else {
        //   Alert.alert('Errore Upload', 'Impossibile caricare l'immagine.');
        //   setIsLoading(false);
        //   setUploadingImage(false);
        //   return;
        // }
        // --- SIMULATED UPLOAD FOR NOW ---
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        imageUrl = newImageUri; // Use the local URI for now
        console.log("Simulated vehicle image upload complete. Using local URI:", imageUrl);
        // --- END SIMULATION ---
        setUploadingImage(false);
    }
    // --- End Placeholder ---

    const vehicleData = {
      make,
      model,
      year: parseInt(year) || null,
      nickname,
      horsepower: parseInt(horsepower) || null,
      modifications,
      isDefault,
      imageUrl: imageUrl, // Use the potentially updated URL
      // userId will be added by the backend via req.user
    };

    try {
      if (isEditMode) {
        await updateVehicle(vehicleId, vehicleData);
        Alert.alert('Successo', 'Veicolo aggiornato.');
      } else {
        await addVehicle(vehicleData);
        Alert.alert('Successo', 'Veicolo aggiunto.');
      }
      navigation.navigate('Garage'); // Navigate back to Garage/Vehicle List screen
    } catch (error) {
      console.error("Error saving vehicle:", error);
      Alert.alert('Errore', error.message || 'Impossibile salvare il veicolo.');
    } finally {
      setIsLoading(false);
      setUploadingImage(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Caricamento dati veicolo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{isEditMode ? 'Modifica Veicolo' : 'Aggiungi Veicolo'}</Text>

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        <Image
          source={vehicleImage ? { uri: vehicleImage } : require('../../../assets/images/default_vehicle.png')} // Placeholder image
          style={styles.vehicleImage}
          resizeMode="cover"
        />
        <Text style={styles.imagePickerText}>Cambia Foto Veicolo</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Marca *</Text>
      <TextInput style={styles.input} value={make} onChangeText={setMake} placeholder="Es. BMW" placeholderTextColor={theme.colors.textSecondary} />

      <Text style={styles.label}>Modello *</Text>
      <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Es. M3" placeholderTextColor={theme.colors.textSecondary} />

      <Text style={styles.label}>Anno</Text>
      <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="Es. 2023" keyboardType="numeric" placeholderTextColor={theme.colors.textSecondary} />

      <Text style={styles.label}>Nickname</Text>
      <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="Es. Il mio bolide" placeholderTextColor={theme.colors.textSecondary} />

      <Text style={styles.label}>Cavalli (HP)</Text>
      <TextInput style={styles.input} value={horsepower} onChangeText={setHorsepower} placeholder="Es. 450" keyboardType="numeric" placeholderTextColor={theme.colors.textSecondary} />

      <Text style={styles.label}>Modifiche</Text>
      <TextInput style={[styles.input, styles.textArea]} value={modifications} onChangeText={setModifications} placeholder="Descrivi le modifiche (scarico, centralina...)" multiline numberOfLines={3} placeholderTextColor={theme.colors.textSecondary} />

      {/* Simple Toggle for Default Vehicle - Replace with better UI if needed */}
      <View style={styles.switchContainer}>
          <Text style={styles.label}>Veicolo Predefinito?</Text>
          <TouchableOpacity onPress={() => setIsDefault(!isDefault)} style={styles.switchTouchable}>
              <View style={[styles.switchOuter, isDefault ? styles.switchOuterActive : {}]}>
                  <View style={[styles.switchInner, isDefault ? styles.switchInnerActive : {}]} />
              </View>
          </TouchableOpacity>
      </View>

      {uploadingImage && (
          <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Caricamento immagine...</Text>
          </View>
      )}

      <Button
        title={isLoading && !uploadingImage ? "Salvataggio..." : (isEditMode ? "Salva Modifiche" : "Aggiungi Veicolo")}
        onPress={handleSave}
        disabled={isLoading || !make || !model} // Basic validation: require make and model
        color={theme.colors.primary}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
  },
  loadingText: {
      marginTop: 10,
      color: theme.colors.text,
      fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 30,
  },
  vehicleImage: {
    width: '100%',
    height: 180, // Adjust height as needed
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    marginBottom: 10,
  },
  imagePickerText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingVertical: 10,
  },
  switchTouchable: {
    // Makes the switch easier to tap
  },
  switchOuter: {
      width: 50,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      padding: 2,
  },
  switchOuterActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
  },
  switchInner: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.textSecondary,
      alignSelf: 'flex-start',
  },
  switchInnerActive: {
      backgroundColor: theme.colors.white,
      alignSelf: 'flex-end',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
//   loadingText duplicate, using the one defined above for fetch loading
});

export default AddEditVehicleScreen; 