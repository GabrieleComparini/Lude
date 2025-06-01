import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { searchUsers } from '../../api/services/userService';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Reset search results when screen is focused
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchQuery('');
        setSearchResults([]);
      };
    }, [])
  );

  // Handle search with real API
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    // Clear results immediately if query is empty
    if (query.trim() === '') {
      setSearchResults([]);
      setError(null); // Also clear previous errors
      setIsLoading(false); // Ensure loading is stopped
      return;
    }
    
    // Require minimum length (e.g., 2 characters) before searching
    if (query.trim().length < 2) {
      setSearchResults([]); // Clear results if query is too short
      setError(null); // Clear errors
      // Optional: Set an error message like setError('Inserisci almeno 2 caratteri per cercare.')
      setIsLoading(false); // Stop loading if previously started by a longer query
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await searchUsers(query);
      console.log('Search results structure:', JSON.stringify(response));
      
      // Handle different response formats
      let usersArray = [];
      if (Array.isArray(response)) {
        usersArray = response;
      } else if (response && Array.isArray(response.data)) {
        usersArray = response.data;
      } else if (response && Array.isArray(response.users)) {
        usersArray = response.users;
      } else if (response && typeof response === 'object') {
        // If it's an object but not in expected format, try to extract array
        console.log('Unexpected response format, attempting to extract users');
        const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          usersArray = possibleArrays[0];
        }
      }
      
      console.log('Processed users array:', usersArray.length, 'users found');
      setSearchResults(usersArray);
      
      if (usersArray.length === 0) {
        console.log('No users found in the response');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Si è verificato un errore durante la ricerca. Riprova più tardi.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToUserProfile = (username) => {
    navigation.navigate('PublicProfile', { username });
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigateToUserProfile(item.username)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.name}>{item.name || item.username}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top }
    ]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca utenti..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item._id || item.id || item.username}
          contentContainerStyle={styles.listContainer}
        />
      ) : searchQuery.length > 0 && searchQuery.length < 2 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Inserisci almeno 2 caratteri</Text>
        </View>
      ) : searchQuery.length > 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Nessun utente trovato</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={80} color="#333" />
          <Text style={styles.emptyStateText}>Cerca utenti per nome o username</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    color: '#999',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  }
});

export default SearchScreen; 