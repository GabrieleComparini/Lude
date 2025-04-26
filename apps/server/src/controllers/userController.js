const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { protect, ensureSynced } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError'); // Assuming AppError utility exists for custom errors
const cloudinary = require('../config/cloudinary'); // Need cloudinary to potentially delete old images
const { checkAchievements } = require('../services/achievementService'); // Import achievement service

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

// @desc    Search users by username or name
// @route   GET /api/users/search
// @access  Private (Logged-in user required)
const searchUsers = asyncHandler(async (req, res, next) => {
    const query = req.query.q;
    if (!query || query.trim().length < 2) { // Require at least 2 characters
        return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
    }

    const searchTerm = new RegExp(query, 'i'); // Case-insensitive search

    const users = await User.find({
        $or: [
            { username: searchTerm },
            { name: searchTerm }
        ]
    })
    .limit(20) // Limit results
    .select('username name profileImage'); // Select minimal info for search results

    res.status(200).json(users);
});

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private (Synced user required)
const followUser = asyncHandler(async (req, res, next) => {
    const userToFollowId = req.params.id;
    const currentUserId = req.user._id;

    if (userToFollowId === currentUserId.toString()) {
        return next(new AppError('You cannot follow yourself', 400));
    }

    // Check if user to follow exists
    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
        return next(new AppError('User to follow not found', 404));
    }

    // Add userToFollowId to currentUser's connections (if not already there)
    // Add currentUserId to userToFollow's followers (if not already there)
    const updateCurrentUser = User.findByIdAndUpdate(currentUserId, { $addToSet: { connections: userToFollowId } });
    const updateUserToFollow = User.findByIdAndUpdate(userToFollowId, { $addToSet: { followers: currentUserId } });

    // Wait for both updates to complete
    await Promise.all([updateCurrentUser, updateUserToFollow]);

    // --- Check for Achievements for the user who initiated the follow ---
    // Trigger based on user update (e.g., connections count change)
    checkAchievements('user_updated', { userId: currentUserId })
        .catch(err => {
            console.error(`[AchievementCheck] Error initiating achievement check for user ${currentUserId} after following ${userToFollowId}:`, err);
        });
    // We could potentially also check achievements for userToFollow if there are follower-based achievements

    res.status(200).json({ message: `Successfully followed ${userToFollow.username}` });
});

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private (Synced user required)
const unfollowUser = asyncHandler(async (req, res, next) => {
    const userToUnfollowId = req.params.id;
    const currentUserId = req.user._id;

     // Check if user to unfollow exists (optional, but good practice)
    const userToUnfollow = await User.findById(userToUnfollowId);
    if (!userToUnfollow) {
        return next(new AppError('User to unfollow not found', 404));
    }

    // Remove userToUnfollowId from currentUser's connections
    // Remove currentUserId from userToUnfollow's followers
    await User.findByIdAndUpdate(currentUserId, { $pull: { connections: userToUnfollowId } });
    await User.findByIdAndUpdate(userToUnfollowId, { $pull: { followers: currentUserId } });

    res.status(200).json({ message: `Successfully unfollowed ${userToUnfollow.username}` });
});

// @desc    Get users the current user is following
// @route   GET /api/users/connections
// @access  Private (Synced user required)
const getConnections = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id)
                           .populate('connections', 'username name profileImage')
                           .select('connections');
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json(user.connections);
});

// @desc    Get users following the current user
// @route   GET /api/users/followers
// @access  Private (Synced user required)
const getFollowers = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id)
                           .populate('followers', 'username name profileImage')
                           .select('followers');
     if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json(user.followers);
});


module.exports = {
    getUserProfile,
    updateUserProfile,
    getPublicUserProfile,
    searchUsers,
    followUser,
    unfollowUser,
    getConnections,
    getFollowers
}; 