const User = require('../models/User');
const { asyncHandler } = require('../middleware/authMiddleware'); // Use asyncHandler for error handling
const admin = require('firebase-admin'); // Import Firebase Admin SDK

// @desc    Sync Firebase user with local DB (Handles login and initial registration)
// @route   POST /api/auth/sync
// @access  Private (Requires valid Firebase token via 'protect' middleware)
const syncUser = asyncHandler(async (req, res) => {
    // 'protect' middleware attaches req.firebaseUser (decoded token) and req.user (if found in DB)
    const { uid, email, name: firebaseName, picture: firebasePicture } = req.firebaseUser;
    let user = req.user; // User from local DB (null if not found by protect)

    if (user) {
        // --- User exists in local DB --- //
        // Update last login time
        user.lastLogin = Date.now();

        // Optional: Check if Firebase profile info has changed and update local DB
        let updated = false;
        if (!user.name && firebaseName) { user.name = firebaseName; updated = true; }
        if (!user.profileImage && firebasePicture) { user.profileImage = firebasePicture; updated = true; }
        // Add more checks if needed (e.g., email verification status)

        if (updated) {
            await user.save();
        }

        console.log(`User synced: ${user.username} (${user.email})`);
        // Return essential user info for the frontend session
        res.status(200).json({
            _id: user._id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            username: user.username,
            name: user.name,
            profileImage: user.profileImage,
            preferences: user.preferences,
            statistics: user.statistics,
            // Add any other fields needed by the client immediately after login
        });

    } else {
        // --- User exists in Firebase but NOT in local DB (First Sync / Registration) --- //
        console.log(`First time sync for Firebase UID: ${uid}`);

        // We need the client to provide a chosen username for the first sync.
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: 'Username is required for initial account setup.' });
        }

        // Validate username format/length (could also use middleware)
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
             return res.status(400).json({ message: 'Invalid username format (3-30 chars, letters, numbers, underscore).' });
        }

        // Check if username is already taken
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already taken.' });
        }

        // Check if email is already associated with another local account (should ideally not happen if Firebase manages emails)
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            console.warn(`Attempted to sync user with existing email: ${email}, Firebase UID: ${uid}, Existing User UID: ${existingEmail.firebaseUid}`);
            // Decide policy: Allow linking? Block? For now, block.
            return res.status(400).json({ message: 'Email already associated with another account.' });
        }

        // Create the new user in the local database
        user = await User.create({
            firebaseUid: uid,
            email: email, // Use verified email from Firebase token
            username: username, // From request body
            name: firebaseName || '', // Use name from Firebase if available
            profileImage: firebasePicture || null, // Use picture from Firebase if available
            lastLogin: Date.now(),
            // Set default preferences/statistics explicitly if needed (though schema has defaults)
            preferences: { units: 'metric', privacy: { profileVisibility: 'public', trackVisibilityDefault: 'private' } },
            statistics: { totalDistance: 0, totalTime: 0, totalTracks: 0, topSpeed: 0, avgSpeed: 0 }
        });

        console.log(`New user created and synced: ${user.username} (${user.email})`);
        // Return essential user info for the frontend session
        res.status(201).json({ // 201 Created
            _id: user._id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            username: user.username,
            name: user.name,
            profileImage: user.profileImage,
            preferences: user.preferences,
            statistics: user.statistics,
        });
    }
});

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    try {
        // Check if the user exists with this email
        const user = await User.findOne({ email });
        
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: 'Invalid credentials or not authorized as admin' });
        }
        
        // Let Firebase handle the actual authentication
        // The client will use Firebase directly, this endpoint only checks if the user is an admin
        return res.status(200).json({ 
            success: true,
            message: 'Admin authentication successful'
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = {
    syncUser,
    adminLogin
}; 