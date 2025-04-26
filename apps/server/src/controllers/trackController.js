const Track = require('../models/Track');
const User = require('../models/User'); // Needed to update user stats
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
const { checkAchievements } = require('../services/achievementService'); // Import achievement service
const { updateChallengeProgressOnTrackSave } = require('../services/challengeService'); // Import challenge service

// @desc    Save a new track after completion
// @route   POST /api/tracks
// @access  Private (Synced user required)
const saveTrack = asyncHandler(async (req, res, next) => {
    console.log("ENTERING saveTrack function");
    const userId = req.user._id;
    const {
        vehicleId, // Optional
        startTime,
        endTime,
        route, // Array of { lat, lng, speed, altitude, timestamp }
        tags,
        description,
        isPublic // Client might send based on user default or explicit choice
    } = req.body;

    // --- Basic Validation --- (More robust validation is better)
    if (!startTime || !endTime || !route || !Array.isArray(route) || route.length === 0) {
        return next(new AppError('Missing required track data (startTime, endTime, route)', 400));
    }

    // Validate timestamps
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return next(new AppError('Invalid startTime or endTime', 400));
    }

    // --- Calculate Track Stats --- (Could be moved to a service/utility)
    let distance = 0; // meters
    let maxSpeed = 0; // m/s
    let validSpeedPoints = 0;
    let speedSum = 0;

    for (let i = 1; i < route.length; i++) {
        const p1 = route[i - 1];
        const p2 = route[i];

        // Calculate distance between points (using Haversine formula)
        distance += calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);

        // Track max speed and sum for average
        if (p2.speed !== undefined && p2.speed >= 0) {
             if (p2.speed > maxSpeed) {
                maxSpeed = p2.speed;
            }
            speedSum += p2.speed;
            validSpeedPoints++;
        } else {
             console.warn(`Invalid speed data at point index ${i}:`, p2.speed);
        }
       
    }

    const duration = (end.getTime() - start.getTime()) / 1000; // seconds
    const avgSpeed = validSpeedPoints > 0 ? speedSum / validSpeedPoints : 0; // m/s

    // --- Create Track Document --- 
    const trackData = {
        userId,
        vehicleId: vehicleId || null,
        startTime: start,
        endTime: end,
        duration,
        distance,
        avgSpeed,
        maxSpeed,
        startLocation: {
            type: 'Point',
            coordinates: [route[0].lng, route[0].lat]
            // Add name lookup later if needed
        },
        endLocation: {
            type: 'Point',
            coordinates: [route[route.length - 1].lng, route[route.length - 1].lat]
             // Add name lookup later if needed
        },
        route: route.map(p => ({ // Ensure structure matches schema
            lat: p.lat,
            lng: p.lng,
            speed: p.speed !== undefined ? p.speed : 0, // Default speed if missing?
            altitude: p.altitude,
            timestamp: new Date(p.timestamp)
        })),
        tags: tags || [],
        description: description || '',
        // Set initial isPublic based on request or user preference default
        isPublic: typeof isPublic === 'boolean' ? isPublic : (req.user.preferences?.privacy?.trackVisibilityDefault === 'public'),
        // weather: {} // Add weather data if sent from client
    };

    const newTrack = await Track.create(trackData);

    // --- Update User Statistics --- 
    if (req.user && req.user.updateStats) {
        try {
            await req.user.updateStats({
                distance: newTrack.distance,
                duration: newTrack.duration,
                maxSpeed: newTrack.maxSpeed
            });
        } catch (statError) {
            console.error(`Error updating stats for user ${userId} after track ${newTrack._id}:`, statError);
            // Don't fail the track save, but log the error
        }
    }

    // --- Check for Achievements --- (Run asynchronously)
    checkAchievements('track_saved', { userId: userId, trackId: newTrack._id })
        .catch(err => {
            console.error(`[AchievementCheck] Error initiating achievement check for user ${userId}, track ${newTrack._id}:`, err);
        });
    
    // --- Update Challenge Progress --- (Run asynchronously)
    updateChallengeProgressOnTrackSave(userId, newTrack._id)
        .catch(err => {
            console.error(`[ChallengeUpdate] Error initiating challenge progress update for user ${userId}, track ${newTrack._id}:`, err);
        });

    res.status(201).json(newTrack);
});

// @desc    Get a specific track by ID
// @route   GET /api/tracks/:id
// @access  Public / Private (checks ownership if not public)
const getTrackById = asyncHandler(async (req, res, next) => {
    const trackId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(trackId)) {
        return next(new AppError(`Invalid track ID: ${trackId}`, 400));
    }

    const track = await Track.findById(trackId)
                           .populate('userId', 'username name profileImage') // Populate user info
                           .populate('vehicleId', 'make model nickname'); // Populate vehicle info

    if (!track) {
        return next(new AppError('Track not found', 404));
    }

    // Check authorization if the track is not public
    if (!track.isPublic) {
        // User must be logged in to view private tracks
        if (!req.user) {
            return next(new AppError('Not authorized to view this track (login required)', 401));
        }
        // User must own the track to view it if private
        if (track.userId._id.toString() !== req.user._id.toString()) {
             return next(new AppError('Not authorized to view this track', 403));
        }
    }

    res.status(200).json(track);
});

// @desc    Get tracks for the logged-in user (paginated)
// @route   GET /api/tracks/list
// @access  Private (Synced user required)
const getUserTracks = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Default 10 per page
    const skip = (page - 1) * limit;

    const totalTracks = await Track.countDocuments({ userId });
    const tracks = await Track.find({ userId })
                              .sort({ startTime: -1 }) // Newest first
                              .skip(skip)
                              .limit(limit)
                              .select('-route') // Exclude full route data for list view
                              .populate('vehicleId', 'make model nickname');

    res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalTracks / limit),
        totalTracks,
        tracks
    });
});

// @desc    Get public tracks (paginated)
// @route   GET /api/tracks/public
// @access  Public
const getPublicTracks = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Optional: Add filtering/sorting options later (e.g., by distance, nearest)

    const totalTracks = await Track.countDocuments({ isPublic: true });
    const tracks = await Track.find({ isPublic: true })
                              .sort({ startTime: -1 })
                              .skip(skip)
                              .limit(limit)
                              .select('-route')
                              .populate('userId', 'username name profileImage')
                              .populate('vehicleId', 'make model nickname');

     res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalTracks / limit),
        totalTracks,
        tracks
    });
});

// @desc    Update track details (description, tags, isPublic)
// @route   PUT /api/tracks/:id
// @access  Private (Owner only)
const updateTrack = asyncHandler(async (req, res, next) => {
    const trackId = req.params.id;
    const userId = req.user._id;
    const { description, tags, isPublic } = req.body;

    if (!mongoose.Types.ObjectId.isValid(trackId)) {
        return next(new AppError(`Invalid track ID: ${trackId}`, 400));
    }

    const track = await Track.findById(trackId);

    if (!track) {
        return next(new AppError('Track not found', 404));
    }

    // Ensure owner is updating
    if (track.userId.toString() !== userId.toString()) {
        return next(new AppError('Not authorized to update this track', 403));
    }

    // Prepare update data
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined && Array.isArray(tags)) updateData.tags = tags;
    if (isPublic !== undefined && typeof isPublic === 'boolean') updateData.isPublic = isPublic;

    if (Object.keys(updateData).length === 0) {
        return res.status(200).json(track); // Nothing to update, return current track
    }

    const updatedTrack = await Track.findByIdAndUpdate(trackId, { $set: updateData }, {
        new: true,
        runValidators: true
    }).populate('userId', 'username name profileImage')
      .populate('vehicleId', 'make model nickname');

    res.status(200).json(updatedTrack);
});

// @desc    Delete a track by ID
// @route   DELETE /api/tracks/:id
// @access  Private (Owner only)
const deleteTrack = asyncHandler(async (req, res, next) => {
    const trackId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(trackId)) {
        return next(new AppError(`Invalid track ID: ${trackId}`, 400));
    }

    const track = await Track.findById(trackId);

    if (!track) {
        return next(new AppError('Track not found', 404));
    }

    // Ensure owner is deleting
    if (track.userId.toString() !== userId.toString()) {
        return next(new AppError('Not authorized to delete this track', 403));
    }

    // TODO: Consider implications - should deleting a track *reduce* user stats?
    // Currently, stats are only incremented. Add logic here or in a pre-remove hook if needed.

    await track.deleteOne();

    // TODO: Delete associated comments, reactions, etc. (or use pre/post remove hook on model)
    // await Comment.deleteMany({ trackId });
    // await Reaction.deleteMany({ trackId });

    res.status(200).json({ message: 'Track deleted successfully' });
});

// --- Helper Functions ---

// Calculate distance between two lat/lng points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}


module.exports = {
    saveTrack,
    getTrackById,
    getUserTracks,
    getPublicTracks,
    updateTrack,
    deleteTrack
}; 