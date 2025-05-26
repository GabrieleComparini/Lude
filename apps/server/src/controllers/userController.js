const User = require('../models/User');
const { asyncHandler, protect, ensureSynced } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError'); // Assuming AppError utility exists for custom errors
const cloudinary = require('../config/cloudinary'); // Need cloudinary to potentially delete old images
const { checkAchievements } = require('../services/achievementService'); // Import achievement service
const mongoose = require('mongoose');
const admin = require('firebase-admin'); // Import Firebase Admin for user creation

// @desc    Get logged-in user profile
// @route   GET /api/users/profile
// @access  Private (Synced user required)
const getUserProfile = asyncHandler(async (req, res, next) => {
    // ensureSynced middleware guarantees req.user exists
    // Populate connections and followers if needed immediately
    const user = await User.findById(req.user._id).populate('connections', 'username profileImage').populate('followers', 'username profileImage');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (Synced user required)
const updateUserProfile = asyncHandler(async (req, res, next) => {
    // ensureSynced middleware guarantees req.user exists
    const userId = req.user._id;
    const { name, username, bio, preferences } = req.body;
    const oldProfileImage = req.user.profileImage; // Get old image URL before update

    // Fields allowed to be updated
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (preferences) { // Handle nested preferences update carefully
        // Example: update units preference
        if (preferences.units && ['metric', 'imperial'].includes(preferences.units)) {
            if (!updateData.preferences) updateData.preferences = {};
            updateData.preferences.units = preferences.units;
        }
        // Add logic for updating privacy and notification preferences similarly
        if (preferences.privacy) {
             if (!updateData.preferences) updateData.preferences = {};
             if (!updateData.preferences.privacy) updateData.preferences.privacy = {};
             if (['public', 'connections', 'private'].includes(preferences.privacy.profileVisibility)) {
                 updateData.preferences.privacy.profileVisibility = preferences.privacy.profileVisibility;
             }
             if (['public', 'private'].includes(preferences.privacy.trackVisibilityDefault)) {
                 updateData.preferences.privacy.trackVisibilityDefault = preferences.privacy.trackVisibilityDefault;
             }
        }
         // Add notification updates...
    }

    // Handle username update separately due to uniqueness constraint
    if (username && username !== req.user.username) {
        // Validate new username format (redundant if schema validation is robust, but good practice)
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
            return next(new AppError('Invalid username format.', 400));
        }
        // Check if the new username is already taken (case-insensitive)
        const existingUser = await User.findOne({ username: username.toLowerCase() }); // Use toLowerCase()
        if (existingUser) {
            return next(new AppError('Username already taken.', 400));
        }
        updateData.username = username;
    }

    // Handle profile image update
    if (req.file) {
        console.log('Uploaded profile image:', req.file.path);
        updateData.profileImage = req.file.path; // Cloudinary URL from upload middleware
    } else if (req.body.profileImage === null || req.body.profileImage === '') {
        // Allow explicitly removing the profile image
        updateData.profileImage = null;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, {
        new: true, // Return the updated document
        runValidators: true // Run schema validators on update
    }).populate('connections', 'username profileImage').populate('followers', 'username profileImage');

    if (!updatedUser) {
        // If update failed, maybe delete the newly uploaded image?
        if (req.file && cloudinary) {
            try {
                 // Extract public_id from the URL (this depends on your Cloudinary setup/URL format)
                 // Example: const publicId = req.file.path.split('/').pop().split('.')[0]; 
                 // A safer way is if the middleware attaches the public_id to req.file
                 // Assuming req.file.filename contains the public_id from CloudinaryStorage params
                 if (req.file.filename) {
                     await cloudinary.uploader.destroy(req.file.filename);
                     console.log(`Deleted uploaded Cloudinary image ${req.file.filename} due to failed user update.`);
                 }
            } catch (err) {
                 console.error("Error deleting Cloudinary image after failed update:", err);
            }
        }
        return next(new AppError('User not found during update', 404));
    }

    // Delete old profile image from Cloudinary if a new one was uploaded or it was removed
    if (cloudinary && oldProfileImage && updateData.profileImage !== oldProfileImage) {
        try {
            // Extract public_id from the old URL. This is tricky and depends on URL structure.
            // Example: Assuming URL is like .../image/upload/v123/lude/user_profiles/public_id.jpg
            // A more robust way is to store the public_id along with the URL in the User model.
            // For now, we'll attempt a basic extraction (NEEDS REFINEMENT)
            const parts = oldProfileImage.split('/');
            const potentialPublicIdWithVersion = parts.slice(parts.indexOf('lude')).join('/').split('.')[0];
            // The actual public_id might be after the version folder, e.g., lude/user_profiles/public_id
             if (potentialPublicIdWithVersion.includes('/')) {
                const publicId = potentialPublicIdWithVersion.substring(potentialPublicIdWithVersion.indexOf('/', potentialPublicIdWithVersion.indexOf('/') + 1) + 1);
                if (publicId) {
                     console.log(`Attempting to delete old Cloudinary image: ${publicId}`);
                     await cloudinary.uploader.destroy(publicId);
                }
            }
        } catch (deleteError) {
            console.error(`Error deleting old Cloudinary image ${oldProfileImage}:`, deleteError);
            // Don't fail the request, just log the error
        }
    }

    res.status(200).json(updatedUser);
});

// @desc    Get public user profile by username
// @route   GET /api/users/:username
// @access  Public
const getPublicUserProfile = asyncHandler(async (req, res, next) => {
    const username = req.params.username;
    const user = await User.findOne({ username })
                           .select('username name profileImage bio registrationDate statistics connectionsCount followersCount'); // Select only public fields
                           // Maybe populate recent public tracks later?

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Depending on privacy settings, might need further checks
    // For now, assume username search implies public visibility is okay for selected fields.

    res.status(200).json(user);
});

// @desc    Search for users by username, name, or other criteria
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res, next) => {
    // Get the search query
    const query = req.query.q;
    
    // Ensure a minimum length for search query to avoid very broad searches
    if (!query || query.length < 2) {
        return next(new AppError('Search query must be at least 2 characters long', 400));
    }

    // Build the search conditions
    // Search by username, name, or other relevant fields
    const searchConditions = {
        $or: [
            { username: { $regex: query, $options: 'i' } }, // Case-insensitive regex match
            { name: { $regex: query, $options: 'i' } }
        ]
    };
    
    // Add exclusion for the current user
    if (req.user) {
        searchConditions._id = { $ne: req.user._id };
    }
    
    // Get pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Execute the search
    const totalUsers = await User.countDocuments(searchConditions);
    const users = await User.find(searchConditions)
        .select('username name profileImage bio statistics')
        .skip(skip)
        .limit(limit)
        .sort({ username: 1 });
    
    // Add follow status if user is logged in
    if (req.user) {
        const currentUser = await User.findById(req.user._id).select('connections');
        const userConnections = currentUser?.connections || [];
        
        // Map users to include isFollowing flag
        const usersWithFollowStatus = users.map(user => {
            const userObj = user.toObject();
            userObj.isFollowing = userConnections.includes(user._id);
            return userObj;
        });
        
        return res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
            users: usersWithFollowStatus
        });
    }
    
    // Return users without follow status for non-logged-in users
    res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        users
    });
});

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private (Synced user required)
const followUser = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const targetUserId = req.params.id;
    
    // Validate target user ID
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return next(new AppError('Invalid user ID', 400));
    }
    
    // Prevent following yourself
    if (userId.toString() === targetUserId) {
        return next(new AppError('You cannot follow yourself', 400));
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        return next(new AppError('User not found', 404));
    }

    // Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
        return next(new AppError('Current user not found', 404));
    }
    
    // Check if already following
    if (currentUser.connections.includes(targetUserId)) {
        return next(new AppError('You are already following this user', 400));
    }
    
    // Add to connections (following)
    currentUser.connections.push(targetUserId);
    await currentUser.save();
    
    // Increment follower count for target user
    targetUser.followerCount = (targetUser.followerCount || 0) + 1;
    await targetUser.save();

    res.status(200).json({
        success: true,
        message: `You are now following ${targetUser.username}`,
        followingCount: currentUser.connections.length
    });
});

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private (Synced user required)
const unfollowUser = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const targetUserId = req.params.id;

    // Validate target user ID
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return next(new AppError('Invalid user ID', 400));
    }
    
    // Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
        return next(new AppError('Current user not found', 404));
    }

    // Check if actually following
    if (!currentUser.connections.includes(targetUserId)) {
        return next(new AppError('You are not following this user', 400));
    }
    
    // Remove from connections (following)
    currentUser.connections = currentUser.connections.filter(
        id => id.toString() !== targetUserId
    );
    await currentUser.save();
    
    // Decrement follower count for target user
    const targetUser = await User.findById(targetUserId);
    if (targetUser) {
        targetUser.followerCount = Math.max((targetUser.followerCount || 0) - 1, 0);
        await targetUser.save();
    }

    res.status(200).json({
        success: true,
        message: `You have unfollowed ${targetUser ? targetUser.username : 'the user'}`,
        followingCount: currentUser.connections.length
    });
});

// @desc    Get user connections (following)
// @route   GET /api/users/connections
// @access  Private (Synced user required)
const getConnections = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Get current user with connections
    const currentUser = await User.findById(userId).select('connections');
    if (!currentUser) {
        return next(new AppError('User not found', 404));
    }
    
    const connectionIds = currentUser.connections || [];
    
    // Get connection users
    const totalConnections = connectionIds.length;
    const connections = await User.find({
        _id: { $in: connectionIds }
    })
    .select('username name profileImage bio')
    .skip(skip)
    .limit(limit);
    
    res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalConnections / limit),
        totalConnections,
        connections
    });
});

// @desc    Get user followers
// @route   GET /api/users/followers
// @access  Private (Synced user required)
const getFollowers = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Find users who have current user in their connections
    const totalFollowers = await User.countDocuments({
        connections: userId
    });
    
    const followers = await User.find({
        connections: userId
    })
    .select('username name profileImage bio')
    .skip(skip)
    .limit(limit);
    
    res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalFollowers / limit),
        totalFollowers,
        followers
    });
});

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = asyncHandler(async (req, res, next) => {
    // Check if the requesting user is an admin
    if (!req.user || req.user.role !== 'admin') {
        return next(new AppError('Not authorized to create users', 403));
    }

    const { email, password, username, name, isAdmin } = req.body;

    // Validate required fields
    if (!email || !password || !username) {
        return next(new AppError('Email, password, and username are required', 400));
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return next(new AppError('Invalid username format (3-30 chars, letters, numbers, underscore)', 400));
    }

    // Check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return next(new AppError('Username already taken', 400));
    }

    // Check if email is already in use
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return next(new AppError('Email already in use', 400));
    }

    try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name || username,
        });

        // Create user in our database
        const user = await User.create({
            firebaseUid: userRecord.uid,
            email,
            username,
            name: name || '',
            role: isAdmin ? 'admin' : 'user', // Set role based on isAdmin flag
            lastLogin: Date.now(),
            // Set default preferences
            preferences: { 
                units: 'metric', 
                privacy: { 
                    profileVisibility: 'public', 
                    trackVisibilityDefault: 'private' 
                } 
            },
            statistics: { 
                totalDistance: 0, 
                totalTime: 0, 
                totalTracks: 0, 
                topSpeed: 0, 
                avgSpeed: 0 
            }
        });

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        // If Firebase user creation fails, we need to handle it
        console.error('Error creating user:', error);
        return next(new AppError(error.message || 'Failed to create user', 500));
    }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res, next) => {
    // Check if the requesting user is an admin
    if (!req.user || req.user.role !== 'admin') {
        return next(new AppError('Not authorized to access all users', 403));
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await User.countDocuments();

    // Get users with pagination
    const users = await User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
        },
        users: users
    });
});

module.exports = {
    getUserProfile,
    updateUserProfile,
    getPublicUserProfile,
    searchUsers,
    followUser,
    unfollowUser,
    getConnections,
    getFollowers,
    createUser,
    getAllUsers
}; 