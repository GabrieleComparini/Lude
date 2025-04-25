const User = require('../models/User');
const Track = require('../models/Track');
const Vehicle = require('../models/Vehicle');
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// @desc    Get summary statistics for the logged-in user
// @route   GET /api/analytics/summary
// @access  Private (Synced user required)
const getSummaryStats = asyncHandler(async (req, res, next) => {
    // req.user is guaranteed by ensureSynced middleware
    // Ensure statistics are populated if they are virtuals or need calculation
    const user = await User.findById(req.user._id).select('statistics');
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json(user.statistics || {}); // Return statistics object or empty if somehow missing
});

// @desc    Get tracking trends over a period
// @route   GET /api/analytics/trends?period=weekly&metric=distance
// @access  Private (Synced user required)
const getTrends = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { period = 'weekly', metric = 'distance' } = req.query;
    const now = new Date();
    let groupByFormat;
    let startDate;

    // Determine grouping format and start date based on period
    switch (period) {
        case 'monthly':
            // Group by year-month
            groupByFormat = "%Y-%m";
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); // Last 12 months
            break;
        case 'weekly':
        default:
            // Group by year-week
            groupByFormat = "%Y-%U"; // %U = week of year (Sunday as first day)
            startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
            break;
    }

    // Determine which metric to sum/average
    let groupOperator;
    switch (metric) {
        case 'duration':
            groupOperator = { $sum: "$duration" }; // Sum of duration
            break;
        case 'count':
            groupOperator = { $sum: 1 }; // Count of tracks
            break;
        case 'distance':
        default:
            groupOperator = { $sum: "$distance" }; // Sum of distance
            break;
    }

    const trends = await Track.aggregate([
        {
            $match: {
                userId: userId,
                startTime: { $gte: startDate } // Filter tracks within the period
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: groupByFormat, date: "$startTime" } }, // Group by week or month
                value: groupOperator // Calculate the sum/count for the metric
            }
        },
        {
            $sort: { _id: 1 } // Sort by period ascending
        },
        {
            $project: {
                _id: 0, // Remove the default _id
                period: "$_id", // Rename _id to period
                value: 1
            }
        }
    ]);

    res.status(200).json(trends);
});

// @desc    Get data points for heatmap visualization
// @route   GET /api/analytics/heatmap
// @access  Private (Synced user required)
const getHeatmapData = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    // WARNING: Fetching all route points can be very memory intensive!
    // Consider adding date filters, sampling, or using pre-aggregated data.
    // For now, fetch start and end points of recent tracks as an example.
    const recentTracks = await Track.find({
            userId: userId,
            // Add date filter, e.g., startTime: { $gte: new Date(Date.now() - 30*24*60*60*1000) } // Last 30 days
        })
        .limit(100) // Limit number of tracks considered
        .select('startLocation endLocation'); // Select only necessary location fields

    const heatmapPoints = [];
    recentTracks.forEach(track => {
        if (track.startLocation?.coordinates) {
            heatmapPoints.push({ 
                lat: track.startLocation.coordinates[1],
                lng: track.startLocation.coordinates[0],
                weight: 0.5 // Example weight 
            });
        }
        if (track.endLocation?.coordinates) {
             heatmapPoints.push({ 
                lat: track.endLocation.coordinates[1],
                lng: track.endLocation.coordinates[0],
                weight: 0.5 // Example weight
            });
        }
        // To include route points: iterate track.route and push { lat, lng, weight }
        // NEED TO BE CAREFUL WITH PERFORMANCE AND DATA SIZE
    });

    res.status(200).json(heatmapPoints);
});

// @desc    Export user data (profile, vehicles, tracks) as JSON
// @route   GET /api/analytics/export
// @access  Private (Synced user required)
const exportData = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    // Fetch all relevant data for the user
    const userProfile = await User.findById(userId).select('-_id -__v -firebaseUid'); // Exclude internal fields
    const userVehicles = await Vehicle.find({ userId }).select('-_id -__v -userId');
    const userTracks = await Track.find({ userId }).select('-_id -__v -userId'); // Exclude full route for smaller initial export?

    if (!userProfile) {
        return next(new AppError('User not found', 404));
    }

    const exportData = {
        profile: userProfile.toObject(), // Convert mongoose doc to plain object
        vehicles: userVehicles.map(v => v.toObject()),
        tracks: userTracks.map(t => t.toObject())
    };

    // Set headers for JSON file download
    res.setHeader('Content-Disposition', 'attachment; filename=lude_data_export.json');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(exportData);
});

module.exports = {
    getSummaryStats,
    getTrends,
    getHeatmapData,
    exportData
}; 