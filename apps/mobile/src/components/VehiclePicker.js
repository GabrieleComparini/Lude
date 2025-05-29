import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserVehicles } from '../api/services/vehicleService';

const VehiclePicker = ({ selectedVehicleId, onVehicleSelect, disabled = false }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Get selected vehicle from the list
  const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId);
  
  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);
  
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const vehiclesData = await getUserVehicles();
      setVehicles(vehiclesData);
      
      // If no vehicle is selected but we have vehicles, select the default one
      if (!selectedVehicleId && vehiclesData.length > 0) {
        const defaultVehicle = vehiclesData.find(v => v.isDefault);
        if (defaultVehicle) {
          onVehicleSelect(defaultVehicle._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError('Impossibile caricare i veicoli');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVehicleSelect = (vehicle) => {
    onVehicleSelect(vehicle._id);
    setModalVisible(false);
  };
  
  const renderVehicleItem = ({ item }) => {
    const isSelected = item._id === selectedVehicleId;
    
    return (
      <TouchableOpacity
        style={[styles.vehicleItem, isSelected && styles.selectedItem]}
        onPress={() => handleVehicleSelect(item)}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.vehicleImage} />
        ) : (
          <View style={styles.vehicleImagePlaceholder}>
            <Ionicons 
              name={item.type === 'car' ? 'car' : item.type === 'motorcycle' ? 'bicycle' : 'speedometer'} 
              size={24} 
              color="#999"
            />
          </View>
        )}
        
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{item.nickname}</Text>
          {item.make && (
            <Text style={styles.vehicleDetails}>
              {item.make} {item.model} {item.year || ''}
            </Text>
          )}
          {item.isDefault && <Text style={styles.defaultBadge}>Predefinito</Text>}
        </View>
        
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.pickerButtonDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : selectedVehicle ? (
          <>
            <View style={styles.selectedVehicleContainer}>
              {selectedVehicle.imageUrl ? (
                <Image source={{ uri: selectedVehicle.imageUrl }} style={styles.selectedVehicleImage} />
              ) : (
                <View style={styles.vehicleImagePlaceholder}>
                  <Ionicons 
                    name={selectedVehicle.type === 'car' ? 'car' : selectedVehicle.type === 'motorcycle' ? 'bicycle' : 'speedometer'} 
                    size={20} 
                    color="#999"
                  />
                </View>
              )}
              <Text style={styles.selectedVehicleText}>{selectedVehicle.nickname}</Text>
            </View>
          </>
        ) : error ? (
          <Text style={styles.errorText}>Errore nel caricamento</Text>
        ) : (
          <Text style={styles.placeholderText}>Seleziona un veicolo</Text>
        )}
        <Ionicons name="chevron-down" size={20} color={disabled ? "#999" : "#333"} />
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Veicolo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.modalLoading} />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchVehicles}>
                  <Text style={styles.retryButtonText}>Riprova</Text>
                </TouchableOpacity>
              </View>
            ) : vehicles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="car-outline" size={50} color="#999" />
                <Text style={styles.emptyText}>Non hai ancora aggiunto veicoli</Text>
              </View>
            ) : (
              <FlatList
                data={vehicles}
                renderItem={renderVehicleItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.vehiclesList}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: '#fff',
  },
  pickerButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  selectedVehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedVehicleImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  selectedVehicleText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#d9534f',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLoading: {
    padding: 30,
  },
  vehiclesList: {
    paddingBottom: 30, // Extra space at the bottom
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#f0f7ff',
  },
  vehicleImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  vehicleImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  defaultBadge: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  checkmarkContainer: {
    marginLeft: 10,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  }
});

export default VehiclePicker; 