const express = require('express');
const router = express.Router();
const {
    listChallenges,
    getChallengeById,
    joinChallenge,
    getUserChallengeProgress,
    getUserParticipations
} = require('../controllers/challengeController');
const { protect, ensureSynced } = require('../middleware/authMiddleware');

// --- Public Routes ---
// GET /api/challenges - List available challenges (filtered by status query param)
router.get('/', listChallenges);

// GET /api/challenges/:id - Get details of a specific challenge
router.get('/:id', getChallengeById);

// --- Private Routes (User Specific) ---
// POST /api/challenges/:id/join - Join a challenge
router.post('/:id/join', protect, ensureSynced, joinChallenge);

// GET /api/challenges/:id/progress - Get logged-in user's progress for a specific challenge
router.get('/:id/progress', protect, ensureSynced, getUserChallengeProgress);

// GET /api/challenges/participating - Get all challenges the user is participating in
router.get('/participating', protect, ensureSynced, getUserParticipations);

// TODO: Add admin routes for managing challenges

module.exports = router; 