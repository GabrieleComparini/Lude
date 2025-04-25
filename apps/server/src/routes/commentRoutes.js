const express = require('express');
const {
    addComment,
    getComments,
    deleteComment
} = require('../controllers/commentController');
const { protect, ensureSynced } = require('../middleware/authMiddleware');

// Create router with mergeParams: true to access :trackId from parent router (trackRoutes)
const router = express.Router({ mergeParams: true });

// --- Routes ---

// Add a comment to a specific track
// POST /api/tracks/:trackId/comments
router.post('/', protect, ensureSynced, addComment);

// Get comments for a specific track (paginated)
// GET /api/tracks/:trackId/comments
// Apply protect middleware here if needed for private tracks (controller also checks)
router.get('/', protect, getComments); 

// Delete a specific comment
// DELETE /api/tracks/:trackId/comments/:commentId
router.delete('/:commentId', protect, ensureSynced, deleteComment);

// Optional: Add route for updating a comment if needed
// router.put('/:commentId', protect, ensureSynced, updateComment);

module.exports = router; 