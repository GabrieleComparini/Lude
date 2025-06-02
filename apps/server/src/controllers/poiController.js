const POI = require('../models/POI');
const POICategory = require('../models/POICategory');
const POIReview = require('../models/POIReview');
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// @desc    Create a new POI
// @route   POST /api/pois
// @access  Private
const createPOI = asyncHandler(async (req, res, next) => {
    const {
        name,
        description,
        category,
        coordinates,
        address,
        tags,
        website,
        phoneNumber,
        openingHours
    } = req.body;

    // Basic validation
    if (!name || !category || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        return next(new AppError('Missing required POI data (name, category, coordinates)', 400));
    }

    // Validate category exists
    const categoryExists = await POICategory.findById(category);
    if (!categoryExists) {
        return next(new AppError('Invalid category ID', 400));
    }

    // Create POI
    const poiData = {
        name,
        description,
        category,
        location: {
            type: 'Point',
            coordinates: [coordinates[0], coordinates[1]] // [longitude, latitude]
        },
        address: address || {},
        images: [],
        rating: { average: 0, count: 0 },
        createdBy: req.user._id,
        tags: tags || [],
        website,
        phoneNumber,
        openingHours
    };

    const newPOI = await POI.create(poiData);

    res.status(201).json(newPOI);
});

// @desc    Get all POIs with optional filters
// @route   GET /api/pois
// @access  Public
const getPOIs = asyncHandler(async (req, res, next) => {
    const {
        lat,
        lng,
        radius = 10000, // Default 10km radius
        category,
        search,
        page = 1,
        limit = 20,
        sort = '-createdAt' // Default sort by most recent
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Base query
    let query = { status: 'active' };

    // Geospatial query if coordinates provided
    if (lat && lng) {
        query.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance: parseInt(radius, 10)
            }
        };
    }

    // Category filter
    if (category) {
        query.category = category;
    }

    // Text search
    if (search) {
        query.$text = { $search: search };
    }

    // Execute query with pagination
    const pois = await POI.find(query)
        .populate('category', 'name icon color')
        .populate('createdBy', 'username name profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    // Get total count for pagination
    const total = await POI.countDocuments(query);

    res.status(200).json({
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        data: pois
    });
});

// @desc    Get a specific POI by ID
// @route   GET /api/pois/:id
// @access  Public
const getPOIById = asyncHandler(async (req, res, next) => {
    const poiId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(poiId)) {
        return next(new AppError(`Invalid POI ID: ${poiId}`, 400));
    }

    const poi = await POI.findById(poiId)
        .populate('category', 'name icon color description')
        .populate('createdBy', 'username name profileImage');

    if (!poi) {
        return next(new AppError('POI not found', 404));
    }

    if (poi.status !== 'active' && (!req.user || poi.createdBy._id.toString() !== req.user._id.toString())) {
        return next(new AppError('POI not available', 404));
    }

    res.status(200).json(poi);
});

// @desc    Update a POI
// @route   PUT /api/pois/:id
// @access  Private (owner or admin)
const updatePOI = asyncHandler(async (req, res, next) => {
    const poiId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(poiId)) {
        return next(new AppError(`Invalid POI ID: ${poiId}`, 400));
    }

    const poi = await POI.findById(poiId);

    if (!poi) {
        return next(new AppError('POI not found', 404));
    }

    // Check if user is owner or admin
    if (poi.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new AppError('Not authorized to update this POI', 403));
    }

    // Handle coordinates update
    if (req.body.coordinates) {
        req.body.location = {
            type: 'Point',
            coordinates: [req.body.coordinates[0], req.body.coordinates[1]]
        };
        delete req.body.coordinates;
    }

    // Prevent changing critical fields
    delete req.body.createdBy;
    delete req.body.rating;
    delete req.body.isVerified;

    const updatedPOI = await POI.findByIdAndUpdate(poiId, req.body, {
        new: true,
        runValidators: true
    }).populate('category', 'name icon color description')
      .populate('createdBy', 'username name profileImage');

    res.status(200).json(updatedPOI);
});

// @desc    Delete a POI
// @route   DELETE /api/pois/:id
// @access  Private (owner or admin)
const deletePOI = asyncHandler(async (req, res, next) => {
    const poiId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(poiId)) {
        return next(new AppError(`Invalid POI ID: ${poiId}`, 400));
    }

    const poi = await POI.findById(poiId);

    if (!poi) {
        return next(new AppError('POI not found', 404));
    }

    // Check if user is owner or admin
    if (poi.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new AppError('Not authorized to delete this POI', 403));
    }

    // Option 1: Hard delete the POI and its reviews
    /*
    await POIReview.deleteMany({ poiId });
    await POI.findByIdAndDelete(poiId);
    */

    // Option 2: Soft delete by changing status
    await POI.findByIdAndUpdate(poiId, { status: 'archived' });

    res.status(200).json({ message: 'POI removed successfully' });
});

// @desc    Add an image to a POI
// @route   POST /api/pois/:id/images
// @access  Private
const addPOIImage = asyncHandler(async (req, res, next) => {
    const poiId = req.params.id;
    const { url, caption } = req.body;

    if (!url) {
        return next(new AppError('Image URL is required', 400));
    }

    const poi = await POI.findById(poiId);

    if (!poi) {
        return next(new AppError('POI not found', 404));
    }

    const newImage = {
        url,
        caption: caption || '',
        uploadedAt: new Date(),
        uploadedBy: req.user._id
    };

    poi.images.push(newImage);
    await poi.save();

    res.status(201).json(newImage);
});

// @desc    Remove an image from a POI
// @route   DELETE /api/pois/:id/images/:imageId
// @access  Private (owner or admin or image uploader)
const removePOIImage = asyncHandler(async (req, res, next) => {
    const { id: poiId, imageId } = req.params;

    const poi = await POI.findById(poiId);

    if (!poi) {
        return next(new AppError('POI not found', 404));
    }

    const imageIndex = poi.images.findIndex(img => img._id.toString() === imageId);

    if (imageIndex === -1) {
        return next(new AppError('Image not found', 404));
    }

    const image = poi.images[imageIndex];

    // Check if user is authorized to remove the image
    const isAuthorized = 
        poi.createdBy.toString() === req.user._id.toString() || 
        image.uploadedBy.toString() === req.user._id.toString() ||
        req.user.role === 'admin';

    if (!isAuthorized) {
        return next(new AppError('Not authorized to remove this image', 403));
    }

    poi.images.splice(imageIndex, 1);
    await poi.save();

    res.status(200).json({ message: 'Image removed successfully' });
});

module.exports = {
    createPOI,
    getPOIs,
    getPOIById,
    updatePOI,
    deletePOI,
    addPOIImage,
    removePOIImage
}; 