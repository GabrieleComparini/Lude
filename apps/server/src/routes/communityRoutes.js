const express = require('express');
const {
    createCommunity,
    getPublicCommunities,
    searchCommunities,
    getCommunityById,
    updateCommunity,
    deleteCommunity,
    joinCommunity,
    leaveCommunity,
    handleMembershipRequest,
    manageModerators,
    transferOwnership,
    getUserCommunities,
    getManagedCommunities
} = require('../controllers/communityController');

const {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    togglePinPost,
    likePost,
    getUserPostsInCommunity
} = require('../controllers/communityPostController');

const {
    addComment,
    getComments,
    updateComment,
    deleteComment,
    likeComment
} = require('../controllers/communityCommentController');

const { protect, ensureSynced } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// --- Community Routes ---

// Get all public communities or create a new one
router.route('/')
    .get(getPublicCommunities)
    .post(protect, ensureSynced, upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]), createCommunity);

// Search communities
router.get('/search', searchCommunities);

// Get user's communities
router.get('/my', protect, ensureSynced, getUserCommunities);

// Get communities the user manages
router.get('/managed', protect, ensureSynced, getManagedCommunities);

// Get, update, or delete a specific community
router.route('/:id')
    .get(getCommunityById)
    .put(protect, ensureSynced, upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]), updateCommunity)
    .delete(protect, ensureSynced, deleteCommunity);

// Join or leave a community
router.post('/:id/join', protect, ensureSynced, joinCommunity);
router.post('/:id/leave', protect, ensureSynced, leaveCommunity);

// Handle membership requests
router.put('/:id/requests/:userId', protect, ensureSynced, handleMembershipRequest);

// Manage moderators
router.put('/:id/moderators', protect, ensureSynced, manageModerators);

// Transfer ownership
router.put('/:id/transfer-ownership', protect, ensureSynced, transferOwnership);

// --- Community Posts Routes ---

// Get posts or create a new post for a community
router.route('/:communityId/posts')
    .get(getPosts)
    .post(protect, ensureSynced, upload.array('images', 10), createPost);

// Get, update, or delete a specific post
router.route('/:communityId/posts/:postId')
    .get(getPostById)
    .put(protect, ensureSynced, updatePost)
    .delete(protect, ensureSynced, deletePost);

// Pin or unpin a post
router.put('/:communityId/posts/:postId/pin', protect, ensureSynced, togglePinPost);

// Like a post
router.post('/:communityId/posts/:postId/like', protect, ensureSynced, likePost);

// Get posts by a specific user in a community
router.get('/:communityId/users/:userId/posts', getUserPostsInCommunity);

// --- Community Comments Routes ---

// Get or add comments to a post
router.route('/:communityId/posts/:postId/comments')
    .get(getComments)
    .post(protect, ensureSynced, addComment);

// Update or delete a comment
router.route('/:communityId/posts/:postId/comments/:commentId')
    .put(protect, ensureSynced, updateComment)
    .delete(protect, ensureSynced, deleteComment);

// Like a comment
router.post('/:communityId/posts/:postId/comments/:commentId/like', protect, ensureSynced, likeComment);

module.exports = router;

 