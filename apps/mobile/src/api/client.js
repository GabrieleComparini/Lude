import axios from 'axios';
import { auth } from '../config/firebase'; // Import Firebase auth instance

// Get the backend API URL from environment variables or use the known working endpoint
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://lude-backend.onrender.com';

console.log('API Client using baseURL:', baseURL);

// Create an axios instance
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add a request interceptor to automatically add the Firebase auth token
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data ? 'with data' : 'no data');
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
    console.error('API Client request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptors for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.message);
    return Promise.reject(error);
  }
);

export default apiClient; 