const express = require('express');
const {
    saveTrack,
    getTrackById,
    getUserTracks,
    getPublicTracks,
    updateTrack,
    deleteTrack
} = require('../controllers/trackController');
const { protect, ensureSynced } = require('../middleware/authMiddleware');
const { handleReaction } = require('../controllers/reactionController');

const router = express.Router();

// --- Mount Comment Router ---
// Redirect routes starting with /:trackId/comments to commentRouter
const commentRouter = require('./commentRoutes');
router.use('/:trackId/comments', commentRouter);

// --- Public Routes ---

// Get public tracks (paginated)
router.get('/public', getPublicTracks);

// Get a specific track by ID (public access check is done in controller)
// Need to handle potential auth for private tracks, so protect is applied broadly here
// but the controller logic decides final access.
router.get('/:id', protect, getTrackById); // Apply protect to allow req.user check for private tracks

// --- Protected Routes (Require logged-in, synced user) ---

// Save a new track
router.post('/', protect, ensureSynced, saveTrack);

// Get logged-in user's tracks (paginated)
router.get('/list', protect, ensureSynced, getUserTracks);

// Update a specific track (owner only - checked in controller)
router.put('/:id', protect, ensureSynced, updateTrack);

// Delete a specific track (owner only - checked in controller)
router.delete('/:id', protect, ensureSynced, deleteTrack);

// --- Reaction Route ---
router.post('/:trackId/react', protect, ensureSynced, handleReaction);

module.exports = router; 