import apiClient from '../client';
import { auth } from '../../config/firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

// Function to check if an email exists in Firebase authentication
export const checkEmailExists = async (email) => {
  try {
    // Use Firebase's fetchSignInMethodsForEmail to check if the email is registered
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    // If there are sign-in methods available for this email, it exists
    return signInMethods.length > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw error;
  }
};

// Wrapper for the login function from AuthContext
export const loginWithEmailPassword = async (email, password) => {
  try {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
}; 