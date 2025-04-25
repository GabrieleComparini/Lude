const admin = require('firebase-admin');
const path = require('path');
const environment = require('./environment');

let initialized = false;

try {
    let credentialOptions;

    // Determine credential method based on environment variables
    if (environment.googleCredentialsPath) {
        // Option 1: Use service account file path
        const serviceAccountPath = path.resolve(__dirname, '../../', environment.googleCredentialsPath);
        // Note: Ensure the file exists and is accessible. `require` automatically parses the JSON.
        try {
            const serviceAccount = require(serviceAccountPath);
            credentialOptions = admin.credential.cert(serviceAccount);
            console.log(`Attempting to initialize Firebase Admin SDK using service account file: ${serviceAccountPath}`);
        } catch (fileError) {
            console.error(`Error loading service account file from path: ${serviceAccountPath}`, fileError);
            throw new Error("Service account file not found or invalid.");
        }
    } else if (environment.firebaseProjectId && environment.firebaseClientEmail && environment.firebasePrivateKey) {
        // Option 2: Use environment variables
        console.log('Attempting to initialize Firebase Admin SDK using environment variables.');
        credentialOptions = admin.credential.cert({
            projectId: environment.firebaseProjectId,
            clientEmail: environment.firebaseClientEmail,
            privateKey: environment.firebasePrivateKey, // Assumes newlines are correctly handled in environment.js
        });
    } else {
        // No valid configuration found
        throw new Error("Firebase Admin SDK configuration is missing. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.");
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
        credential: credentialOptions,
        // databaseURL: `https://${environment.firebaseProjectId}.firebaseio.com` // Optional: Only if using Realtime Database features
    });

    initialized = true;
    console.log('Firebase Admin SDK Initialized Successfully');

} catch (error) {
    console.error('Firebase Admin SDK Initialization Error:', error.message);
    // Optional: Allow server to start without Firebase if it's not critical for all routes?
    // If critical, uncomment the next line:
    // process.exit(1);
}

// Export the initialized admin instance (or null if failed)
module.exports = initialized ? admin : null; 