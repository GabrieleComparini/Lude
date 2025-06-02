const POICategory = require('../models/POICategory');
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// @desc    Create a new POI category
// @route   POST /api/pois/categories
// @access  Private (admin)
const createCategory = asyncHandler(async (req, res, next) => {
    const { name, icon, color, description, order } = req.body;

    if (!name) {
        return next(new AppError('Category name is required', 400));
    }

    // Check for duplicate
    const existingCategory = await POICategory.findOne({ name });
    if (existingCategory) {
        return next(new AppError('A category with this name already exists', 400));
    }

    const category = await POICategory.create({
        name,
        icon,
        color,
        description,
        order: order || 0
    });

    res.status(201).json(category);
});

// @desc    Get all POI categories
// @route   GET /api/pois/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await POICategory.find().sort({ order: 1, name: 1 });
    res.status(200).json(categories);
});

// @desc    Get a specific POI category
// @route   GET /api/pois/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res, next) => {
    const categoryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(new AppError(`Invalid category ID: ${categoryId}`, 400));
    }

    const category = await POICategory.findById(categoryId);

    if (!category) {
        return next(new AppError('Category not found', 404));
    }

    res.status(200).json(category);
});

// @desc    Update a POI category
// @route   PUT /api/pois/categories/:id
// @access  Private (admin)
const updateCategory = asyncHandler(async (req, res, next) => {
    const categoryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(new AppError(`Invalid category ID: ${categoryId}`, 400));
    }

    // Check for duplicate name if changing name
    if (req.body.name) {
        const existingCategory = await POICategory.findOne({ 
            name: req.body.name, 
            _id: { $ne: categoryId } 
        });
        
        if (existingCategory) {
            return next(new AppError('A category with this name already exists', 400));
        }
    }

    const category = await POICategory.findByIdAndUpdate(
        categoryId,
        req.body,
        { new: true, runValidators: true }
    );

    if (!category) {
        return next(new AppError('Category not found', 404));
    }

    res.status(200).json(category);
});

// @desc    Delete a POI category
// @route   DELETE /api/pois/categories/:id
// @access  Private (admin)
const deleteCategory = asyncHandler(async (req, res, next) => {
    const categoryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return next(new AppError(`Invalid category ID: ${categoryId}`, 400));
    }

    const category = await POICategory.findById(categoryId);

    if (!category) {
        return next(new AppError('Category not found', 404));
    }

    // Check if category is in use by any POIs
    const POI = require('../models/POI');
    const poiCount = await POI.countDocuments({ category: categoryId });

    if (poiCount > 0) {
        return next(new AppError(`Cannot delete category that is used by ${poiCount} POIs`, 400));
    }

    await POICategory.findByIdAndDelete(categoryId);

    res.status(200).json({ message: 'Category deleted successfully' });
});

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
}; 