const express = require('express');
const router = express.Router();
const {
    getSummaryStats,
    getTrends,
    getHeatmapData,
    getSpeedDistribution,
    getStatsByVehicle,
    exportData
} = require('../controllers/analyticsController');
const { protect, ensureSynced } = require('../middleware/authMiddleware');

// All analytics routes require user to be logged in and synced
router.use(protect, ensureSynced);

// GET /api/analytics/summary - Get summary statistics
router.get('/summary', getSummaryStats);

// GET /api/analytics/trends - Get tracking trends (query params: period, metric)
router.get('/trends', getTrends);

// GET /api/analytics/heatmap - Get heatmap data points
router.get('/heatmap', getHeatmapData);

// GET /api/analytics/speed-distribution - Get speed distribution data
router.get('/speed-distribution', getSpeedDistribution);

// GET /api/analytics/vehicles - Get statistics grouped by vehicle
router.get('/vehicles', getStatsByVehicle);

// GET /api/analytics/export - Export user data as JSON
router.get('/export', exportData);

module.exports = router; 