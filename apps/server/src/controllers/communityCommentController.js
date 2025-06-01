const CommunityComment = require('../models/CommunityComment');
const CommunityPost = require('../models/CommunityPost');
const Community = require('../models/Community');
const asyncHandler = require('express-async-handler');

// @desc    Add comment to a post
// @route   POST /api/communities/:communityId/posts/:postId/comments
// @access  Private (community members only)
const addComment = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params;
    const { text, parentCommentId } = req.body;
    
    if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'Comment text is required' });
    }
    
    // Check if post exists
    const post = await CommunityPost.findOne({
        _id: postId,
        communityId
    });
    
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    
    // Check if community exists
    const community = await Community.findById(communityId);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check if user is a member
    const isMember = community.members.some(member => 
        member.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
        res.status(403);
        throw new Error('You must be a member of the community to comment');
    }
    
    // If parentCommentId is provided, check if it exists
    if (parentCommentId) {
        const parentComment = await CommunityComment.findById(parentCommentId);
        if (!parentComment || parentComment.postId.toString() !== postId) {
            return res.status(404).json({ message: 'Parent comment not found' });
        }
    }
    
    // Create the comment
    const comment = await CommunityComment.create({
        postId,
        userId: req.user._id,
        text,
        parentCommentId: parentCommentId || null,
        username: req.user.username,
        userProfileImage: req.user.profileImage
    });
    
    // Update comments count on the post
    post.commentsCount += 1;
    await post.save();
    
    res.status(201).json(comment);
});

// @desc    Get comments for a post
// @route   GET /api/communities/:communityId/posts/:postId/comments
// @access  Private (members) or Public (if community is public)
const getComments = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params;
    const parentCommentId = req.query.parentCommentId || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Check if post exists
    const post = await CommunityPost.findOne({
        _id: postId,
        communityId
    });
    
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    
    // Check if community exists and if user has access
    const community = await Community.findById(communityId);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check access permissions
    if (!community.isPublic) {
        // If not authenticated, deny access
        if (!req.user) {
            res.status(403);
            throw new Error('This is a private community');
        }
        
        // If not a member, deny access
        const isMember = community.members.some(member => 
            member.toString() === req.user._id.toString()
        );
        
        if (!isMember) {
            res.status(403);
            throw new Error('You are not a member of this private community');
        }
    }
    
    // Build query for fetching comments
    const query = { 
        postId,
        parentCommentId: parentCommentId
    };
    
    // Get comments with pagination
    const comments = await CommunityComment.find(query)
        .sort({ createdAt: 1 }) // Oldest first
        .skip(skip)
        .limit(limit);
    
    // Get total count for pagination
    const total = await CommunityComment.countDocuments(query);
    
    res.json({
        comments,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Update a comment
// @route   PUT /api/communities/:communityId/posts/:postId/comments/:commentId
// @access  Private (comment author, community owner, or moderators)
const updateComment = asyncHandler(async (req, res) => {
    const { communityId, postId, commentId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'Comment text is required' });
    }
    
    // Check if comment exists
    const comment = await CommunityComment.findOne({
        _id: commentId,
        postId
    });
    
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }
    
    // Check if post exists and belongs to the community
    const post = await CommunityPost.findOne({
        _id: postId,
        communityId
    });
    
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    
    // Check if community exists
    const community = await Community.findById(communityId);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check permissions
    const isAuthor = comment.userId.toString() === req.user._id.toString();
    const isOwner = community.ownerId.toString() === req.user._id.toString();
    const isModerator = community.moderators.some(mod => 
        mod.toString() === req.user._id.toString()
    );
    
    // Only author, owner, or moderators can update
    if (!isAuthor && !isOwner && !isModerator) {
        res.status(403);
        throw new Error('You do not have permission to update this comment');
    }
    
    // Update comment
    comment.text = text;
    await comment.save();
    
    res.json(comment);
});

// @desc    Delete a comment
// @route   DELETE /api/communities/:communityId/posts/:postId/comments/:commentId
// @access  Private (comment author, community owner, or moderators)
const deleteComment = asyncHandler(async (req, res) => {
    const { communityId, postId, commentId } = req.params;
    
    // Check if comment exists
    const comment = await CommunityComment.findOne({
        _id: commentId,
        postId
    });
    
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }
    
    // Check if post exists and belongs to the community
    const post = await CommunityPost.findOne({
        _id: postId,
        communityId
    });
    
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    
    // Check if community exists
    const community = await Community.findById(communityId);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check permissions
    const isAuthor = comment.userId.toString() === req.user._id.toString();
    const isOwner = community.ownerId.toString() === req.user._id.toString();
    const isModerator = community.moderators.some(mod => 
        mod.toString() === req.user._id.toString()
    );
    
    // Only author, owner, or moderators can delete
    if (!isAuthor && !isOwner && !isModerator) {
        res.status(403);
        throw new Error('You do not have permission to delete this comment');
    }
    
    // Count replies to this comment
    const repliesCount = await CommunityComment.countDocuments({
        parentCommentId: commentId
    });
    
    // Delete the comment
    await comment.remove();
    
    // Update comments count on the post (subtracting this comment plus its replies)
    post.commentsCount = Math.max(0, post.commentsCount - (1 + repliesCount));
    await post.save();
    
    // Delete all replies to this comment
    if (repliesCount > 0) {
        await CommunityComment.deleteMany({ parentCommentId: commentId });
    }
    
    res.json({ message: 'Comment deleted successfully' });
});

// @desc    Like a comment
// @route   POST /api/communities/:communityId/posts/:postId/comments/:commentId/like
// @access  Private (community members)
const likeComment = asyncHandler(async (req, res) => {
    const { communityId, postId, commentId } = req.params;
    
    // Check if comment exists
    const comment = await CommunityComment.findOne({
        _id: commentId,
        postId
    });
    
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }
    
    // Check if post exists and belongs to the community
    const post = await CommunityPost.findOne({
        _id: postId,
        communityId
    });
    
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    
    // Check if community exists and if user is a member
    const community = await Community.findById(communityId);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check if user is a member
    const isMember = community.members.some(member => 
        member.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
        res.status(403);
        throw new Error('You must be a member of the community to like comments');
    }
    
    // Increment likes count
    comment.likesCount += 1;
    await comment.save();
    
    res.json({ message: 'Comment liked successfully', likesCount: comment.likesCount });
});

module.exports = {
    addComment,
    getComments,
    updateComment,
    deleteComment,
    likeComment
}; 