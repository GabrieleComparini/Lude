import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../../../styles/theme';
import { API_URL } from '../../../config/apiConfig';
import { useAuth } from '../../../context/authContext';

const CommunityScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [communities, setCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('explore');

  // Fetch public communities
  const fetchPublicCommunities = async () => {
    try {
      const response = await axios.get(`${API_URL}/communities`);
      setCommunities(response.data.communities);
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };

  // Fetch user's joined communities
  const fetchUserCommunities = async () => {
    try {
      const response = await axios.get(`${API_URL}/communities/my`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      });
      setUserCommunities(response.data);
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPublicCommunities();
      if (user?.token) {
        await fetchUserCommunities();
      }
      setLoading(false);
    };
    
    loadData();
  }, [user?.token]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'explore') {
      await fetchPublicCommunities();
    } else {
      await fetchUserCommunities();
    }
    setRefreshing(false);
  };

  // Navigate to community details
  const handleCommunitySectionPress = (community) => {
    navigation.navigate('CommunityDetails', { communityId: community._id });
  };

  // Search communities
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPublicCommunities();
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/communities/search?query=${searchQuery}`);
      setCommunities(response.data);
    } catch (error) {
      console.error('Error searching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new community
  const handleCreateCommunity = () => {
    navigation.navigate('CreateCommunity');
  };

  // Render community card
  const renderCommunityCard = ({ item }) => (
    <TouchableOpacity
      style={styles.communityCard}
      onPress={() => handleCommunitySectionPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={item.coverImage ? { uri: item.coverImage } : require('../../../assets/images/default-cover.png')}
        style={styles.cardCoverImage}
      />
      <View style={styles.avatarContainer}>
        <Image
          source={item.avatar ? { uri: item.avatar } : require('../../../assets/images/default-avatar.png')}
          style={styles.avatar}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.communityDescription} numberOfLines={2}>
          {item.description || 'No description provided'}
        </Text>
        <View style={styles.communityStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>{item.membersCount || 0} members</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="text-box-multiple" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>{item.postsCount || 0} posts</Text>
          </View>
          {item.isPublic === false && (
            <View style={styles.privateTag}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
              <Text style={styles.privateTagText}>Private</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Display appropriate content based on loading state and active tab
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      );
    }

    const dataToShow = activeTab === 'explore' ? communities : userCommunities;
    
    if (dataToShow.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name={activeTab === 'explore' ? "compass-off" : "account-group-outline"} 
            size={70} 
            color={theme.colors.gray}
          />
          <Text style={styles.emptyText}>
            {activeTab === 'explore' 
              ? 'No communities found' 
              : 'You haven\'t joined any communities yet'}
          </Text>
          {activeTab === 'my' && (
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => setActiveTab('explore')}
            >
              <Text style={styles.exploreButtonText}>Explore Communities</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={dataToShow}
        keyExtractor={(item) => item._id}
        renderItem={renderCommunityCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateCommunity}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                fetchPublicCommunities();
              }}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
          onPress={() => setActiveTab('explore')}
        >
          <Ionicons 
            name="compass" 
            size={20} 
            color={activeTab === 'explore' ? theme.colors.primary : theme.colors.gray} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'explore' && styles.activeTabText
            ]}
          >
            Explore
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'my' ? theme.colors.primary : theme.colors.gray} 
          />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'my' && styles.activeTabText
            ]}
          >
            My Communities
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: theme.colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    marginLeft: 5,
    fontSize: 16,
    color: theme.colors.gray,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 17,
    color: theme.colors.gray,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  exploreButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  cardCoverImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  avatarContainer: {
    position: 'absolute',
    top: 60,
    left: 15,
    backgroundColor: '#fff',
    borderRadius: 35,
    padding: 3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardContent: {
    padding: 15,
    paddingTop: 40,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  communityDescription: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 15,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  statText: {
    marginLeft: 5,
    fontSize: 13,
    color: theme.colors.grayDark,
  },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
  },
  privateTagText: {
    marginLeft: 3,
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default CommunityScreen; 