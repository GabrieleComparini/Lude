import axios from 'axios';
import { API_URL } from '../config/api';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Axios instance with base URL
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add auth token to requests
apiClient.interceptors.request.use(
    async (config) => {
        try {
            // Get current user from Firebase auth
            const user = auth.currentUser;
            
            if (user) {
                // Get token
                const token = await user.getIdToken();
                // Add token to request headers
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Error getting auth token:", error);
        }
        return config;
    },
    (error) => {
        console.error("API Request Error:", error);
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => {
        // Success handler - just return the response
        return response;
    },
    async (error) => {
        // Error handler
        const originalRequest = error.config;
        
        // Log error details for debugging
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("API Response Error:", error.message);
            console.log("Error Response Data:", error.response.data);
            console.log("Error Response Status:", error.response.status);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("API No Response Error:", error.message);
            console.log("Request:", error.request);
        } else {
            // Something happened in setting up the request
            console.error("API Request Setup Error:", error.message);
        }
        
        // Token expired handling - 401 for expired tokens
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Get current user from Firebase
                const user = auth.currentUser;
                
                if (user) {
                    // Force refresh token
                    const newToken = await user.getIdToken(true);
                    // Update header and retry request
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error("Error refreshing token:", refreshError);
                
                // If token refresh fails, clear stored data and return to login
                try {
                    await AsyncStorage.removeItem('userData');
                } catch (storageError) {
                    console.error("Error clearing storage:", storageError);
                }
            }
        }
        
        // Handle 404 for certain endpoints more gracefully
        if (error.response && error.response.status === 404) {
            // If it's a specific profile endpoint that 404s during app initialization,
            // don't treat it as a fatal error - the app's auth flow will handle it
            const url = originalRequest.url;
            if (url.includes('/api/users/profile') || url.includes('/api/users/me')) {
                console.log("Profile endpoint 404 - this may be expected for new users");
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient; 