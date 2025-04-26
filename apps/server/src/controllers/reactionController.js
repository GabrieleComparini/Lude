const Track = require('../models/Track');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// Define valid reaction types
const VALID_REACTIONS = ['like', 'wow']; // Add more as needed

// @desc    Add or toggle a reaction to a track
// @route   POST /api/tracks/:trackId/react
// @access  Private (Synced user required)
const handleReaction = asyncHandler(async (req, res, next) => {
    const trackId = req.params.trackId;
    const userId = req.user._id;
    const { type } = req.body; // e.g., { "type": "like" }

    if (!type || !VALID_REACTIONS.includes(type)) {
        return next(new AppError(`Invalid reaction type. Valid types are: ${VALID_REACTIONS.join(', ')}`, 400));
    }

    if (!mongoose.Types.ObjectId.isValid(trackId)) {
        return next(new AppError(`Invalid track ID: ${trackId}`, 400));
    }

    // Check if track exists and is accessible
    const track = await Track.findById(trackId).select('isPublic userId reactions reactionsLog'); // Include reactionsLog if using Option B later
    if (!track) {
        return next(new AppError('Track not found', 404));
    }

    // Check if user can react (e.g., public track or owner/connection)
    if (!track.isPublic && track.userId.toString() !== userId.toString()) {
        // Add more complex logic if connections can react to private tracks
        return next(new AppError('Cannot react to this private track', 403));
    }

    // --- Simple Reaction Toggle (Option A - using denormalized counts) --- 
    // This simple version just increments/decrements count. It does NOT track *who* reacted.
    // A common approach to prevent multiple reactions from the same user requires a more complex setup (Option B).
    // For now, we proceed with the simple increment/decrement based on a hypothetical client toggle state.

    // The client would typically send if the user is *adding* or *removing* the reaction.
    // Let's assume the client sends `add: true` or `add: false` in the body for simplicity.
    const { add } = req.body;
    const updateField = `reactions.${type}`; // e.g., 'reactions.like'
    const incrementValue = (add === true) ? 1 : -1; // Increment if adding, decrement if removing

    // Prevent counts from going below zero
    if (incrementValue === -1 && (!track.reactions || track.reactions[type] === undefined || track.reactions[type] <= 0)) {
        return res.status(400).json({ message: `Cannot remove reaction '${type}' as count is already zero.` });
    }

    const updatedTrack = await Track.findByIdAndUpdate(trackId, 
        { $inc: { [updateField]: incrementValue } }, 
        { new: true, runValidators: true } // runValidators might not be needed for $inc
    ).select('reactions'); // Return only the updated reactions object

    if (!updatedTrack) {
        return next(new AppError('Failed to update reaction count', 500));
    }

    res.status(200).json(updatedTrack.reactions);

    // --- Alternative: Option B Setup (Tracking Individual Reactions - more robust) ---
    /*
    // Requires a Reaction model: { trackId, userId, type }
    const existingReaction = await Reaction.findOne({ trackId, userId, type });

    if (existingReaction) {
        // User already reacted with this type, remove it
        await existingReaction.deleteOne();
        // Decrement count on Track (could use hooks on Reaction model)
        await Track.findByIdAndUpdate(trackId, { $inc: { [`reactions.${type}`]: -1 } });
        res.status(200).json({ message: `Reaction '${type}' removed` });
    } else {
        // User hasn't reacted with this type, add it
        await Reaction.create({ trackId, userId, type });
        // Increment count on Track (could use hooks on Reaction model)
        await Track.findByIdAndUpdate(trackId, { $inc: { [`reactions.${type}`]: 1 } });
        res.status(201).json({ message: `Reaction '${type}' added` });
    }
    */
});


module.exports = {
    handleReaction
}; 