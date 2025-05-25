import apiClient from '../client';

/**
 * Search for users by query string
 * @param {string} query - Search query for username, name, etc.
 * @returns {Promise} Promise with search results
 */
export const searchUsers = async (query) => {
  try {
    // Add direct URL construction with explicit endpoint
    const url = `/api/users/search?q=${encodeURIComponent(query)}`;
    console.log('Making search request to:', url);
    
    // Set options for the request
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Remove any potentially problematic headers
        'Accept': 'application/json'
      }
    };
    
    const response = await apiClient.get(url, options);
    console.log('Search response:', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    // Log more details about the error for debugging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

/**
 * Get user profile data by username
 * @param {string} username - Username of the user to retrieve
 * @returns {Promise} Promise with user profile data
 */
export const getUserProfile = async (username) => {
  try {
    const response = await apiClient.get(`/api/users/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Follow a user
 * @param {string} username - Username of the user to follow
 * @returns {Promise} Promise with follow status
 */
export const followUser = async (username) => {
  try {
    const response = await apiClient.post(`/api/users/${username}/follow`);
    return response.data;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

/**
 * Unfollow a user
 * @param {string} username - Username of the user to unfollow
 * @returns {Promise} Promise with unfollow status
 */
export const unfollowUser = async (username) => {
  try {
    const response = await apiClient.post(`/api/users/${username}/unfollow`);
    return response.data;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

/**
 * Get user's following list
 * @returns {Promise} Promise with list of users the current user is following
 */
export const getFollowing = async () => {
  try {
    const response = await apiClient.get('/api/users/following');
    return response.data;
  } catch (error) {
    console.error('Error getting following list:', error);
    throw error;
  }
};

/**
 * Get user's followers list
 * @returns {Promise} Promise with list of users following the current user
 */
export const getFollowers = async () => {
  try {
    const response = await apiClient.get('/api/users/followers');
    return response.data;
  } catch (error) {
    console.error('Error getting followers list:', error);
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