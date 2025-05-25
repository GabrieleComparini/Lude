import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

// Create the context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Funzione per ottenere il profilo utente dal backend
    const getUserProfile = async () => {
        try {
            console.log('Fetching user profile from backend');
            // Tentare prima con /api/users/me
            try {
                const response = await apiClient.get('/api/users/me');
                console.log('User profile response from /me:', response.data);
                
                if (response.data) {
                    // Aggiorna lo stato dell'utente con i dati reali
                    setUser(response.data);
                    // Salva i dati utente in AsyncStorage
                    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
                    return response.data;
                }
            } catch (meError) {
                console.log('Error fetching from /api/users/me, trying /api/users/profile');
                // Se /me fallisce, prova con /profile
                const response = await apiClient.get('/api/users/profile');
                console.log('User profile response from /profile:', response.data);
                
                if (response.data) {
                    // Aggiorna lo stato dell'utente con i dati reali
                    setUser(response.data);
                    // Salva i dati utente in AsyncStorage
                    await AsyncStorage.setItem('userData', JSON.stringify(response.data));
                    return response.data;
                }
            }
            return null;
        } catch (err) {
            console.error("Error fetching user profile:", err);
            console.error("Error details:", err.response?.data || err.message);
            return null;
        }
    };

    // Check for saved token on app start
    useEffect(() => {
        const loadStoredUser = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('userToken');
                if (storedToken) {
                    // If token exists, set up API client
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                    
                    // Carica i dati utente dal backend
                    const userProfile = await getUserProfile();
                    
                    // Se non riceviamo i dati utente dal backend, usiamo quelli in storage
                    if (!userProfile) {
                        // Get user from storage
                        const storedUser = await AsyncStorage.getItem('userData');
                        if (storedUser) {
                            setUser(JSON.parse(storedUser));
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading stored user:", err);
                setError(err.message);
            } finally {
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
            // Chiamata API reale per il login
            const response = await apiClient.post('/api/auth/login', {
                email,
                password
            });
            
            const { token, user: userData } = response.data;
            
            // Store token
            await AsyncStorage.setItem('userToken', token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Ottenere il profilo completo dell'utente
            const userProfile = await getUserProfile();
            
            // Se non abbiamo ricevuto il profilo completo, usiamo i dati base
            if (!userProfile && userData) {
                setUser(userData);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
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

    const register = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            // Chiamata API reale per la registrazione
            const response = await apiClient.post('/api/auth/register', {
                email,
                password
            });
            
            const { token, user: userData } = response.data;
            
            // Store token
            await AsyncStorage.setItem('userToken', token);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Ottenere il profilo completo dell'utente
            const userProfile = await getUserProfile();
            
            // Se non abbiamo ricevuto il profilo completo, usiamo i dati base
            if (!userProfile && userData) {
                setUser(userData);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
            }
            
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
            // Clear storage
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            
            // Clear API client header
            delete apiClient.defaults.headers.common['Authorization'];
            
            // Clear user state
            setUser(null);
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

    const value = useMemo(() => ({
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUserProfile, // Esponiamo la funzione di refresh
        isAuthReady: !loading
    }), [user, loading, error]);

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