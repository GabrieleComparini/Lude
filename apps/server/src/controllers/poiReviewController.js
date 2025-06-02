const POIReview = require('../models/POIReview');
const POI = require('../models/POI');
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// @desc    Add a review to a POI
// @route   POST /api/pois/:id/reviews
// @access  Private
const createReview = asyncHandler(async (req, res, next) => {
    const poiId = req.params.id;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(poiId)) {
        return next(new AppError(`Invalid POI ID: ${poiId}`, 400));
    }
    
    const { rating, comment, images, visitDate, tags } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
        return next(new AppError('Rating is required and must be between 1 and 5', 400));
    }
    
    // Check if POI exists
    const poi = await POI.findById(poiId);
    if (!poi) {
        return next(new AppError('POI not found', 404));
    }
    
    // Check if user has already reviewed this POI
    const existingReview = await POIReview.findOne({ poiId, userId });
    if (existingReview) {
        return next(new AppError('You have already reviewed this POI', 400));
    }
    
    // Create the review
    const review = await POIReview.create({
        poiId,
        userId,
        rating,
        comment,
        images: images || [],
        visitDate: visitDate ? new Date(visitDate) : undefined,
        tags: tags || []
    });
    
    // Populate user details for response
    const populatedReview = await POIReview.findById(review._id)
        .populate('userId', 'username name profileImage');
    
    res.status(201).json(populatedReview);
});

// @desc    Get all reviews for a POI
// @route   GET /api/pois/:id/reviews
// @access  Public
const getPOIReviews = asyncHandler(async (req, res, next) => {
    const poiId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(poiId)) {
        return next(new AppError(`Invalid POI ID: ${poiId}`, 400));
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const sortBy = req.query.sort || '-createdAt'; // Default newest first
    
    // Check if POI exists
    const poi = await POI.findById(poiId);
    if (!poi) {
        return next(new AppError('POI not found', 404));
    }
    
    // Get only visible reviews
    const query = { poiId, isVisible: true };
    
    const reviews = await POIReview.find(query)
        .populate('userId', 'username name profileImage')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    
    const totalReviews = await POIReview.countDocuments(query);
    
    res.status(200).json({
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
        data: reviews
    });
});

// @desc    Get a specific review
// @route   GET /api/pois/:id/reviews/:reviewId
// @access  Public
const getReviewById = asyncHandler(async (req, res, next) => {
    const { id: poiId, reviewId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(poiId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
        return next(new AppError('Invalid POI ID or Review ID', 400));
    }
    
    const review = await POIReview.findOne({ _id: reviewId, poiId })
        .populate('userId', 'username name profileImage');
    
    if (!review) {
        return next(new AppError('Review not found', 404));
    }
    
    if (!review.isVisible && (!req.user || review.userId._id.toString() !== req.user._id.toString())) {
        return next(new AppError('Review not available', 404));
    }
    
    res.status(200).json(review);
});

// @desc    Update a review
// @route   PUT /api/pois/:id/reviews/:reviewId
// @access  Private (owner only)
const updateReview = asyncHandler(async (req, res, next) => {
    const { id: poiId, reviewId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(poiId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
        return next(new AppError('Invalid POI ID or Review ID', 400));
    }
    
    let review = await POIReview.findOne({ _id: reviewId, poiId });
    
    if (!review) {
        return next(new AppError('Review not found', 404));
    }
    
    // Check ownership
    if (review.userId.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to update this review', 403));
    }
    
    // Validate rating if provided
    if (req.body.rating && (req.body.rating < 1 || req.body.rating > 5)) {
        return next(new AppError('Rating must be between 1 and 5', 400));
    }
    
    // Update allowed fields only
    const allowedUpdates = ['rating', 'comment', 'images', 'visitDate', 'tags'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });
    
    // Process visitDate if provided
    if (updates.visitDate) {
        updates.visitDate = new Date(updates.visitDate);
    }
    
    review = await POIReview.findByIdAndUpdate(
        reviewId,
        updates,
        { new: true, runValidators: true }
    ).populate('userId', 'username name profileImage');
    
    res.status(200).json(review);
});

// @desc    Delete a review
// @route   DELETE /api/pois/:id/reviews/:reviewId
// @access  Private (owner or admin)
const deleteReview = asyncHandler(async (req, res, next) => {
    const { id: poiId, reviewId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(poiId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
        return next(new AppError('Invalid POI ID or Review ID', 400));
    }
    
    const review = await POIReview.findOne({ _id: reviewId, poiId });
    
    if (!review) {
        return next(new AppError('Review not found', 404));
    }
    
    // Check authorization (owner or admin)
    const isAuthorized = 
        review.userId.toString() === req.user._id.toString() ||
        req.user.role === 'admin';
    
    if (!isAuthorized) {
        return next(new AppError('Not authorized to delete this review', 403));
    }
    
    // Option 1: Hard delete
    // await POIReview.findByIdAndDelete(reviewId);
    
    // Option 2: Soft delete
    review.isVisible = false;
    await review.save();
    
    res.status(200).json({ message: 'Review removed successfully' });
});

// @desc    Mark a review as helpful
// @route   POST /api/pois/:id/reviews/:reviewId/helpful
// @access  Private
const markReviewHelpful = asyncHandler(async (req, res, next) => {
    const { id: poiId, reviewId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(poiId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
        return next(new AppError('Invalid POI ID or Review ID', 400));
    }
    
    const review = await POIReview.findOne({ _id: reviewId, poiId });
    
    if (!review) {
        return next(new AppError('Review not found', 404));
    }
    
    // Prevent users from marking their own reviews as helpful
    if (review.userId.toString() === req.user._id.toString()) {
        return next(new AppError('You cannot mark your own review as helpful', 400));
    }
    
    // This is a simplified approach. In a production app, you would track which users
    // marked which reviews as helpful to prevent multiple marks
    review.helpfulCount += 1;
    await review.save();
    
    res.status(200).json({
        message: 'Review marked as helpful',
        helpfulCount: review.helpfulCount
    });
});

module.exports = {
    createReview,
    getPOIReviews,
    getReviewById,
    updateReview,
    deleteReview,
    markReviewHelpful
}; 