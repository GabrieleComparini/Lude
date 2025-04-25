const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// GeoJSON Schema for Point location
const PointSchema = new Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere' // Index for geospatial queries
    },
    name: { // Optional address/name derived from coordinates
        type: String,
        trim: true
    }
}, { _id: false });

// Schema for individual route points
const RoutePointSchema = new Schema({
    lat: {
        type: Number,
        required: true
    },
    lng: {
        type: Number,
        required: true
    },
    speed: { // Instantaneous speed at this point (m/s)
        type: Number,
        required: true,
        min: 0
    },
    altitude: { // Optional altitude (meters)
        type: Number
    },
    timestamp: {
        type: Date,
        required: true
    }
}, { _id: false });

const TrackSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    vehicleId: { // Optional, but recommended
        type: Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: false, // Make required if a vehicle MUST be selected
        index: true
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    endTime: {
        type: Date,
        required: true
    },
    duration: { // Seconds
        type: Number,
        required: true,
        min: 0
    },
    distance: { // Meters
        type: Number,
        required: true,
        min: 0
    },
    avgSpeed: { // m/s
        type: Number,
        required: true,
        min: 0
    },
    maxSpeed: { // m/s
        type: Number,
        required: true,
        min: 0
    },
    startLocation: PointSchema,
    endLocation: PointSchema,
    route: {
        type: [RoutePointSchema],
        required: true,
        validate: [val => Array.isArray(val) && val.length > 0, 'Route must contain at least one point']
    },
    // routeSimplified: { // Optional: For map previews (GeoJSON LineString)
    //     type: {
    //         type: String,
    //         enum: ['LineString'],
    //         default: 'LineString'
    //     },
    //     coordinates: {
    //         type: [[Number]] // Array of [lng, lat] pairs
    //     }
    // },
    weather: { // Optional: Weather at start or average during track
        temperature: { type: Number }, // Celsius
        conditions: { type: String, trim: true }, // e.g., 'sunny', 'rainy'
        windSpeed: { type: Number, min: 0 } // m/s
    },
    isPublic: {
        type: Boolean,
        default: false, // Default to private based on User preference override?
        index: true
    },
    tags: {
        type: [String],
        index: true,
        // Add validation for tag length or count if needed
        validate: [val => !val.some(tag => tag.length > 30), 'Tags cannot exceed 30 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    // Denormalized fields for performance
    commentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    reactions: { // Store counts for different reaction types
        like: { type: Number, default: 0, min: 0 },
        wow: { type: Number, default: 0, min: 0 }
        // Add other reaction types as needed
    }
    // Consider adding 'expectedDuration' if needed from specs

}, {
    timestamps: true
});

// --- INDEXES ---
// Compound index for fetching user tracks sorted by time
TrackSchema.index({ userId: 1, startTime: -1 });
// Index for fetching public tracks sorted by time
TrackSchema.index({ isPublic: 1, startTime: -1 });

// --- MIDDLEWARE (PRE/POST HOOKS) ---

// // Example: Pre-save hook to calculate routeSimplified
// TrackSchema.pre('save', function(next) {
//     if (this.isModified('route') && this.route.length > 0) {
//         // Basic simplification: take every Nth point or use a library (e.g., simplify-js)
//         this.routeSimplified = {
//             type: 'LineString',
//             coordinates: this.route.map(p => [p.lng, p.lat]) // Simplification logic here
//         };
//     }
//     next();
// });

// // Example: Post-remove hook to delete associated comments/reactions
// TrackSchema.post('remove', async function(doc, next) {
//     console.log(`Track ${doc._id} removed. Deleting associated comments/reactions...`);
//     // await mongoose.model('Comment').deleteMany({ trackId: doc._id });
//     // await mongoose.model('Reaction').deleteMany({ trackId: doc._id });
//     next();
// });

module.exports = mongoose.model('Track', TrackSchema); 