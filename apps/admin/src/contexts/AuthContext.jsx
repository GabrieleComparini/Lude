import React, { createContext, useState, useContext, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { apiService } from '../api/apiClient';

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase app and auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        
        if (user) {
          // User is signed in
          const token = await user.getIdToken();
          localStorage.setItem('adminToken', token);

          // Get user data (if backend provides a profile endpoint)
          try {
            const response = await apiService.users.getProfile();
            setAdminUser({
              uid: user.uid,
              email: user.email,
              ...response.data
            });
          } catch (profileError) {
            // If no profile endpoint or error, use Firebase user data
            setAdminUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Admin User'
            });
          }
          
          setIsAuthenticated(true);
        } else {
          // User is signed out
          localStorage.removeItem('adminToken');
          setAdminUser(null);
          setIsAuthenticated(false);
        }
      } catch (authError) {
        console.error('Auth state change error:', authError);
        setError(authError.message);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verify if the user is an admin - this depends on your authorization logic
      // For example, you could check a custom claim, or check against a list of admin emails
      const adminEmails = [import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com'];
      
      if (!adminEmails.includes(user.email)) {
        // If not an admin, sign out and show error
        await signOut(auth);
        setError('You do not have admin access.');
        setIsAuthenticated(false);
        return { success: false, error: 'You do not have admin access.' };
      }
      
      // If all checks pass
      return { success: true };
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return { 
        success: false, 
        error: err.message || 'Login failed. Please check your credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('adminToken');
      setAdminUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        adminUser, 
        login, 
        logout, 
        loading,
        error 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 