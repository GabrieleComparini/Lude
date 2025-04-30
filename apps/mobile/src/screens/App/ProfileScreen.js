import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

// Placeholder components for section content
const StatsSection = ({ userStats }) => {
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Le mie statistiche</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats.totalDistance.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Km totali</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.floor(userStats.totalTime / 3600)}</Text>
          <Text style={styles.statLabel}>Ore totali</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats.topSpeed.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Km/h max</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userStats.avgSpeed.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Km/h media</Text>
        </View>
      </View>

      {/* Placeholder for speed distribution chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Distribuzione velocità</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Grafico distribuzione velocità</Text>
        </View>
      </View>
    </View>
  );
};

const HistoryItem = ({ track, onPress }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle}>{track.title}</Text>
        <Text style={styles.historyDate}>{formatDate(track.createdAt)}</Text>
        
        <View style={styles.historyStats}>
          <View style={styles.historyStat}>
            <Ionicons name="time-outline" size={14} color="#999" />
            <Text style={styles.historyStatText}>{formatDuration(track.duration)}</Text>
          </View>
          
          <View style={styles.historyStat}>
            <Ionicons name="resize-outline" size={14} color="#999" />
            <Text style={styles.historyStatText}>{track.distance.toFixed(1)} km</Text>
          </View>
          
          <View style={styles.historyStat}>
            <Ionicons name="speedometer-outline" size={14} color="#999" />
            <Text style={styles.historyStatText}>{track.avgSpeed.toFixed(1)} km/h</Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={22} color="#999" />
    </TouchableOpacity>
  );
};

const HistorySection = ({ tracks, onTrackPress }) => {
  return (
    <View style={styles.historyContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>I miei tracciati</Text>
        <Text style={styles.trackCount}>{tracks.length}</Text>
      </View>
      
      {tracks.map((track) => (
        <HistoryItem 
          key={track.id} 
          track={track} 
          onPress={() => onTrackPress(track.id)}
        />
      ))}
      
      {tracks.length === 0 && (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryText}>Nessun tracciato disponibile</Text>
        </View>
      )}
    </View>
  );
};

// Placeholder data
const PLACEHOLDER_USER_STATS = {
  totalDistance: 1250.8,  // km
  totalTime: 86400,       // seconds (24 hours)
  topSpeed: 180.5,        // km/h
  avgSpeed: 65.2,         // km/h
};

const PLACEHOLDER_TRACKS = [
  {
    id: 't1',
    title: 'Morning Ride',
    createdAt: new Date().toISOString(),
    distance: 12.5,
    duration: 3600, // in seconds
    avgSpeed: 25.3,
  },
  {
    id: 't2',
    title: 'Mountain Route',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
    distance: 28.3,
    duration: 7200, // in seconds
    avgSpeed: 22.1,
  },
  {
    id: 't3',
    title: 'City Tour',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    distance: 8.7,
    duration: 2400, // in seconds
    avgSpeed: 15.5,
  },
];

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [userStats, setUserStats] = useState(PLACEHOLDER_USER_STATS);
  const [userTracks, setUserTracks] = useState(PLACEHOLDER_TRACKS);

  // Add useEffect to fetch user data in real implementation

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleTrackPress = (trackId) => {
    navigation.navigate('TripDetail', { trackId });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user?.name || 'User Name'}</Text>
            <Text style={styles.username}>@{user?.username || 'username'}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Modifica Profilo</Text>
        </TouchableOpacity>
        
        <View style={styles.followStats}>
          <View style={styles.followStat}>
            <Text style={styles.followCount}>{user?.following || 0}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </View>
          
          <View style={styles.followStat}>
            <Text style={styles.followCount}>{user?.followers || 0}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </View>
        </View>
      </View>
      
      {/* Statistics Section */}
      <StatsSection userStats={userStats} />
      
      {/* Track History Section */}
      <HistorySection tracks={userTracks} onTrackPress={handleTrackPress} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  nameContainer: {
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 16,
    color: '#999',
  },
  editButton: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  followStats: {
    flexDirection: 'row',
  },
  followStat: {
    marginRight: 24,
  },
  followCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  followLabel: {
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackCount: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  // Stats section styles
  statsContainer: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginTop: 12,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  chartContainer: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#666',
  },
  // History section styles
  historyContainer: {
    padding: 16,
    backgroundColor: '#1c1c1e',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  historyStatText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: '#666',
    fontSize: 16,
  },
});

export default ProfileScreen; 