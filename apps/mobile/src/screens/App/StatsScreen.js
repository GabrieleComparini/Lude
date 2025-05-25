import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { formatDistance, formatTime, formatSpeed } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const StatsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Imposta le statistiche iniziali dai dati dell'utente
    if (user && user.statistics) {
      setStats(user.statistics);
    }
  }, [user]);

  // Funzione per aggiornare le statistiche
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Qui potremmo fare una chiamata API per aggiornare le statistiche
    // Per ora usiamo solo i dati presenti nell'oggetto user
    setTimeout(() => {
      if (user && user.statistics) {
        setStats(user.statistics);
      }
      setRefreshing(false);
    }, 1000);
  };

  // Renderizza una card con statistica
  const renderStatCard = (icon, title, value, unit) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={28} color="#007AFF" style={styles.statIcon} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );

  // Renderizza la sezione con le statistiche principali
  const renderMainStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsGrid}>
        {renderStatCard(
          'map-outline', 
          'Distanza Totale', 
          formatDistance(stats.totalDistance || 0), 
          'km'
        )}
        
        {renderStatCard(
          'time-outline', 
          'Tempo Totale', 
          formatTime(stats.totalTime || 0), 
          ''
        )}
        
        {renderStatCard(
          'speedometer-outline', 
          'Velocità Top', 
          formatSpeed(stats.topSpeed || 0), 
          'km/h'
        )}
        
        {renderStatCard(
          'analytics-outline', 
          'Velocità Media', 
          formatSpeed(stats.avgSpeed || 0), 
          'km/h'
        )}
      </View>
    );
  };

  // Renderizza la sezione delle statistiche di utilizzo
  const renderUsageStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.usageContainer}>
        <Text style={styles.sectionTitle}>Statistiche di Utilizzo</Text>
        
        <View style={styles.usageStat}>
          <View style={styles.usageIconContainer}>
            <Ionicons name="calendar-outline" size={22} color="#007AFF" />
          </View>
          <View style={styles.usageTextContainer}>
            <Text style={styles.usageLabel}>Tracciati Totali</Text>
            <Text style={styles.usageValue}>{stats.totalTracks || 0}</Text>
          </View>
        </View>

        {/* Qui si potrebbero aggiungere altre statistiche di utilizzo se disponibili */}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Caricamento statistiche...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#007AFF']}
        />
      }
    >
      <Text style={styles.header}>Le tue Statistiche</Text>
      
      {renderMainStats()}
      
      {renderUsageStats()}
      
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          Trascina verso il basso per aggiornare le statistiche.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 40) / 2,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statUnit: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  usageContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  usageStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  usageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1f5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  usageTextContainer: {
    flex: 1,
  },
  usageLabel: {
    fontSize: 14,
    color: '#666',
  },
  usageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
});

export default StatsScreen; 