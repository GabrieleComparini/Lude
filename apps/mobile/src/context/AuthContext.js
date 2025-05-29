import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Create the context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    // Funzione per ottenere il profilo utente dal backend
    const getUserProfile = async () => {
        try {
            console.log('Fetching user profile from backend');
            let userData = null;
            
            // Try /api/users/profile first since it's working correctly
            try {
                const response = await apiClient.get('/api/users/profile');
                console.log('User profile response from /profile:', response.data);
                
                if (response.data) {
                    userData = response.data;
                    
                    // Check if profile is incomplete (needs onboarding)
                    if (!response.data.name || !response.data.username) {
                        setNeedsOnboarding(true);
                    } else {
                        setNeedsOnboarding(false);
                    }
                    
                    // Aggiorna lo stato dell'utente con i dati reali
                    setUser(response.data);
                    // Salva i dati utente in AsyncStorage
                    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
                }
            } catch (profileError) {
                // Se il primo tentativo fallisce e non abbiamo ancora i dati utente, prova /me
                if (!userData) {
                    console.log('Error fetching from /api/users/profile, trying /api/users/me');
                    try {
                        const response = await apiClient.get('/api/users/me');
                        console.log('User profile response from /me:', response.data);
                        
                        if (response.data) {
                            userData = response.data;
                            
                            // Check if profile is incomplete (needs onboarding)
                            if (!response.data.name || !response.data.username) {
                                setNeedsOnboarding(true);
                            } else {
                                setNeedsOnboarding(false);
                            }
                            
                            // Aggiorna lo stato dell'utente con i dati reali
                            setUser(response.data);
                            // Salva i dati utente in AsyncStorage
                            await AsyncStorage.setItem('userData', JSON.stringify(response.data));
                        }
                    } catch (meError) {
                        console.error('Error fetching from /api/users/me:', meError);
                        // Non propaghiamo l'errore, se abbiamo già ottenuto dati dall'endpoint precedente
                    }
                }
            }
            
            return userData;
        } catch (err) {
            console.error("Error fetching user profile:", err);
            console.error("Error details:", err.response?.data || err.message);
            
            // Se abbiamo un utente già impostato, presupponiamo che sia un errore temporaneo
            // e NON impostiamo needsOnboarding, per evitare di resettare lo stato dell'utente
            if (!user) {
                // Assume we need onboarding if we can't fetch the profile AND we don't have a user
                setNeedsOnboarding(true);
            }
            
            return null;
        }
    };

    // Check for saved token on app start
    useEffect(() => {
        const loadStoredUser = async () => {
            try {
                // We don't need to manually restore the token from AsyncStorage
                // Firebase auth will handle persistence with our configured persistence
                
                // Check if we have a logged in user from Firebase
                const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
                    if (firebaseUser) {
                        // User is signed in
                        // Firebase auth token will be automatically added by the API client interceptor
                        
                        // Get user profile
                        const userProfile = await getUserProfile();
                        
                        // If we couldn't get the profile, use stored data as fallback
                        if (!userProfile) {
                            const storedUser = await AsyncStorage.getItem('userData');
                            if (storedUser) {
                                const parsedUser = JSON.parse(storedUser);
                                setUser(parsedUser);
                                
                                // Check if stored user data suggests incomplete profile
                                if (!parsedUser.name || !parsedUser.username) {
                                    setNeedsOnboarding(true);
                                }
                            } else {
                                // No stored user data, likely needs onboarding
                                setNeedsOnboarding(true);
                            }
                        }
                    } else {
                        // User is not signed in
                        setUser(null);
                        setNeedsOnboarding(false);
                    }
                    setLoading(false);
                });
                
                return () => unsubscribe();
            } catch (err) {
                console.error("Error loading stored user:", err);
                setError(err.message);
                setLoading(false);
            }
        };
        
        console.log("Loading stored user data");
        loadStoredUser();
    }, []);

    // Basic functions for login, register, logout
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            // Use Firebase authentication instead of directly calling the API
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // The Firebase auth token will be automatically added to API requests
            // by the apiClient interceptor
            
            // Ottenere il profilo completo dell'utente
            const userProfile = await getUserProfile();
            
            // Se non abbiamo ricevuto il profilo completo, creiamo un oggetto utente semplice
            if (!userProfile) {
                const basicUser = {
                    email: userCredential.user.email,
                    uid: userCredential.user.uid
                };
                setUser(basicUser);
                await AsyncStorage.setItem('userData', JSON.stringify(basicUser));
                
                // If we have only basic user info, definitely needs onboarding
                setNeedsOnboarding(true);
            }
            
            return true;
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email, password, username) => {
        setLoading(true);
        setError(null);
        try {
            // Use Firebase authentication instead of directly calling the API
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // The Firebase auth token will be automatically added to API requests
            // by the apiClient interceptor
            
            // After creating the Firebase account, we need to sync with our backend and provide username
            try {
                const idToken = await userCredential.user.getIdToken();
                
                // Set the token in the API client headers
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
                
                // Call the sync API to create the user in our database with the username
                await apiClient.post('/api/auth/sync', { username });
                
                // Wait a moment to ensure backend sync completes
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (syncError) {
                console.error("Error syncing user with backend:", syncError);
                // If sync fails, we still have the Firebase account, so we can continue
                // but should notify the user that some features might be limited
            }
            
            // Ottenere il profilo completo dell'utente
            const userProfile = await getUserProfile();
            
            // Se non abbiamo ricevuto il profilo completo, creiamo un oggetto utente semplice
            if (!userProfile) {
                const basicUser = {
                    email: userCredential.user.email,
                    uid: userCredential.user.uid,
                    username: username // Add username to basic user
                };
                setUser(basicUser);
                await AsyncStorage.setItem('userData', JSON.stringify(basicUser));
            }
            
            // Always set needsOnboarding to true for new registrations
            setNeedsOnboarding(true);
            
            return true;
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        setError(null);
        try {
            // Sign out from Firebase
            await auth.signOut();
            
            // Clear storage
            await AsyncStorage.removeItem('userData');
            
            // Clear user state
            setUser(null);
            setNeedsOnboarding(false);
        } catch (err) {
            console.error("Logout error:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Aggiungiamo la funzione refreshUserProfile per aggiornare i dati utente
    const refreshUserProfile = async () => {
        try {
            const updatedUser = await getUserProfile();
            return updatedUser;
        } catch (err) {
            console.error("Error refreshing user profile:", err);
            return null;
        }
    };
    
    // Function to complete onboarding
    const completeOnboarding = () => {
        setNeedsOnboarding(false);
    };

    const value = useMemo(() => ({
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUserProfile, // Esponiamo la funzione di refresh
        isAuthReady: !loading,
        needsOnboarding,
        completeOnboarding
    }), [user, loading, error, needsOnboarding]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 