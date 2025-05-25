import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const VehicleDetailScreen = () => {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleId } = route.params;
  
  useEffect(() => {
    fetchVehicleData();
  }, [vehicleId]);
  
  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/vehicles/${vehicleId}`);
      setVehicle(response.data);
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      Alert.alert('Errore', 'Impossibile caricare i dati del veicolo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = () => {
    navigation.navigate('EditVehicle', { vehicleId });
  };
  
  const confirmDelete = () => {
    Alert.alert(
      'Elimina Veicolo',
      'Sei sicuro di voler eliminare questo veicolo? Questa azione non è reversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', onPress: handleDelete, style: 'destructive' }
      ]
    );
  };
  
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await apiClient.delete(`/api/vehicles/${vehicleId}`);
      Alert.alert(
        'Successo',
        'Veicolo eliminato con successo',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      
      if (err.response && err.response.data && err.response.data.message) {
        Alert.alert('Errore', err.response.data.message);
      } else {
        Alert.alert('Errore', 'Impossibile eliminare il veicolo. Riprova più tardi.');
      }
      setDeleting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento in corso...</Text>
      </View>
    );
  }
  
  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>Impossibile caricare i dati del veicolo</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchVehicleData}
        >
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with vehicle icon instead of image */}
        <View style={styles.imageContainer}>
          <View style={styles.vehicleIconContainer}>
            <Ionicons name="car" size={80} color="#007AFF" />
          </View>
          <View style={styles.badgeContainer}>
            {vehicle.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Predefinito</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Informazioni veicolo */}
        <View style={styles.infoContainer}>
          <Text style={styles.vehicleName}>{vehicle.nickname}</Text>
          <Text style={styles.vehicleModel}>{vehicle.make} {vehicle.model} {vehicle.year}</Text>
          
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Dettagli</Text>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Marca</Text>
              <Text style={styles.detailValue}>{vehicle.make}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Modello</Text>
              <Text style={styles.detailValue}>{vehicle.model}</Text>
            </View>
            
            {vehicle.year && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Anno</Text>
                <Text style={styles.detailValue}>{vehicle.year}</Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Veicolo predefinito</Text>
              <View style={[styles.statusIndicator, vehicle.isDefault ? styles.activeStatus : styles.inactiveStatus]}>
                <Text style={[styles.statusText, vehicle.isDefault ? styles.activeStatusText : styles.inactiveStatusText]}>
                  {vehicle.isDefault ? 'Sì' : 'No'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Pulsanti azioni */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={confirmDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="delete-outline" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Elimina</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEdit}
          disabled={deleting}
        >
          <Icon name="pencil-outline" size={20} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Modifica</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#E1F5FE',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 16,
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  inactiveStatus: {
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatusText: {
    color: '#007AFF',
  },
  inactiveStatusText: {
    color: '#8E8E93',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deleteButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  editButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default VehicleDetailScreen; 