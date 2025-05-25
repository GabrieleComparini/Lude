import apiClient from '../client';

/**
 * Get user's tracks (paginated)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of tracks per page (default: 10)
 * @param {string} username - Optional username to get another user's public tracks
 * @returns {Promise} Promise with tracks data
 */
export const getUserTracks = async (page = 1, limit = 10, username = null) => {
  try {
    let endpoint = `/api/tracks/list?page=${page}&limit=${limit}`;
    
    // Se è specificato un username, ottieni i tracciati pubblici di quel utente
    if (username) {
      // Utilizziamo l'endpoint dei tracciati pubblici con filtro per username
      endpoint = `/api/tracks/public?page=${page}&limit=${limit}&username=${encodeURIComponent(username)}`;
    }
    
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching user tracks:', error);
    throw error;
  }
};

/**
 * Get track details by ID
 * @param {string} trackId - ID of the track to fetch
 * @returns {Promise} Promise with track data
 */
export const getTrackById = async (trackId) => {
  try {
    const response = await apiClient.get(`/api/tracks/${trackId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching track details:', error);
    throw error;
  }
};

/**
 * Save a new track
 * @param {Object} trackData - Track data object
 * @returns {Promise} Promise with saved track data
 */
export const saveTrack = async (trackData) => {
  try {
    const response = await apiClient.post('/api/tracks', trackData);
    return response.data;
  } catch (error) {
    console.error('Error saving track:', error);
    throw error;
  }
};

/**
 * Update track details
 * @param {string} trackId - ID of the track to update
 * @param {Object} updateData - Data to update (description, tags, isPublic)
 * @returns {Promise} Promise with updated track data
 */
export const updateTrack = async (trackId, updateData) => {
  try {
    const response = await apiClient.put(`/api/tracks/${trackId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating track:', error);
    throw error;
  }
};

/**
 * Delete a track
 * @param {string} trackId - ID of the track to delete
 * @returns {Promise} Promise with success message
 */
export const deleteTrack = async (trackId) => {
  try {
    const response = await apiClient.delete(`/api/tracks/${trackId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting track:', error);
    throw error;
  }
};

/**
 * Get public tracks (paginated)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of tracks per page (default: 10)
 * @returns {Promise} Promise with public tracks data
 */
export const getPublicTracks = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get(`/api/tracks/public?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public tracks:', error);
    throw error;
  }
}; 