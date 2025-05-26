const express = require('express');
const { getFeed, getFriendsFeed, getPopularFeed } = require('../controllers/feedController');
const { protect, ensureSynced } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Feed Routes ---

// Legacy route - keep for backward compatibility
router.get('/feed', protect, ensureSynced, getFeed);

// Friends feed - tracks from users you follow
router.get('/feed/friends', protect, ensureSynced, getFriendsFeed);

// Popular/Global feed - popular public tracks
router.get('/feed/popular', protect, ensureSynced, getPopularFeed);

// --- Other Social Routes (Placeholder) ---
// Example: Sharing
// router.post('/share/:trackId', protect, ensureSynced, handleShare);

module.exports = router; 