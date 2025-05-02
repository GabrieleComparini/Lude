const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    getPublicUserProfile,
    searchUsers,
    followUser,
    unfollowUser,
    getConnections,
    getFollowers,
    createUser,
    getAllUsers
} = require('../controllers/userController');
const { protect, ensureSynced, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import upload middleware

const router = express.Router();

// --- Admin Routes ---
router.route('/')
    .post(protect, ensureSynced, isAdmin, createUser)
    .get(protect, ensureSynced, isAdmin, getAllUsers);

// --- Protected Routes (Require logged-in, synced user) ---

// Get/Update own profile
router.route('/profile')
    .get(protect, ensureSynced, getUserProfile)
    .put(protect, ensureSynced, upload.single('profileImage'), updateUserProfile); // Apply upload middleware for profile image

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