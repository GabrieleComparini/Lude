const Track = require('../models/Track');
const User = require('../models/User'); // Needed to get user connections
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');

// @desc    Get activity feed for the logged-in user (tracks from connections)
// @route   GET /api/social/feed
// @access  Private (Synced user required)
const getFeed = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Tracks per page
    const skip = (page - 1) * limit;

    // Get the list of user IDs the current user is following
    // We populate connections on login/profile fetch, but maybe refetch here just in case?
    // For performance, it might be better to rely on req.user.connections if populated recently.
    const currentUser = await User.findById(userId).select('connections');
    if (!currentUser) {
        // Should not happen if ensureSynced middleware is used
        return next(new AppError('User not found', 404)); 
    }

    const followingIds = currentUser.connections; // Array of ObjectIds

    // Add own ID to see own tracks in feed? Optional.
    // followingIds.push(userId);

    if (!followingIds || followingIds.length === 0) {
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

module.exports = {
    getFeed
}; 