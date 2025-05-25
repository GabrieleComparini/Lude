const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    getPublicUserProfile,
    searchUsers,
    followUser,
    unfollowUser,
    getConnections,
    getFollowers
} = require('../controllers/userController');
const { protect, ensureSynced } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import upload middleware

const router = express.Router();

// --- Protected Routes (Require logged-in, synced user) ---

// Get/Update own profile
router.route('/profile')
    .get(protect, ensureSynced, getUserProfile)
    .put(protect, ensureSynced, upload.single('profileImage'), updateUserProfile); // Apply upload middleware for profile image

// Alias route for /me -> /profile for consistency with other APIs
router.get('/me', protect, ensureSynced, getUserProfile);

// Search users
router.get('/search', protect, searchUsers);

// Follow/Unfollow actions
router.route('/:id/follow')
    .post(protect, ensureSynced, followUser)
    .delete(protect, ensureSynced, unfollowUser);

// Get connections/followers lists
router.get('/connections', protect, ensureSynced, getConnections);
router.get('/followers', protect, ensureSynced, getFollowers);

// --- Public Routes ---

// Get public profile by username
router.get('/:username', getPublicUserProfile);


module.exports = router; 