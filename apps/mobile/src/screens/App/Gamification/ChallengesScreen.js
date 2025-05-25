import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { theme } from '../../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress'; // Need to install react-native-progress

// Dummy data
const dummyChallenges = [
  { _id: '1', title: 'Sfida Settimanale: Distanza', description: 'Percorri 100 km questa settimana', progress: 75, target: 100, unit: 'km', reward: 'XP +100', type: 'weekly' },
  { _id: '2', title: 'Sfida Mensile: Top Speed', description: 'Raggiungi i 250 km/h in un singolo tracciato', progress: 0, target: 1, unit: 'record', reward: 'Badge Esclusivo', type: 'monthly' },
  { _id: '3', title: 'Sfida Speciale: Esplorazione', description: 'Registra tracciati in 3 città diverse', progress: 1, target: 3, unit: 'città', reward: 'XP +250', type: 'special' },
];

const ChallengeItem = ({ item }) => {
  const progressValue = item.target > 0 ? item.progress / item.target : 0;
  const isCompleted = progressValue >= 1;

  return (
    <View style={[styles.itemContainer, isCompleted && styles.itemCompleted]}>
      <View style={styles.header}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {isCompleted && <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />}
      </View>
      <Text style={styles.itemDescription}>{item.description}</Text>
      
      <View style={styles.progressContainer}>
         <Progress.Bar 
            progress={progressValue}
            width={null} // Use container width
            color={isCompleted ? theme.colors.success : theme.colors.primary}
            unfilledColor={theme.colors.border}
            borderWidth={0}
            height={8}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {item.progress} / {item.target} {item.unit}
          </Text>
      </View>
      
      {!isCompleted && (
          <View style={styles.rewardContainer}>
              <Ionicons name="gift-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.rewardText}>Ricompensa: {item.reward}</Text>
          </View>
      )}
    </View>
  );
};

const ChallengesScreen = () => {
  // Replace with API state
  const loading = false;
  const challenges = dummyChallenges;

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />;
  }

  return (
    <FlatList
      data={challenges}
      renderItem={ChallengeItem}
      keyExtractor={(item) => item._id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={() => (
          <View style={styles.titleContainer}>
              <Text style={styles.title}>Sfide Attive</Text>
              {/* TODO: Add Tabs for Active/Completed/Expired? */}
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
      padding: 15,
  },
  loader: {
    marginTop: 30,
  },
  titleContainer: {
      marginBottom: 15,
      alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  itemContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemCompleted: {
      borderColor: theme.colors.success,
      // backgroundColor: theme.colors.successSurface, // Optional: subtle background change
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.text,
    flexShrink: 1, // Allow title to shrink if needed
    marginRight: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 15,
  },
  progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
  },
  progressBar: {
      flex: 1,
      marginRight: 10,
      borderRadius: 4,
  },
  progressText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
  },
  rewardContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
  },
  rewardText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginLeft: 5,
      fontStyle: 'italic',
  }
});

export default ChallengesScreen; 