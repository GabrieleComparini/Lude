import apiClient from '../client';

/**
 * Get feed of tracks from users the current user follows
 * @param {object} options - Optional parameters like page, limit
 * @returns {Promise} Promise with feed data
 */
export const getFriendsFeed = async (options = {}) => {
  const { page = 1, limit = 10 } = options;
  try {
    const response = await apiClient.get('/api/social/feed/friends', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting friends feed:', error);
    throw error;
  }
};

/**
 * Get feed of popular tracks globally
 * @param {object} options - Optional parameters like page, limit, sortBy
 * @returns {Promise} Promise with feed data
 */
export const getGlobalFeed = async (options = {}) => {
  const { page = 1, limit = 10, sortBy = 'popular' } = options;
  try {
    const response = await apiClient.get('/api/social/feed/popular', {
      params: { page, limit, sortBy }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting global feed:', error);
    throw error;
  }
};

/**
 * Like a track
 * @param {string} trackId - ID of the track to like
 * @returns {Promise} Promise with like status
 */
export const likeTrack = async (trackId) => {
  try {
    const response = await apiClient.post(`/api/tracks/${trackId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error liking track:', error);
    throw error;
  }
};

/**
 * Unlike a track
 * @param {string} trackId - ID of the track to unlike
 * @returns {Promise} Promise with unlike status
 */
export const unlikeTrack = async (trackId) => {
  try {
    const response = await apiClient.post(`/api/tracks/${trackId}/unlike`);
    return response.data;
  } catch (error) {
    console.error('Error unliking track:', error);
    throw error;
  }
};

/**
 * Get comments for a track
 * @param {string} trackId - ID of the track
 * @returns {Promise} Promise with comments data
 */
export const getTrackComments = async (trackId) => {
  try {
    const response = await apiClient.get(`/api/tracks/${trackId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error getting track comments:', error);
    throw error;
  }
};

/**
 * Add a comment to a track
 * @param {string} trackId - ID of the track
 * @param {string} content - Comment content
 * @returns {Promise} Promise with new comment data
 */
export const addTrackComment = async (trackId, content) => {
  try {
    const response = await apiClient.post(`/api/tracks/${trackId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error('Error adding track comment:', error);
    throw error;
  }
}; 