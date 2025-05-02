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
    try {
    // req.user is guaranteed by ensureSynced middleware
        const userId = req.user._id;
        
        // Get total distance and duration from tracks
        const tracksAggregation = await Track.aggregate([
            { $match: { userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId } },
            { $group: {
                _id: null,
                totalDistance: { $sum: '$distance' },
                totalDuration: { $sum: '$duration' },
                maxSpeed: { $max: '$maxSpeed' },
                avgSpeed: { $avg: '$avgSpeed' },
                trackCount: { $sum: 1 }
            }}
        ]);
        
        // Calculate stats
        const stats = tracksAggregation.length > 0 ? tracksAggregation[0] : {
            totalDistance: 0,
            totalDuration: 0,
            maxSpeed: 0,
            avgSpeed: 0,
            trackCount: 0
        };
        
        // Convert distance from meters to km
        stats.totalDistance = (stats.totalDistance || 0) / 1000;
        
        // Convert speed from m/s to km/h
        stats.maxSpeed = (stats.maxSpeed || 0) * 3.6;
        stats.avgSpeed = (stats.avgSpeed || 0) * 3.6;
        
        // Convert duration from seconds to hours and minutes
        const hours = Math.floor((stats.totalDuration || 0) / 3600);
        const minutes = Math.floor(((stats.totalDuration || 0) % 3600) / 60);
        stats.formattedDuration = `${hours}h ${minutes}m`;
        
        // Make sure we delete _id field if it exists
        if (stats._id !== undefined) {
            delete stats._id;
    }
        
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error in getSummaryStats:', error);
        return next(new AppError('Failed to fetch user statistics', 500));
    }
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

// @desc    Get speed distribution data (time spent in different speed ranges)
// @route   GET /api/analytics/speed-distribution
// @access  Private (Synced user required)
const getSpeedDistribution = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    
    // Define speed ranges in km/h
    const speedRanges = [
        { minSpeed: 0, maxSpeed: 50 },
        { minSpeed: 50, maxSpeed: 100 },
        { minSpeed: 100, maxSpeed: 150 },
        { minSpeed: 150, maxSpeed: 200 },
        { minSpeed: 200, maxSpeed: 250 },
        { minSpeed: 250, maxSpeed: "250+" }
    ];
    
    // Get all tracks for the user
    const tracks = await Track.find({ userId }).select('route');
    
    // Calculate time spent in each speed range
    const speedDistribution = speedRanges.map(range => {
        const minSpeed = range.minSpeed;
        const maxSpeed = range.maxSpeed === "250+" ? Infinity : range.maxSpeed;
        
        // Convert km/h to m/s for comparison with track data
        const minSpeedMps = minSpeed / 3.6;
        const maxSpeedMps = maxSpeed === Infinity ? Infinity : maxSpeed / 3.6;
        
        let timeSpent = 0; // in seconds
        
        tracks.forEach(track => {
            if (!track.route || track.route.length < 2) return;
            
            for (let i = 1; i < track.route.length; i++) {
                const currentPoint = track.route[i];
                const prevPoint = track.route[i-1];
                
                // Check if speed is within range
                if (currentPoint.speed >= minSpeedMps && currentPoint.speed < maxSpeedMps) {
                    // Calculate time between points
                    const timeDiff = (new Date(currentPoint.timestamp) - new Date(prevPoint.timestamp)) / 1000; // in seconds
                    
                    // Add to total time spent in this range
                    timeSpent += timeDiff;
                }
            }
        });
        
        return {
            minSpeed,
            maxSpeed: range.maxSpeed,
            timeSpent: Math.round(timeSpent) // Round to whole seconds
        };
    });
    
    res.status(200).json(speedDistribution);
});

// @desc    Get statistics grouped by vehicle
// @route   GET /api/analytics/vehicles
// @access  Private (Synced user required)
const getStatsByVehicle = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    
    // Get statistics for each vehicle
    const vehicleStats = await Track.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $group: {
            _id: '$vehicleId',
            totalDistance: { $sum: '$distance' },
            totalDuration: { $sum: '$duration' },
            maxSpeed: { $max: '$maxSpeed' },
            avgSpeed: { $avg: '$avgSpeed' },
            trackCount: { $sum: 1 }
        }},
        { $lookup: {
            from: 'vehicles',
            localField: '_id',
            foreignField: '_id',
            as: 'vehicle'
        }},
        { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
        { $project: {
            _id: 1,
            vehicleName: { $ifNull: ['$vehicle.nickname', '$vehicle.make'] },
            vehicleImage: '$vehicle.imageUrl',
            totalDistance: { $divide: ['$totalDistance', 1000] }, // Convert to km
            totalDuration: 1,
            maxSpeed: { $multiply: ['$maxSpeed', 3.6] }, // Convert to km/h
            avgSpeed: { $multiply: ['$avgSpeed', 3.6] }, // Convert to km/h
            trackCount: 1
        }}
    ]);
    
    // Handle tracks without a vehicle
    const noVehicleIndex = vehicleStats.findIndex(stat => stat._id === null);
    if (noVehicleIndex !== -1) {
        vehicleStats[noVehicleIndex].vehicleName = 'No Vehicle';
    }
    
    res.status(200).json(vehicleStats);
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
    getSpeedDistribution,
    getStatsByVehicle,
    exportData
}; 