const Comment = require('../models/Comment');
const Track = require('../models/Track');
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// @desc    Add a comment to a track
// @route   POST /api/tracks/:trackId/comments
// @access  Private (Synced user required)
const addComment = asyncHandler(async (req, res, next) => {
    const { text } = req.body;
    const trackId = req.params.trackId;
    const userId = req.user._id;

    if (!text || text.trim() === '') {
        return next(new AppError('Comment text cannot be empty', 400));
    }

    if (!mongoose.Types.ObjectId.isValid(trackId)) {
        return next(new AppError(`Invalid track ID: ${trackId}`, 400));
    }

    // Check if track exists and is accessible (public or owned/connected? Decide policy)
    const track = await Track.findById(trackId).select('isPublic userId');
    if (!track) {
        return next(new AppError('Track not found', 404));
    }

    // Policy: Allow comments only on public tracks or tracks owned by the user?
    // Add more complex logic if needed (e.g., allow connections to comment)
    if (!track.isPublic && track.userId.toString() !== userId.toString()) {
         return next(new AppError('Cannot comment on this private track', 403));
    }

    const comment = await Comment.create({
        trackId,
        userId,
        text
    });

    // Populate user info for the response
    const populatedComment = await Comment.findById(comment._id).populate('userId', 'username name profileImage');

    res.status(201).json(populatedComment);
});

// @desc    Get comments for a track (paginated)
// @route   GET /api/tracks/:trackId/comments
// @access  Public / Private (checks track access)
const getComments = asyncHandler(async (req, res, next) => {
    const trackId = req.params.trackId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15; // Default 15 comments per page
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(trackId)) {
        return next(new AppError(`Invalid track ID: ${trackId}`, 400));
    }

    // Check if track exists and is accessible before fetching comments
    const track = await Track.findById(trackId).select('isPublic userId');
    if (!track) {
        return next(new AppError('Track not found', 404));
    }

    // Check authorization if the track is not public
    // Note: We might need req.user even for public tracks if we show like status later
     if (!track.isPublic) {
        // User must be logged in to view comments on private tracks
        // Assuming protect middleware runs before this if needed
        if (!req.user) {
            return next(new AppError('Not authorized to view comments (login required)', 401));
        }
        if (track.userId.toString() !== req.user._id.toString()) {
             return next(new AppError('Not authorized to view comments', 403));
        }
    }

    const totalComments = await Comment.countDocuments({ trackId });
    const comments = await Comment.find({ trackId })
                                .sort({ createdAt: 1 }) // Oldest first for conversation flow
                                .skip(skip)
                                .limit(limit)
                                .populate('userId', 'username name profileImage'); // Populate author details

     res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        comments
    });
});

// @desc    Delete a comment
// @route   DELETE /api/tracks/:trackId/comments/:commentId
// @access  Private (Comment owner or Track owner?)
const deleteComment = asyncHandler(async (req, res, next) => {
    const commentId = req.params.commentId;
    const userId = req.user._id; // Logged in user

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return next(new AppError(`Invalid comment ID: ${commentId}`, 400));
    }

    const comment = await Comment.findById(commentId).populate('trackId', 'userId'); // Populate track owner ID

    if (!comment) {
        return next(new AppError('Comment not found', 404));
    }

    // Authorization: Allow deletion only by the comment author OR the owner of the track
    if (
        comment.userId.toString() !== userId.toString() &&
        comment.trackId.userId.toString() !== userId.toString()
     ) {
        return next(new AppError('Not authorized to delete this comment', 403));
    }

    // Use findOneAndDelete to trigger the post hook for commentsCount update
    await Comment.findOneAndDelete({ _id: commentId });

    res.status(200).json({ message: 'Comment deleted successfully' });
});

// Note: Update comment functionality is often omitted for simplicity, 
// users typically delete and re-post if needed.
// If required, add an updateComment function similar to deleteComment with authorization checks.


module.exports = {
    addComment,
    getComments,
    deleteComment
}; 