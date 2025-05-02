import axios from 'axios';

// Read the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'https://lude-backend.onrender.com';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Add interceptors for handling auth tokens
apiClient.interceptors.request.use(
  async (config) => {
    // Log the request for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add auth token if available
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Client request error:', error);
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
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls outside the range of 2xx
      console.error('API Error Response:', error.response.status, error.response.data);
      
      // Handle 401 Unauthorized (expired token)
      if (error.response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API service functions for reuse across components
export const apiService = {
  // User related endpoints
  users: {
    search: (query, page = 1, limit = 10) => 
      apiClient.get(`/api/users/search?q=${query}&page=${page}&limit=${limit}`),
    getAll: (page = 1, limit = 10) => 
      apiClient.get(`/api/users?page=${page}&limit=${limit}`),
    getById: (id) => 
      apiClient.get(`/api/users/${id}`),
    getProfile: () => 
      apiClient.get('/api/users/profile'),
    update: (id, data) => 
      apiClient.put(`/api/users/${id}`, data),
    delete: (id) => 
      apiClient.delete(`/api/users/${id}`),
    create: (userData) => 
      apiClient.post('/api/users', userData),
  },
  
  // Track related endpoints
  tracks: {
    getAll: (page = 1, limit = 10, filter = '') => 
      apiClient.get(`/api/tracks?page=${page}&limit=${limit}&visibility=${filter}`),
    getById: (id) => 
      apiClient.get(`/api/tracks/${id}`),
    getUserTracks: (userId, page = 1, limit = 10) => 
      apiClient.get(`/api/tracks/user/${userId}?page=${page}&limit=${limit}`),
    update: (id, data) => 
      apiClient.put(`/api/tracks/${id}`, data),
    delete: (id) => 
      apiClient.delete(`/api/tracks/${id}`),
  },
  
  // Vehicle related endpoints
  vehicles: {
    getAll: (page = 1, limit = 10, query = '') => 
      apiClient.get(`/api/vehicles?page=${page}&limit=${limit}&q=${query}`),
    getById: (id) => 
      apiClient.get(`/api/vehicles/${id}`),
    getUserVehicles: (userId) => 
      apiClient.get(`/api/vehicles/user/${userId}`),
    update: (id, data) => 
      apiClient.put(`/api/vehicles/${id}`, data),
    delete: (id) => 
      apiClient.delete(`/api/vehicles/${id}`),
  },
  
  // Analytics endpoints
  analytics: {
    getSummary: () => 
      apiClient.get('/api/analytics/summary'),
    getSpeedDistribution: () => 
      apiClient.get('/api/analytics/speed-distribution'),
    getUserGrowth: (timeRange = 'month') => 
      apiClient.get(`/api/analytics/users?timeRange=${timeRange}`),
    getTrackActivity: (timeRange = 'month') => 
      apiClient.get(`/api/analytics/tracks?timeRange=${timeRange}`),
    getVehicleTypes: () => 
      apiClient.get('/api/analytics/vehicle-types'),
    getPopularRoutes: () => 
      apiClient.get('/api/analytics/popular-routes'),
  },
  
  // Auth endpoints
  auth: {
    login: (credentials) => 
      apiClient.post('/api/auth/login', credentials),
    validateToken: () => 
      apiClient.get('/api/auth/validate'),
  }
};

export default apiClient; 