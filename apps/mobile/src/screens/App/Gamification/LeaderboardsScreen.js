import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { theme } from '../../../styles/theme';

// Dummy data
const dummyLeaderboard = [
  { _id: '1', rank: 1, username: 'Speedster', name: 'Marco Rossi', value: 5250.5, unit: 'km' },
  { _id: '2', rank: 2, username: 'RoadRunner', name: 'Giulia Bianchi', value: 4890.2, unit: 'km' },
  { _id: '3', rank: 3, username: 'User123', name: 'Luca Verdi', value: 4500.0, unit: 'km' },
  { _id: '4', rank: 4, username: 'TrailBlazer', name: 'Sofia Neri', value: 4100.8, unit: 'km' },
  { _id: '5', rank: 5, username: 'You', name: 'Il Tuo Nome', value: 3950.1, unit: 'km', isCurrentUser: true },
];

const LeaderboardItem = ({ item }) => (
  <View style={[styles.itemContainer, item.isCurrentUser && styles.currentUserItem]}>
     <Text style={styles.rank}>{item.rank}</Text>
     <Image 
        source={item.profileImage ? { uri: item.profileImage } : require('../../../assets/images/default_profile.png')}
        style={styles.avatar}
     />
     <View style={styles.userInfo}>
        <Text style={styles.name}>{item.name || item.username}</Text>
        <Text style={styles.username}>@{item.username}</Text>
     </View>
     <View style={styles.valueContainer}>
         <Text style={styles.value}>{item.value.toFixed(1)}</Text>
         <Text style={styles.unit}>{item.unit}</Text>
     </View>
  </View>
);

const LeaderboardsScreen = () => {
  // Replace with API call: const [leaderboardData, setLeaderboardData] = useState([]); const [loading, setLoading] = useState(true); 
  // Need state for selected leaderboard type (e.g., distance, top speed)
  const loading = false;
  const leaderboardData = dummyLeaderboard;

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />;
  }

  return (
    <FlatList
      data={leaderboardData}
      renderItem={LeaderboardItem}
      keyExtractor={(item) => item._id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={() => (
          <View style={styles.headerContainer}>
              <Text style={styles.title}>Classifica Globale</Text>
              <Text style={styles.subtitle}>Basata sulla distanza totale</Text>
              {/* TODO: Add picker/tabs to switch leaderboard type */}
          </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
      paddingBottom: 20,
  },
  loader: {
    marginTop: 30,
  },
  headerContainer: {
      padding: 20,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currentUserItem: {
      backgroundColor: theme.colors.surface, // Highlight current user
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
  },
  rank: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      width: 30,
      textAlign: 'center',
      marginRight: 10,
  },
  avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 15,
      backgroundColor: theme.colors.surface,
  },
  userInfo: {
      flex: 1,
  },
  name: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
  },
  username: {
      fontSize: 14,
      color: theme.colors.textSecondary,
  },
  valueContainer: {
      alignItems: 'flex-end',
  },
  value: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
  },
  unit: {
      fontSize: 12,
      color: theme.colors.textSecondary,
  }
});

export default LeaderboardsScreen; 