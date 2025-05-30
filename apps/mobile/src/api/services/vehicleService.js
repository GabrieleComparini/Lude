import apiClient from '../client';

/**
 * Get user's vehicles
 * @returns {Promise} Promise with vehicles data
 */
export const getUserVehicles = async () => {
  try {
    const response = await apiClient.get('/api/vehicles');
    return response.data;
  } catch (error) {
    console.error('Error fetching user vehicles:', error);
    throw error;
  }
};

/**
 * Get vehicle details by ID
 * @param {string} vehicleId - ID of the vehicle to fetch
 * @returns {Promise} Promise with vehicle data
 */
export const getVehicleById = async (vehicleId) => {
  try {
    const response = await apiClient.get(`/api/vehicles/${vehicleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    throw error;
  }
};

/**
 * Get default vehicle for user
 * @returns {Promise} Promise with default vehicle data or null if none
 */
export const getDefaultVehicle = async () => {
  try {
    const vehicles = await getUserVehicles();
    return vehicles.find(vehicle => vehicle.isDefault) || null;
  } catch (error) {
    console.error('Error fetching default vehicle:', error);
    throw error;
  }
}; 

/**
 * Add a new vehicle
 * @param {Object} vehicleData - Vehicle data to add
 * @returns {Promise} Promise with the created vehicle data
 */
export const addVehicle = async (vehicleData) => {
  try {
    const response = await apiClient.post('/api/vehicles', vehicleData);
    return response.data;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

/**
 * Update a vehicle
 * @param {string} vehicleId - ID of the vehicle to update
 * @param {Object} vehicleData - Updated vehicle data
 * @returns {Promise} Promise with the updated vehicle data
 */
export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const response = await apiClient.put(`/api/vehicles/${vehicleId}`, vehicleData);
    return response.data;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
}; 