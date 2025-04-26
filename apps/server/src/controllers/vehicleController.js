const Vehicle = require('../models/Vehicle');
const User = require('../models/User'); // May be needed if updating user's default vehicle
const { asyncHandler } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary'); // Import cloudinary
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// @desc    Add a new vehicle for the logged-in user
// @route   POST /api/vehicles
// @access  Private (Synced user required)
const addVehicle = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const {
        type, make, model, year, color, nickname, specs, isDefault, imageUrl // imageUrl might come from upload middleware later
    } = req.body;

    // Basic validation (nickname is required by schema)
    if (!nickname) {
        return next(new AppError('Vehicle nickname is required', 400));
    }

    // TODO: Handle isDefault logic - if this is set to true, unset other vehicles for this user?
    if (isDefault === true) {
        await Vehicle.updateMany({ userId: userId, isDefault: true }, { $set: { isDefault: false } });
    }

    const vehicleData = {
        userId,
        type, // Schema has default
        make,
        model,
        year,
        color,
        nickname,
        specs,
        imageUrl: req.file ? req.file.path : imageUrl, // Use uploaded file path if available
        isDefault: isDefault !== undefined ? isDefault : false
    };

    const newVehicle = await Vehicle.create(vehicleData);

    // Optional: Add vehicle ID to user's vehicle array if maintaining that relationship
    // await User.findByIdAndUpdate(userId, { $push: { vehicles: newVehicle._id } });

    res.status(201).json(newVehicle);
});

// @desc    Get all vehicles for the logged-in user
// @route   GET /api/vehicles
// @access  Private (Synced user required)
const getUserVehicles = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const vehicles = await Vehicle.find({ userId }).sort({ createdAt: -1 }); // Sort by creation date

    res.status(200).json(vehicles);
});

// @desc    Get a specific vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private (Owner only)
const getVehicleById = asyncHandler(async (req, res, next) => {
    const vehicleId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return next(new AppError(`Invalid vehicle ID: ${vehicleId}`, 400));
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    // Ensure the logged-in user owns the vehicle
    if (vehicle.userId.toString() !== userId.toString()) {
        return next(new AppError('Not authorized to access this vehicle', 403));
    }

    res.status(200).json(vehicle);
});

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Owner only)
const updateVehicle = asyncHandler(async (req, res, next) => {
    const vehicleId = req.params.id;
    const userId = req.user._id;
    const {
        type, make, model, year, color, nickname, specs, isDefault, imageUrl
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return next(new AppError(`Invalid vehicle ID: ${vehicleId}`, 400));
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    // Ensure the logged-in user owns the vehicle
    if (vehicle.userId.toString() !== userId.toString()) {
        return next(new AppError('Not authorized to update this vehicle', 403));
    }

    // Prepare update data
    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (make !== undefined) updateData.make = make;
    if (model !== undefined) updateData.model = model;
    if (year !== undefined) updateData.year = year;
    if (color !== undefined) updateData.color = color;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (specs !== undefined) updateData.specs = specs; // TODO: Need careful update logic for nested objects? Maybe replace whole object?
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    // Handle image update (check if new file uploaded)
    if (req.file) {
        updateData.imageUrl = req.file.path;
        // TODO: Delete old image from Cloudinary
        // const oldImageUrl = vehicle.imageUrl;
        // if (oldImageUrl) { ... delete logic ... }
    } else if (imageUrl === null || imageUrl === '') {
         updateData.imageUrl = null; // Allow removing image
         // TODO: Delete old image from Cloudinary
    }
    
    // Handle isDefault logic
    if (isDefault === true && vehicle.isDefault === false) {
        // If setting this one to default, unset others for this user
        await Vehicle.updateMany({ userId: userId, _id: { $ne: vehicleId }, isDefault: true }, { $set: { isDefault: false } });
    } else if (isDefault === false && vehicle.isDefault === true) {
        // Optional: Ensure at least one vehicle remains default? Or allow none?
        // For now, allow unsetting.
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(vehicleId, { $set: updateData }, {
        new: true,
        runValidators: true
    });

    res.status(200).json(updatedVehicle);
});

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Owner only)
const deleteVehicle = asyncHandler(async (req, res, next) => {
    const vehicleId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return next(new AppError(`Invalid vehicle ID: ${vehicleId}`, 400));
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    // Ensure the logged-in user owns the vehicle
    if (vehicle.userId.toString() !== userId.toString()) {
        return next(new AppError('Not authorized to delete this vehicle', 403));
    }

    // TODO: Delete associated image from Cloudinary
    // if (vehicle.imageUrl) { ... delete logic ... }

    // TODO: Consider what happens to Tracks that used this vehicleId. 
    // Option A: Set track.vehicleId to null.
    // Option B: Prevent deletion if tracks exist.
    // Option C: Do nothing (leaving dangling reference).
    // For now, Option C (do nothing) is implemented by default.

    await vehicle.deleteOne();

    // Optional: Remove vehicle ID from user's vehicle array if using that
    // await User.findByIdAndUpdate(userId, { $pull: { vehicles: vehicleId } });

    res.status(200).json({ message: 'Vehicle deleted successfully' });
});

module.exports = {
    addVehicle,
    getUserVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
}; 