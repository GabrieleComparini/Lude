const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VehicleSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index for fetching vehicles by user
    },
    type: {
        type: String,
        required: [true, 'Vehicle type is required'],
        enum: {
            values: ['car', 'motorcycle', 'bicycle', 'scooter', 'other'],
            message: '{VALUE} is not a supported vehicle type'
        },
        default: 'car'
    },
    make: {
        type: String,
        trim: true,
        maxlength: [50, 'Make cannot exceed 50 characters']
    },
    model: {
        type: String,
        trim: true,
        maxlength: [50, 'Model cannot exceed 50 characters']
    },
    year: {
        type: Number,
        min: [1900, 'Year seems too old'],
        max: [new Date().getFullYear() + 1, 'Year cannot be in the far future'] // Allow next year
    },
    color: {
        type: String,
        trim: true,
        maxlength: [30, 'Color cannot exceed 30 characters']
    },
    nickname: {
        type: String,
        trim: true,
        required: [true, 'Vehicle nickname is required'],
        maxlength: [50, 'Nickname cannot exceed 50 characters']
    },
    specs: { // Optional technical specifications
        engineDisplacement: { type: String, trim: true, maxlength: 50 }, // e.g., "1.6L", "250cc"
        power: { type: String, trim: true, maxlength: 50 }, // e.g., "120hp", "15kW"
        weight: { type: String, trim: true, maxlength: 50 } // e.g., "1500kg", "180kg"
        // Add other relevant specs as needed
    },
    imageUrl: { // Optional image of the vehicle
        type: String, // URL to Cloudinary image
        default: null
    },
    isDefault: { // Optional: Flag if this is the user's default vehicle
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// --- INDEXES --- 
// Compound index for user + type?
// VehicleSchema.index({ userId: 1, type: 1 });

// --- METHODS --- 
// Potential methods like `getDisplayName()` could be added here


module.exports = mongoose.model('Vehicle', VehicleSchema); 