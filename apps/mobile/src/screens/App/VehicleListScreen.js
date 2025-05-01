import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

// Componente per visualizzare un singolo veicolo nella lista
const VehicleItem = ({ vehicle, onPress, onDelete }) => {
  const { nickname, make, model, year, isDefault } = vehicle;
  
  return (
    <TouchableOpacity style={styles.vehicleItem} onPress={onPress}>
      <View style={styles.vehicleContent}>
        <View style={styles.vehicleImagePlaceholder}>
          <Ionicons name="car" size={32} color="#007AFF" />
        </View>
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleHeader}>
            <Text style={styles.vehicleName}>{nickname}</Text>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.vehicleDetails}>
            {make} {model} {year ? `(${year})` : ''}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
};

const VehicleListScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const navigation = useNavigation();
  
  // Carica i veicoli dell'utente
  const loadVehicles = async (shouldRefresh = false) => {
    if (shouldRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      const response = await apiClient.get('/api/vehicles');
      setVehicles(response.data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Impossibile caricare i tuoi veicoli. Riprova più tardi.');
      Alert.alert('Errore', 'Impossibile caricare i tuoi veicoli. Riprova più tardi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Carica i dati iniziali
  useEffect(() => {
    loadVehicles();
  }, []);
  
  // Gestisce l'eliminazione di un veicolo
  const handleDeleteVehicle = (vehicle) => {
    Alert.alert(
      'Elimina Veicolo',
      `Sei sicuro di voler eliminare "${vehicle.nickname}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/vehicles/${vehicle._id}`);
              // Ricarica la lista dopo l'eliminazione
              loadVehicles();
              Alert.alert('Successo', 'Veicolo eliminato con successo');
            } catch (err) {
              console.error('Error deleting vehicle:', err);
              Alert.alert('Errore', 'Impossibile eliminare il veicolo. Riprova più tardi.');
            }
          }
        }
      ]
    );
  };
  
  // Gestisce il refresh quando si trascina verso il basso
  const handleRefresh = () => {
    loadVehicles(true);
  };
  
  // Gestisce la navigazione verso la schermata di aggiunta veicolo
  const handleAddVehicle = () => {
    navigation.navigate('AddEditVehicle');
  };
  
  // Gestisce la navigazione verso la schermata di modifica veicolo
  const handleEditVehicle = (vehicle) => {
    navigation.navigate('AddEditVehicle', { vehicleId: vehicle._id });
  };
  
  // Renderizza il messaggio di lista vuota
  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="car-outline" size={64} color="#CCCCCC" />
        <Text style={styles.emptyTitle}>Nessun veicolo trovato</Text>
        <Text style={styles.emptyText}>Aggiungi il tuo primo veicolo</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <FlatList
        data={vehicles}
        renderItem={({ item }) => (
          <VehicleItem
            vehicle={item}
            onPress={() => handleEditVehicle(item)}
            onDelete={() => handleDeleteVehicle(item)}
          />
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={vehicles.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={renderEmptyList}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>I Tuoi Veicoli</Text>
            <Text style={styles.headerSubtitle}>
              {vehicles.length === 0 
                ? 'Aggiungi i tuoi veicoli per tracciare le tue corse' 
                : `Hai ${vehicles.length} ${vehicles.length === 1 ? 'veicolo' : 'veicoli'}`
              }
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
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
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  vehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#E1F5FE',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#666666',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    margin: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VehicleListScreen; 