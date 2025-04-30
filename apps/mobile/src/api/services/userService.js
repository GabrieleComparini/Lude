import apiClient from '../client';

/**
 * Search for users by query string
 * @param {string} query - Search query for username, name, etc.
 * @returns {Promise} Promise with search results
 */
export const searchUsers = async (query) => {
  try {
    const response = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
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
    const response = await apiClient.get('/api/analytics/summary');
    return response.data;
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
}; 