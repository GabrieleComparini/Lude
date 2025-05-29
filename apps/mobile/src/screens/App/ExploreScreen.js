import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Questo componente serve solo come reindirizzamento alla nuova schermata dei feed
const ExploreScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Reindirizza alla nuova schermata dei feed
    navigation.reset({
      index: 0,
      routes: [{ name: 'ExploreFeed' }],
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default ExploreScreen; 