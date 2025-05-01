import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase/config';
import apiClient from '../api/client';

// User type definition
interface User extends FirebaseUser {
  username?: string;
  name?: string;
  profileImage?: string;
  isAdmin?: boolean;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // If user is authenticated, sync with backend
          const token = await firebaseUser.getIdToken();
          const response = await apiClient.post('/api/auth/sync', {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          // Enhance user object with additional info from our backend
          const enhancedUser = {
            ...firebaseUser,
            username: response.data.username,
            name: response.data.name,
            profileImage: response.data.profileImage
          };
          
          setUser(enhancedUser);
        } catch (err) {
          console.error('Error syncing user with backend:', err);
          // Still set the basic Firebase user even if backend sync fails
          setUser(firebaseUser as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Login method
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state listener will handle setting the user
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register method
  const register = async (email: string, password: string, username: string) => {
    setLoading(true);
    setError(null);
    try {
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // After Firebase auth, sync with our backend to create the user record
      const token = await firebaseUser.getIdToken();
      await apiClient.post('/api/auth/sync', { 
        username,
        name: username // Default name to username initially
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Auth state listener will handle setting the user
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during registration';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout method
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during logout';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 