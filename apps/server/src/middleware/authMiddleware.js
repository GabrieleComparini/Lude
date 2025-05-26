const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const AppError = require('../utils/AppError'); // Import AppError at the top

// Utility function to handle async route handlers
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Middleware to verify Firebase ID token and attach user to request
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            if (!admin) {
                console.error("Firebase Admin SDK not initialized. Cannot verify token.");
                return res.status(500).json({ message: 'Firebase configuration error' });
            }

            // Verify token using Firebase Admin SDK
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.firebaseUser = decodedToken; // Attach decoded token info

            // Find user in our DB using the Firebase UID
            const user = await User.findOne({ firebaseUid: decodedToken.uid });

            if (!user) {
                // User exists in Firebase but not yet synced to our DB.
                // Allow request to proceed, but req.user will be null.
                // The controller (e.g., authController.syncUser) will handle creation.
                console.log(`User with firebaseUid ${decodedToken.uid} not found in local DB. Needs sync.`);
                req.user = null;
            } else {
                // User found in DB, attach it to the request
                req.user = user;
            }

            next(); // Proceed to the next middleware/controller
        } catch (error) {
            console.error('Authentication Error:', error.code, error.message);
            if (error.code === 'auth/id-token-expired') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            // Handle other potential errors like revoked token, invalid token etc.
            res.status(401).json({ message: 'Not authorized, token verification failed' });
        }
    } else {
        // No token provided
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
});

// Optional: Middleware to ensure user is fully synced/exists in local DB
// Use this *after* protect on routes that require a synced user
const ensureSynced = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ message: 'User profile not yet synchronized. Please complete registration or sync first.' });
    }
    next();
};

// Middleware to check for Admin role
// Should be used *after* protect and ensureSynced
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed
    } else {
        // User is not an admin, or user object doesn't exist
        next(new AppError('Forbidden: Administrator privileges required', 403));
    }
};

module.exports = {
    protect,
    ensureSynced,
    isAdmin, // Export the isAdmin middleware
    asyncHandler // Export asyncHandler if used elsewhere
}; 