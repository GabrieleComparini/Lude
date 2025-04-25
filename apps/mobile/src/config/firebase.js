import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth'; // Import necessary auth functions
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage for persistence

// Your web app's Firebase configuration
// Using process.env to access environment variables set by Expo
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Basic validation to ensure keys are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase configuration error: Missing API Key or Project ID. Check your .env file and ensure variables start with EXPO_PUBLIC_");
    // Depending on how you want to handle this, you might throw an error
    // or allow the app to continue but with Firebase features disabled.
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native Persistence
// This ensures the user's login state persists across app restarts
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// You can initialize other Firebase services here as needed
// import { getFirestore } from 'firebase/firestore';
// const db = getFirestore(app);

// Export the initialized app and auth instances
export { app, auth };
// export { db }; // Export other services if initialized 