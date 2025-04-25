import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { auth } from '../config/firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Needed? Maybe just for manual token storage if needed

// Create the context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Stores user data from *our* backend
    const [firebaseUser, setFirebaseUser] = useState(null); // Stores the raw firebase user object
    const [loading, setLoading] = useState(true); // Initial loading state
    const [error, setError] = useState(null);

    // Effect to listen for Firebase auth state changes
    useEffect(() => {
        setLoading(true);
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            const previousFirebaseUser = firebaseUser; // Keep track of previous state
            setFirebaseUser(fbUser);
            
            // Only run backend sync if the user *just* logged in 
            // (i.e., was null before and is now detected) and we are not already handling it manually in register.
            // Or if the user state was somehow cleared locally but firebase still has a user.
            // Avoid syncing if it's just a token refresh detected by onAuthStateChanged.
            if (fbUser && (!user || fbUser.uid !== previousFirebaseUser?.uid)) { 
                console.log('[AuthContext] Firebase user detected/changed:', fbUser.uid);
                // User logged in via Firebase, now sync with our backend
                try {
                    console.log('[AuthContext] Attempting backend sync via onAuthStateChanged...');
                    const response = await apiClient.post('/api/auth/sync'); // Token attached by interceptor
                    setUser(response.data); // Store user data from our backend
                    setError(null);
                    console.log('[AuthContext] Backend sync via onAuthStateChanged successful, user data set:', response.data);
                } catch (err) {
                    console.error('[AuthContext] Backend sync via onAuthStateChanged failed:', err.response?.data || err.message);
                    setError(err.response?.data?.message || 'Failed to sync with backend');
                    setUser(null); // Ensure local user state is cleared on sync failure
                     // Optional: Sign out from Firebase if backend sync consistently fails?
                    // await signOut(auth);
                }
            } else if (!fbUser) {
                // User logged out from Firebase
                console.log('[AuthContext] No Firebase user detected (logged out).');
                setUser(null); // Clear local user state
                setError(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    // Depend on `user` state as well to re-sync if local user gets cleared somehow while firebase user exists?
    // Be careful with dependency arrays here to avoid infinite loops.
    }, []); // Keep dependency array minimal for now

    // --- Auth Functions --- 

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle setting user state and syncing
            console.log('[AuthContext] Firebase login successful, waiting for state change...');
            // setLoading(false) will be handled by onAuthStateChanged effect
        } catch (err) {
            console.error('[AuthContext] Firebase login failed:', err.code, err.message);
            setError(err.message); // Provide feedback to user
            setLoading(false);
        }
    };

    const register = async (email, password, username /* add other required fields like name? */) => {
        setLoading(true);
        setError(null);
        let firebaseUserCredential = null;
        try {
            // 1. Create user in Firebase
            firebaseUserCredential = await createUserWithEmailAndPassword(auth, email, password);
            const fbUser = firebaseUserCredential.user;
            console.log('[AuthContext] Firebase user creation successful:', fbUser.uid);

            // 2. Immediately call backend sync with username
            if (fbUser) {
                 console.log('[AuthContext] Attempting manual backend sync post-register...');
                try {
                    const token = await fbUser.getIdToken();
                    const response = await apiClient.post(
                        '/api/auth/sync', 
                        { username /*, name? */ }, // Send required username
                        { headers: { Authorization: `Bearer ${token}` } } // Send token manually just in case interceptor hasn't caught up
                    );
                    setUser(response.data); // Set user data from backend response
                    setError(null);
                    console.log('[AuthContext] Manual backend sync post-register successful:', response.data);
                } catch (syncError) {
                    console.error('[AuthContext] Manual backend sync post-register failed:', syncError.response?.data || syncError.message);
                    setError(syncError.response?.data?.message || 'Failed initial user sync. Please try logging in.');
                    // Clean up? Delete the created Firebase user? Sign out?
                    // This depends on desired UX. For now, just set error.
                     await signOut(auth); // Log out the partially created user
                     setUser(null);
                }
            } else {
                 // Should not happen if createUserWithEmailAndPassword succeeded
                 throw new Error("Firebase user not available immediately after creation.");
            }
            setLoading(false); // Set loading false after manual sync attempt

        } catch (err) {
            console.error('[AuthContext] Firebase registration failed:', err.code, err.message);
            setError(err.message);
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        setError(null);
        try {
            await signOut(auth);
            console.log('[AuthContext] Firebase logout successful.');
            // onAuthStateChanged will handle clearing user state
        } catch (err) {
            console.error('[AuthContext] Firebase logout failed:', err.code, err.message);
            setError(err.message);
            setLoading(false);
        }
    };

    // Use useMemo to prevent unnecessary re-renders
    const value = useMemo(() => ({
        user, // User data from our backend
        firebaseUser, // Raw Firebase user object
        loading,
        error,
        login,
        register,
        logout
    }), [user, firebaseUser, loading, error]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 