const Community = require('../models/Community');
const CommunityPost = require('../models/CommunityPost');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private
const createCommunity = asyncHandler(async (req, res) => {
    const { name, description, isPublic, tags, rules } = req.body;
    
    // Create community with current user as owner
    const community = await Community.create({
        name,
        description: description || '',
        isPublic: isPublic !== undefined ? isPublic : true,
        ownerId: req.user._id,
        moderators: [],
        members: [req.user._id], // Owner is automatically a member
        tags: tags || [],
        rules: rules || []
    });
    
    // Set cover image and avatar if uploaded
    if (req.files) {
        if (req.files.coverImage) {
            community.coverImage = req.files.coverImage[0].path;
        }
        if (req.files.avatar) {
            community.avatar = req.files.avatar[0].path;
        }
        await community.save();
    }
    
    res.status(201).json(community);
});

// @desc    Get all public communities
// @route   GET /api/communities
// @access  Public
const getPublicCommunities = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const communities = await Community.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name description avatar coverImage membersCount postsCount tags');
    
    // Get total count for pagination
    const total = await Community.countDocuments({ isPublic: true });
    
    res.json({
        communities,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Search for communities by name or tags
// @route   GET /api/communities/search
// @access  Public
const searchCommunities = asyncHandler(async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }
    
    const communities = await Community.find({
        $and: [
            { isPublic: true },
            { 
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { tags: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            }
        ]
    })
    .limit(20)
    .select('name description avatar membersCount');
    
    res.json(communities);
});

// @desc    Get community by ID
// @route   GET /api/communities/:id
// @access  Public/Private (depends on community privacy)
const getCommunityById = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id)
        .populate('ownerId', 'username name profileImage')
        .populate('moderators', 'username name profileImage');
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check if private community and user not a member
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
    
    res.json(community);
});

// @desc    Update community
// @route   PUT /api/communities/:id
// @access  Private (owner or moderators only)
const updateCommunity = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check permissions (only owner or moderators can update)
    const isOwner = community.ownerId.toString() === req.user._id.toString();
    const isModerator = community.moderators.some(mod => 
        mod.toString() === req.user._id.toString()
    );
    
    if (!isOwner && !isModerator) {
        res.status(403);
        throw new Error('Only community owners and moderators can update community details');
    }
    
    // Fields that only the owner can update
    const ownerOnlyFields = ['isPublic', 'ownerId'];
    
    // Check if non-owner is trying to update restricted fields
    if (!isOwner && ownerOnlyFields.some(field => req.body[field] !== undefined)) {
        res.status(403);
        throw new Error('Only community owners can update these fields');
    }
    
    // Update allowed fields
    const updatableFields = ['name', 'description', 'rules', 'tags'];
    
    updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
            community[field] = req.body[field];
        }
    });
    
    if (isOwner && req.body.isPublic !== undefined) {
        community.isPublic = req.body.isPublic;
    }
    
    // Update cover image and avatar if uploaded
    if (req.files) {
        if (req.files.coverImage) {
            community.coverImage = req.files.coverImage[0].path;
        }
        if (req.files.avatar) {
            community.avatar = req.files.avatar[0].path;
        }
    }
    
    await community.save();
    res.json(community);
});

// @desc    Delete community
// @route   DELETE /api/communities/:id
// @access  Private (owner only)
const deleteCommunity = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Only owner can delete community
    if (community.ownerId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Only the community owner can delete the community');
    }
    
    // Delete all related posts (in production, consider background jobs for this)
    await CommunityPost.deleteMany({ communityId: community._id });
    // Future: Delete all related comments as well
    
    await community.remove();
    res.json({ message: 'Community deleted successfully' });
});

// @desc    Join community or request to join
// @route   POST /api/communities/:id/join
// @access  Private
const joinCommunity = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check if user is already a member
    const isMember = community.members.some(member => 
        member.toString() === req.user._id.toString()
    );
    
    if (isMember) {
        return res.status(400).json({ message: 'You are already a member of this community' });
    }
    
    // Check if user has a pending join request
    const hasPendingRequest = community.pendingRequests.some(request => 
        request.userId.toString() === req.user._id.toString()
    );
    
    if (hasPendingRequest) {
        return res.status(400).json({ message: 'You already have a pending request to join this community' });
    }
    
    // If community is public, add user as member directly
    if (community.isPublic) {
        community.members.push(req.user._id);
        await community.save();
        return res.json({ message: 'You have joined the community' });
    }
    
    // If community is private, add to pending requests
    community.pendingRequests.push({
        userId: req.user._id,
        requestDate: Date.now()
    });
    
    await community.save();
    res.json({ message: 'Your request to join has been sent to the community moderators' });
});

// @desc    Leave community
// @route   POST /api/communities/:id/leave
// @access  Private
const leaveCommunity = asyncHandler(async (req, res) => {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check if user is a member
    const memberIndex = community.members.findIndex(member => 
        member.toString() === req.user._id.toString()
    );
    
    if (memberIndex === -1) {
        return res.status(400).json({ message: 'You are not a member of this community' });
    }
    
    // Owner can't leave without transferring ownership
    if (community.ownerId.toString() === req.user._id.toString()) {
        return res.status(400).json({ 
            message: 'Community owners cannot leave. Transfer ownership first or delete the community.' 
        });
    }
    
    // Remove user from members
    community.members.splice(memberIndex, 1);
    
    // If user is a moderator, remove from moderators as well
    const modIndex = community.moderators.findIndex(mod => 
        mod.toString() === req.user._id.toString()
    );
    
    if (modIndex !== -1) {
        community.moderators.splice(modIndex, 1);
    }
    
    await community.save();
    res.json({ message: 'You have left the community' });
});

// @desc    Approve or reject membership request
// @route   PUT /api/communities/:id/requests/:userId
// @access  Private (owner or moderators)
const handleMembershipRequest = asyncHandler(async (req, res) => {
    const { approve } = req.body;
    const { id: communityId, userId } = req.params;
    
    if (approve === undefined) {
        return res.status(400).json({ message: 'Approval decision is required' });
    }
    
    const community = await Community.findById(communityId);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Check permissions (only owner or moderators can approve)
    const isOwner = community.ownerId.toString() === req.user._id.toString();
    const isModerator = community.moderators.some(mod => 
        mod.toString() === req.user._id.toString()
    );
    
    if (!isOwner && !isModerator) {
        res.status(403);
        throw new Error('Only community owners and moderators can manage membership requests');
    }
    
    // Find the request
    const requestIndex = community.pendingRequests.findIndex(request => 
        request.userId.toString() === userId
    );
    
    if (requestIndex === -1) {
        return res.status(404).json({ message: 'Membership request not found' });
    }
    
    // Handle the request
    community.pendingRequests.splice(requestIndex, 1);
    
    if (approve) {
        // Add user as member if not already a member
        if (!community.members.some(member => member.toString() === userId)) {
            community.members.push(mongoose.Types.ObjectId(userId));
        }
    }
    
    await community.save();
    
    res.json({ 
        message: approve 
            ? 'Membership request approved' 
            : 'Membership request rejected' 
    });
});

// @desc    Add or remove moderators
// @route   PUT /api/communities/:id/moderators
// @access  Private (owner only)
const manageModerators = asyncHandler(async (req, res) => {
    const { action, userId } = req.body;
    
    if (!action || !userId) {
        return res.status(400).json({ 
            message: 'Action (add/remove) and userId are required' 
        });
    }
    
    if (!['add', 'remove'].includes(action)) {
        return res.status(400).json({ message: 'Action must be add or remove' });
    }
    
    const community = await Community.findById(req.params.id);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Only owner can manage moderators
    if (community.ownerId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Only the community owner can manage moderators');
    }
    
    // Convert userId to ObjectId to ensure proper comparison
    const userObjectId = mongoose.Types.ObjectId(userId);
    
    // For adding a moderator
    if (action === 'add') {
        // Check if user is a member
        const isMember = community.members.some(member => 
            member.toString() === userId
        );
        
        if (!isMember) {
            return res.status(400).json({ 
                message: 'User must be a member of the community to become a moderator' 
            });
        }
        
        // Check if user is already a moderator
        const isModerator = community.moderators.some(mod => 
            mod.toString() === userId
        );
        
        if (isModerator) {
            return res.status(400).json({ 
                message: 'User is already a moderator' 
            });
        }
        
        community.moderators.push(userObjectId);
    }
    
    // For removing a moderator
    if (action === 'remove') {
        const modIndex = community.moderators.findIndex(mod => 
            mod.toString() === userId
        );
        
        if (modIndex === -1) {
            return res.status(400).json({ message: 'User is not a moderator' });
        }
        
        community.moderators.splice(modIndex, 1);
    }
    
    await community.save();
    
    res.json({ 
        message: action === 'add' 
            ? 'Moderator added successfully' 
            : 'Moderator removed successfully' 
    });
});

// @desc    Transfer community ownership
// @route   PUT /api/communities/:id/transfer-ownership
// @access  Private (owner only)
const transferOwnership = asyncHandler(async (req, res) => {
    const { newOwnerId } = req.body;
    
    if (!newOwnerId) {
        return res.status(400).json({ message: 'New owner ID is required' });
    }
    
    const community = await Community.findById(req.params.id);
    
    if (!community) {
        res.status(404);
        throw new Error('Community not found');
    }
    
    // Only owner can transfer ownership
    if (community.ownerId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Only the community owner can transfer ownership');
    }
    
    // Check if new owner is a member
    const isMember = community.members.some(member => 
        member.toString() === newOwnerId
    );
    
    if (!isMember) {
        return res.status(400).json({ 
            message: 'New owner must be a member of the community' 
        });
    }
    
    // Transfer ownership
    community.ownerId = mongoose.Types.ObjectId(newOwnerId);
    
    // Add new owner to moderators if not already there
    const isNewOwnerModerator = community.moderators.some(mod => 
        mod.toString() === newOwnerId
    );
    
    if (!isNewOwnerModerator) {
        community.moderators.push(mongoose.Types.ObjectId(newOwnerId));
    }
    
    await community.save();
    
    res.json({ message: 'Community ownership transferred successfully' });
});

// @desc    Get communities where user is a member
// @route   GET /api/communities/my
// @access  Private
const getUserCommunities = asyncHandler(async (req, res) => {
    const communities = await Community.find({ 
        members: { $in: [req.user._id] } 
    })
    .select('name description avatar coverImage isPublic membersCount')
    .sort({ createdAt: -1 });
    
    res.json(communities);
});

// @desc    Get communities managed by the user
// @route   GET /api/communities/managed
// @access  Private
const getManagedCommunities = asyncHandler(async (req, res) => {
    const ownedCommunities = await Community.find({ ownerId: req.user._id })
        .select('name description avatar coverImage isPublic membersCount')
        .sort({ createdAt: -1 });
    
    const moderatedCommunities = await Community.find({ 
        moderators: { $in: [req.user._id] },
        ownerId: { $ne: req.user._id }  // Exclude owned communities to avoid duplicates
    })
    .select('name description avatar coverImage isPublic membersCount ownerId')
    .sort({ createdAt: -1 });
    
    res.json({
        owned: ownedCommunities,
        moderated: moderatedCommunities
    });
});

module.exports = {
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
}; 