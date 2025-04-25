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
            setFirebaseUser(fbUser);
            if (fbUser) {
                console.log('[AuthContext] Firebase user detected:', fbUser.uid);
                // User logged in via Firebase, now sync with our backend
                try {
                    console.log('[AuthContext] Attempting backend sync...');
                    const response = await apiClient.post('/api/auth/sync'); // Token attached by interceptor
                    setUser(response.data); // Store user data from our backend
                    setError(null);
                    console.log('[AuthContext] Backend sync successful, user data set:', response.data);
                } catch (err) {
                    console.error('[AuthContext] Backend sync failed:', err.response?.data || err.message);
                    setError(err.response?.data?.message || 'Failed to sync with backend');
                    setUser(null); // Ensure local user state is cleared on sync failure
                    // Optional: Sign out from Firebase if backend sync consistently fails?
                    // await signOut(auth);
                }
            } else {
                // User logged out from Firebase
                console.log('[AuthContext] No Firebase user detected.');
                setUser(null); // Clear local user state
                setError(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

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
        try {
            // 1. Create user in Firebase
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('[AuthContext] Firebase user creation successful, waiting for state change...');
            // onAuthStateChanged will fire, but the backend sync might need username
            // We rely on onAuthStateChanged to call sync, maybe need to pass username there?
            // This is tricky. Alternative: call sync *manually* here after user creation?
            
            // --- Alternative: Manual Sync Call --- 
            // const fbUser = auth.currentUser;
            // if (fbUser) {
            //     try {
            //         const token = await fbUser.getIdToken();
            //         const response = await apiClient.post('/api/auth/sync', 
            //             { username /*, name? */ }, // Send required data
            //             { headers: { Authorization: `Bearer ${token}` } } // Manual token add needed if interceptor hasn't run?
            //         );
            //         setUser(response.data);
            //     } catch (syncError) {
            //         console.error('[AuthContext] Manual backend sync post-register failed:', syncError);
            //         setError(syncError.response?.data?.message || 'Failed initial sync');
            //         // TODO: Maybe delete the firebase user if sync fails?
            //     }
            // } else {
            //     throw new Error("Firebase user not available immediately after creation.");
            // }
            // setLoading(false); // If doing manual sync

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