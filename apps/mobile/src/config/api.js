// Configuration file for API settings

// Get the backend API URL from environment variables or use the known working endpoint
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lude-backend.onrender.com';

console.log('API configuration initialized with URL:', API_URL);

// You can add other API-related constants here if needed
export const API_TIMEOUT = 60000; // 60 seconds timeout for API requests 