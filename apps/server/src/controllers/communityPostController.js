const CommunityPost = require('../models/CommunityPost');
const Community = require('../models/Community');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new community post
// @route   POST /api/communities/:communityId/posts
// @access  Private (members only)
const createPost = asyncHandler(async (req, res) => {
    const { type, content, visibility } = req.body;
    const { communityId } = req.params;
    
    // Validate post type
    if (!['text', 'image', 'track', 'route'].includes(type)) {
        return res.status(400).json({ message: 'Invalid post type' });
    }
    
    // Validate post content based on type
    if (type === 'text' && (!content.text || content.text.trim().length === 0)) {
        return res.status(400).json({ message: 'Text content is required for text posts' });
    }
    
    if (type === 'image' && (!content.images || content.images.length === 0)) {
        return res.status(400).json({ message: 'At least one image is required for image posts' });
    }
    
    if (type === 'track' && !content.trackId) {
        return res.status(400).json({ message: 'Track ID is required for track posts' });
    }
    
    if (type === 'route' && !content.routeId) {
        return res.status(400).json({ message: 'Route ID is required for route posts' });
    }
    
    // Check if community exists
    const community = await Community.findById(communityId);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check if user is a member of the community
    const isMember = community.members.some(member => 
        member.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
        res.status(403);
        throw new Error('You must be a member of the community to post');
    }
    
    // Create the post
    const post = await CommunityPost.create({
        communityId: mongoose.Types.ObjectId(communityId),
        userId: req.user._id,
        type,
        content: {
            text: content.text || '',
            images: content.images || [],
            trackId: content.trackId || null,
            routeId: content.routeId || null
        },
        visibility: visibility || 'community-only',
        username: req.user.username,
        userProfileImage: req.user.profileImage
    });
    
    // Update post count in community
    community.postsCount += 1;
    await community.save();
    
    res.status(201).json(post);
});

// @desc    Get posts for a community
// @route   GET /api/communities/:communityId/posts
// @access  Private (members) or Public (if community is public)
const getPosts = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const type = req.query.type; // Optional filter by post type
    
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
    
    // Build query for fetching posts
    const query = { communityId: mongoose.Types.ObjectId(communityId) };
    
    // Add type filter if specified
    if (type && ['text', 'image', 'track', 'route'].includes(type)) {
        query.type = type;
    }
    
    // Get posts with pagination
    const posts = await CommunityPost.find(query)
        .sort({ isPinned: -1, createdAt: -1 }) // Pinned posts first, then by date
        .skip(skip)
        .limit(limit);
    
    // Get total count for pagination
    const total = await CommunityPost.countDocuments(query);
    
    res.json({
        posts,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Get a single post by ID
// @route   GET /api/communities/:communityId/posts/:postId
// @access  Private (members) or Public (if community is public)
const getPostById = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params;
    
    // Find the post
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
    
    // Return the post
    res.json(post);
});

// @desc    Update a post
// @route   PUT /api/communities/:communityId/posts/:postId
// @access  Private (post author, community owner, or moderators)
const updatePost = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params;
    const { content, visibility } = req.body;
    
    // Find the post
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
    const isAuthor = post.userId.toString() === req.user._id.toString();
    const isOwner = community.ownerId.toString() === req.user._id.toString();
    const isModerator = community.moderators.some(mod => 
        mod.toString() === req.user._id.toString()
    );
    
    // Only author, owner, or moderators can update
    if (!isAuthor && !isOwner && !isModerator) {
        res.status(403);
        throw new Error('You do not have permission to update this post');
    }
    
    // Some fields can only be updated by the author
    if (!isAuthor && content) {
        res.status(403);
        throw new Error('Only the author can update the content');
    }
    
    // Update fields
    if (content && post.type === 'text') {
        post.content.text = content.text;
    }
    
    // Visibility can be updated by author, owner, or moderators
    if (visibility) {
        post.visibility = visibility;
    }
    
    // Save updates
    await post.save();
    
    res.json(post);
});

// @desc    Delete a post
// @route   DELETE /api/communities/:communityId/posts/:postId
// @access  Private (post author, community owner, or moderators)
const deletePost = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params;
    
    // Find the post
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
    const isAuthor = post.userId.toString() === req.user._id.toString();
    const isOwner = community.ownerId.toString() === req.user._id.toString();
    const isModerator = community.moderators.some(mod => 
        mod.toString() === req.user._id.toString()
    );
    
    // Only author, owner, or moderators can delete
    if (!isAuthor && !isOwner && !isModerator) {
        res.status(403);
        throw new Error('You do not have permission to delete this post');
    }
    
    // Delete the post
    await post.remove();
    
    // Update post count in community
    community.postsCount = Math.max(0, community.postsCount - 1);
    await community.save();
    
    res.json({ message: 'Post deleted successfully' });
});

// @desc    Pin or unpin a post
// @route   PUT /api/communities/:communityId/posts/:postId/pin
// @access  Private (community owner or moderators)
const togglePinPost = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params;
    const { isPinned } = req.body;
    
    if (isPinned === undefined) {
        return res.status(400).json({ message: 'isPinned field is required' });
    }
    
    // Find the post
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
    
    // Check permissions (only owner or moderators can pin/unpin)
    const isOwner = community.ownerId.toString() === req.user._id.toString();
    const isModerator = community.moderators.some(mod => 
        mod.toString() === req.user._id.toString()
    );
    
    if (!isOwner && !isModerator) {
        res.status(403);
        throw new Error('Only community owners and moderators can pin or unpin posts');
    }
    
    // Update pin status
    post.isPinned = isPinned;
    await post.save();
    
    res.json({ 
        message: isPinned ? 'Post pinned successfully' : 'Post unpinned successfully',
        post
    });
});

// @desc    Like a post
// @route   POST /api/communities/:communityId/posts/:postId/like
// @access  Private (community members)
const likePost = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params;
    
    // Find the post
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
        throw new Error('You must be a member of the community to like posts');
    }
    
    // Increment likes count
    post.likesCount += 1;
    await post.save();
    
    res.json({ message: 'Post liked successfully', likesCount: post.likesCount });
});

// @desc    Get posts created by a specific user in a community
// @route   GET /api/communities/:communityId/users/:userId/posts
// @access  Private (community members) or Public (if community is public)
const getUserPostsInCommunity = asyncHandler(async (req, res) => {
    const { communityId, userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
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
    
    // Get user posts in the community
    const posts = await CommunityPost.find({
        communityId,
        userId
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    // Get total count for pagination
    const total = await CommunityPost.countDocuments({
        communityId,
        userId
    });
    
    res.json({
        posts,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

module.exports = {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    togglePinPost,
    likePost,
    getUserPostsInCommunity
}; 