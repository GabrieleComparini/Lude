const express = require('express');
const router = express.Router();
const { 
    createPOI, 
    getPOIs, 
    getPOIById, 
    updatePOI, 
    deletePOI,
    addPOIImage,
    removePOIImage
} = require('../controllers/poiController');

const {
    createReview,
    getPOIReviews,
    getReviewById,
    updateReview,
    deleteReview,
    markReviewHelpful
} = require('../controllers/poiReviewController');

const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/poiCategoryController');

const { protect, admin } = require('../middleware/authMiddleware');

// POI routes
router.route('/')
    .get(getPOIs)
    .post(protect, createPOI);

router.route('/:id')
    .get(getPOIById)
    .put(protect, updatePOI)
    .delete(protect, deletePOI);

router.route('/:id/images')
    .post(protect, addPOIImage);

router.route('/:id/images/:imageId')
    .delete(protect, removePOIImage);

// POI review routes
router.route('/:id/reviews')
    .get(getPOIReviews)
    .post(protect, createReview);

router.route('/:id/reviews/:reviewId')
    .get(getReviewById)
    .put(protect, updateReview)
    .delete(protect, deleteReview);

router.route('/:id/reviews/:reviewId/helpful')
    .post(protect, markReviewHelpful);

// POI category routes
router.route('/categories')
    .get(getCategories)
    .post(protect, admin, createCategory);

router.route('/categories/:id')
    .get(getCategoryById)
    .put(protect, admin, updateCategory)
    .delete(protect, admin, deleteCategory);

module.exports = router; 