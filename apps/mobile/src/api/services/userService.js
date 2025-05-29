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
    const response = await apiClient.get(`/api/users/profile/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
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