const express = require('express');
const {
    saveTrack,
    getTrackById,
    getUserTracks,
    getPublicTracks,
    updateTrack,
    deleteTrack,
    updateTrackVisibility
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

// --- Protected Routes (Require logged-in, synced user) ---

// Save a new track
router.post('/', protect, ensureSynced, saveTrack);

// Get logged-in user's tracks (paginated)
router.get('/list', protect, ensureSynced, getUserTracks);

// Handle reactions to a track
router.post('/:trackId/react', protect, ensureSynced, handleReaction);

// Update track details (description, tags, isPublic)
router.put('/:id', protect, ensureSynced, updateTrack);

// Update track visibility (public/private)
router.patch('/:id/visibility', protect, ensureSynced, updateTrackVisibility);

// Delete a track
router.delete('/:id', protect, ensureSynced, deleteTrack);

// Get a specific track by ID (public access check is done in controller)
// Need to handle potential auth for private tracks, so protect is applied broadly here
// but the controller logic decides final access.
router.get('/:id', protect, getTrackById);

module.exports = router; 