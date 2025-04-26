const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');

// Middleware to verify Firebase ID token and attach user to request
const protect = asyncHandler(async (req, res, next) => {
    console.log("ENTERING protect middleware for request:", req.method, req.originalUrl);
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
            const user = await User.findOne({ firebaseUid: decodedToken.uid }).select('-password');

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

            console.log("Protect middleware SUCCESS, calling next(). User:", req.user ? req.user.username : 'undefined');
            next(); // Proceed to the next middleware/controller
        } catch (error) {
            console.error('Protect Error:', error.name, error.message);
            if (error.name === 'JsonWebTokenError') {
                return next(new AppError('Not authorized, token failed', 401));
            } else if (error.name === 'TokenExpiredError') {
                return next(new AppError('Not authorized, token expired', 401));
            } else {
                // For other potential errors during verification
                return next(new AppError('Not authorized, token verification issue', 401));
            }
        }
    } else {
        // No token provided
        console.log("Protect Middleware: No token found in headers.");
        // Allow request to proceed if no token, but req.user will be undefined
        // Other middleware or route handlers can check for req.user if authentication is strictly required
        // For strictly protected routes, we might want to send error here.
        // Let's assume for now some routes might be optionally protected.
        // Changed: For actual *protected* routes, we NEED a token.
        return next(new AppError('Not authorized, no token', 401));
    }
});

// Optional: Middleware to ensure user is fully synced/exists in local DB
// Use this *after* protect on routes that require a synced user
const ensureSynced = (req, res, next) => {
    console.log("ENTERING ensureSynced middleware");
    if (!req.user) {
        console.error("EnsureSynced Error: req.user not found after protect middleware.");
        return res.status(403).json({ message: 'User profile not yet synchronized. Please complete registration or sync first.' });
    }
    console.log("EnsureSynced SUCCESS, calling next(). User:", req.user.username);
    next();
};

// Middleware to check for Admin role
// Should be used *after* protect and ensureSynced
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed
    } else {
        // Use AppError for consistent error handling if available
        if (AppError) {
             next(new AppError('Forbidden: Administrator privileges required', 403));
        } else {
            // Fallback if AppError is not available
            res.status(403).json({ message: 'Forbidden: Administrator privileges required' });
        }
       
    }
};

module.exports = {
    protect,
    ensureSynced,
    isAdmin, // Export the isAdmin middleware
}; 