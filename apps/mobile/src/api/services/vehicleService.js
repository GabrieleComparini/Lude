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