import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente che mostra i dettagli del veicolo in una card
 * @param {Object} vehicle - Oggetto veicolo
 * @param {boolean} showDefault - Indica se mostrare badge "predefinito"
 * @param {function} onPress - Callback quando si preme sulla card
 */
const VehicleCard = ({ vehicle, showDefault = true, onPress }) => {
  if (!vehicle) return null;

  // Determina le icone per la potenza (basata sulla potenza del veicolo)
  const renderPowerIcons = () => {
    const horsePower = vehicle.horsePower || 0;
    
    if (horsePower >= 300) {
      return (
        <View style={styles.iconGroup}>
          <Ionicons name="flash" size={18} color="#FF9500" />
          <Ionicons name="flash" size={18} color="#FF9500" />
          <Ionicons name="flash" size={18} color="#FF9500" />
        </View>
      );
    } else if (horsePower >= 150) {
      return (
        <View style={styles.iconGroup}>
          <Ionicons name="flash" size={18} color="#FF9500" />
          <Ionicons name="flash" size={18} color="#FF9500" />
          <Ionicons name="flash-outline" size={18} color="#FF9500" />
        </View>
      );
    } else {
      return (
        <View style={styles.iconGroup}>
          <Ionicons name="flash" size={18} color="#FF9500" />
          <Ionicons name="flash-outline" size={18} color="#FF9500" />
          <Ionicons name="flash-outline" size={18} color="#FF9500" />
        </View>
      );
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="car" size={40} color="#007AFF" />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{vehicle.nickname}</Text>
          {showDefault && vehicle.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Predefinito</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.modelText}>{vehicle.make} {vehicle.model} {vehicle.year}</Text>
        
        <View style={styles.detailsRow}>
          {/* Potenza */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Potenza</Text>
            {renderPowerIcons()}
          </View>
          
          {/* Stato (stock o modificato) */}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Stato</Text>
            <View style={styles.iconWithText}>
              <Ionicons 
                name={vehicle.isModified ? "construct" : "checkmark-circle"} 
                size={18} 
                color={vehicle.isModified ? "#FF9500" : "#4CD964"} 
              />
              <Text style={styles.statusText}>
                {vehicle.isModified ? "Modificato" : "Stock"}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#999" style={styles.arrow} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#2c2c2e',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nickname: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  modelText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  iconGroup: {
    flexDirection: 'row',
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
  },
  arrow: {
    marginLeft: 8,
  },
});

export default VehicleCard; 