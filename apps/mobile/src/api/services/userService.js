import apiClient from '../client';

/**
 * Search for users
 * @param {string} query - Search query
 * @param {Object} options - Query options (page, limit)
 * @returns {Promise} Promise with search results
 */
export const searchUsers = async (query, options = {}) => {
  const { page = 1, limit = 10 } = options;
  try {
    const response = await apiClient.get('/api/users/search', {
      params: { q: query, page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Get user profile by username
 * @param {string} username - Username to fetch
 * @returns {Promise} Promise with user profile data
 */
export const getUserProfile = async (username) => {
  try {
    // Prima prova il nuovo endpoint corretto
    try {
      const response = await apiClient.get(`/api/users/${username}`);
      return response.data;
    } catch (initialError) {
      console.log(`Tried new endpoint format but failed: ${initialError.message}`);
      
      // Se il nuovo endpoint fallisce, prova con l'endpoint legacy
      const fallbackResponse = await apiClient.get(`/api/users/profile/${username}`);
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // Restituisci un profilo predefinito in caso di errore 404
    if (error.response && error.response.status === 404) {
      console.log('Profilo non trovato, restituzione profilo predefinito');
      return {
        username: username,
        displayName: username,
        bio: 'Profilo non disponibile',
        profileImage: null,
        isFollowing: false,
        statistics: {
          totalDistance: 0,
          totalTime: 0,
          topSpeed: 0,
          avgSpeed: 0
        },
        followersCount: 0,
        followingCount: 0
      };
    }
    
    throw error;
  }
};

/**
 * Follow a user
 * @param {string} userId - ID of the user to follow
 * @returns {Promise} Promise with follow result
 */
export const followUser = async (userId) => {
  try {
    const response = await apiClient.post(`/api/users/${userId}/follow`);
    return response.data;
  } catch (error) {
    // Gestire specificamente l'errore "già seguendo"
    if (error.response && error.response.status === 400 && 
        error.response.data && error.response.data.message && 
        error.response.data.message.includes('already following')) {
      console.log('Already following this user, returning success anyway');
      // Restituisci un oggetto di successo simulato anziché propagare l'errore
      return { success: true, isFollowing: true };
    }
    
    console.error('Error following user:', error);
    throw error;
  }
};

/**
 * Unfollow a user
 * @param {string} userId - ID of the user to unfollow
 * @returns {Promise} Promise with unfollow result
 */
export const unfollowUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/api/users/${userId}/follow`);
    return response.data;
  } catch (error) {
    // Gestire specificamente l'errore "non stai seguendo"
    if (error.response && error.response.status === 400 && 
        error.response.data && error.response.data.message && 
        (error.response.data.message.includes('not following') || 
         error.response.data.message.includes('already not following'))) {
      console.log('Already not following this user, returning success anyway');
      // Restituisci un oggetto di successo simulato anziché propagare l'errore
      return { success: true, isFollowing: false };
    }
    
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

/**
 * Get users followed by current user
 * @param {Object} options - Query options (page, limit)
 * @returns {Promise} Promise with list of followed users
 */
export const getFollowing = async (options = {}) => {
  const { page = 1, limit = 20 } = options;
  try {
    const response = await apiClient.get('/api/users/following', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching following users:', error);
    throw error;
  }
};

/**
 * Get users who follow the current user
 * @param {Object} options - Query options (page, limit)
 * @returns {Promise} Promise with list of followers
 */
export const getFollowers = async (options = {}) => {
  const { page = 1, limit = 20 } = options;
  try {
    const response = await apiClient.get('/api/users/followers', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching followers:', error);
    throw error;
  }
};

/**
 * Get users followed by a specific user
 * @param {string} username - Username to get following list for
 * @param {Object} options - Query options (page, limit)
 * @returns {Promise} Promise with list of followed users
 */
export const getFollowingList = async (username, options = {}) => {
  const { page = 1, limit = 20 } = options;
  try {
    // Prima prova il nuovo endpoint
    try {
      const response = await apiClient.get(`/api/users/${username}/following`, {
        params: { page, limit }
      });
      return response.data;
    } catch (initialError) {
      console.log(`Tried new following endpoint format but failed: ${initialError.message}`);
      
      // Fallback all'endpoint legacy se esiste
      const fallbackResponse = await apiClient.get(`/api/users/profile/${username}/following`, {
        params: { page, limit }
      });
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching following list:', error);
    // In caso di errore, restituisci un array vuoto e non interrompere il flusso
    if (error.response && error.response.status === 404) {
      console.log('Following list not found, returning empty array');
      return { users: [] };
    }
    throw error;
  }
};

/**
 * Get users who follow a specific user
 * @param {string} username - Username to get followers list for
 * @param {Object} options - Query options (page, limit)
 * @returns {Promise} Promise with list of followers
 */
export const getFollowersList = async (username, options = {}) => {
  const { page = 1, limit = 20 } = options;
  try {
    // Prima prova il nuovo endpoint
    try {
      const response = await apiClient.get(`/api/users/${username}/followers`, {
        params: { page, limit }
      });
      return response.data;
    } catch (initialError) {
      console.log(`Tried new followers endpoint format but failed: ${initialError.message}`);
      
      // Fallback all'endpoint legacy se esiste
      const fallbackResponse = await apiClient.get(`/api/users/profile/${username}/followers`, {
        params: { page, limit }
      });
      return fallbackResponse.data;
    }
  } catch (error) {
    console.error('Error fetching followers list:', error);
    // In caso di errore, restituisci un array vuoto e non interrompere il flusso
    if (error.response && error.response.status === 404) {
      console.log('Followers list not found, returning empty array');
      return { users: [] };
    }
    throw error;
  }
};

/**
 * Get user's statistics summary
 * @returns {Promise} Promise with user's statistics data
 */
export const getUserStatistics = async () => {
  try {
    const url = '/api/analytics/summary';
    console.log('Making statistics request to:', url);
    
    // Set options for the request
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    const response = await apiClient.get(url, options);
    console.log('Statistics response:', response.status, JSON.stringify(response.data));
    
    if (!response.data) {
      throw new Error('Server returned empty statistics data');
    }
    
    // Restituiamo direttamente i dati dall'API senza manipolazioni
    return response.data;
  } catch (error) {
    console.error('Error getting user statistics:', error);
    // Log more details about the error for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // Throw the error instead of returning default stats
    throw error;
  }
}; 