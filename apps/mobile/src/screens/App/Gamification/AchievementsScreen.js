import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

// Dummy data for now
const dummyAchievements = [
  { _id: '1', title: 'First Track', description: 'Hai salvato il tuo primo tracciato!', achieved: true, icon: 'ribbon' },
  { _id: '2', title: 'Speed Demon', description: 'Hai superato i 200 km/h!', achieved: true, icon: 'flash' },
  { _id: '3', title: 'Night Rider', description: 'Hai registrato un tracciato di notte.', achieved: false, icon: 'moon' },
  { _id: '4', title: 'Globetrotter', description: 'Hai percorso 1000 km totali.', achieved: false, icon: 'map' },
];

const AchievementItem = ({ item }) => (
  <View style={[styles.itemContainer, !item.achieved && styles.itemContainerLocked]}>
    <Ionicons 
      name={item.icon || 'star'} 
      size={30} 
      color={item.achieved ? theme.colors.primary : theme.colors.textSecondary} 
      style={styles.icon}
    />
    <View style={styles.textContainer}>
      <Text style={[styles.itemTitle, !item.achieved && styles.itemTextLocked]}>{item.title}</Text>
      <Text style={[styles.itemDescription, !item.achieved && styles.itemTextLocked]}>{item.description}</Text>
    </View>
    {item.achieved && <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />}
  </View>
);

const AchievementsScreen = () => {
  // Replace with API call state: const [achievements, setAchievements] = useState([]); const [loading, setLoading] = useState(true);
  const loading = false; // Simulate loading finished
  const achievements = dummyAchievements; // Use dummy data

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />;
  }

  return (
    <FlatList
      data={achievements}
      renderItem={AchievementItem}
      keyExtractor={(item) => item._id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={() => <Text style={styles.title}>Obiettivi Sbloccati</Text>}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
      padding: 15,
  },
  loader: {
    marginTop: 30,
  },
  title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.primary, // Highlight achieved
  },
  itemContainerLocked: {
      borderLeftColor: theme.colors.border,
      opacity: 0.7,
  },
  icon: {
      marginRight: 15,
  },
  textContainer: {
      flex: 1,
      marginRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  itemTextLocked: {
      color: theme.colors.textSecondary,
  }
});

export default AchievementsScreen; 