import axios from 'axios';
import { API_URL } from '../../config/api';

/**
 * Service for community-related API calls
 */
class CommunityService {
  /**
   * Get all public communities
   */
  async getPublicCommunities() {
    try {
      const response = await axios.get(`${API_URL}/communities`);
      return response.data.communities;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search communities by query
   * @param {string} query - Search query
   */
  async searchCommunities(query) {
    try {
      const response = await axios.get(`${API_URL}/communities/search?query=${query}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's joined communities
   * @param {string} token - User authentication token
   */
  async getUserCommunities(token) {
    try {
      const response = await axios.get(`${API_URL}/communities/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get communities managed by the user
   * @param {string} token - User authentication token
   */
  async getManagedCommunities(token) {
    try {
      const response = await axios.get(`${API_URL}/communities/managed`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get community details by ID
   * @param {string} communityId - Community ID
   * @param {string} token - Optional user authentication token
   */
  async getCommunityById(communityId, token = null) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/communities/${communityId}`, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new community
   * @param {object} communityData - Community data
   * @param {string} token - User authentication token
   */
  async createCommunity(communityData, token) {
    try {
      const response = await axios.post(`${API_URL}/communities`, communityData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a community
   * @param {string} communityId - Community ID
   * @param {object} updateData - Updated community data
   * @param {string} token - User authentication token
   */
  async updateCommunity(communityId, updateData, token) {
    try {
      const response = await axios.put(`${API_URL}/communities/${communityId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Join a community
   * @param {string} communityId - Community ID
   * @param {string} token - User authentication token
   */
  async joinCommunity(communityId, token) {
    try {
      const response = await axios.post(
        `${API_URL}/communities/${communityId}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Leave a community
   * @param {string} communityId - Community ID
   * @param {string} token - User authentication token
   */
  async leaveCommunity(communityId, token) {
    try {
      const response = await axios.post(
        `${API_URL}/communities/${communityId}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle a membership request
   * @param {string} communityId - Community ID
   * @param {string} userId - User ID of the request
   * @param {boolean} accept - Whether to accept or reject the request
   * @param {string} token - User authentication token
   */
  async handleMembershipRequest(communityId, userId, accept, token) {
    try {
      const response = await axios.put(
        `${API_URL}/communities/${communityId}/requests/${userId}`,
        { accept },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get community posts
   * @param {string} communityId - Community ID
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of posts per page
   * @param {string} token - Optional user authentication token
   */
  async getCommunityPosts(communityId, page = 1, limit = 10, token = null) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(
        `${API_URL}/communities/${communityId}/posts?page=${page}&limit=${limit}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a post in a community
   * @param {string} communityId - Community ID
   * @param {object} postData - Post data
   * @param {string} token - User authentication token
   */
  async createPost(communityId, postData, token) {
    try {
      const response = await axios.post(
        `${API_URL}/communities/${communityId}/posts`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comments for a post
   * @param {string} communityId - Community ID
   * @param {string} postId - Post ID
   * @param {string} token - Optional user authentication token
   */
  async getComments(communityId, postId, token = null) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(
        `${API_URL}/communities/${communityId}/posts/${postId}/comments`,
        { headers }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a comment to a post
   * @param {string} communityId - Community ID
   * @param {string} postId - Post ID
   * @param {object} commentData - Comment data
   * @param {string} token - User authentication token
   */
  async addComment(communityId, postId, commentData, token) {
    try {
      const response = await axios.post(
        `${API_URL}/communities/${communityId}/posts/${postId}/comments`,
        commentData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new CommunityService(); 