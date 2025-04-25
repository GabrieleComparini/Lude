const express = require('express');
const router = express.Router();
const {
    addVehicle,
    getUserVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
} = require('../controllers/vehicleController');
const { protect, ensureSynced } = require('../middleware/authMiddleware');
// const upload = require('../middleware/uploadMiddleware'); // Uncomment when image upload is ready

// All routes below require user to be logged in and synced
router.use(protect, ensureSynced);

// POST /api/vehicles - Add a new vehicle
// Add upload.single('vehicleImage') middleware here when ready for image uploads
router.post('/', addVehicle);

// GET /api/vehicles - Get all vehicles for the logged-in user
router.get('/', getUserVehicles);

// GET /api/vehicles/:id - Get a specific vehicle by ID
router.get('/:id', getVehicleById);

// PUT /api/vehicles/:id - Update a vehicle
// Add upload.single('vehicleImage') middleware here when ready for image uploads
router.put('/:id', updateVehicle);

// DELETE /api/vehicles/:id - Delete a vehicle
router.delete('/:id', deleteVehicle);

module.exports = router; 