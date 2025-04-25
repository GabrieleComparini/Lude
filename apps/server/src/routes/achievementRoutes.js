const express = require('express');
const router = express.Router();
const {
    getAllAchievementDefinitions,
    getEarnedAchievementsForUser,
    createAchievement,
    updateAchievement,
    deleteAchievement
} = require('../controllers/achievementController');
const { protect, ensureSynced, isAdmin } = require('../middleware/authMiddleware');

// --- Public/User Routes ---
// GET /api/achievements - Get all achievement definitions (public)
router.get('/', getAllAchievementDefinitions);

// GET /api/achievements/earned - Get achievements earned by logged-in user (private)
router.get('/earned', protect, ensureSynced, getEarnedAchievementsForUser);

// --- Admin Routes ---
// POST /api/achievements - Create a new achievement definition (admin only)
router.post('/', protect, ensureSynced, isAdmin, createAchievement);

// PUT /api/achievements/:id - Update an achievement definition (admin only)
router.put('/:id', protect, ensureSynced, isAdmin, updateAchievement);

// DELETE /api/achievements/:id - Delete an achievement definition (admin only)
router.delete('/:id', protect, ensureSynced, isAdmin, deleteAchievement);

module.exports = router; 