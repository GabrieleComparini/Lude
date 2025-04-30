import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Placeholder data for user search results
const DUMMY_USERS = [
  { id: '1', username: 'user1', name: 'John Doe', avatar: null },
  { id: '2', username: 'user2', name: 'Jane Smith', avatar: null },
  { id: '3', username: 'user3', name: 'Mike Johnson', avatar: null },
  { id: '4', username: 'user4', name: 'Sarah Williams', avatar: null },
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  // Simulate search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      if (query.trim() === '') {
        setSearchResults([]);
      } else {
        const filtered = DUMMY_USERS.filter(user => 
          user.username.toLowerCase().includes(query.toLowerCase()) || 
          user.name.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
      setIsLoading(false);
    }, 500);
  };

  const navigateToUserProfile = (username) => {
    // In future: navigation.navigate('PublicProfile', { username })
    console.log('Navigate to profile for:', username);
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigateToUserProfile(item.username)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
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
  }
});

export default SearchScreen; 