const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
// Add middleware like protect if leaderboards should be private

// GET /api/leaderboards/:type - Get the latest leaderboard for a specific type
router.get('/:type', getLeaderboard);

module.exports = router; 