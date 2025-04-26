const Leaderboard = require('../models/Leaderboard');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');

// @desc    Get the latest leaderboard for a specific type
// @route   GET /api/leaderboards/:type
// @access  Public (or Private if needed)
const getLeaderboard = asyncHandler(async (req, res, next) => {
    const leaderboardType = req.params.type.toLowerCase();
    const limit = parseInt(req.query.limit, 10) || 50; // Limit number of scores returned

    // Find the most recently generated leaderboard document for the given type
    const leaderboard = await Leaderboard.findOne({ type: leaderboardType })
        .sort({ generatedAt: -1 }); // Get the latest one
        // .select('type period generatedAt scores'); // Select fields if needed

    if (!leaderboard) {
        // Return empty if no leaderboard generated yet for this type
        // Or return 404? For now, return empty array.
        return res.status(200).json({
            type: leaderboardType,
            period: null,
            generatedAt: null,
            scores: []
        });
        // Alternatively: return next(new AppError(`Leaderboard not found for type: ${leaderboardType}`, 404));
    }

    // Limit the number of scores returned if specified
    const limitedScores = leaderboard.scores.slice(0, limit);

    res.status(200).json({
        type: leaderboard.type,
        period: leaderboard.period,
        generatedAt: leaderboard.generatedAt,
        scores: limitedScores
    });
});

// Placeholder for future controllers, e.g., manually triggering generation (admin?)

module.exports = {
    getLeaderboard
}; 