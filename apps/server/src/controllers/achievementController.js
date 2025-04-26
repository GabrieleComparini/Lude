const Achievement = require('../models/Achievement');
const AchievementEarned = require('../models/AchievementEarned');
const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');

// @desc    Get all achievement definitions
// @route   GET /api/achievements
// @access  Public
const getAllAchievementDefinitions = asyncHandler(async (req, res, next) => {
    // Exclude requirements from the public list? Or keep them?
    // For now, include everything.
    const achievements = await Achievement.find({}).sort('category rarity name');
    res.status(200).json(achievements);
});

// @desc    Get achievements earned by the logged-in user
// @route   GET /api/achievements/earned
// @access  Private
const getEarnedAchievementsForUser = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const earned = await AchievementEarned.find({ userId })
        .sort({ earnedAt: -1 }) // Show most recent first
        .populate({ 
            path: 'achievementId',
            model: 'Achievement', // Explicitly specify model name
            select: 'name description iconUrl rarity category' // Select fields from Achievement
        })
        .select('earnedAt trackId achievementId'); // Select fields from AchievementEarned

    if (!earned) {
        return res.status(200).json([]); // Return empty array if none found
    }

    // Optional: Format the response if needed, e.g., flatten the populated data
    const formattedEarned = earned.map(e => ({
        achievementCode: e.achievementId.achievementCode, // Assuming code is on Achievement now
        name: e.achievementId.name,
        description: e.achievementId.description,
        iconUrl: e.achievementId.iconUrl,
        category: e.achievementId.category,
        rarity: e.achievementId.rarity,
        earnedAt: e.earnedAt,
        trackId: e.trackId // Include trackId if present
        // _id: e._id // Include the earned record ID if needed
    }));

    res.status(200).json(formattedEarned);
});

// @desc    Create a new achievement definition
// @route   POST /api/achievements
// @access  Private (Admin only)
const createAchievement = asyncHandler(async (req, res, next) => {
    // Basic validation (more can be added based on requirements)
    const { achievementCode, name, description, category, requirements, rarity, iconUrl } = req.body;

    if (!achievementCode || !name || !description || !category || !requirements) {
        return next(new AppError('Missing required fields for achievement definition', 400));
    }

    // Check if code already exists
    const existing = await Achievement.findOne({ achievementCode: achievementCode.toUpperCase() });
    if (existing) {
        return next(new AppError(`Achievement code '${achievementCode}' already exists`, 400));
    }

    const newAchievement = await Achievement.create({
        achievementCode: achievementCode.toUpperCase(),
        name,
        description,
        iconUrl,
        category,
        requirements,
        rarity: rarity || 'common' // Default rarity if not provided
    });

    res.status(201).json(newAchievement);
});

// @desc    Update an achievement definition by ID
// @route   PUT /api/achievements/:id
// @access  Private (Admin only)
const updateAchievement = asyncHandler(async (req, res, next) => {
    const achievementId = req.params.id;
    const { name, description, category, requirements, rarity, iconUrl, achievementCode } = req.body;

    // Prevent changing the achievementCode easily? Or allow if unique?
    // For now, let's prevent changing the code via update, handle separately if needed.
    if (achievementCode) {
        return next(new AppError('Updating achievementCode is not allowed via this endpoint.', 400));
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    if (category !== undefined) updateData.category = category;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (rarity !== undefined) updateData.rarity = rarity;

    if (Object.keys(updateData).length === 0) {
        return next(new AppError('No valid fields provided for update', 400));
    }

    const updatedAchievement = await Achievement.findByIdAndUpdate(achievementId, updateData, {
        new: true, // Return the updated document
        runValidators: true // Run schema validators
    });

    if (!updatedAchievement) {
        return next(new AppError('Achievement definition not found', 404));
    }

    res.status(200).json(updatedAchievement);
});

// @desc    Delete an achievement definition by ID
// @route   DELETE /api/achievements/:id
// @access  Private (Admin only)
const deleteAchievement = asyncHandler(async (req, res, next) => {
    const achievementId = req.params.id;

    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
        return next(new AppError('Achievement definition not found', 404));
    }

    // TODO: Consider implications - what happens to users who earned this?
    // Option 1: Delete AchievementEarned records (cascade delete - potentially complex)
    // Option 2: Keep AchievementEarned records, but the linked definition is gone (causes issues?)
    // Option 3: Add a flag like 'isDeleted' or 'isActive' instead of actually deleting.
    // For now, we proceed with deletion, but this needs thought in a real app.
    // Example: await AchievementEarned.deleteMany({ achievementId });

    await achievement.deleteOne();

    res.status(200).json({ message: 'Achievement definition deleted successfully' });
});

// TODO: Add admin controllers for creating/updating/deleting achievement definitions

module.exports = {
    getAllAchievementDefinitions,
    getEarnedAchievementsForUser,
    createAchievement,
    updateAchievement,
    deleteAchievement
}; 