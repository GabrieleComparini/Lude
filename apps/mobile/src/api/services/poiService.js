import client from '../client';

/**
 * Get POIs with optional filters
 * @param {Object} params - Query parameters
 * @param {number} params.lat - Latitude for geospatial search
 * @param {number} params.lng - Longitude for geospatial search
 * @param {number} params.radius - Search radius in meters (default: 10000)
 * @param {string} params.category - Category ID to filter by
 * @param {string} params.search - Search term
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Results per page (default: 20)
 * @param {string} params.sort - Sort field and direction (default: -createdAt)
 * @returns {Promise<Object>} Paginated POIs data
 */
export const getPOIs = async (params = {}) => {
  const response = await client.get('/api/pois', { params });
  return response.data;
};

/**
 * Get a single POI by ID
 * @param {string} id - POI ID
 * @returns {Promise<Object>} POI data
 */
export const getPOIById = async (id) => {
  const response = await client.get(`/api/pois/${id}`);
  return response.data;
};

/**
 * Create a new POI
 * @param {Object} poiData - POI data to create
 * @returns {Promise<Object>} Created POI data
 */
export const createPOI = async (poiData) => {
  const response = await client.post('/api/pois', poiData);
  return response.data;
};

/**
 * Update a POI
 * @param {string} id - POI ID
 * @param {Object} poiData - POI data to update
 * @returns {Promise<Object>} Updated POI data
 */
export const updatePOI = async (id, poiData) => {
  const response = await client.put(`/api/pois/${id}`, poiData);
  return response.data;
};

/**
 * Delete a POI
 * @param {string} id - POI ID
 * @returns {Promise<Object>} Success message
 */
export const deletePOI = async (id) => {
  const response = await client.delete(`/api/pois/${id}`);
  return response.data;
};

/**
 * Upload an image to a POI
 * @param {string} poiId - POI ID
 * @param {Object} imageData - Image data { url, caption }
 * @returns {Promise<Object>} Created image data
 */
export const addPOIImage = async (poiId, imageData) => {
  const response = await client.post(`/api/pois/${poiId}/images`, imageData);
  return response.data;
};

/**
 * Delete an image from a POI
 * @param {string} poiId - POI ID
 * @param {string} imageId - Image ID
 * @returns {Promise<Object>} Success message
 */
export const removePOIImage = async (poiId, imageId) => {
  const response = await client.delete(`/api/pois/${poiId}/images/${imageId}`);
  return response.data;
};

/**
 * Get all POI categories
 * @returns {Promise<Array>} List of categories
 */
export const getCategories = async () => {
  const response = await client.get('/api/pois/categories');
  return response.data;
};

/**
 * Get reviews for a POI
 * @param {string} poiId - POI ID
 * @param {Object} params - Query parameters 
 * @returns {Promise<Object>} Paginated reviews data
 */
export const getPOIReviews = async (poiId, params = {}) => {
  const response = await client.get(`/api/pois/${poiId}/reviews`, { params });
  return response.data;
};

/**
 * Create a review for a POI
 * @param {string} poiId - POI ID
 * @param {Object} reviewData - Review data { rating, comment, images, visitDate, tags }
 * @returns {Promise<Object>} Created review data
 */
export const createReview = async (poiId, reviewData) => {
  const response = await client.post(`/api/pois/${poiId}/reviews`, reviewData);
  return response.data;
};

/**
 * Update a review
 * @param {string} poiId - POI ID
 * @param {string} reviewId - Review ID
 * @param {Object} reviewData - Review data to update
 * @returns {Promise<Object>} Updated review data
 */
export const updateReview = async (poiId, reviewId, reviewData) => {
  const response = await client.put(`/api/pois/${poiId}/reviews/${reviewId}`, reviewData);
  return response.data;
};

/**
 * Delete a review
 * @param {string} poiId - POI ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Success message
 */
export const deleteReview = async (poiId, reviewId) => {
  const response = await client.delete(`/api/pois/${poiId}/reviews/${reviewId}`);
  return response.data;
};

/**
 * Mark a review as helpful
 * @param {string} poiId - POI ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object>} Updated helpful count
 */
export const markReviewHelpful = async (poiId, reviewId) => {
  const response = await client.post(`/api/pois/${poiId}/reviews/${reviewId}/helpful`);
  return response.data;
};

export default {
  getPOIs,
  getPOIById,
  createPOI,
  updatePOI,
  deletePOI,
  addPOIImage,
  removePOIImage,
  getCategories,
  getPOIReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful
}; 