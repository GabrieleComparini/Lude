const Track = require('../models/Track');
const User = require('../models/User'); // Needed to get user connections
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// @desc    Get activity feed for friends (tracks from connections)
// @route   GET /api/social/feed/friends
// @access  Private (Synced user required)
const getFriendsFeed = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Tracks per page
    const skip = (page - 1) * limit;

    // Get the list of user IDs the current user is following
    const currentUser = await User.findById(userId).select('connections');
    if (!currentUser) {
        return next(new AppError('User not found', 404)); 
    }

    const followingIds = currentUser.connections || []; // Array of ObjectIds

    if (followingIds.length === 0) {
        // User isn't following anyone
        return res.status(200).json({ 
            currentPage: 1,
            totalPages: 0,
            totalTracks: 0,
            tracks: [] 
        });
    }

    // Find public tracks from the followed users
    const query = {
        userId: { $in: followingIds }, // Track's userId must be in the list of followed IDs
        isPublic: true // Only show public tracks in the feed
    };

    const totalTracks = await Track.countDocuments(query);
    const feedTracks = await Track.find(query)
                                .sort({ startTime: -1 }) // Show newest tracks first
                                .skip(skip)
                                .limit(limit)
                                .select('-route') // Exclude full route for feed
                                .populate('userId', 'username name profileImage') // Populate author info
                                .populate('vehicleId', 'make model nickname'); // Populate basic vehicle info

    res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalTracks / limit),
        totalTracks,
        tracks: feedTracks
    });
});

// @desc    Get global popular tracks feed
// @route   GET /api/social/feed/popular
// @access  Private (Synced user required)
const getPopularFeed = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Tracks per page
    const skip = (page - 1) * limit;
    
    // Define popularity metrics (can be adjusted)
    const sortOptions = req.query.sortBy || 'reactions'; // Default sort by reactions
    
    // Find public tracks with popularity metrics
    const query = { isPublic: true };
    
    // Define sort criteria based on selected option
    let sortCriteria = {};
    switch (sortOptions) {
        case 'comments':
            sortCriteria = { commentsCount: -1 };
            break;
        case 'recent':
            sortCriteria = { startTime: -1 };
            break;
        case 'reactions':
        default:
            // Sum of all reaction types
            sortCriteria = { 'reactions.like': -1 }; // Primary sort by likes
            break;
    }
    
    // Add secondary sort by date for all options
    sortCriteria.startTime = -1;
    
    const totalTracks = await Track.countDocuments(query);
    const popularTracks = await Track.find(query)
                                .sort(sortCriteria)
                                .skip(skip)
                                .limit(limit)
                                .select('-route')
                                .populate('userId', 'username name profileImage')
                                .populate('vehicleId', 'make model nickname');

    res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalTracks / limit),
        totalTracks,
        tracks: popularTracks
    });
});

// Legacy feed endpoint - redirects to friends feed for backward compatibility
const getFeed = asyncHandler(async (req, res, next) => {
    return getFriendsFeed(req, res, next);
});

module.exports = {
    getFeed,
    getFriendsFeed,
    getPopularFeed
}; 