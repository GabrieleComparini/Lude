import axios from 'axios';
import { auth } from '../config/firebase'; // Import Firebase auth instance

// Get the backend API URL from environment variables
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

if (!process.env.EXPO_PUBLIC_API_URL) {
    console.warn("API Client Warning: Missing EXPO_PUBLIC_API_URL environment variable. Using fallback URL:", baseURL);
}

// Create an axios instance
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically add the Firebase auth token
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data ? 'with data' : 'no data');
    // Check if the user is logged in via Firebase
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Get the Firebase ID token
        const token = await currentUser.getIdToken(); // This automatically refreshes the token if needed
        // Set the Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting Firebase ID token:', error);
        // Handle error appropriately - maybe reject the request or let it proceed without token?
        // For now, log the error and proceed without the token.
      }
    }
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// Optional: Add response interceptors here if needed (e.g., for global error handling)
// apiClient.interceptors.response.use(...);

export default apiClient; 