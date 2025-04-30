import axios from 'axios';

// Vite exposes env variables starting with VITE_ via import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'; // Default fallback

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Add authentication headers if needed (e.g., for admin-only endpoints)
  // headers: {
  //   'Authorization': `Bearer ${your_admin_token}`
  // }
});

/**
 * Fetches all users from the admin endpoint.
 * Requires admin privileges on the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
export const getAllUsers = async () => {
  try {
    // Adjust the endpoint if your backend route is different
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    // Rethrow or handle error as needed for the UI
    throw error;
  }
};

// Add other admin-related API functions here (e.g., deleteUser, updateUserRole, getAllVehicles, etc.) 