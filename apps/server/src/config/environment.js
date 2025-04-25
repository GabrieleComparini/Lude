const dotenv = require('dotenv');
const path = require('path');

// Load .env file from the parent directory (apps/server)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const environment = {
    port: process.env.PORT || 3001,
    databaseUrl: process.env.DATABASE_URL,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
    googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Alternative if using file path
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development',
    // jwtSecret: process.env.JWT_SECRET, // Uncomment if using JWT
};

// Basic validation (optional but recommended)
const requiredVars = [
    'databaseUrl',
    'firebaseProjectId',
    'firebaseClientEmail',
    'firebasePrivateKey',
    'cloudinaryCloudName',
    'cloudinaryApiKey',
    'cloudinaryApiSecret'
];

// Only enforce strict checks if not using the file path for Firebase creds
if (!environment.googleCredentialsPath) {
    requiredVars.forEach(v => {
        if (!environment[v]) {
            console.error(`FATAL ERROR: Environment variable ${v.toUpperCase()} is not defined.`);
            process.exit(1);
        }
    });
} else if (!environment.databaseUrl || !environment.cloudinaryCloudName || !environment.cloudinaryApiKey || !environment.cloudinaryApiSecret) {
    // Still check others if using file path for Firebase
    console.error("FATAL ERROR: DATABASE_URL or Cloudinary variables are not defined.");
    process.exit(1);
}

module.exports = environment; 