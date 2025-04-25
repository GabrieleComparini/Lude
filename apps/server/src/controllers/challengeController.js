const Challenge = require('../models/Challenge');
const ChallengeParticipant = require('../models/ChallengeParticipant');
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// @desc    Get list of available challenges (active or all)
// @route   GET /api/challenges
// @access  Public (or Private)
const listChallenges = asyncHandler(async (req, res, next) => {
    const { status = 'active' } = req.query; // Default to active, allow 'all', 'upcoming', 'expired'
    const now = new Date();
    
    const query = {};
    if (status === 'active') {
        query.isActive = true;
        query.startTime = { $lte: now };
        query.endTime = { $gte: now };
    } else if (status === 'upcoming') {
        query.isActive = true;
        query.startTime = { $gt: now };
    } else if (status === 'expired') {
        // Could be inactive OR active but past endTime
        query.$or = [{ isActive: false }, { endTime: { $lt: now } }];
    } else if (status !== 'all') {
        return next(new AppError(`Invalid status filter: ${status}`, 400));
    }
    // If status === 'all', query remains empty {} -> find all

    const challenges = await Challenge.find(query).sort({ endTime: 1, startTime: 1 }); // Sort by end time, then start time

    res.status(200).json(challenges);
});

// @desc    Get details of a specific challenge by ID
// @route   GET /api/challenges/:id
// @access  Public (or Private)
const getChallengeById = asyncHandler(async (req, res, next) => {
    const challengeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
        return next(new AppError('Invalid challenge ID', 400));
    }

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
        return next(new AppError('Challenge not found', 404));
    }

    res.status(200).json(challenge);
});

// @desc    Join a challenge
// @route   POST /api/challenges/:id/join
// @access  Private (Synced user required)
const joinChallenge = asyncHandler(async (req, res, next) => {
    const challengeId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
        return next(new AppError('Invalid challenge ID', 400));
    }

    // 1. Find the challenge
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
        return next(new AppError('Challenge not found', 404));
    }

    // 2. Check if challenge is active and joinable
    const now = new Date();
    if (!challenge.isActive || challenge.startTime > now || challenge.endTime < now) {
        return next(new AppError('Challenge is not active or cannot be joined at this time', 400));
    }

    // 3. Check if user already joined (unique index handles this, but good practice)
    const existingParticipation = await ChallengeParticipant.findOne({ challengeId, userId });
    if (existingParticipation) {
        return res.status(200).json(existingParticipation); // Already joined, return current status
        // Alternatively: return next(new AppError('Already joined this challenge', 400));
    }

    // 4. Create participation record
    const newParticipation = await ChallengeParticipant.create({
        challengeId,
        userId,
        progress: 0, // Initial progress
        status: 'joined'
        // goalValue: challenge.goal // Optionally store goal value
    });

    // Optional: Increment participantsCount on Challenge model if denormalizing
    // await Challenge.findByIdAndUpdate(challengeId, { $inc: { participantsCount: 1 } });

    res.status(201).json(newParticipation);
});

// @desc    Get participation status/progress for a specific challenge for logged-in user
// @route   GET /api/challenges/:id/progress
// @access  Private (Synced user required)
const getUserChallengeProgress = asyncHandler(async (req, res, next) => {
    const challengeId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
        return next(new AppError('Invalid challenge ID', 400));
    }

    const participation = await ChallengeParticipant.findOne({ challengeId, userId })
                                                  .populate({
                                                      path: 'challengeId',
                                                      select: 'name description type goal goalUnit startTime endTime reward' // Populate relevant challenge details
                                                  });

    if (!participation) {
        // If user hasn't joined, return null or specific status?
        // For now, return 404 indicating no participation found.
        return next(new AppError('Participation record not found for this challenge', 404));
    }

    res.status(200).json(participation);
});

// @desc    Get all challenges the logged-in user is participating in
// @route   GET /api/challenges/participating
// @access  Private (Synced user required)
const getUserParticipations = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    // Find all participation records for the user
    const participations = await ChallengeParticipant.find({ userId })
        .sort({ 'challengeId.endTime': 1 }) // Sort by challenge end time?
        .populate({
            path: 'challengeId',
            select: 'name description type goal goalUnit startTime endTime reward status' // Populate relevant challenge details + status virtual
        });

    res.status(200).json(participations);
});

// TODO: Add admin controllers for creating/updating/deleting challenge definitions

module.exports = {
    listChallenges,
    getChallengeById,
    joinChallenge,
    getUserChallengeProgress,
    getUserParticipations
}; 