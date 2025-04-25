const express = require('express');
const { getFeed } = require('../controllers/feedController');
const { protect, ensureSynced } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Feed Route ---

// GET /api/social/feed
router.get('/feed', protect, ensureSynced, getFeed);

// --- Other Social Routes (Placeholder) ---
// Example: Sharing
// router.post('/share/:trackId', protect, ensureSynced, handleShare);

module.exports = router; 