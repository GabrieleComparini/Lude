const express = require('express');
const { syncUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/auth/sync
// @desc    Handles user login and initial registration sync after Firebase Authentication
// @access  Private (Requires Firebase ID Token)
router.post('/sync', protect, syncUser);

// Note: No traditional /register or /login needed as Firebase handles primary auth.
// The client should authenticate with Firebase (e.g., signInWithEmailAndPassword, GoogleSignIn),
// get the ID token, and send it in the Authorization header of the /sync request.

module.exports = router; 