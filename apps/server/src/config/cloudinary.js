const cloudinary = require('cloudinary').v2;
const environment = require('./environment');

let initialized = false;

if (!environment.cloudinaryCloudName || !environment.cloudinaryApiKey || !environment.cloudinaryApiSecret) {
    console.warn('Cloudinary configuration is missing in environment variables. Image upload features will be disabled.');
} else {
    try {
        cloudinary.config({
            cloud_name: environment.cloudinaryCloudName,
            api_key: environment.cloudinaryApiKey,
            api_secret: environment.cloudinaryApiSecret,
            secure: true // Always use HTTPS
        });
        initialized = true;
        console.log('Cloudinary SDK Initialized Successfully');
    } catch (error) {
        console.error('Cloudinary SDK Initialization Error:', error.message);
        // Allow server to start even if Cloudinary fails?
    }
}

// Export the configured cloudinary instance (or null/the base object if not configured)
module.exports = initialized ? cloudinary : null; 